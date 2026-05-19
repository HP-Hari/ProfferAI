from typing import List, Dict
from sqlalchemy import text
from .db import AsyncSessionLocal
from .provider import embed_text

try:
    from sentence_transformers import CrossEncoder
    reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
except Exception:
    reranker = None

async def vector_search(query: str, top_k: int = 5) -> List[Dict]:
    """
    Perform nearest-neighbor search using pgvector.
    """
    q_emb = await embed_text(query)
    sql = text("""
        SELECT id, document_id, content, metadata, embedding <-> :q AS distance
        FROM chunks
        ORDER BY distance
        LIMIT :k
    """)
    async with AsyncSessionLocal() as session:
        res = await session.execute(sql, {"q": q_emb, "k": top_k})
        rows = res.fetchall()
    return [{"id": r.id, "document_id": r.document_id, "content": r.content, "metadata": r.metadata, "distance": float(r.distance)} for r in rows]

async def hybrid_search(query: str, top_k: int = 5) -> List[Dict]:
    """
    Perform hybrid retrieval: nearest-neighbor search + cross-encoder reranking.
    """
    candidates = await vector_search(query, top_k * 2)
    if not candidates or not reranker:
        return candidates
    texts = [c["content"] for c in candidates]
    # CrossEncoder expects list of pairs and returns scores
    pairs = [(query, t) for t in texts]
    scores = reranker.predict(pairs)
    reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)[:top_k]
    return [{"id": c["id"], "document_id": c["document_id"], "content": c["content"], "metadata": c["metadata"], "score": float(s)} for c, s in reranked]
