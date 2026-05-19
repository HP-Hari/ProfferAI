from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import datetime
from typing import List, Dict, Any, Optional

from .config import settings
from .database import get_db, init_db
from .memory import seed_knowledge_base, HindsightMemoryEngine
from .cascade import CascadeflowEngine
from .tasks import process_document_ingestion
from .analysis import RFPAnalysisSystem
from .models import User, Project, UploadedDocument, Question, DraftAnswer, RetrievedEvidence, ContentLibraryItem, ExportPackage, ChatSession, ChatMessage
from .schemas import (
    UserResponse, UserCreate, ProjectResponse, QuestionResponse, 
    DraftAnswerResponse, QuestionReviewPayload, ProjectComposePayload,
    ContentLibraryItemResponse, ContentLibraryItemCreate,
    ChatSessionCreate, ChatSessionResponse, ChatMessageCreate, ChatMessageResponse
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Enable CORS for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_UPLOAD_DIR = "/tmp/proposal_agent_uploads"
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

# Lifespan/Startup Events
@app.on_event("startup")
def startup_event():
    # Initialize DB schemas
    init_db()
    
    # Seed library data
    db = next(get_db())
    seed_knowledge_base(db)
    
    # Pre-provision default testing users (Sales Rep, Security SME, Legal SME)
    seed_mock_users(db)

def seed_mock_users(db: Session):
    existing = db.query(User).limit(1).first()
    if existing:
        return
        
    users = [
        User(
            email="proposal_manager@example.com",
            full_name="Sarah Miller",
            role="proposal_manager",
            domain_expertise=["company_background", "references"]
        ),
        User(
            email="security_sme@example.com",
            full_name="Alex Chen",
            role="sme_reviewer",
            domain_expertise=["security", "compliance_privacy", "sla_support"]
        ),
        User(
            email="legal_sme@example.com",
            full_name="Elena Vance",
            role="legal_reviewer",
            domain_expertise=["legal_contractual", "pricing_commercial"]
        )
    ]
    for u in users:
        db.add(u)
    db.commit()

# Root test route
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "api_docs": "/docs"
    }

