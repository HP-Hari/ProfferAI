const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const { openDB } = require('sqlite');
const sqlite3 = require('sqlite3');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const AGENTS = require('./agents/agents');

require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// storage for uploaded files (text). For PDFs, do offline conversion & pass text.
const upload = multer({ dest: 'uploads/' });

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SQLITE_DB = process.env.SQLITE_DB || './data/embeddings.db';
const OPENAI_KEY = process.env.OPENAI_API_KEY; // kept for backward-compat if present
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_CHAT_URL = process.env.GROQ_CHAT_URL; // user-supplied full endpoint if using Groq
const GROQ_EMBEDDING_URL = process.env.GROQ_EMBEDDING_URL;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

if (!OPENAI_KEY) {
  console.warn('OPENAI_API_KEY not set. Please add it to .env');
}

// Redis client for session context
const redis = createClient({ url: REDIS_URL });
redis.connect().catch((e) => console.error('Redis connect error', e));

// Initialize SQLite vector table
async function initDB() {
  const db = await openDB({
    filename: SQLITE_DB,
    driver: sqlite3.Database
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      content TEXT
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      doc_id TEXT,
      chunk_id INTEGER,
      embedding BLOB,
      content TEXT,
      PRIMARY KEY (doc_id, chunk_id)
    );
  `);
  return db;
}

let dbPromise = initDB();

// Provider helper: chooses based on env keys
function providerName() {
  if (OPENROUTER_API_KEY) return 'openrouter';
  if (GROQ_API_KEY) return 'groq';
  if (OPENAI_KEY) return 'openai';
  return null;
}

// Helpers for embeddings & vector search (simple linear scan)
// Embed using available provider
async function embedText(text) {
  const provider = providerName();
  if (!provider) throw new Error('No embedding provider configured. Set OPENROUTER_API_KEY or GROQ_API_KEY or OPENAI_API_KEY.');

  if (provider === 'openrouter' || provider === 'openai') {
    // OpenRouter and OpenAI-compatible endpoint
    const url = provider === 'openrouter'
      ? 'https://api.openrouter.ai/v1/embeddings'
      : 'https://api.openai.com/v1/embeddings';
    const key = provider === 'openrouter' ? OPENROUTER_API_KEY : OPENAI_KEY;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: text, model: EMBEDDING_MODEL })
    });
    const j = await resp.json();
    if (!j.data || !j.data[0]) throw new Error('Embedding provider error: ' + JSON.stringify(j));
    return j.data[0].embedding;
  }

  if (provider === 'groq') {
    if (!GROQ_EMBEDDING_URL) throw new Error('GROQ_EMBEDDING_URL not set for Groq embeddings.');
    // Generic POST to user-provided Groq embedding URL. Expect response {embedding: [...] } or {data:[{embedding}]}
    const resp = await fetch(GROQ_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: text })
    });
    const j = await resp.json();
    // try common shapes
    if (j.embedding) return j.embedding;
    if (j.data && j.data[0] && j.data[0].embedding) return j.data[0].embedding;
    throw new Error('Unexpected Groq embedding response: ' + JSON.stringify(j));
  }

  throw new Error('Unsupported embedding provider');
}

function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}
function norm(a) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}
function cosine(a, b) {
  return dot(a, b) / (norm(a) * norm(b) + 1e-12);
}
async function upsertDocument(title, content) {
  const db = await dbPromise;
  const docId = uuidv4();
  await db.run('INSERT INTO documents(id, title, content) VALUES(?,?,?)', [docId, title, content]);
  // naive chunking: split by paragraphs, compute embedding per chunk
  const chunks = content.split('\n\n').map(s => s.trim()).filter(Boolean);
  for (let i = 0; i < chunks.length; i++) {
    const emb = await embedText(chunks[i]);
    const blob = Buffer.from(JSON.stringify(emb));
    await db.run('INSERT INTO embeddings(doc_id, chunk_id, embedding, content) VALUES(?,?,?,?)', [docId, i, blob, chunks[i]]);
  }
  return docId;
}
async function searchRelevant(query, topK = 3) {
  const qEmb = await embedText(query);
  const db = await dbPromise;
  const rows = await db.all('SELECT doc_id, chunk_id, embedding, content FROM embeddings');
  const scored = rows.map(r => {
    const emb = JSON.parse(Buffer.from(r.embedding).toString());
    return { ...r, score: cosine(qEmb, emb) };
  }).sort((a, b) => b.score - a.score).slice(0, topK);
  return scored;
}

// Simple LLM call supporting OpenRouter and Groq (via configured URL)
async function callLLM(systemPrompt, userPrompt, temperature = 0.2) {
  const provider = providerName();
  if (!provider) throw new Error('No LLM provider configured. Set OPENROUTER_API_KEY or GROQ_API_KEY or OPENAI_API_KEY.');

  if (provider === 'openrouter' || provider === 'openai') {
    const url = provider === 'openrouter'
      ? 'https://api.openrouter.ai/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const key = provider === 'openrouter' ? OPENROUTER_API_KEY : OPENAI_KEY;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: 1000
      })
    });
    const j = await res.json();
    if (j.error) throw new Error(JSON.stringify(j.error));
    // OpenRouter/OpenAI return shape:
    if (j.choices && j.choices[0] && j.choices[0].message) return j.choices[0].message.content;
    if (j.choices && j.choices[0] && j.choices[0].text) return j.choices[0].text;
    throw new Error('Unexpected LLM response: ' + JSON.stringify(j));
  }

  if (provider === 'groq') {
    if (!GROQ_CHAT_URL) throw new Error('GROQ_CHAT_URL not set for Groq chat completions.');
    // POST to user-provided Groq chat URL. Expect result text in a known field.
    const res = await fetch(GROQ_CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system: systemPrompt,
        prompt: userPrompt,
        temperature,
        max_tokens: 1000
      })
    });
    const j = await res.json();
    // try common shapes
    if (j.output) return j.output;
    if (j.choices && j.choices[0] && (j.choices[0].text || (j.choices[0].message && j.choices[0].message.content))) {
      return j.choices[0].text || j.choices[0].message.content;
    }
    throw new Error('Unexpected Groq chat response: ' + JSON.stringify(j));
  }

  throw new Error('Unsupported LLM provider');
}

// Endpoint: upload/injest RFP text
app.post('/api/upload', upload.single('file'), async (req, res) => {
  // Expecting text file; for PDFs, user should pre-convert to text or add a parser.
  try {
    const title = req.body.title || req.file.originalname || 'uploaded';
    const text = fs.readFileSync(req.file.path, 'utf8');
    const docId = await upsertDocument(title, text);
    fs.unlinkSync(req.file.path);
    res.json({ ok: true, docId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Endpoint: ask with session retention and multi-agent orchestration
app.post('/api/ask', async (req, res) => {
  // body: { sessionId?, question }
  try {
    const { sessionId: providedSession, question } = req.body;
    const sessionId = providedSession || uuidv4();

    // load session history from Redis
    const historyKey = `session:${sessionId}:history`;
    let history = [];
    const raw = await redis.get(historyKey);
    if (raw) history = JSON.parse(raw);

    // Add user question to history
    history.push({ role: 'user', content: question });

    // Retrieve top relevant RFP chunks
    const relevant = await searchRelevant(question, 4);
    const contextText = relevant.map(r => `- (${r.score.toFixed(3)}) ${r.content}`).join('\n');

    // Orchestrator: run each agent with its system prompt and the same context+question
    const agentResults = [];
    for (const agent of AGENTS.list()) {
      const systemPrompt = agent.systemPrompt;
      const agentInput = `Context (from RFP):\n${contextText}\n\nQuestion:\n${question}\n\nInstructions: ${agent.instructions || ''}`;
      const out = await callLLM(systemPrompt, agentInput, agent.temperature || 0.1);
      agentResults.push({ agent: agent.name, output: out });
    }

    // Merge agent outputs with a final synthesis agent (concise answer + source refs)
    const synthInstruction = `You are a synthesis agent. Given the outputs from specialists, produce a concise customer-ready answer (2-4 paragraphs) and then a short bulleted "Sources" section referencing which agent produced which point.`;
    const combined = agentResults.map(a => `== Agent: ${a.agent} ==\n${a.output}`).join('\n\n');
    const synthesis = await callLLM(synthInstruction, `Specialist outputs:\n\n${combined}\n\nQuestion:\n${question}`, 0.2);

    // Persist history (cap to recent N)
    history.push({ role: 'assistant', content: synthesis });
    const MAX = 40;
    if (history.length > MAX) history = history.slice(history.length - MAX);
    await redis.set(historyKey, JSON.stringify(history), { EX: 60 * 60 * 24 * 7 }); // 7 days

    res.json({ ok: true, sessionId, reply: synthesis, agentResults });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Basic health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve simple frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on ${port}`));
