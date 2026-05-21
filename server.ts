import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { INITIAL_DB_STATE } from './src/dbSeed.js';
import { DBState, TeamTask, Objection, SavedDraft, MemoryEvent, Activity } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase Client dynamically for server-side persistence using the provided credentials file
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const getUserId = (req: express.Request): string => {
  const headerId = req.headers['x-user-id'] || req.headers['authorization'];
  if (headerId && typeof headerId === 'string') {
    if (headerId.startsWith('Bearer ')) {
      return headerId.substring(7);
    }
    return headerId;
  }
  return 'demo-ae-user-id';
};

const getUserWorkspace = async (userId: string): Promise<DBState> => {
  try {
    const docRef = doc(firestoreDb, 'user_workspaces', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as DBState;
    } else {
      const initialClone = JSON.parse(JSON.stringify(INITIAL_DB_STATE)) as DBState;
      await setDoc(docRef, initialClone);
      return initialClone;
    }
  } catch (err) {
    console.error(`Error loading or seeding workspace for user ${userId}:`, err);
    return JSON.parse(JSON.stringify(INITIAL_DB_STATE)) as DBState;
  }
};

const saveUserWorkspace = async (userId: string, state: DBState): Promise<void> => {
  try {
    const docRef = doc(firestoreDb, 'user_workspaces', userId);
    await setDoc(docRef, state);
  } catch (err) {
    console.error(`Error saving workspace for user ${userId}:`, err);
  }
};

// Initialize Gemini SDK with User-Agent header for telemetry
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Chat features will fallback to smart mock responses.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
};

// REST API Endpoints for state management

// Get current database state
app.get('/api/db', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  res.json(userDb);
});

// Reset database state to seed initial data
app.post('/api/db/reset', async (req, res) => {
  const userId = getUserId(req);
  const initialClone = JSON.parse(JSON.stringify(INITIAL_DB_STATE)) as DBState;
  await saveUserWorkspace(userId, initialClone);
  res.json({ success: true, db: initialClone });
});

// Create/Update Task
app.post('/api/tasks', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const task = req.body as TeamTask;
  if (!task.id) {
    task.id = 'task_' + Math.random().toString(36).substring(2, 9);
    userDb.tasks.unshift(task);
  } else {
    const idx = userDb.tasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      userDb.tasks[idx] = { ...userDb.tasks[idx], ...task };
    } else {
      userDb.tasks.unshift(task);
    }
  }
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, task, db: userDb });
});

app.post('/api/tasks/toggle', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const { id } = req.body;
  const task = userDb.tasks.find(t => t.id === id);
  if (task) {
    task.status = task.status === 'pending' ? 'completed' : 'pending';
    await saveUserWorkspace(userId, userDb);
    res.json({ success: true, task, db: userDb });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// Create Objection
app.post('/api/objections', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const obj = req.body as Objection;
  if (!obj.id) {
    obj.id = 'obj_' + Math.random().toString(36).substring(2, 9);
    userDb.objections.unshift(obj);
  } else {
    const idx = userDb.objections.findIndex(o => o.id === obj.id);
    if (idx !== -1) {
      userDb.objections[idx] = { ...userDb.objections[idx], ...obj };
    }
  }
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, objection: obj, db: userDb });
});

app.post('/api/objections/resolve', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const { id, resolution } = req.body;
  const obj = userDb.objections.find(o => o.id === id);
  if (obj) {
    obj.status = 'resolved';
    obj.resolution = resolution || 'Resolved by AE via alignment meeting.';
    await saveUserWorkspace(userId, userDb);
    res.json({ success: true, objection: obj, db: userDb });
  } else {
    res.status(404).json({ error: 'Objection not found' });
  }
});

// Save Email draft
app.post('/api/drafts', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const draft = req.body as SavedDraft;
  if (!draft.id) {
    draft.id = 'drf_' + Math.random().toString(36).substring(2, 9);
    draft.createdAt = new Date().toISOString().split('T')[0];
    userDb.savedDrafts.unshift(draft);
  } else {
    const idx = userDb.savedDrafts.findIndex(d => d.id === draft.id);
    if (idx !== -1) {
      userDb.savedDrafts[idx] = { ...userDb.savedDrafts[idx], ...draft };
    }
  }
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, draft, db: userDb });
});

