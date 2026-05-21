# Proffer AI

> **The intelligent, cognitive sales workspace that remembers every deal, preserves organizational intelligence, and guides your next move.**

Proffer AI is a premium, enterprise-grade AI sales copilot and workspace designed to accelerate sales pipelines and eliminate fragmented deal tracking. By integrating a persistent semantic memory layer (**Hindsight**) with a context-aware reasoning router (**CascadeFlow**), Proffer AI empowers Account Executives and Sales leaders to make data-driven decisions and generate highly personalized customer assets.

---

## 🌟 Key Architectures

### 🧠 Hindsight: Persistent Semantic Memory
Unlike ephemeral chat systems, Proffer AI leverages **Hindsight**—a persistent memory layer that captures and stores:
* Customer objection patterns and pricing pushbacks.
* Timeline activities (calls, meeting summaries, follow-ups).
* Contextual stakeholder notes.
* Competitor mentions and client pain points.

This ensures that historical learnings and crucial client details from previous deal cycles are instantly recalled and contextually injected into future conversations.

### ⚡ CascadeFlow: Cognitive Routing & Action Block Engine
At the core of the copilot is **CascadeFlow**, an agentic intelligence router powered by Google Gemini (with robust local simulation fallbacks). When you query the AI, CascadeFlow:
1. Classifies the query into structured intent classes (e.g., *Objection Resolution*, *Outbound Drafting*, *Deal Risk Evaluation*, *Call Prep*).
2. Dynamically pulls context from the relevant Hindsight memory scoped to the account.
3. Chains reasoning steps together to deliver strategic guidance.
4. Generates production-ready, actionable assets (like email drafts) directly into your workspace.

---

## 🖥️ Core Workspace Modules

* **📊 Executive Dashboard:** High-level overview of sales telemetry, active pipelines, pending team tasks, and database health metrics.
* **💼 Deals Pipeline:** Detailed tracker displaying active pipeline value, stages, deal health percentages, primary risks, and scheduled next steps.
* **🔬 Interactive Deal Workspace:** A focused command board for single deals where you can log meeting activities, resolve objections on the spot, and track the historical deal timeline.
* **🏢 Accounts Directory:** Database of prospect organizations, mapping their industry, employee size, pain points, and incumbent competitors.
* **🤖 AI Copilot Panel:** Interactive conversational agent to write hyper-personalized email follow-ups, synthesize objection counters, and auto-generate calendar tasks.
* **🔗 Memory & Timeline Ledger:** An immutable, chronological ledger displaying all Hindsight events and system reflections across sales cycles.

---

## 🛠️ Technology Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion (animations), Lucide Icons
* **Backend:** Express API, Node.js
* **AI/LLM Engine:** Google Gemini SDK (`@google/genai`)

---

## 🚀 Getting Started & Local Development

### Prerequisites
* **Node.js** (v18 or higher recommended)
* A **Gemini API Key** (optional, fallback local simulation provided)

### Step 1: Install Dependencies
Install all package dependencies for the React frontend and Express server:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory and add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 3: Run the Development Server
Spin up the joint Express backend and Vite frontend development server:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`** to access the workspace.

### Step 4: Build and Deploy (Production)
To generate the production bundle and run the server in production mode:
```bash
npm run build
npm start
```