# ----------------- PROVISIONING USERS -----------------
@app.get(f"{settings.API_V1_STR}/users", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# ----------------- PROJECTS & INGESTION -----------------
@app.post(f"{settings.API_V1_STR}/projects", status_code=status.HTTP_202_ACCEPTED)
def create_project_and_upload(
    background_tasks: BackgroundTasks,
    buyer_name: str = Form(...),
    opportunity_name: str = Form(...),
    deadline: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Intake upload endpoint. Receives file and metadata, 
    initializes project, and triggers background processing.
    """
    try:
        deadline_dt = datetime.datetime.fromisoformat(deadline.replace("Z", "+00:00"))
    except Exception:
        deadline_dt = datetime.datetime.utcnow() + datetime.timedelta(days=14)
        
    # Get a default owner (proposal manager)
    owner = db.query(User).filter(User.role == "proposal_manager").first()
    if not owner:
        owner = db.query(User).first()
        
    if not owner:
        raise HTTPException(status_code=500, detail="No users registered in system. Initialize users first.")
        
    # Create Project Record
    project = Project(
        buyer_name=buyer_name,
        opportunity_name=opportunity_name,
        deadline=deadline_dt,
        status="intake",
        owner_id=owner.user_id
    )
    db.add(project)
    db.flush()
    
    # Save Uploaded file locally
    file_uuid = uuid.uuid4()
    file_ext = file.filename.split(".")[-1]
    saved_filename = f"{file_uuid}.{file_ext}"
    saved_path = os.path.join(TEMP_UPLOAD_DIR, saved_filename)
    
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Create UploadedDocument Record
    doc = UploadedDocument(
        project_id=project.project_id,
        file_name=file.filename,
        file_type=file_ext,
        file_url=saved_path,
        document_role="buyer_rfp"
    )
    db.add(doc)
    db.commit()
    db.refresh(project)
    
    # Enqueue Ingestion Parsing in Background Tasks
    background_tasks.add_task(
        process_document_ingestion,
        db=db,
        project_id=project.project_id,
        document_id=doc.document_id,
        file_path=saved_path,
        file_type=file_ext
    )
    
    return {
        "project_id": project.project_id,
        "buyer_name": project.buyer_name,
        "opportunity_name": project.opportunity_name,
        "status": project.status,
        "deadline": project.deadline,
        "uploaded_files": [
            {
                "document_id": doc.document_id,
                "file_name": doc.file_name,
                "file_type": doc.file_type
            }
        ],
        "message": "Project initiated successfully. Processing and ingestion scheduled asynchronously."
    }

@app.get(f"{settings.API_V1_STR}/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

# ----------------- QUESTIONS & COLLABORATION -----------------
@app.get(f"{settings.API_V1_STR}/projects/{{project_id}}/questions")
def get_project_questions_status(project_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Returns extracted questions, categories, and matching draft details.
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    questions = db.query(Question).filter(Question.project_id == project_id).all()
    
    # Statistics calculations
    status_counts = {"unassigned": 0, "auto_drafted": 0, "pending_sme": 0, "approved": 0}
    for q in questions:
        status_counts[q.status] = status_counts.get(q.status, 0) + 1
        
    question_details = []
    for q in questions:
        draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == q.question_id).first()
        evidences = db.query(RetrievedEvidence).filter(RetrievedEvidence.question_id == q.question_id).all()
        
        draft_data = None
        if draft:
            sources_used = []
            for ev in evidences:
                item = db.query(ContentLibraryItem).filter(ContentLibraryItem.content_id == ev.content_id).first()
                if item:
                    sources_used.append({
                        "content_id": item.content_id,
                        "title": item.title,
                        "similarity_score": float(ev.similarity_score)
                    })
            
            draft_data = {
                "draft_id": draft.draft_id,
                "generated_answer": draft.generated_answer,
                "confidence_score": float(draft.confidence_score),
                "risk_flags": draft.risk_flags or [],
                "cascade_escalated": draft.cascade_escalated,
                "sources_used": sources_used
            }
            
        question_details.append({
            "question_id": q.question_id,
            "section_name": q.section_name,
            "raw_text": q.raw_text,
            "normalized_text": q.normalized_text,
            "category": q.category,
            "response_type": q.response_type,
            "status": q.status,
            "assigned_to": q.assigned_to,
            "draft": draft_data
        })
        
    return {
        "project_id": project_id,
        "buyer_name": project.buyer_name,
        "opportunity_name": project.opportunity_name,
        "total_questions": len(questions),
        "status_counts": status_counts,
        "questions": question_details
    }

@app.patch(f"{settings.API_V1_STR}/questions/{{question_id}}/review")
def review_and_approve_question(
    question_id: uuid.UUID,
    payload: QuestionReviewPayload,
    db: Session = Depends(get_db)
):
    """
    SME Approval & Correction endpoint. 
    Triggers Hindsight retain hook to update persistent memory graph.
    """
    question = db.query(Question).filter(Question.question_id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    if payload.action == "approved":
        question.status = "approved"
        # If revised answer provided, save it to the draft
        if payload.revised_answer:
            draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == question_id).first()
            if draft:
                draft.generated_answer = payload.revised_answer
                db.commit()
                
            # Learn from human update
            # Call Hindsight Memory retain to update Belief/Experience networks
            retention_res = HindsightMemoryEngine.retain(
                db=db,
                question_text=question.raw_text,
                answer_text=payload.revised_answer,
                category=question.category,
                reviewer_id=payload.reviewer_id,
                source_doc=f"RFP Review Edit - {question.project.buyer_name}"
            )
            
            return {
                "question_id": question.question_id,
                "status": question.status,
                "assigned_to": question.assigned_to,
                "last_updated": datetime.datetime.utcnow().isoformat() + "Z",
                "hindsight_retention": retention_res
            }
            
    elif payload.action == "revised":
        question.status = "revised"
        if payload.revised_answer:
            draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == question_id).first()
            if draft:
                draft.generated_answer = payload.revised_answer
                
    db.commit()
    return {
        "question_id": question.question_id,
        "status": question.status,
        "assigned_to": question.assigned_to,
        "last_updated": datetime.datetime.utcnow().isoformat() + "Z"
    }

# ----------------- COMPOSITION & EXPORTS -----------------
@app.post(f"{settings.API_V1_STR}/projects/{{project_id}}/compose")
def compose_final_proposal(
    project_id: uuid.UUID,
    payload: ProjectComposePayload,
    db: Session = Depends(get_db)
):
    """
    Composes approved drafts into response table structure.
    Generates tailored AI Executive Summary.
    """
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    questions = db.query(Question).filter(Question.project_id == project_id).all()
    
    approved_qas = []
    for q in questions:
        draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == q.question_id).first()
        answer = draft.generated_answer if draft else "No response generated."
        approved_qas.append({
            "question": q.raw_text,
            "answer": answer,
            "category": q.category
        })
        
    # Generate tailored executive summary
    summary_intro = f"Executive Summary for {project.buyer_name} Proposal - AegisCore Platform Solutions"
    body_text = f"Based on the {len(approved_qas)} compliance and architectural requirements analyzed, AegisCore provides a fully SOC 2 Type II and ISO 27001 validated infrastructure supporting robust customer workflows."
    
    # Save a mock export file
    export_url = f"/tmp/exports/Proposal_Export_{project_id}.{payload.requested_format}"
    os.makedirs(os.path.dirname(export_url), exist_ok=True)
    
    with open(export_url, "w") as f:
        f.write(f"PROPOSAL FOR {project.buyer_name}\n")
        f.write(f"OPPORTUNITY: {project.opportunity_name}\n\n")
        f.write(f"{summary_intro}\n{body_text}\n\n")
        for idx, item in enumerate(approved_qas):
            f.write(f"Q{idx+1}: {item['question']}\n")
            f.write(f"A{idx+1}: {item['answer']}\n\n")
            
    # Record package
    manager = db.query(User).filter(User.role == "proposal_manager").first()
    pkg = ExportPackage(
        project_id=project_id,
        format=payload.requested_format,
        file_url=export_url,
        generated_by=manager.user_id if manager else project.owner_id
    )
    db.add(pkg)
    
    project.status = "exported"
    db.commit()
    
    return {
        "project_id": project_id,
        "export_id": pkg.export_id,
        "status": "completed",
        "file_url": f"file://{export_url}",
        "executive_summary": f"{summary_intro}\n\n{body_text}",
        "message": "Document composition complete. Final response package generated."
    }

@app.get(f"{settings.API_V1_STR}/projects/{{project_id}}/analysis")
def get_project_analysis_audit(
    project_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Analyzes and audits all drafts in an RFP project, calculating 
    health metrics and running live compliance checks via flagship LLMs.
    """
    audit = RFPAnalysisSystem.audit_proposal_live(db, project_id)
    if "error" in audit:
        raise HTTPException(status_code=404, detail=audit["error"])
    return audit

# ----------------- CONTENT LIBRARY GOVERNANCE -----------------
@app.get(f"{settings.API_V1_STR}/library", response_model=List[ContentLibraryItemResponse])
def get_library(db: Session = Depends(get_db)):
    return db.query(ContentLibraryItem).all()

@app.post(f"{settings.API_V1_STR}/library", response_model=ContentLibraryItemResponse)
def add_to_library(payload: ContentLibraryItemCreate, db: Session = Depends(get_db)):
    item = ContentLibraryItem(
        network=payload.network,
        title=payload.title,
        question_text=payload.question_text,
        answer_text=payload.answer_text,
        category=payload.category,
        tags=payload.tags,
        source_document=payload.source_document,
        owner_id=payload.owner_id
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.post(f"{settings.API_V1_STR}/library/reflect")
def run_library_reflection(db: Session = Depends(get_db)):
    """
    Triggers the Hindsight Reflection analysis to detect library stale warnings.
    """
    reflections = HindsightMemoryEngine.reflect(db)
    return {
        "status": "sweep_completed",
        "issues_detected": len(reflections),
        "actions": reflections
    }

# ----------------- AUTONOMOUS AI CHAT BOT AGENT -----------------
@app.post(f"{settings.API_V1_STR}/chat/sessions", response_model=ChatSessionResponse)
def create_chat_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    """
    Creates a new conversational chat session linked to an RFP project.
    """
    session = ChatSession(project_id=payload.project_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.get(f"{settings.API_V1_STR}/chat/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(db: Session = Depends(get_db)):
    """
    Lists all available conversational chat sessions.
    """
    return db.query(ChatSession).order_by(ChatSession.updated_at.desc()).all()

@app.get(f"{settings.API_V1_STR}/chat/sessions/{{session_id}}/history", response_model=List[ChatMessageResponse])
def get_chat_history(session_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Returns full chronological conversation thread history for context retention.
    """
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

AGENT_SYSTEM_PROMPT = """You are beam.ai — the world's most advanced Enterprise Proposal & RFP Agent, purpose-built for B2B sales teams.

YOUR EXCLUSIVE DOMAIN: Sales proposals, RFP/RFI responses, security questionnaires (SIG/CAIQ/VSA), vendor assessments, DDQs, and compliance forms.

CORE CAPABILITIES:
• EXTRACT every question, requirement, and compliance obligation from uploaded documents
• DRAFT precise, citation-backed proposal responses grounded ONLY in the corporate knowledge base
• DETECT compliance risks — SLA conflicts, unverified claims, missing audit evidence, legal exposure
• ADVISE on contract redlines, liability caps, indemnification language, and negotiation positioning
• SCORE response confidence — grounding quality percentage, source freshness, and submission readiness
• RETAIN full conversation memory — you recall everything discussed across this entire session thread

MANDATORY RESPONSE FORMAT:
**Answer:** [Your grounded response here]
**Source:** [Cite the specific corporate policy or knowledge base entry used]
**Confidence Level:** [High/Medium/Low with brief justification]
**Risk/Compliance Note:** [Flag any SLA mismatches, legal gaps, or unverifiable claims. Write "None identified" if clean.]

IRONCLAD RULES:
1. NEVER fabricate capabilities. If the knowledge base lacks evidence, state: "[NOT IN CORPORATE KNOWLEDGE BASE — requires SME input]"
2. ALWAYS cite the specific source title from corporate context when drafting responses.
3. FLAG any SLA numbers that conflict between buyer requirements and actual corporate commitments.
4. Be direct, professional, and concise. Zero filler. Every sentence must deliver value.
5. When analyzing documents, be exhaustive — extract ALL questions including implicit requirements.
6. Operate as a senior proposal director with 20+ years at a Fortune 100 enterprise.
7. For legal/contractual questions, always recommend legal review and note standard redline positions.
8. Quantify wherever possible — response times in hours, uptime in percentages, retention periods in days.

You are NOT a generic chatbot. You are a specialized, elite proposal operations intelligence system that helps sales teams win deals."""

@app.post(f"{settings.API_V1_STR}/chat/sessions/{{session_id}}/message", response_model=ChatMessageResponse)
def post_chat_message(
    session_id: uuid.UUID,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    """
    Full conversational AI agent with:
    - Complete conversation history context retention (injected into every LLM call)
    - RAG grounding from corporate knowledge base
    - Speculative Cascadeflow routing (cheap -> flagship escalation)
    """
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        sender="user",
        content=payload.content
    )
    db.add(user_msg)
    db.flush()

    # ---- CONVERSATION HISTORY INJECTION ----
    # Pull all prior messages for this session and format as context block
    prior_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    conversation_history = ""
    for pm in prior_messages[:-1]:  # Exclude the message we just added
        role_label = "Sales Rep" if pm.sender == "user" else "Proposal Agent"
        conversation_history += f"[{role_label}]: {pm.content}\n\n"

    # Load topic category
    from .tasks import categorize_question_text
    category = categorize_question_text(payload.content)

    # RAG Recall — pull relevant corporate knowledge
    evidence_candidates = HindsightMemoryEngine.recall(db, payload.content, category, limit=5)

    # Execute Speculative Cascade routing with conversation history
    cascade_res = CascadeflowEngine.execute_speculative_cascade(
        question=payload.content,
        category=category,
        evidence_list=evidence_candidates,
        conversation_history=conversation_history
    )
    agent_reply = cascade_res["generated_answer"]
    cascade_escalated = cascade_res["cascade_escalated"]
    confidence_score = cascade_res["confidence_score"]
    risk_flags = cascade_res["risk_flags"]

    # Prepare citations metadata with confidence and risk info
    metadata = []
    for ev in evidence_candidates:
        if ev["similarity_score"] > 0.05:
            metadata.append({
                "content_id": str(ev["content_id"]),
                "title": ev["title"],
                "similarity_score": float(ev["similarity_score"]),
                "answer_text": ev["answer_text"][:200],
                "escalated": cascade_escalated,
                "confidence_score": confidence_score,
                "risk_flags": risk_flags
            })
    
    # Ensure at least one metadata entry with scoring even if no evidence matched
    if not metadata:
        metadata.append({
            "title": "Speculative Generation (No RAG Match)",
            "similarity_score": 0.0,
            "confidence_score": confidence_score,
            "risk_flags": risk_flags,
            "escalated": cascade_escalated
        })

    # Save Agent Response
    agent_msg = ChatMessage(
        session_id=session_id,
        sender="agent",
        content=agent_reply,
        metadata_json=metadata
    )
    db.add(agent_msg)

    session.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(agent_msg)

    return agent_msg

@app.post(f"{settings.API_V1_STR}/chat/sessions/{{session_id}}/upload")
def upload_chat_document(
    session_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Receives a file upload within a chat session, parses it, and automatically pre-drafts
    every requirement using Hindsight memory RAG and Speculative Cascadeflow.
    """
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Save Uploaded file locally
    file_uuid = uuid.uuid4()
    file_ext = file.filename.split(".")[-1]
    saved_filename = f"{file_uuid}.{file_ext}"
    saved_path = os.path.join(TEMP_UPLOAD_DIR, saved_filename)
    
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Add user message indicating file upload
    user_msg = ChatMessage(
        session_id=session_id,
        sender="user",
        content=f"Uploaded document: {file.filename}"
    )
    db.add(user_msg)
    db.flush()

    # Parse document
    from .parser import parse_document
    parsed_data = parse_document(saved_path, file_ext)
    questions = parsed_data.get("questions", [])

    # Process all questions, grounding them dynamically during ingest
    questions_list = []
    for idx, q in enumerate(questions):
        q_text = q["raw_text"]
        q_sec = q.get("section_name", "General")
        q_bread = q.get("context_breadcrumbs", "")
        
        # Categorize
        from .tasks import categorize_question_text
        category = categorize_question_text(q_text)
        
        # RAG Grounding
        evidence_candidates = HindsightMemoryEngine.recall(db, q_text, category, limit=3)
        
        # Speculative Cascade Drafting
        cascade_res = CascadeflowEngine.execute_speculative_cascade(
            question=q_text,
            category=category,
            evidence_list=evidence_candidates
        )
        
        # Format citations
        citations = []
        for ev in evidence_candidates:
            if ev["similarity_score"] > 0.05:
                citations.append({
                    "title": ev["title"],
                    "similarity_score": float(ev["similarity_score"]),
                    "answer_text": ev["answer_text"]
                })
                
        questions_list.append({
            "id": idx + 1,
            "text": q_text,
            "section_name": q_sec,
            "context_breadcrumbs": q_bread,
            "status": "completed",
            "score": int(cascade_res["confidence_score"] * 100),
            "draft": cascade_res["generated_answer"],
            "risk_flags": cascade_res["risk_flags"],
            "citations": citations
        })

    if not questions:
         agent_reply = f"I've received '{file.filename}', but I couldn't extract any specific questions or requirements from it. Could you clarify what you need me to do with this document?"
    else:
         agent_reply = f"I have successfully ingested '{file.filename}' and automatically analyzed **{len(questions)} requirements**.\n\n"
         agent_reply += "I've ran full semantic RAG retrieval and speculative drafting across all of them. You can review pre-drafted answers, grounding confidence indices, and warning flags directly on the **RFP Workspace** spreadsheet grid on the left. Click on any row to open the Interactive Editor panel."

    # Add agent message with analysis
    metadata = {
        "file_name": file.filename,
        "extracted_questions": len(questions),
        "questions_list": questions_list
    }
    
    agent_msg = ChatMessage(
        session_id=session_id,
        sender="agent",
        content=agent_reply,
        metadata_json=[metadata]
    )
    db.add(agent_msg)

    session.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(agent_msg)

    return {"message": "Document processed", "agent_message": {"content": agent_msg.content, "metadata_json": agent_msg.metadata_json}}

@app.get(f"{settings.API_V1_STR}/chat/sessions/{{session_id}}/download")
def download_chat_session_proposal(
    session_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """
    Exports all QA pairs from a chat session as a formatted submission-ready Markdown proposal package.
    """
    session = db.query(ChatSession).filter(ChatSession.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.asc()).all()

    if not messages:
        raise HTTPException(status_code=400, detail="No messages in this session to export")

    # Generate Markdown content
    markdown_content = f"# BEAM.AI — PROPOSAL SUBMISSION PACKAGE\n\n"
    markdown_content += f"**Generated:** {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
    markdown_content += f"**Session ID:** `{session_id}`\n\n"
    markdown_content += "---\n\n"

    # Check if any message contains pre-drafted spreadsheet requirements
    upload_msg = None
    for msg in messages:
        if msg.sender == "agent" and msg.metadata_json:
            meta_list = msg.metadata_json
            if isinstance(meta_list, list) and len(meta_list) > 0:
                meta = meta_list[0]
                if isinstance(meta, dict) and "questions_list" in meta:
                    upload_msg = meta
                    break

    if upload_msg and upload_msg.get("questions_list"):
        # Export from structured pre-drafted requirements (spreadsheet data)
        questions_list = upload_msg["questions_list"]
        markdown_content += f"## Document: {upload_msg.get('file_name', 'Unknown')}\n"
        markdown_content += f"**Total Requirements Extracted:** {len(questions_list)}\n\n"
        markdown_content += "---\n\n"
        
        drafted = [q for q in questions_list if q.get('status') == 'completed' and q.get('draft')]
        pending = [q for q in questions_list if q.get('status') != 'completed' or not q.get('draft')]
        
        if drafted:
            markdown_content += "## DRAFTED RESPONSES\n\n"
            for q in drafted:
                score = q.get('score', 'N/A')
                flags = q.get('risk_flags', [])
                risk_str = f"\n\n> ⚠️ **Risk Flags:** {', '.join(flags)}" if flags else ""
                markdown_content += f"### REQ-{q['id']}: {q.get('section_name', 'General')}\n"
                markdown_content += f"**Question:** {q['text']}\n\n"
                markdown_content += f"**Response (Confidence: {score}%):**\n{q['draft']}\n"
                markdown_content += f"{risk_str}\n\n---\n\n"
        
        if pending:
            markdown_content += "## PENDING REQUIREMENTS (Not Yet Drafted)\n\n"
            for q in pending:
                markdown_content += f"- **REQ-{q['id']}:** {q['text']}\n"
            markdown_content += "\n---\n\n"
    else:
        # Fallback: export from chat conversation QA pairs
        qa_pairs = []
        current_q = None
        for msg in messages:
            if msg.sender == "user":
                current_q = msg.content
            elif msg.sender == "agent" and current_q:
                qa_pairs.append((current_q, msg.content))
                current_q = None

        if not qa_pairs:
            for msg in messages:
                sender_name = "Buyer Question" if msg.sender == "user" else "Grounded Response"
                markdown_content += f"### {sender_name}\n{msg.content}\n\n---\n\n"
        else:
            for idx, (q, a) in enumerate(qa_pairs):
                markdown_content += f"## REQUIREMENT {idx + 1}\n"
                markdown_content += f"**Question:** {q}\n\n"
                markdown_content += f"**Response:**\n{a}\n\n"
                markdown_content += "---\n\n"

    markdown_content += "\n\n*Generated by beam.ai — Enterprise Proposal Agent*\n"

    from fastapi.responses import Response
    return Response(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename=beam_proposal_{session_id}.md"
        }
    )
