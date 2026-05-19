import logging
import datetime
import uuid
import re
import math
import collections
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from .models import ContentLibraryItem, ContentEmbedding, RetrievedEvidence

logger = logging.getLogger(__name__)

# ----------------- MATHEMATICAL TF-IDF & COUSINE SIMILARITY ENGINE -----------------

def tokenize_text(text: str) -> List[str]:
    """
    Standardize text into lowercase, clean punctuation tokens.
    """
    if not text:
        return []
    # Strip non-alphanumeric and split into lower words
    words = re.findall(r'\w+', text.lower())
    # Keep key words longer than 2 characters
    return [w for w in words if len(w) > 2]

def compute_tfidf_score(query: str, doc: str, corpus: List[str]) -> float:
    """
    Pure Python execution of a mathematically authentic TF-IDF Cosine Similarity calculation.
    """
    q_tokens = tokenize_text(query)
    d_tokens = tokenize_text(doc)
    
    if not q_tokens or not d_tokens:
        return 0.0
        
    # Term Frequencies (TF)
    q_tf = collections.Counter(q_tokens)
    d_tf = collections.Counter(d_tokens)
    
    # Vocabulary
    vocab = set(q_tokens + d_tokens)
    
    # Document Frequencies (DF) across the entire corporate library corpus
    df = {}
    for token in vocab:
        count = 0
        for doc_item in corpus:
            if token in tokenize_text(doc_item):
                count += 1
        df[token] = count if count > 0 else 1
        
    # Calculate weighted TF-IDF norms and dot products
    num_docs = len(corpus) + 1
    dot_product = 0.0
    q_norm_sq = 0.0
    d_norm_sq = 0.0
    
    for token in vocab:
        # Inverse Document Frequency (IDF)
        idf = math.log(num_docs / df.get(token, 1))
        
        # Weighted TF-IDF vectors
        q_weight = (q_tf.get(token, 0) / len(q_tokens)) * idf
        d_weight = (d_tf.get(token, 0) / len(d_tokens)) * idf
        
        dot_product += q_weight * d_weight
        q_norm_sq += q_weight ** 2
        d_norm_sq += d_weight ** 2
        
    if q_norm_sq == 0.0 or d_norm_sq == 0.0:
        return 0.0
        
    # Cosine similarity metric
    similarity = dot_product / (math.sqrt(q_norm_sq) * math.sqrt(d_norm_sq))
    return min(1.0, max(0.0, float(similarity)))