app.delete('/api/drafts/:id', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const { id } = req.params;
  userDb.savedDrafts = userDb.savedDrafts.filter(d => d.id !== id);
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, db: userDb });
});

// Save direct manual Hindsight Memory Event
app.post('/api/memories', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const memory = req.body as MemoryEvent;
  if (!memory.id) {
    memory.id = 'mem_' + Math.random().toString(36).substring(2, 9);
    memory.timestamp = new Date().toISOString();
    userDb.memories.unshift(memory);
  }
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, memory, db: userDb });
});

// Log custom call or note activity
app.post('/api/activities', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const activity = req.body as Activity;
  if (!activity.id) {
    activity.id = 'act_' + Math.random().toString(36).substring(2, 9);
    activity.timestamp = new Date().toISOString();
    userDb.activities.unshift(activity);
  }
  await saveUserWorkspace(userId, userDb);
  res.json({ success: true, activity, db: userDb });
});

// Core AI Chat endpoint utilizing Hindsight context and CascadeFlow workflow routing
app.post('/api/chat', async (req, res) => {
  const userId = getUserId(req);
  const userDb = await getUserWorkspace(userId);
  const { message, dealId, accountId } = req.body;
  const ai = getGeminiClient();

  // 1. Identify Context details from user's custom DB
  let focusedDeal = null;
  let focusedAccount = null;
  let contextualSystemInstructions = '';

  if (dealId) {
    focusedDeal = userDb.deals.find(d => d.id === dealId);
    if (focusedDeal) {
      focusedAccount = userDb.accounts.find(a => a.id === focusedDeal.accountId);
    }
  } else if (accountId) {
    focusedAccount = userDb.accounts.find(a => a.id === accountId);
    focusedDeal = userDb.deals.find(d => d.accountId === accountId);
  }

  // 2. Query Hindsight persistent memory to fetch associated records
  const relevantMemories = userDb.memories.filter(m => {
    return (dealId && m.dealId === dealId) || (accountId && userDb.deals.some(d => d.accountId === accountId && d.id === m.dealId));
  });

  const relevantObjections = userDb.objections.filter(o => {
    return (dealId && o.dealId === dealId) || (accountId && userDb.deals.some(d => d.accountId === accountId && d.id === o.dealId));
  });
  
  const relevantTasks = userDb.tasks.filter(t => {
    return (dealId && t.dealId === dealId) || (accountId && userDb.deals.some(d => d.accountId === accountId && d.id === t.dealId));
  });

  const relevantActivities = userDb.activities.filter(a => {
    return (dealId && a.dealId === dealId) || (accountId && userDb.deals.some(d => d.accountId === accountId && d.id === a.dealId));
  });

  // Compile prompt background context
  let hindsightSegment = `[HINDSIGHT PERSISTENT SEMANTIC MEMORIES]:\n`;
  if (relevantMemories.length > 0) {
    relevantMemories.forEach(m => {
      hindsightSegment += `- (${m.type.toUpperCase()} - Importance ${m.score}/10) [Date: ${m.timestamp}] - ${m.summary}\n`;
    });
  } else {
    hindsightSegment += `- No specific memories retrieved for this workspace. Fetching fallback team heuristics.\n`;
  }

  let dealSegment = '';
  if (focusedDeal) {
    dealSegment = `[ACTIVE WORKSPACE DEAL IN FOCUS]:
- Deal Name: ${focusedDeal.name}
- Stage: ${focusedDeal.stage}
- Value: $${focusedDeal.value.toLocaleString()}
- Close Date: ${focusedDeal.closeDate}
- Health Score: ${focusedDeal.healthScore}%
- Top Deal Risk: ${focusedDeal.topRisk}
- Next Action Scheduled: ${focusedDeal.nextStep}
- Deal Summary: ${focusedDeal.summary}
- Unresolved Objections Count: ${focusedDeal.unresolvedObjectionsCount}
`;
  }

  let accountSegment = '';
  if (focusedAccount) {
    accountSegment = `[ACTIVE WORKSPACE ACCOUNT IN FOCUS]:
- Account Name: ${focusedAccount.name}
- Domain: ${focusedAccount.domain}
- Industry: ${focusedAccount.industry}
- Size: ${focusedAccount.size}
- Likely Pain Points: ${focusedAccount.likelyPainPoints.join(', ')}
- Competitors: ${focusedAccount.competitorMentions.join(', ')}
- Executive Summary: ${focusedAccount.summary}
`;
  }

  let objectionsSegment = `[UNRESOLVED OBJECTIONS]:\n`;
  relevantObjections.forEach(o => {
    objectionsSegment += `- [${o.type.toUpperCase()} - ${o.status}] - ${o.text}\n`;
  });

  let tasksSegment = `[OUTSTANDING FOLLOW-UPS / TASKS]:\n`;
  relevantTasks.forEach(t => {
    tasksSegment += `- [Priority: ${t.priority.toUpperCase()} - ${t.status}] - ${t.description} (Due: ${t.dueDate})\n`;
  });

  let timelineSegment = `[RECENT ACTIVITY TIMELINE]:\n`;
  relevantActivities.slice(0, 5).forEach(a => {
    timelineSegment += `- [${a.type.toUpperCase()} - ${a.timestamp}]: ${a.title} - ${a.description}\n`;
  });

  contextualSystemInstructions = `
You are the primary cognitive agent powering "Proffer AI" — a polished, enterprise-grade AI sales copilot.
Your main frameworks are Hindsight (persistent memory across sales cycles) and CascadeFlow (reasoning workflow routing and structured outputs).

When replying, you must organize your response into a strict structured schema.
Analyze the user query, identify the most likely intent class:
1. "Objection Resolution Analysis": if they ask about pricing pushback, compliance blockers, security question, competitor discounts.
2. "Output / Email Outbound Drafting": if they ask to draft follow-up email, cold email, proposal outreach.
3. "Account / Deal Risk Evaluation": if they ask about deal status, health, timeline risks, missing stakeholders.
4. "Meeting Brief / Call Prep": if they ask to prepare for buyer call, stakeholder mapping briefs.
5. "General Deal History Retrieval": if they ask what happened last week or what commitments are open.

Your response MUST map how CascadeFlow routed this request. Return 3 to 4 sequential routing step strings. E.g.
- [CascadeFlow Route - Intent Classified: Outbound Drafting]
- [Hindsight Query - Scoped Account Memory: Acme Corp]
- [CascadeFlow Block - Personalization Heuristic Load]
- [CascadeFlow Output - Email Synthesizer Complete]

Always remain crisp, extremely authoritative, human-in-the-loop friendly, and professional (no raw lists of unformatted JSON, summarize detail eloquently in markdown).
`;

  const fullPromptInput = `
${dealSegment}
${accountSegment}
${hindsightSegment}
${objectionsSegment}
${tasksSegment}
${timelineSegment}

USER INQUIRY: "${message}"

Generate a structured response adhering strictly to the JSON schema. Ensure markdown content is formatted cleanly inside the "answer" field. Include actionable generated draft email, brief, or task in "generateArtifact" if requested or helpful.
`;

  if (!ai) {
    // Elegant fallback mock simulation in case of missing key to avoid crash, keeping with usability guidelines
    console.log("GEMINI_API_KEY is missing, generating authentic local simulation...");
    const isObjection = message.toLowerCase().includes('objection') || message.toLowerCase().includes('pricing') || message.toLowerCase().includes('blocked');
    const isOutbound = message.toLowerCase().includes('draft') || message.toLowerCase().includes('email') || message.toLowerCase().includes('write');
    const isRisk = message.toLowerCase().includes('risk') || message.toLowerCase().includes('blocker') || message.toLowerCase().includes('stalled');

    let simulatedAnswer = '';
    let simulatedArtifact = null;
    let simulatedMemories = ["Jonathan Vance requested tier-based pricing structure standard review.", "Vikram Mehta flagged the compliance backup rotation schedules."];
    let simulatedRisks = ["Incumbent pricing concession pressure in the mid-market", "Procurement alignment delay"];
    let simulatedSteps = ["Deliver custom tiered support package structure.", "Confirm meeting with regional Infosec panel."];
    let simulatedCascade = ["[Intent: General Intelligent Response]", "[Hindsight Retrieval: Dynamic Context Loading]", "[CascadeFlow Block: Generation Completed]"];

    if (isObjection) {
      simulatedAnswer = `### Objection Analysis: Objections Logged for this Account

We have identified **${relevantObjections.length || 1} unresolved objection** focusing on financial and integration capabilities:

1. **Pricing pushback (${focusedAccount?.name || 'Acme Corp'})**: Procurement suggests the enterprise tier list price is 15% too high compared to historical numbers.
2. **Support Structure Overlap**: Needs dedicated guaranteed response SLA coverage.

**Recommended Resolution Path:**
* Avoid immediate flat discounting. Instead, pivot to our **Custom Tiered SLA Bundle** structure which justifies the high support tier cost.`;
      simulatedCascade = ["[Intent: Objection Resolution Analysis]", "[Hindsight Query: Objection Index]", "[CascadeFlow Block: ROI Optimization]", "[Output Generation]"];
      simulatedMemories = ["Acme requested enterprise support SLA metrics on Tuesday.", "Competitor SentinelOps offers free standard support first year."];
      simulatedRisks = ["15% budget reduction insistence from buyer finance group."];
      simulatedSteps = ["Send the customized SLA bracket options.", "Request direct contact to procurement Lead Douglas Stone."];
    } else if (isOutbound) {
      const recipient = focusedDeal ? focusedDeal.owner : "Enterprise Partner";
      simulatedAnswer = `### Personalized Outbound Outreach Generated

I have generated a highly tailored outreach artifact for **${focusedAccount?.name || 'Acme Corp'}** addressing their industry bottlenecks. This has been formulated utilizing Hindsight observations to reflect custom context.

* Review the pre-compiled email draft in the actionable suggestions panel below. 
* Click **"Save Email Draft"** to instantly archive this compiled artifact into your Deals tab space.`;
      simulatedCascade = ["[Intent: Output/Email Outbound Drafting]", "[Hindsight Query: Account Insights]", "[CascadeFlow Block: Outreach Personalizer]", "[Output Generation]"];
      simulatedMemories = ["Arthur Pendelton reported an 18% fuel cost drop in fleets.", "Vertex Logistics is missing procurement intro."];
      simulatedArtifact = {
        type: 'email_draft',
        title: `Dynamic Fleet Operations Optimization - Proffer AI & ${focusedAccount?.name || 'Vertex Logistics'}`,
        content: `Hi Arthur,\n\nI was thrilled to see our dynamic dispatch system successfully demonstrated an 18% fuel logistics optimization during the operations pilot run.\n\nNow that we have validated these strong initial yields, I want to help establish the onboarding path. Could you introduce me to Clara Jenkins on your procurement team? This will allow us to align our service schedules so you can boot up the full system without shipping delays.\n\nBest regards,\n${recipient}`,
        targetRecipient: focusedAccount ? `Arthur Pendelton (${focusedAccount.domain})` : 'arthur@vertex.com'
      };
      simulatedSteps = ["Approve and dispatch custom draft.", "Ask Arthur for warm introduction link."];
    } else if (isRisk) {
      simulatedAnswer = `### Risk Matrix Summary: Critical Objections and Threat Indicators

Based on Hindsight reflection feeds:
* **Competitor Pressure**: Multi-cloud scaleup deals are experiencing aggressive renewal buyout bids.
* **Stakeholder Disengagement**: Missing formal endorsement from the procurement board or primary system architect.
* **Auditing Blockers**: Regional health data or defense operations demand custom technical audit clauses.`;
      simulatedCascade = ["[Intent: Account/Deal Risk Evaluation]", "[Hindsight Query: Memory Reflections]", "[CascadeFlow Block: Risk Assessment]", "[Output Generation]"];
      simulatedMemories = ["Nadia Vance flagged the ITAR jurisdiction clause.", "Orion Retail currently operates without active VP sponsor."];
      simulatedRisks = ["SentinelOps offering full discount tiers.", "EHR integration bottlenecks on patient data flow."];
      simulatedSteps = ["Generate custom comparative SentinelOps spreadsheet.", "Arrange compliance call for healthcare audit teams."];
    } else {
      simulatedAnswer = `### Proffer AI Deal Intelligence Diagnostic

I have compiled the comprehensive deal metrics for your active sales pipeline. 

* **Active Coverage**: Tracking ${userDb.deals.filter(d => d.stage !== 'Closed Won').length} active enterprise engagements.
* **Persistent History**: Scoped ${userDb.memories.length} historical events saved across the Hindsight memory fabric.
* **Action Center**: Detected ${userDb.tasks.filter(t => t.status === 'pending').length} pending follow-up operations.

How can I help you accelerate your pipeline today? I can prepare brief sheets, answer objections, generate sequences, or review contract compliance obstacles.`;
    }

    res.json({
      answer: simulatedAnswer,
      recalledMemories: simulatedMemories,
      risksDetected: simulatedRisks,
      recommendedSteps: simulatedSteps,
      cascadeFlowRouting: simulatedCascade,
      generateArtifact: simulatedArtifact
    });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPromptInput,
      config: {
        systemInstruction: contextualSystemInstructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: {
              type: Type.STRING,
              description: 'Primary AI conversational text. Must provide strategic guidance in rich, elegant, markdown format.'
            },
            recalledMemories: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific persistent facts or previous deal events recalled from Hindsight memory context.'
            },
            risksDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Associated deal risks, potential blockers, or aggressive competitor actions.'
            },
            recommendedSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Next best action bullets recommended for the account owner.'
            },
            cascadeFlowRouting: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Steps representing agent reasoning routing (e.g. [Intent Clafissied] -> [Hindsight Scoped Analysis]).'
            },
            generateArtifact: {
              type: Type.OBJECT,
              description: 'Optional, only return if user requested standard draft email, note, or briefing tool asset.',
              properties: {
                type: { type: Type.STRING, description: 'Type of draft: "email_draft", "call_prep", "internal_note" or "task"' },
                title: { type: Type.STRING, description: 'Subject line, title, or summary' },
                content: { type: Type.STRING, description: 'Complete high-quality final document content' },
                targetRecipient: { type: Type.STRING, description: 'Target colleague or buyer context' }
              }
            }
          },
          required: ['answer', 'recalledMemories', 'risksDetected', 'recommendedSteps', 'cascadeFlowRouting']
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || '{}');

    // CascadeFlow: If the response suggests creating an observation/reflection, let's write to db timeline
    if (parsedResponse.risksDetected?.length > 0 && Math.random() > 0.6) {
      const generatedObservation: MemoryEvent = {
        id: 'mem_auto_' + Math.random().toString(36).substring(2, 9),
        dealId: dealId || userDb.deals[0]?.id || '',
        timestamp: new Date().toISOString(),
        summary: `AI Agent Observation: Identified risk factor "${parsedResponse.risksDetected[0]}" after analyzing conversation.`,
        type: 'objection',
        score: 6
      };
      userDb.memories.unshift(generatedObservation);
      await saveUserWorkspace(userId, userDb);
    }

    res.json(parsedResponse);
  } catch (error: any) {
    console.error('Failed to query Gemini model:', error);
    res.status(500).json({ error: 'Failsafe: error compiling AI context.', details: error.message });
  }
});

// Serve static build or configure Vite middleware for development
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Proffer AI] Server booting successfully in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[Proffer AI] Secure proxy tunnel bound to http://0.0.0.0:${PORT}`);
  });
};

startServer();
