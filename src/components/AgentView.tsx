import { useState, useEffect, useRef } from 'react';
import { Send, Brain, Sparkles, AlertTriangle, CheckSquare, CalendarCheck, FileText, ChevronRight, CornerDownRight, CheckCircle2, MessageSquareDot, HelpCircle } from 'lucide-react';
import { DBState, Deal, Account, SavedDraft, TeamTask } from '../types.js';

interface AgentViewProps {
  initialDealId?: string;
  db: DBState;
  onSubmitChat: (message: string, dealId?: string, accountId?: string) => Promise<any>;
  onSaveDraft: (draft: any) => Promise<void>;
  onSaveTask: (task: any) => Promise<void>;
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  recalledMemories?: string[];
  risksDetected?: string[];
  recommendedSteps?: string[];
  cascadeFlowRouting?: string[];
  generateArtifact?: {
    type: string;
    title: string;
    content: string;
    targetRecipient?: string;
  } | null;
}

export default function AgentView({
  initialDealId,
  db,
  onSubmitChat,
  onSaveDraft,
  onSaveTask
}: AgentViewProps) {
  // Scoped Workspace Context
  const [selectedDealId, setSelectedDealId] = useState(initialDealId || '');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Prompt message inputs
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'agent',
      text: `### Proffer AI Copilot initialized.

I have established connection to your persistent **Hindsight memory matrices** and **CascadeFlow orchestration layers**.

How can I assist you with deal intelligence or outbound prospecting today? Set a specific workspace context in the side diagnostic panel to automatically ground my reasoning loops on active objects, objections and timeline histories.`
    }
  ]);

  // Scroll ref for chat threads
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isGenerating]);

  // Handle active Deal context changing
  useEffect(() => {
    if (selectedDealId) {
      const deal = db.deals.find(d => d.id === selectedDealId);
      if (deal) {
        setSelectedAccountId(deal.accountId);
      }
    }
  }, [selectedDealId, db]);

  // Handle sending a chat message to server
  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isGenerating) return;

    // Push User message
    const updatedHistory = [...chatHistory, { sender: 'user', text: textToSend } as ChatMessage];
    setChatHistory(updatedHistory);
    setUserInput('');
    setIsGenerating(true);

    try {
      const responseData = await onSubmitChat(textToSend, selectedDealId || undefined, selectedAccountId || undefined);
      
      // Push Agent Structured Response
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'agent',
          text: responseData.answer || 'Failsafe: Error compiling cognitive response. No context returned.',
          recalledMemories: responseData.recalledMemories || [],
          risksDetected: responseData.risksDetected || [],
          recommendedSteps: responseData.recommendedSteps || [],
          cascadeFlowRouting: responseData.cascadeFlowRouting || [],
          generateArtifact: responseData.generateArtifact || null
        }
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `### Internal Route Latency Flagged

Sorry, we failed to route that prompt through our server. This typically occurs when your API keys are misconfigured or connection limits are reached. Retrying local simulations...`
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Quick prompt presets
  const suggestedPrompts = [
    { label: 'Unresolved Objections', text: 'Analyze outstanding resolved and unresolved objection events.' },
    { label: 'Draft Follow-up Email', text: 'Draft a professional follow-up email after today’s SLA and support pricing call.' },
    { label: 'Identify Stakeholder Objections', text: 'Review decision-maker sentiment and identify potential deal blockers.' },
    { label: 'Summarize Pipeline Risks', text: 'Identify and rank potential pipeline threat factors.' }
  ];

  // Apply action saving email draft to Express DB
  const handleApplyDraft = async (artifact: any) => {
    if (!artifact) return;
    const toastData = {
      id: '',
      dealId: selectedDealId || db.deals[0]?.id || '',
      recipientName: artifact.targetRecipient || 'Acme Procurement',
      recipientEmail: 'procure@acme.com',
      subject: artifact.title,
      text: artifact.content,
      type: artifact.type,
      createdAt: new Date().toISOString().split('T')[0]
    };
    await onSaveDraft(toastData);
    alert(`Draft saved successfully to the database! You can review or delete archived outreach logs in your dashboard or settings.`);
  };

  // Convert suggested step or action into task
  const handleApplyTask = async (taskDescription: string) => {
    const taskData: Partial<TeamTask> = {
      dealId: selectedDealId || db.deals[0]?.id || '',
      description: taskDescription,
      dueDate: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
      priority: 'high',
      status: 'pending',
      owner: 'Sarah Connor'
    };
    await onSaveTask(taskData);
    alert(`Task created: "${taskDescription}" has been successfully assigned and added to your Workspace tasks feed.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
      
      {/* LEFT CHAT THREAD (Columns 1-3) */}
      <div className="lg:col-span-3 flex flex-col justify-between bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden h-full">
        
        {/* Chat Header showing current thread diagnostic */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-teal-500" />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white font-display">Active Copilot Core Thread</span>
              <p className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                {selectedDealId ? `Grounding: ${db.deals.find(d => d.id === selectedDealId)?.name}` : 'Unscoped general sales telemetry'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-teal-500 font-mono font-bold uppercase bg-teal-500/5 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping shrink-0"></span>
            <span>Hindsight Scoped</span>
          </div>
        </div>

        {/* Messaging Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/20 dark:bg-slate-950/10">
          {chatHistory.map((message, mIdx) => (
            <div
              key={mIdx}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} w-full items-start gap-4`}
            >
              {message.sender === 'agent' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm text-white">
                  <Brain className="w-4.5 h-4.5" />
                </div>
              )}
              
              <div className="max-w-2xl space-y-4">
                {/* Text Bubble Content */}
                <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                  message.sender === 'user'
                    ? 'bg-slate-900 text-white border-slate-800'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-800/65 shadow-xs'
                }`}>
                  <p className="font-sans whitespace-pre-line leading-relaxed text-sm">
                    {message.text}
                  </p>
                </div>

                {/* Structured Data components (CascadeFlow outputs) - displayed inside Agent's response segment */}
                {message.sender === 'agent' && (message.recalledMemories?.length || message.risksDetected?.length || message.recommendedSteps?.length) && (
                  <div className="space-y-3.5 border-l-2 border-teal-500/45 pl-4 mt-2">
                    
                    {/* Recall logs block */}
                    {message.recalledMemories && message.recalledMemories.length > 0 && (
                      <div>
                        <span className="text-[9px] font-mono tracking-wider font-bold text-teal-600 dark:text-teal-400 block uppercase">Hindsight Memories Retrieved:</span>
                        <div className="mt-1 space-y-1">
                          {message.recalledMemories.map((rec, rIdx) => (
                            <div key={rIdx} className="text-[11px] font-sans text-slate-500 dark:text-slate-400 flex items-start gap-1">
                              <CornerDownRight className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                              <span>"{rec}"</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Threat alerts */}
                    {message.risksDetected && message.risksDetected.length > 0 && (
                      <div>
                        <span className="text-[9px] font-mono tracking-wider font-bold text-rose-500 block uppercase">Threat Risks Flagged:</span>
                        <div className="mt-1 space-y-1">
                          {message.risksDetected.map((risk, riIdx) => (
                            <div key={riIdx} className="text-[11px] font-sans text-slate-500 dark:text-slate-400 flex items-start gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                              <span>{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick Steps Action Buttons */}
                    {message.recommendedSteps && message.recommendedSteps.length > 0 && (
                      <div>
                        <span className="text-[9px] font-mono tracking-wider font-bold text-slate-400 block uppercase">Next Correct Steps Recommendations:</span>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {message.recommendedSteps.map((rec, stepIdx) => (
                            <button
                              key={stepIdx}
                              onClick={() => handleApplyTask(rec)}
                              className="py-1 px-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-teal-500/10 dark:hover:bg-teal-500/10 hover:border-teal-500/30 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] leading-tight text-left cursor-pointer transition-colors"
                            >
                              + Convert: <strong className="text-slate-700 dark:text-slate-200">{rec}</strong> to team task
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Artifact drafting block panel */}
                    {message.generateArtifact && (
                      <div className="bg-slate-950/90 text-slate-100 rounded-xl p-4 mt-3 border border-slate-800 space-y-3 shadow-md max-w-xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-1.5 text-teal-400 font-display text-xs font-semibold">
                            <FileText className="w-4 h-4 shrink-0" />
                            <span>{message.generateArtifact.title}</span>
                          </div>
                          <span className="text-[9px] font-mono uppercase bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                            {message.generateArtifact.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-slate-300">
                          {message.generateArtifact.content}
                        </p>
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => handleApplyDraft(message.generateArtifact)}
                            className="py-1 px-3 bg-teal-500 text-slate-950 hover:bg-teal-650 cursor-pointer text-[10px] font-bold font-mono tracking-wider rounded uppercase"
                          >
                            Save Draft
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CascadeFlow Visual reasoning log path */}
                    {message.cascadeFlowRouting && message.cascadeFlowRouting.length > 0 && (
                      <div className="text-[9px] uppercase font-mono tracking-widest text-slate-400 flex flex-wrap gap-1.5 items-center bg-slate-100/50 dark:bg-slate-950/40 px-2 py-1 rounded w-fit border border-slate-150 dark:border-slate-800/40">
                        {message.cascadeFlowRouting.map((route, routeIdx) => (
                          <div key={routeIdx} className="flex items-center gap-1.5">
                            {routeIdx > 0 && <span>&bull;</span>}
                            <span>{route}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          ))}

          {/* SKELETON LOADER ANIMATION */}
          {isGenerating && (
            <div className="flex justify-start w-full items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0 border border-teal-200/20">
                <Brain className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="space-y-2 max-w-xl">
                <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-48 animate-pulse"></div>
                <div className="h-3.5 bg-slate-200 dark:bg-slate-850 rounded w-72 animate-pulse"></div>
                <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-64 animate-pulse"></div>
                <div className="text-[9px] font-mono text-teal-500 uppercase tracking-widest mt-2 block animate-pulse">
                  Routing prompt loop via CascadeFlow diagnostic panels...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preset Suggested Prompts Shortcuts Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {suggestedPrompts.map((p, pIdx) => (
              <button
                key={pIdx}
                disabled={isGenerating}
                onClick={() => handleSendPrompt(p.text)}
                className="py-1 px-3 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-[10px] font-medium font-mono cursor-pointer transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Prompt Input Text Area */}
        <div className="p-3 border-t border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-3.5 items-center shrink-0">
          <textarea
            rows={1}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={isGenerating}
            placeholder={isGenerating ? "Grounding chat threads..." : "Input prompt or paste telemetry text (e.g., pricing objections details)..."}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(userInput);
              }
            }}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors resize-none h-10 leading-relaxed font-sans"
          ></textarea>
          
          <button
            onClick={() => handleSendPrompt(userInput)}
            disabled={!userInput.trim() || isGenerating}
            className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 text-white flex items-center justify-center shrink-0 hover:shadow-xs transition-all disabled:opacity-30 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* RIGHT SIDE WORKSPACE MANAGER DIAGNOSTICS PANE (Column 4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-4 space-y-5 h-full overflow-y-auto flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-slate-400">Workspace Scopes</h3>
            <span className="text-[10px] text-slate-400 mt-1 block">Limit AI memory grounding scoping boundaries</span>
          </div>

          <div className="space-y-3.5">
            {/* Scoped Deal selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Scope Deal Object Context</label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">No General Scoped Deal (Broad search)</option>
                {db.deals.map(d => <option key={d.id} value={d.id}>{d.name} (${d.value.toLocaleString()})</option>)}
              </select>
            </div>

            {/* Scoped Account selector */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Scope Company profile</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="">No Grounded Account</option>
                {db.accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>

          {/* Quick Context status metrics card */}
          {selectedDealId && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3.5 border border-slate-100 dark:border-slate-900/60 space-y-1.5">
              <span className="text-[9px] uppercase font-mono font-bold text-teal-500">Workspace Status Overview</span>
              {(() => {
                const deal = db.deals.find(d => d.id === selectedDealId);
                if (!deal) return null;
                const outstandingCount = db.objections.filter(o => o.dealId === deal.id && o.status === 'unresolved').length;
                return (
                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div>Health Metric: <strong className="text-slate-700 dark:text-slate-250 font-semibold">{deal.healthScore}%</strong></div>
                    <div>Unresolved blockers: <strong className="text-slate-700 dark:text-slate-250 font-semibold">{outstandingCount} active objections</strong></div>
                    <div>Sponsor owner: <strong className="text-slate-700 dark:text-slate-250 font-semibold">{deal.owner}</strong></div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Saved Drafts Repository in Hindsight Space */}
        <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 mt-4 space-y-3.5">
          <div>
            <h4 className="text-[10px] tracking-widest font-mono uppercase font-bold text-slate-400">Archived Saved Drafts</h4>
            <span className="text-[9px] text-slate-400 block">Outreach logs kept inside full-stack memory</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {db.savedDrafts.length > 0 ? (
              db.savedDrafts.map((draft) => (
                <div key={draft.id} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg space-y-1">
                  <span className="block text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {draft.subject}
                  </span>
                  <span className="block text-[9px] font-mono uppercase text-slate-400">
                    {draft.recipientName} &bull; {draft.createdAt}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-[10px] hover:none text-slate-400 block italic py-2">No drafts compiled yet.</span>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
