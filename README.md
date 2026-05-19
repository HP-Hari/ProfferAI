# RFP Agent Platform (starter)

Quick start:
1. Copy .env.example to .env and set OPENAI_API_KEY and REDIS_URL.
2. Install deps:
   npm install
3. Start Redis locally (or use hosted Redis).
4. Run:
   npm start
5. Open http://localhost:3000

Notes and next steps:
- This scaffold uses SQLite as a simple vector table. For production, migrate to Pinecone, Milvus, or Postgres+pgvector.
- Add PDF parsing and chunking with overlap; add concurrency & streaming responses (WebSockets).
- Add authentication, usage limits, auditing, and admin UI for templates and canned answers.
