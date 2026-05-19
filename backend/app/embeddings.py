import os
import httpx
from dotenv import load_dotenv
from sqlalchemy import text
from .db import AsyncSessionLocal
from typing import List, Dict

load_dotenv()

OPENAI_KEY = os.getenv("OPENAI_API_KEY")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
GROQ_CHAT_URL = os.getenv("GROQ_CHAT_URL")
GROQ_EMBEDDING_URL = os.getenv("GROQ_EMBEDDING_URL")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")
VEC_DIM = int(os.getenv("VECTOR_DIM", "1536"))

def provider():
    if OPENROUTER_KEY:
        return "openrouter"
    if GROQ_KEY:
        return "groq"
    if OPENAI_KEY:
        return "openai"
    return None

async def embed_text(text_in: str) -> List[float]:
    p = provider()
    if not p:
        raise RuntimeError("No provider configured (set OPENROUTER_API_KEY, GROQ_API_KEY, or OPENAI_API_KEY)")
    async with httpx.AsyncClient(timeout=30) as client:
        if p in ("openrouter", "openai"):
            url = "https://api.openrouter.ai/v1/embeddings" if p == "openrouter" else "https://api.openai.com/v1/embeddings"
            key = OPENROUTER_KEY if p == "openrouter" else OPENAI_KEY
            r = await client.post(url, json={"model": EMBEDDING_MODEL, "input": text_in}, headers={"Authorization": f"Bearer {key}"})
            j = r.json()
            if "data" in j and j["data"]:
                return j["data"][0]["embedding"]
            raise RuntimeError("Unexpected embedding response: " + str(j))
        if p == "groq":
            if not GROQ_EMBEDDING_URL:
                raise RuntimeError("Set GROQ_EMBEDDING_URL for Groq provider")
            r = await client.post(GROQ_EMBEDDING_URL, json={"input": text_in}, headers={"Authorization": f"Bearer {GROQ_KEY}"})
            j = r.json()
            if "embedding" in j:
                return j["embedding"]
            if "data" in j and j["data"]:
                return j["data"][0].get("embedding")
            raise RuntimeError("Unexpected Groq embedding response: " + str(j))

async def chat_completion(system: str, user: str, temperature: float = 0.2) -> str:
    p = provider()
    if not p:
        raise RuntimeError("No LLM provider configured")
    async with httpx.AsyncClient(timeout=60) as client:
        if p in ("openrouter", "openai"):
            url = "https://api.openrouter.ai/v1/chat/completions" if p == "openrouter" else "https://api.openai.com/v1/chat/completions"
            key = OPENROUTER_KEY if p == "openrouter" else OPENAI_KEY
            payload = {"model": LLM_MODEL, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}], "temperature": temperature}
            r = await client.post(url, json=payload, headers={"Authorization": f"Bearer {key}"})
            j = r.json()
            if "choices" in j and j["choices"]:
                c = j["choices"][0]
                if "message" in c and "content" in c["message"]:
                    return c["message"]["content"]
                if "text" in c:
                    return c["text"]
            raise RuntimeError("Unexpected LLM response: " + str(j))
        if p == "groq":
            if not GROQ_CHAT_URL:
                raise RuntimeError("Set GROQ_CHAT_URL for Groq provider")
            r = await client.post(GROQ_CHAT_URL, json={"system": system, "prompt": user, "temperature": temperature}, headers={"Authorization": f"Bearer {GROQ_KEY}"})
            j = r.json()
            if "output" in j:
                return j["output"]
            if "choices" in j and j["choices"]:
                c = j["choices"][0]
                return c.get("text") or (c.get("message") and c["message"].get("content"))
            raise RuntimeError("Unexpected Groq chat response: " + str(j))

async def vector_search(query: str, top_k: int = 5) -> List[Dict]:
    """
    Compute embedding for query and return top_k chunks ordered by pgvector distance.
    Returns list of dicts: {id, content, distance, metadata, document_id}
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
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "document_id": r.document_id,
            "content": r.content,
            "metadata": r.metadata,
            "distance": float(r.distance)
        })
    return result