class HindsightMemoryEngine:
    """
    Hindsight Memory Substrate.
    Performs hybrid TF-IDF Cosine semantic grounding recalls and maintains
    a duplication reflect analysis system across Belief and Experience networks.
    """
    
    @staticmethod
    def recall(db: Session, question_text: str, category: str, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves matching grounding records from the database using 
        mathematical TF-IDF Cosine Similarity over the library.
        """
        logger.info(f"Hindsight TF-IDF recall triggered for: '{question_text}'")
        
        candidate_items = db.query(ContentLibraryItem).filter(
            ContentLibraryItem.is_approved == True
        ).all()
        
        if not candidate_items:
            logger.warning("Hindsight library is completely empty. Return blank evidence list.")
            return []
            
        # Build document corpus for TF-IDF IDF baseline
        corpus = [(item.question_text or "") + " " + item.answer_text for item in candidate_items]
        
        scored_results = []
        for item in candidate_items:
            item_text = (item.question_text or "") + " " + item.answer_text
            
            # Compute real TF-IDF similarity
            similarity = compute_tfidf_score(question_text, item_text, corpus)
            
            # Boost score if category matches
            if item.category.lower() == category.lower():
                similarity += 0.08
                
            # Boost score if item is within 'experience' network (past successful responses)
            if item.network == "experience":
                similarity += 0.02
                
            similarity = min(1.0, max(0.0, similarity))
            
            scored_results.append({
                "item": item,
                "score": similarity
            })
            
        # Sort and truncate
        scored_results = sorted(scored_results, key=lambda x: x["score"], reverse=True)[:limit]
        
        fused_evidence = []
        for r in scored_results:
            item = r["item"]
            fused_evidence.append({
                "content_id": item.content_id,
                "network": item.network,
                "title": item.title,
                "question_text": item.question_text,
                "answer_text": item.answer_text,
                "category": item.category,
                "similarity_score": r["score"],
                "source_document": item.source_document or "System Library"
            })
            
        return fused_evidence

    @staticmethod
    def retain(db: Session, question_text: str, answer_text: str, category: str, 
                reviewer_id: Optional[uuid.UUID] = None, source_doc: Optional[str] = None) -> Dict[str, Any]:
        """
        Retains SME-approved corrections back into standard corporate library segments.
        """
        logger.info(f"Hindsight Retain updating corporate database.")
        
        # 1. Update/Create a Belief network record
        belief_item = ContentLibraryItem(
            network="belief",
            title=f"Statement on {category} - Ingested {datetime.date.today()}",
            question_text=question_text,
            answer_text=answer_text,
            category=category,
            tags=[category, "sme_verified"],
            source_document=source_doc,
            owner_id=reviewer_id,
            is_approved=True,
            version=1
        )
        db.add(belief_item)
        db.flush()
        
        # Save placeholder embedding record
        embed_record = ContentEmbedding(
            content_id=belief_item.content_id,
            chunk_text=question_text,
            embedding_text="TF-IDF encoded text"
        )
        db.add(embed_record)
        
        # 2. Log transaction to the Experience Network
        exp_item = ContentLibraryItem(
            network="experience",
            title=f"Past Transaction - {category} Response - {datetime.date.today()}",
            question_text=question_text,
            answer_text=answer_text,
            category=category,
            tags=[category, "transactional_log"],
            source_document=source_doc,
            owner_id=reviewer_id,
            is_approved=True,
            version=1
        )
        db.add(exp_item)
        db.flush()
        
        db.add(ContentEmbedding(
            content_id=exp_item.content_id,
            chunk_text=question_text,
            embedding_text="TF-IDF encoded text"
        ))
        
        db.commit()
        
        return {
            "status": "updated_successfully",
            "networks_impacted": ["belief", "experience"],
            "belief_id": belief_item.content_id,
            "experience_id": exp_item.content_id
        }

    @staticmethod
    def reflect(db: Session) -> List[Dict[str, Any]]:
        """
        Reflect executes dynamic duplication sweeps across all knowledge base records
        using our TF-IDF Cosine Similarity matrix to identify redundant overlapping assertions.
        """
        logger.info("Hindsight Reflect executing duplication integrity sweeps...")
        items = db.query(ContentLibraryItem).filter(ContentLibraryItem.is_approved == True).all()
        reflections = []
        
        if len(items) < 2:
            return reflections
            
        corpus = [(item.question_text or "") + " " + item.answer_text for item in items]
        
        # Perform O(N^2) pairwise similarity check to find duplicate clusters
        visited = set()
        for i in range(len(items)):
            if items[i].content_id in visited:
                continue
                
            duplicates = []
            text_i = (items[i].question_text or "") + " " + items[i].answer_text
            
            for j in range(i + 1, len(items)):
                if items[j].content_id in visited:
                    continue
                    
                text_j = (items[j].question_text or "") + " " + items[j].answer_text
                
                # Check actual mathematical overlap similarity
                similarity = compute_tfidf_score(text_i, text_j, corpus)
                
                if similarity > 0.82:
                    duplicates.append(items[j])
                    visited.add(items[j].content_id)
                    
            if duplicates:
                visited.add(items[i].content_id)
                reflections.append({
                    "action_type": "merge_duplicates",
                    "target_content_ids": [str(items[i].content_id)] + [str(d.content_id) for d in duplicates],
                    "explanation": f"Detected high semantic duplicate overlap ({len(duplicates)+1} records match above 82%) for topic: '{items[i].title}'. Redundancy risk present.",
                    "suggested_revision": items[i].answer_text
                })
                
        # Also sweep for outdated items older than 180 days
        for item in items:
            age = (datetime.datetime.utcnow() - item.last_reviewed).days
            if age > 180 and item.content_id not in visited:
                reflections.append({
                    "action_type": "flag_stale",
                    "target_content_ids": [str(item.content_id)],
                    "explanation": f"Library item '{item.title}' has not been reviewed for {age} days. Decay risk present.",
                    "suggested_revision": item.answer_text
                })
                
        return reflections


def seed_knowledge_base(db: Session):
    """
    Seeds a small collection of standard security, general corporate, and SLA statements
    into the content library to guarantee immediate RAG functionality.
    """
    existing = db.query(ContentLibraryItem).limit(1).first()
    if existing:
        return
        
    logger.info("Seeding initial corporate knowledge library base...")
    
    seeds = [
        {
            "network": "belief",
            "title": "Corporate Ingress Security Controls",
            "question_text": "Do you encrypt data in transit using strong TLS algorithms?",
            "answer_text": "Yes. AegisCore secures all customer data in transit across public networks using Transport Layer Security (TLS) 1.3. Cryptographic connections negotiate strong cipher suites, specifically ECDHE-RSA-AES256-GCM-SHA384, to protect data against unauthorized interception. TLS 1.2 is supported as a legacy fallback, while insecure configurations (TLS 1.0, TLS 1.1) are explicitly disabled across all endpoints.",
            "category": "security",
            "tags": ["security", "encryption", "tls"]
        },
        {
            "network": "belief",
            "title": "Database Cryptographic Storage Controls",
            "question_text": "Do you encrypt data at rest using AES-256?",
            "answer_text": "Yes. AegisCore encrypts all customer data at rest within production databases and cloud storage volumes using FIPS 140-2 validated AES-256 encryption. Cryptographic keys are managed via AWS Key Management Service (KMS) and rotated automatically on a monthly cycle, aligned with our SOC 2 Type II assurance controls.",
            "category": "security",
            "tags": ["security", "encryption", "kms"]
        },
        {
            "network": "belief",
            "title": "Standard Availability Commitments",
            "question_text": "Does your organization guarantee a 99.99% service availability SLA?",
            "answer_text": "No. Under our standard Master Service Agreement (MSA), AegisCore guarantees a service availability SLA of 99.9%. Commitments for custom service availability of 99.99% are available for premium enterprise support tiers and require explicit legal review and contract addendums.",
            "category": "legal_contractual",
            "tags": ["legal", "sla", "availability"]
        },
        {
            "network": "belief",
            "title": "Company Foundation & Financial Overview",
            "question_text": "When was the company founded and where is it headquartered?",
            "answer_text": "AegisCore was founded in 2021 by a veteran team of compliance and infrastructure specialists. The corporation is headquartered in San Francisco, California, with global distributed engineering operations.",
            "category": "company_background",
            "tags": ["company", "financials", "founded"]
        }
    ]
    
    for seed in seeds:
        item = ContentLibraryItem(
            network=seed["network"],
            title=seed["title"],
            question_text=seed["question_text"],
            answer_text=seed["answer_text"],
            category=seed["category"],
            tags=seed["tags"],
            source_document="Seeded Document v1",
            is_approved=True,
            version=1
        )
        db.add(item)
        db.flush()
        
        db.add(ContentEmbedding(
            content_id=item.content_id,
            chunk_text=seed["question_text"],
            embedding_text="TF-IDF encoded"
        ))
        
    db.commit()
    logger.info("Successfully seeded corporate knowledge base.")
