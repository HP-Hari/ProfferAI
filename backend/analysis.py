import logging
import uuid
import collections
import re
import math
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from .models import Project, Question, DraftAnswer, RetrievedEvidence, ContentLibraryItem
from .config import settings

logger = logging.getLogger(__name__)

# Re-use our TF-IDF tokenizer
def tokenize_text(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r'\w+', text.lower())
    return [w for w in words if len(w) > 2]

class RFPAnalysisSystem:
    """
    RFP & Proposal Analysis System.
    Audits drafted questionnaire responses for compliance conflicts, 
    unsupported assertions, and calculates an overall submission risk score.
    """

    @staticmethod
    def calculate_health_score(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Applies a strict algorithmic health scorecard check across parsed items.
        """
        score = 100.0
        deductions = []
        
        compliance_conflicts = 0
        unsupported_claims = 0
        pending_smes = 0
        
        for q in questions:
            status = q.get("status")
            draft = q.get("draft")
            
            # Penalty for outstanding SME reviewer bottlenecks
            if status == "pending_sme" or not draft:
                pending_smes += 1
                score -= 5.0
                deductions.append({
                    "type": "workflow_delay",
                    "description": f"Question is pending SME verification.",
                    "penalty": 5.0
                })
                continue
                
            # Penalty for compliance/SLA mismatch flags raised in Cascadeflow
            risk_flags = draft.get("risk_flags", [])
            if any(f in risk_flags for f in ["sla_mismatch", "unsupported_claim", "legal_review_required"]):
                compliance_conflicts += 1
                score -= 15.0
                deductions.append({
                    "type": "compliance_conflict",
                    "description": f"Compliance conflict flagged: {', '.join(risk_flags)}.",
                    "penalty": 15.0
                })
                
            # Heuristic text audit: Check if answer text length is extremely low while claiming 'Yes'
            answer_text = draft.get("generated_answer", "").lower()
            if answer_text.startswith("yes") and len(answer_text) < 20:
                unsupported_claims += 1
                score -= 8.0
                deductions.append({
                    "type": "vague_claim",
                    "description": f"Answer has vague affirmation without accompanying details.",
                    "penalty": 8.0
                })

        # Boundaries
        score = max(0.0, min(100.0, score))
        
        # Risk assessment
        risk_level = "Low"
        if score < 60.0:
            risk_level = "High"
        elif score < 85.0:
            risk_level = "Medium"
            
        return {
            "overall_health_score": round(score, 1),
            "risk_level": risk_level,
            "metrics": {
                "compliance_conflicts": compliance_conflicts,
                "unsupported_claims": unsupported_claims,
                "pending_smes": pending_smes
            },
            "deductions": deductions
        }

    @classmethod
    def audit_proposal_live(cls, db: Session, project_id: uuid.UUID) -> Dict[str, Any]:
        """
        Runs a comprehensive AI security audit on the active proposal drafts 
        using live Groq FLAGSHIP completions to detect vulnerable security claims.
        """
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            return {"error": "Project not found"}
            
        questions = db.query(Question).filter(Question.project_id == project_id).all()
        
        proposal_items = []
        for q in questions:
            draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == q.question_id).first()
            evidences = db.query(RetrievedEvidence).filter(RetrievedEvidence.question_id == q.question_id).all()
            
            citations = []
            for ev in evidences:
                item = db.query(ContentLibraryItem).filter(ContentLibraryItem.content_id == ev.content_id).first()
                if item:
                    citations.append(item.answer_text)
                    
            proposal_items.append({
                "question": q.raw_text,
                "answer": draft.generated_answer if draft else "[No draft answer]",
                "evidence_base": " | ".join(citations) if citations else "[No corporate library context matched]"
            })
            
        # Algorithmic scorecard analysis
        # Format questions for the algorithmic analyzer
        q_formatted = []
        for q in questions:
            draft = db.query(DraftAnswer).filter(DraftAnswer.question_id == q.question_id).first()
            q_formatted.append({
                "status": q.status,
                "draft": {
                    "generated_answer": draft.generated_answer if draft else "",
                    "risk_flags": draft.risk_flags if draft else []
                } if draft else None
            })
        scorecard = cls.calculate_health_score(q_formatted)
        
        # Build prompt for LLM compliance scan
        proposal_text = ""
        for idx, item in enumerate(proposal_items):
            proposal_text += f"Item {idx+1}:\nQ: {item['question']}\nA: {item['answer']}\nCitations: {item['evidence_base']}\n\n"
            
        audit_report = {
            "vulnerability_scan": "Pending LLM scan",
            "suggested_negotiation_addendums": []
        }
        
        # Call live Groq flagship model to perform Vulnerability audit
        from groq import Groq
        groq_client = None
        if settings.GROQ_API_KEY:
            try:
                groq_client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception:
                pass
                
        if groq_client:
            try:
                prompt = f"""
                You are a Senior enterprise compliance lawyer and security assessor.
                Analyze the following RFP proposal responses and matching context citations for vulnerabilities:
                - Check for discrepancies (e.g. promising compliance to SOC 2 standard while context says it's still in audit stage).
                - Identify any ungrounded capabilities promised (claims without backing evidence).
                - Outline specific legal exceptions we must attach to the contract signature package.
                
                Proposal Drafts:
                {proposal_text}
                
                Output your audit as a clean, highly professional security report with headings:
                1. Executive Compliance Risk Summary
                2. SLA & Liability Redlines
                3. Grounding Mismatches Found
                """
                response = groq_client.chat.completions.create(
                    model=settings.GROQ_PRO_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                audit_report["vulnerability_scan"] = response.choices[0].message.content.strip()
            except Exception as e:
                audit_report["vulnerability_scan"] = f"Flagship LLM Audit scan failed: {e}. Fallback to local heuristic checklist."
                
        return {
            "project_id": str(project_id),
            "buyer_name": project.buyer_name,
            "opportunity_name": project.opportunity_name,
            "scorecard": scorecard,
            "ai_compliance_audit": audit_report["vulnerability_scan"]
        }
