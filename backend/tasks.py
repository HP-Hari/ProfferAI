import logging
import os
from sqlalchemy.orm import Session
from .models import Project, UploadedDocument, Question, RetrievedEvidence, DraftAnswer, User, ReviewTask
from .parser import parse_document
from .memory import HindsightMemoryEngine
from .cascade import CascadeflowEngine
import datetime
import uuid

logger = logging.getLogger(__name__)

def categorize_question_text(text: str) -> str:
    """
    Keyword taxonomy helper mapping question domains.
    """
    text_lower = text.lower()
    if any(k in text_lower for k in ["encrypt", "tls", "security", "cipher", "hacker", "firewall", "vulnerability"]):
        return "security"
    elif any(k in text_lower for k in ["sla", "uptime", "availability", "disaster", "recovery", "support"]):
        return "sla_support"
    elif any(k in text_lower for k in ["founded", "headquarter", "location", "employee", "financial", "revenue"]):
        return "company_background"
    elif any(k in text_lower for k in ["soc", "iso", "gdpr", "compliance", "audit", "policy", "privacy"]):
        return "compliance_privacy"
    elif any(k in text_lower for k in ["price", "cost", "license", "fee", "payment", "pricing"]):
        return "pricing_commercial"
    elif any(k in text_lower for k in ["indemnity", "legal", "liability", "clause", "contract", "agreement"]):
        return "legal_contractual"
    return "product_capabilities"

def process_document_ingestion(db: Session, project_id: uuid.UUID, document_id: uuid.UUID, file_path: str, file_type: str):
    """
    Asynchronous background transaction loop coordinate parsing, 
    classification, Hindsight recall, Cascadeflow drafting, and routing.
    """
    logger.info(f"Starting background ingestion parser pipeline for document {document_id}")
    
    # 1. Update status to parsing
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        logger.error(f"Project {project_id} not found.")
        return
        
    project.status = "parsing"
    db.commit()
    
    try:
        # 2. Extract layout structure and text
        parsed_results = parse_document(file_path, file_type)
        
        doc = db.query(UploadedDocument).filter(UploadedDocument.document_id == document_id).first()
        if doc:
            doc.parsed_text = parsed_results["full_text"]
            db.commit()
            
        questions = parsed_results["questions"]
        logger.info(f"Extracted {len(questions)} candidate questions from file.")
        
        project.status = "drafting"
        db.commit()
        
        # Resolve target reviewer profiles for assignment
        smes = db.query(User).all()
        sme_map = {role: u.user_id for u in smes for role in u.domain_expertise}
        
        # 3. Process each question
        for q_idx, q_data in enumerate(questions):
            category = categorize_question_text(q_data["raw_text"])
            
            # Create Question entry
            question = Question(
                project_id=project_id,
                document_id=document_id,
                section_name=q_data["section_name"],
                raw_text=q_data["raw_text"],
                normalized_text=q_data["raw_text"].strip(),
                category=category,
                response_type="paragraph",
                status="unassigned"
            )
            db.add(question)
            db.flush() # Secure question_id
            
            # 4. Hindsight Memory Engine Recall
            evidence_candidates = HindsightMemoryEngine.recall(db, question.raw_text, category, limit=3)
            
            # Write retrieved evidence linkages
            for ev in evidence_candidates:
                evidence_record = RetrievedEvidence(
                    question_id=question.question_id,
                    content_id=ev["content_id"],
                    similarity_score=ev["similarity_score"],
                    citation_text=ev["answer_text"][:200]
                )
                db.add(evidence_record)
                
            db.commit()
            
            # 5. Cascadeflow Engine Speculative Drafting
            cascade_res = CascadeflowEngine.execute_speculative_cascade(
                question=question.raw_text,
                category=category,
                evidence_list=evidence_candidates
            )
            
            # Create DraftAnswer entry
            draft = DraftAnswer(
                question_id=question.question_id,
                generated_answer=cascade_res["generated_answer"],
                confidence_score=cascade_res["confidence_score"],
                risk_flags=cascade_res["risk_flags"],
                cascade_escalated=cascade_res["cascade_escalated"],
                cascade_reason=cascade_res["cascade_reason"],
                sources_used=[ev["content_id"] for ev in evidence_candidates]
            )
            db.add(draft)
            
            # 6. Automatic Review Routing Strategy
            has_risks = len(cascade_res["risk_flags"]) > 0 or cascade_res["confidence_score"] < 0.85
            
            if has_risks:
                question.status = "pending_sme"
                # Map domain assignee
                assigned_sme_id = sme_map.get(category) or sme_map.get("security")
                if assigned_sme_id:
                    question.assigned_to = assigned_sme_id
                    
                    # Create corresponding review task
                    review_task = ReviewTask(
                        question_id=question.question_id,
                        assigned_to=assigned_sme_id,
                        due_date=project.deadline,
                        final_decision="pending"
                    )
                    db.add(review_task)
            else:
                question.status = "auto_drafted"
                
            db.commit()
            
        # Complete stage
        project.status = "reviewing"
        db.commit()
        logger.info(f"Ingestion parser pipeline successfully executed. Project transitioned to reviewing.")
        
    except Exception as e:
        logger.error(f"Critical error executing background parsing: {e}")
        project.status = "intake"
        db.commit()
