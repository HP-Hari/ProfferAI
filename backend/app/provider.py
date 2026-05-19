import os
import time
import math
import httpx
import json
from typing import List, Optional, Dict

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY")
GROQ_KEY = os.getenv("GROQ_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
GROQ_CHAT_URL = os.getenv("GROQ_CHAT_URL")
GROQ_EMBEDDING_URL = os.getenv("GROQ_EMBEDDING_URL")

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
DEFAULT_LLM = os.getenv("LLM_MODEL", "gpt-4o-mini")
CHEAP_MODEL = os.getenv("CASCADE_CHEAP_MODEL", "gpt-3.5-turbo")
MID_MODEL = os.getenv("CASCADE_MID_MODEL", "gpt-4o-mini")

_redis = None

# Lazily init redis using redis-py async client if available
async def get_redis():
    global _redis
    if _redis is None:
        try:
            # prefer redis.asyncio (modern redis-py)
            from redis.asyncio import from_url
            _redis = from_url(REDIS_URL, decode_responses=True)
        except Exception as e:
            raise RuntimeError(f"Redis connection failed: {e}")
    return _redis

def _provider_order():
    order = []
    if OPENROUTER_KEY:
        order.append("openrouter")
    if GROQ_KEY:
        order.append("groq")
    if OPENAI_KEY:
        order.append("openai")
    return order

# Safe JSON decode helper
def _safe_json(resp):
    try:
        return resp.json()
    except Exception:
        try:
            return json.loads(resp.text or "{}")
        except Exception:
            return {}

async def _log_metric(key: str, payload: Dict):
    try:
        r = await get_redis()
        ts = int(time.time())
        # use Redis Stream for lightweight metrics
        # some clients expect bytes; ensure string
        await r.xadd(key, {"t": ts, "d": json.dumps(payload)}, maxlen=1024)
    except Exception:
        # non-fatal logging failure
        return

# simple heuristic token estimate
def estimate_tokens(text: str) -> int:
    return max(1, math.ceil(len(text) / 4.0))

def cascade_select_model(prompt: str) -> str:
    toks = estimate_tokens(prompt)
    if toks < 250:
        return CHEAP_MODEL
    if toks < 2000:
        return MID_MODEL
    return DEFAULT_LLM

async def embed_text(text: str) -> List[float]:
    """
    Try providers in priority order. Return embedding list or raise on total failure.
    """
    order = _provider_order()
    last_err = None
    async with httpx.AsyncClient(timeout=30) as client:
        for p in order:
            try:
                if p == "openrouter":
                    url = "https://api.openrouter.ai/v1/embeddings"
                    headers = {"Authorization": f"Bearer {OPENROUTER_KEY}"}
                    payload = {"model": EMBEDDING_MODEL, "input": text}
                    r = await client.post(url, json=payload, headers=headers)
                    j = _safe_json(r)
                    if "data" in j and j["data"]:
                        await _log_metric("metrics:embed", {"provider": "openrouter", "len": len(text)})
                        return j["data"][0]["embedding"]
                if p == "groq":
                    if not GROQ_EMBEDDING_URL:
                        raise RuntimeError("GROQ_EMBEDDING_URL not set")
                    headers = {"Authorization": f"Bearer {GROQ_KEY}"}
                    r = await client.post(GROQ_EMBEDDING_URL, json={"input": text}, headers=headers)
                    j = _safe_json(r)
                    if "embedding" in j:
                        await _log_metric("metrics:embed", {"provider": "groq", "len": len(text)})
                        return j["embedding"]
                    if "data" in j and j["data"]:
                        await _log_metric("metrics:embed", {"provider": "groq", "len": len(text)})
                        return j["data"][0].get("embedding")
                if p == "openai":
                    url = "https://api.openai.com/v1/embeddings"
                    headers = {"Authorization": f"Bearer {OPENAI_KEY}"}
                    payload = {"model": EMBEDDING_MODEL, "input": text}
                    r = await client.post(url, json=payload, headers=headers)
                    j = _safe_json(r)
                    if "data" in j and j["data"]:
                        await _log_metric("metrics:embed", {"provider": "openai", "len": len(text)})
                        return j["data"][0]["embedding"]
            except Exception as e:
                last_err = e
                await _log_metric("metrics:embed_error", {"provider": p, "error": str(e)})
                continue
    raise RuntimeError(f"All embedding providers failed: {last_err}")

async def chat_completion(system: str, user: str, temperature: float = 0.2, prefer_fast: bool = False, model: Optional[str] = None) -> str:
    """
    Multi-provider chat with cascadeflow model selection and graceful fallbacks.
    prefer_fast=True uses cascade_select_model heuristic.
    """
    order = _provider_order()
    prompt = f"{system}\n\n{user}"
    chosen_model = model or (cascade_select_model(prompt) if prefer_fast else DEFAULT_LLM)
    last_err = None
    async with httpx.AsyncClient(timeout=120) as client:
        for p in order:
            try:
                if p in ("openrouter", "openai"):
                    url = "https://api.openrouter.ai/v1/chat/completions" if p == "openrouter" else "https://api.openai.com/v1/chat/completions"
                    key = OPENROUTER_KEY if p == "openrouter" else OPENAI_KEY
                    payload = {
                        "model": chosen_model,
                        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                        "temperature": temperature,
                        "max_tokens": 1024,
                    }
                    headers = {"Authorization": f"Bearer {key}"}
                    start = time.time()
                    r = await client.post(url, json=payload, headers=headers)
                    latency = time.time() - start
                    j = _safe_json(r)
                    # support both choices[...] and direct text
                    if "choices" in j and j["choices"]:
                        c = j["choices"][0]
                        out = c.get("message", {}).get("content") or c.get("text")
                        await _log_metric("metrics:chat", {"provider": p, "model": chosen_model, "latency": latency})
                        return out or ""
                if p == "groq":
                    if not GROQ_CHAT_URL:
                        raise RuntimeError("GROQ_CHAT_URL not set")
                    payload = {"system": system, "prompt": user, "temperature": temperature}
                    headers = {"Authorization": f"Bearer {GROQ_KEY}"}
                    start = time.time()
                    r = await client.post(GROQ_CHAT_URL, json=payload, headers=headers)
                    latency = time.time() - start
                    j = _safe_json(r)
                    if "output" in j:
                        await _log_metric("metrics:chat", {"provider": "groq", "latency": latency})
                        return j["output"]
                    if "choices" in j and j["choices"]:
                        c = j["choices"][0]
                        out = c.get("text") or c.get("message", {}).get("content")
                        await _log_metric("metrics:chat", {"provider": "groq", "latency": latency})
                        return out or ""
            except Exception as e:
                last_err = e
                await _log_metric("metrics:chat_error", {"provider": p, "error": str(e)})
                continue
    raise RuntimeError(f"All chat providers failed: {last_err}")
