import os
import json
import logging
from typing import List, Dict, Any, Tuple
from .config import settings

logger = logging.getLogger(__name__)

# Handle optional Groq client library presence cleanly
try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    logger.warning("Groq SDK package not found. Deactivating live remote inference calls.")
    HAS_GROQ = False

# Initialize Groq client if key is configured and package is installed
groq_client = None
if HAS_GROQ and settings.GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")

class CascadeflowEngine:
    """
    Cascadeflow Speculative Routing Engine.
    Routes queries to high-speed/low-cost model ('qwen/qwen3-32b') first, 
    evaluates output confidence and risk, and escalates to flagship model 
    ('openai/gpt-oss-120b') if threshold conditions are missed.
    """
    
    @staticmethod
    def _clean_response(text: str) -> str:
        import re
        if not text:
            return ""
        # Remove reasoning blocks <think>...</think> if present in output
        cleaned = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
        return cleaned.strip()
    
    @staticmethod
    def _evaluate_draft(category: str, draft_text: str, evidence_list: List[Dict[str, Any]]) -> Tuple[float, List[str]]:
        """
        Determines the grounding confidence score and flags legal or SLA risks.
        Formula:
        Confidence = 0.4 * SemanticMatch + 0.3 * SourceFreshness + 0.3 * Completeness
        """
        if not evidence_list:
            return 0.2, ["no_source"]
            
        best_match = evidence_list[0]
        semantic_match = best_match["similarity_score"]
        
        # Freshness calculation
        source_freshness = 1.0 # default high freshness
        
        # Completeness calculation - basic heuristic looking at answer length and word match
        completeness = 0.9
        if len(draft_text) < 40:
            completeness = 0.5
            
        confidence = 0.4 * semantic_match + 0.3 * source_freshness + 0.3 * completeness
        
        risk_flags = []
        if confidence < 0.6:
            risk_flags.append("unsupported_claim")
            
        # Category specific legal checks
        if category.lower() in ["legal_contractual", "pricing_commercial"]:
            # Standard policies require legal check on SLA differences
            if "99.99%" in draft_text and "99.9%" in best_match["answer_text"]:
                risk_flags.append("sla_mismatch")
                risk_flags.append("legal_review_required")
                
        return float(round(confidence, 4)), risk_flags

    @classmethod
    def execute_speculative_cascade(cls, question: str, category: str, 
                                   evidence_list: List[Dict[str, Any]],
                                   conversation_history: str = "") -> Dict[str, Any]:
        """
        Orchestrates the dual-tier speculative generation cascade.
        """
        logger.info(f"Cascadeflow speculative route initiated for category: '{category}'")
        
        evidence_context = "\n\n".join([
            f"Source [{e['title']} - Match {e['similarity_score']:.2f}]: {e['answer_text']}" 
            for e in evidence_list
        ])
        
        # Tier 1: Speculative fast-path generation (Cheap model)
        fast_draft = ""
        cascade_escalated = False
        cascade_reason = ""
        
        if groq_client:
            try:
                # Fast path call to qwen/qwen3-32b
                history_block = ""
                if conversation_history:
                    history_block = f"\n\nConversation History (for context):\n{conversation_history}\n"
                
                prompt = f"""
                You are beam.ai — a precise enterprise sales proposal assistant. Draft a response to the following query.
                Strict Rule: Ground your answer strictly in the provided corporate context. If not present, say [INFORMATION NOT IN CONTEXT LIBRARY].
                
                Corporate Context:
                {evidence_context}
                {history_block}
                Question:
                {question}
                """
                response = groq_client.chat.completions.create(
                    model=settings.GROQ_CHEAP_MODEL,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1
                )
                fast_draft = response.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"Groq fast-path model failed: {e}. Falling back to simulated draft.")
                fast_draft = cls._generate_mock_draft(question, evidence_list)
        else:
            logger.info("Groq API key not found. Executing simulated fast-path draft.")
            fast_draft = cls._generate_mock_draft(question, evidence_list)
            
        # Clean potential reasoning process blocks from output
        fast_draft = cls._clean_response(fast_draft)
            
        # Evaluation check
        confidence, risk_flags = cls._evaluate_draft(category, fast_draft, evidence_list)
        
        # Decision boundary check
        # Escalate if:
        # 1. Category is high-risk (legal or pricing)
        # 2. Confidence is low (< 0.85)
        # 3. Mismatches or critical risk flags detected
        is_acceptable = (
            confidence >= 0.85 and 
            len(risk_flags) == 0 and 
            category not in ["legal_contractual", "pricing_commercial"]
        )
        
        final_answer = fast_draft
        
        if not is_acceptable:
            cascade_escalated = True
            cascade_reason = f"Category: '{category}' high risk or confidence: {confidence} < 0.85"
            logger.info(f"Cascadeflow Escalation Triggered: {cascade_reason}")
            
            # Tier 2: Escalation to Flagship model (openai/gpt-oss-120b)
            if groq_client:
                try:
                    history_block = ""
                    if conversation_history:
                        history_block = f"\n\nConversation History (for context):\n{conversation_history}\n"
                    
                    escalated_prompt = f"""
                    You are a Flagship Security & Legal Reviewer Agent for beam.ai.
                    Review the draft proposal response and correct any errors, SLA conflicts, or ungrounded assertions.
                    Do not promise capabilities not explicitly present in corporate policies.
                    
                    Question:
                    {question}
                    
                    Corporate Context:
                    {evidence_context}
                    {history_block}
                    First Pass Fast Draft (review and correct):
                    {fast_draft}
                    """
                    response = groq_client.chat.completions.create(
                        model=settings.GROQ_PRO_MODEL,
                        messages=[{"role": "user", "content": escalated_prompt}],
                        temperature=0.1
                    )
                    final_answer = response.choices[0].message.content.strip()
                    # Recalculate confidence post-escalation
                    confidence, risk_flags = cls._evaluate_draft(category, final_answer, evidence_list)
                except Exception as e:
                    logger.error(f"Groq escalation model failed: {e}. Falling back to mock escalated draft.")
                    final_answer = cls._generate_mock_escalated_draft(question, fast_draft, evidence_list)
            else:
                logger.info("Executing simulated flagship escalated draft.")
                final_answer = cls._generate_mock_escalated_draft(question, fast_draft, evidence_list)
                confidence, risk_flags = cls._evaluate_draft(category, final_answer, evidence_list)
                
        # Clean final output reasoning blocks if present
        final_answer = cls._clean_response(final_answer)
                
        return {
            "generated_answer": final_answer,
            "confidence_score": confidence,
            "risk_flags": risk_flags,
            "cascade_escalated": cascade_escalated,
            "cascade_reason": cascade_reason
        }
        
    @staticmethod
    def _generate_mock_draft(question: str, evidence_list: List[Dict[str, Any]]) -> str:
        """
        Local simulated mock generation to ensure immediate utility.
        """
        if not evidence_list:
            return "[INFORMATION NOT IN CONTEXT LIBRARY]"
            
        best_match = evidence_list[0]
        # Simulate clean extraction or direct copy for base RAG
        if "data at rest" in question.lower() and "rest" in best_match["answer_text"].lower():
            return best_match["answer_text"]
        elif "transit" in question.lower() and "transit" in best_match["answer_text"].lower():
            return best_match["answer_text"]
        elif "sla" in question.lower() or "availability" in question.lower():
            # Standard cheap mini model draft might make a generic claim based on Chevron
            return "Yes, AegisCore standardly delivers high availability. We support a custom SLA of 99.99% for our enterprise clients."
        else:
            return best_match["answer_text"]

    @staticmethod
    def _generate_mock_escalated_draft(question: str, fast_draft: str, evidence_list: List[Dict[str, Any]]) -> str:
        """
        Local simulated advanced flagship correction for high-risk legal queries.
        """
        if not evidence_list:
            return "[INFORMATION NOT IN CONTEXT LIBRARY]"
            
        best_match = evidence_list[0]
        if "sla" in question.lower() or "availability" in question.lower():
            # Flagship corrects standard SLA to 99.9% following strict grounded library context
            return best_match["answer_text"]
        return fast_draft
