import os
import json
from typing import List, Dict
from dotenv import load_dotenv
from .provider import chat_completion, get_redis

load_dotenv()
MEM_KEY = "hindsight:session:{}:history"
SUMMARY_KEY = "hindsight:session:{}:summary"

async def save_interaction(session_id: str, role: str, content: str) -> None:
    r = await get_redis()
    key = MEM_KEY.format(session_id)
    await r.rpush(key, json.dumps({"role": role, "content": content}))
    await r.ltrim(key, -200, -1)

async def list_history(session_id: str) -> List[Dict]:
    r = await get_redis()
    key = MEM_KEY.format(session_id)
    items = await r.lrange(key, 0, -1)
    history = []
    for item in items:
        try:
            if isinstance(item, (bytes, bytearray)):
                item = item.decode()
            history.append(json.loads(item))
        except Exception:
            continue
    return history

async def delete_history_index(session_id: str, idx: int) -> bool:
    r = await get_redis()
    key = MEM_KEY.format(session_id)
    placeholder = json.dumps({"role": "sys", "content": "__TO_DELETE__"})
    # lset + lrem pattern
    try:
        await r.lset(key, idx, placeholder)
        await r.lrem(key, 0, placeholder)
        return True
    except Exception:
        return False

async def edit_history_index(session_id: str, idx: int, role: str, content: str) -> bool:
    r = await get_redis()
    key = MEM_KEY.format(session_id)
    new = json.dumps({"role": role, "content": content})
    try:
        await r.lset(key, idx, new)
        return True
    except Exception:
        return False

async def summarize_memory(session_id: str, force: bool = False) -> str:
    r = await get_redis()
    key = MEM_KEY.format(session_id)
    items = await r.lrange(key, 0, -1)
    texts = []
    for item in items:
        try:
            if isinstance(item, (bytes, bytearray)):
                item = item.decode()
            texts.append(json.loads(item)["content"])
        except Exception:
            continue
    if not texts:
        return ""
    s_key = SUMMARY_KEY.format(session_id)
    if not force:
        existing = await r.get(s_key)
        if existing:
            return existing.decode() if isinstance(existing, (bytes, bytearray)) else existing
    summary_prompt = (
        "You are a memory synthesizer for a Proposal & RFP assistant. Produce a short summary "
        "of the user's preferences, previous tasks, and important context for future answers."
    )
    user = "===RECENT INTERACTIONS===\n\n" + "\n\n".join(texts[-50:]) + "\n\nPlease produce a compact bulleted summary."
    try:
        summary = await chat_completion(summary_prompt, user, temperature=0.0, prefer_fast=True)
    except Exception:
        summary = ""
    if summary:
        await r.set(s_key, summary, ex=60 * 60 * 24 * 30)
    return summary
