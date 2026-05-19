import os
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text

from .provider import get_redis, chat_completion, embed_text
from .retrieval import hybrid_search
from .hindsight import save_interaction, list_history, summarize_memory
from .auth import create_access_token, get_current_user
from .db import AsyncSessionLocal

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3002", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    print("[INFO] Starting application — running startup checks")
    try:
        r = await get_redis()
        pong = await r.ping()
        print("[OK] Redis ping:", pong)
    except Exception as e:
        print("[WARN] Redis init failed:", e)
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        print("[OK] Postgres connectivity OK")
    except Exception as e:
        print("[WARN] Postgres connectivity failed:", e)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("[ERROR] Unhandled exception:", exc)
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"ok": False, "error": "internal server error"})

@app.get("/health")
async def health():
    return {"ok": True, "status": "healthy"}

@app.get("/debug/status")
async def debug_status():
    info = {"ok": True, "services": {}, "env": {}}
    try:
        r = await get_redis()
        pong = await r.ping()
        info["services"]["redis"] = {"ok": True, "ping": str(pong)}
    except Exception as e:
        info["services"]["redis"] = {"ok": False, "error": str(e)}
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        info["services"]["postgres"] = {"ok": True}
    except Exception as e:
        info["services"]["postgres"] = {"ok": False, "error": str(e)}
    info["env"]["DATABASE_URL_set"] = bool(os.getenv("DATABASE_URL"))
    info["env"]["REDIS_URL_set"] = bool(os.getenv("REDIS_URL"))
    info["env"]["OPENROUTER_API_KEY_set"] = bool(os.getenv("OPENROUTER_API_KEY"))
    info["env"]["GROQ_API_KEY_set"] = bool(os.getenv("GROQ_API_KEY"))
    return info

# ===== Auth =====
@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    username = form_data.username
    password = form_data.password
    ADMIN_USER = os.getenv("ADMIN_USER", "admin")
    ADMIN_PASS = os.getenv("ADMIN_PASS", "admin")
    if username != ADMIN_USER or password != ADMIN_PASS:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = create_access_token({"sub": username, "roles": ["admin"]})
    return {"access_token": access_token, "token_type": "bearer"}

# ===== Upload =====
@app.post("/api/upload")
async def upload(file: UploadFile = File(...), title: str = Form(None), current_user: dict = Depends(get_current_user)):
    try:
        import boto3
        key = f"uploads/{uuid.uuid4()}-{file.filename}"
        bucket = os.getenv("S3_BUCKET", "rfp-bucket")
        s3 = boto3.client(
            "s3",
            endpoint_url=os.getenv("S3_ENDPOINT"),
            aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
            aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
        )
        content = await file.read()
        s3.put_object(Bucket=bucket, Key=key, Body=content)
        return {"ok": True, "s3_key": key, "title": title or file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== Ask =====
class AskRequest(BaseModel):
    question: str
    session_id: str = None

@app.post("/api/ask")
async def ask(req: AskRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="question required")
    try:
        session_id = req.session_id or str(uuid.uuid4())
        history = await list_history(session_id)
        context = "\n\n".join([f"{h['role']}: {h['content']}" for h in history[-10:]]) if history else ""
        top_chunks = await hybrid_search(req.question, top_k=5)
        retrieved_context = "\n\n".join([f"({c.get('score', 0):.4f}) {c['content']}" for c in top_chunks]) if top_chunks else ""
        prompt = (
            "You are a Proposal & RFP assistant. Use the retrieved context and history to answer clearly.\n\n"
            f"Retrieved Context:\n{retrieved_context}\n\n"
            f"History:\n{context}\n\n"
            f"Question:\n{req.question}"
        )
        answer = await chat_completion("Proposal & RFP assistant", prompt, temperature=0.2, prefer_fast=True)
        await save_interaction(session_id, "user", req.question)
        await save_interaction(session_id, "assistant", answer)
        return {"ok": True, "session_id": session_id, "reply": answer, "retrieved_context": retrieved_context}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== Memory =====
@app.get("/api/memory/{session_id}")
async def memory_list(session_id: str, current_user: dict = Depends(get_current_user)):
    try:
        history = await list_history(session_id)
        summary = await summarize_memory(session_id)
        return {"ok": True, "history": history, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/memory/{session_id}/add")
async def memory_add(session_id: str, role: str = Form(...), content: str = Form(...), current_user: dict = Depends(get_current_user)):
    try:
        await save_interaction(session_id, role, content)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
