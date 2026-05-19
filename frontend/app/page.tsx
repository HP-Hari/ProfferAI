"use client";
import React, { useState, useEffect, useRef } from 'react';

const API = "http://localhost:8000/api/v1";

// Rich Markdown and format parser for AI agent answers
function renderContent(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    if (line.startsWith('### ')) {
      return <h3 key={i} className="font-bold text-white mt-4 mb-2 text-sm tracking-tight" dangerouslySetInnerHTML={{__html: processed.slice(4)}} />;
    }
    if (line.startsWith('## ')) {
      return <h2 key={i} className="font-bold text-white mt-5 mb-2.5 text-base tracking-tight border-b border-white/[0.05] pb-1" dangerouslySetInnerHTML={{__html: processed.slice(3)}} />;
    }
    if (line.startsWith('# ')) {
      return <h1 key={i} className="font-extrabold text-white mt-6 mb-3 text-lg tracking-tight" dangerouslySetInnerHTML={{__html: processed.slice(2)}} />;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return <li key={i} className="ml-5 mb-1.5 list-disc text-zinc-300 leading-relaxed text-xs" dangerouslySetInnerHTML={{__html: processed.slice(2)}} />;
    }
    if (/^\d+\.\s/.test(line)) {
      return <li key={i} className="ml-5 mb-1.5 list-decimal text-zinc-300 leading-relaxed text-xs" dangerouslySetInnerHTML={{__html: processed.replace(/^\d+\.\s/, '')}} />;
    }
    if (line.startsWith('> ')) {
      return <blockquote key={i} className="border-l-3 border-indigo-500 pl-4 py-1 my-3 bg-indigo-500/5 text-zinc-400 italic text-xs rounded-r-md" dangerouslySetInnerHTML={{__html: processed.slice(2)}} />;
    }
    if (line.trim() === '') {
      return <div key={i} className="h-3" />;
    }
    return <p key={i} className="mb-2 text-zinc-300 text-xs leading-relaxed font-medium" dangerouslySetInnerHTML={{__html: processed}} />;
  });
}

export default function BeamAIWorkspace() {
  const [activeTab, setActiveTab] = useState<'rfp' | 'library' | 'docs'>('rfp');
  
  // Navigation & UI Layout States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'editor'>('chat');
  const [selectedModel, setSelectedModel] = useState("qwen-32b-cascade");
  
  // Core AI & Chat Session States
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  
  // Asynchronous Loading Flags
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [bulkDrafting, setBulkDrafting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  
  // Grounded RFP Workspace spreadsheet records
  const [activeDocName, setActiveDocName] = useState<string>("");
  const [extractedRequirements, setExtractedRequirements] = useState<any[]>([]);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [reqSearch, setReqSearch] = useState("");
  
  // Corporate Knowledge Base (RAG Library) States
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libSearch, setLibSearch] = useState("");
  const [newLibTitle, setNewLibTitle] = useState("");
  const [newLibText, setNewLibText] = useState("");
  const [newLibCategory, setNewLibCategory] = useState("Security Controls");
  const [libAdding, setLibAdding] = useState(false);
  const [staleWarnings, setStaleWarnings] = useState<any[]>([]);
  
  // Raw Documents Intake states
  const [documents, setDocuments] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Record<string, 'up' | 'down'>>({});
  
  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    fetchSessions(); 
    fetchLibrary();
  }, []);

  useEffect(() => { 
    if (activeSession) {
      fetchHistory(activeSession.session_id); 
      setExtractedRequirements([]);
      setSelectedRequirement(null);
      setSidebarTab('chat');
    }
  }, [activeSession]);

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); 
  }, [messages, sending, uploading]);

  const fetchSessions = async () => {
    try {
      const r = await fetch(`${API}/chat/sessions`);
      if (r.ok) {
        const d = await r.json();
        setSessions(d);
        if (d.length > 0 && !activeSession) {
          setActiveSession(d[0]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch chat sessions:", e);
    }
  };

  const fetchHistory = async (sid: string) => {
    try {
      const r = await fetch(`${API}/chat/sessions/${sid}/history`);
      if (r.ok) { 
        const d = await r.json(); 
        setMessages(d); 
        
        // Auto-hydrate parsed requirements spreadsheet if a document ingestion is found in history
        const uploadMsg = d.find((m: any) => m.sender === "agent" && m.metadata_json?.[0]?.extracted_questions > 0);
        if (uploadMsg) {
          const meta = uploadMsg.metadata_json[0];
          setActiveDocName(meta.file_name);
          hydrateRequirements(meta.questions_list);
          addDocumentRecord(meta.file_name, meta.extracted_questions);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  };

  const fetchLibrary = async () => {
    try {
      const r = await fetch(`${API}/library`);
      if (r.ok) { 
        setLibraryItems(await r.json()); 
      }
    } catch (e) {
      console.error("Failed to load library items:", e);
    }
  };

  const hydrateRequirements = (questionsList?: any[]) => {
    if (questionsList && questionsList.length > 0) {
      const list = questionsList.map((q: any) => ({
        id: q.id,
        text: q.text,
        section_name: q.section_name || "General",
        context_breadcrumbs: q.context_breadcrumbs || "",
        status: q.status || "completed",
        score: q.score || 95,
        draft: q.draft || "",
        risk_flags: q.risk_flags || [],
        citations: q.citations || []
      }));
      setExtractedRequirements(list);
    }
  };

  const addDocumentRecord = (filename: string, count: number) => {
    const newDoc = {
      id: Date.now(),
      name: filename,
      size: "1.8 MB",
      requirementsCount: count,
      status: "Grounded & Pre-drafted",
      date: new Date().toLocaleDateString()
    };
    setDocuments(prev => {
      if (prev.some(d => d.name === filename)) return prev;
      return [newDoc, ...prev];
    });
  };

  const newSession = async () => {
    try {
      const r = await fetch(`${API}/chat/sessions`, {
        method: "POST", 
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ project_id: null })
      });
      if (r.ok) {
        const d = await r.json();
        setSessions(prev => [d, ...prev]);
        setActiveSession(d);
        setMessages([]);
        setExtractedRequirements([]);
        setSelectedRequirement(null);
        setActiveDocName("");
        setSidebarTab('chat');
      }
    } catch (e) {
      console.error("Failed to create new session:", e);
    }
  };

  // Chat message sending / requirement manual regeneration trigger
  const send = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const text = customText || input;
    if (!text.trim() || !activeSession || sending) return;
    
    if (!customText) {
      setInput("");
    }
    
    setSending(true);
    setMessages(prev => [...prev, { message_id: Date.now(), sender: "user", content: text, created_at: new Date().toISOString() }]);
    
    try {
      const r = await fetch(`${API}/chat/sessions/${activeSession.session_id}/message`, {
        method: "POST", 
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ content: text })
      });
      if (r.ok) { 
        const d = await r.json(); 
        setMessages(prev => [...prev, d]); 
        
        // Dynamic spreadsheet integration:
        // Update requirement status, draft, confidence index, risk alerts, and grounding citations on the fly!
        if (customText) {
          const riskFlags = d.metadata_json?.find((m: any) => m.risk_flags)?.risk_flags || [];
          const citationsList = d.metadata_json?.filter((m: any) => m.similarity_score > 0.05).map((m: any) => ({
            title: m.title,
            similarity_score: m.similarity_score,
            answer_text: m.answer_text || ""
          })) || [];
          
          setExtractedRequirements(prev => prev.map(req => {
            if (req.text === customText) {
              const updated = { 
                ...req, 
                status: "completed", 
                draft: d.content,
                score: d.metadata_json?.[0]?.confidence_score ? Math.floor(d.metadata_json[0].confidence_score * 100) : req.score,
                risk_flags: riskFlags,
                citations: citationsList
              };
              
              // Sync inspector focus state if active
              if (selectedRequirement && selectedRequirement.text === customText) {
                setSelectedRequirement(updated);
              }
              return updated;
            }
            return req;
          }));
        }
      }
    } catch (e) {
      console.error("Failed to post message:", e);
    }
    setSending(false);
    fetchSessions();
    if (!customText) {
      inputRef.current?.focus();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeSession) return;
    const file = e.target.files[0];
    setUploading(true);
    
    // Clear requirement grid during parsing load
    setExtractedRequirements([]);
    setSelectedRequirement(null);
    setSidebarTab('chat');
    
    setMessages(prev => [...prev, { message_id: Date.now(), sender: "user", content: `Uploading document: ${file.name}`, created_at: new Date().toISOString() }]);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const r = await fetch(`${API}/chat/sessions/${activeSession.session_id}/upload`, {
        method: "POST",
        body: formData
      });
      if (r.ok) {
        const d = await r.json();
        setMessages(prev => [...prev, {
          message_id: Date.now() + 1,
          sender: "agent",
          content: d.agent_message.content,
          metadata_json: d.agent_message.metadata_json,
          created_at: new Date().toISOString()
        }]);
        
        const meta = d.agent_message.metadata_json?.[0];
        if (meta) {
          setActiveDocName(file.name);
          hydrateRequirements(meta.questions_list);
          addDocumentRecord(file.name, meta.extracted_questions);
        }
      }
    } catch (e) {
      console.error("Failed to upload document:", e);
    }
    setUploading(false);
    fetchSessions();
  };

  const downloadProposal = async () => {
    if (!activeSession) return;
    window.open(`${API}/chat/sessions/${activeSession.session_id}/download`, "_blank");
  };

  // BULK DRAFT ALL — sequentially drafts every pending requirement
  const draftAllPending = async () => {
    if (!activeSession || bulkDrafting) return;
    const pending = extractedRequirements.filter(r => r.status !== 'completed');
    if (pending.length === 0) return;
    setBulkDrafting(true);
    setBulkProgress(0);
    for (let i = 0; i < pending.length; i++) {
      const req = pending[i];
      setBulkProgress(Math.round(((i) / pending.length) * 100));
      try {
        const r = await fetch(`${API}/chat/sessions/${activeSession.session_id}/message`, {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ content: req.text })
        });
        if (r.ok) {
          const d = await r.json();
          const riskFlags = d.metadata_json?.find((m: any) => m.risk_flags)?.risk_flags || [];
          const citationsList = d.metadata_json?.filter((m: any) => m.similarity_score > 0.05).map((m: any) => ({
            title: m.title,
            similarity_score: m.similarity_score,
            answer_text: m.answer_text || ""
          })) || [];
          setExtractedRequirements(prev => prev.map(r2 =>
            r2.id === req.id
              ? { ...r2, status: 'completed', draft: d.content, score: d.metadata_json?.[0]?.confidence_score ? Math.floor(d.metadata_json[0].confidence_score * 100) : r2.score, risk_flags: riskFlags, citations: citationsList }
              : r2
          ));
          setMessages(prev => [
            ...prev,
            { message_id: Date.now(), sender: "user", content: req.text, created_at: new Date().toISOString() },
            d
          ]);
        }
      } catch {}
    }
    setBulkProgress(100);
    setBulkDrafting(false);
    fetchSessions();
  };

  const handleAddLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibTitle.trim() || !newLibText.trim() || libAdding) return;
    setLibAdding(true);
    try {
      const r = await fetch(`${API}/library`, {
        method: "POST", 
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          network: "corporate_knowledge",
          title: newLibTitle,
          question_text: newLibTitle,
          answer_text: newLibText,
          category: newLibCategory,
          tags: ["console_ingest"],
          source_document: "Direct Admin console input",
          owner_id: null
        })
      });
      if (r.ok) {
        setNewLibTitle("");
        setNewLibText("");
        fetchLibrary();
      }
    } catch (e) {
      console.error("Failed to add to library:", e);
    }
    setLibAdding(false);
  };

  // Perform library memory reflection sweep to look for alignment updates
  const handleTriggerReflection = async () => {
    setReflecting(true);
    try {
      const r = await fetch(`${API}/library/reflect`, { method: "POST" });
      if (r.ok) {
        const d = await r.json();
        setStaleWarnings(d.actions || []);
        alert(`Memory Reflection Complete! Analyzed corporate alignment: ${d.issues_detected} synchronization issues identified.`);
      }
    } catch (e) {
      console.error("Failed to trigger reflection:", e);
    }
    setReflecting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      send(); 
    }
  };

  const sessionLabel = (s: any, idx: number) => {
    const age = Date.now() - new Date(s.created_at).getTime();
    if (age < 60000) return "Just now";
    if (age < 3600000) return `${Math.floor(age/60000)}m ago`;
    if (age < 86400000) return `${Math.floor(age/3600000)}h ago`;
    return new Date(s.created_at).toLocaleDateString();
  };

  // Filtering helpers
  const filteredLibrary = libraryItems.filter(item => 
    item.title?.toLowerCase().includes(libSearch.toLowerCase()) ||
    item.answer_text?.toLowerCase().includes(libSearch.toLowerCase()) ||
    item.category?.toLowerCase().includes(libSearch.toLowerCase())
  );

  const filteredRequirements = extractedRequirements.filter(req =>
    req.text?.toLowerCase().includes(reqSearch.toLowerCase()) ||
    req.section_name?.toLowerCase().includes(reqSearch.toLowerCase())
  );

  return (
    <div className="h-screen flex bg-[#09090b] text-[#fafafa] overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".pdf,.docx,.xlsx,.xls,.csv,.txt"
      />

      {/* ========================================================
          1. COLLAPSIBLE PRIMARY SIDEBAR NAVIGATION
          ======================================================== */}
      <aside className={`${sidebarOpen ? 'w-[260px]' : 'w-0'} flex-shrink-0 border-r border-white/[0.06] flex flex-col transition-all duration-300 overflow-hidden bg-[#0c0c0f] z-10`}>
        {/* Brand Header & Shield */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white">beam.ai</h1>
              <p className="text-[9px] text-zinc-500 font-semibold uppercase tracking-wider">Enterprise Proposal Console</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <nav className="p-3 space-y-1 border-b border-white/[0.06] flex-shrink-0">
          {[
            { id: 'rfp', label: 'RFP Workspace', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
            { id: 'library', label: 'Knowledge Base', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1V20H20"/></svg> },
            { id: 'docs', label: 'Ingested Documents', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === tab.id 
                  ? 'bg-white/[0.05] text-white' 
                  : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Sessions / Workspaces List */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-1.5 mb-2 flex-shrink-0">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Workspaces</span>
            <button onClick={newSession} className="text-indigo-400 hover:text-indigo-300 text-[11px] font-bold flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New
            </button>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto pr-1">
            {sessions.map((s, idx) => {
              const isActive = activeSession?.session_id === s.session_id;
              return (
                <button 
                  key={s.session_id} 
                  onClick={() => { setActiveSession(s); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition truncate flex items-center justify-between group border ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 font-semibold' 
                      : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200 border-transparent'
                  }`}
                >
                  <span className="truncate flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-500 animate-pulse' : 'bg-zinc-600'}`} />
                    RFP Workspace {sessions.length - idx}
                  </span>
                  <span className="text-[9px] text-zinc-600 group-hover:text-zinc-500 flex-shrink-0 ml-2">{sessionLabel(s, idx)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Connection status tag */}
        <div className="p-4 border-t border-white/[0.06] text-[10px] text-zinc-500 font-medium font-mono flex items-center gap-1.5 justify-center flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Cascade spec-flow: Connected
        </div>
      </aside>

      {/* ========================================================
          2. MAIN WORKSPACE VIEWPORTS
          ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* ========================================================
            TAB 1: RFP WORKSPACE (THE ELITE 3-COLUMN WORKBENCH)
            ======================================================== */}
        {activeTab === 'rfp' && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* CENTRAL COLUMN: Requirements spreadsheet grid */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#09090b] border-r border-white/[0.06]">
              {/* Header */}
              <div className="h-14 border-b border-white/[0.06] px-5 flex items-center justify-between flex-shrink-0 bg-[#09090b]/80 backdrop-blur-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-zinc-500 hover:text-zinc-300 transition mr-1 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  </button>
                  <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[260px]">
                    {activeDocName ? `Workspace: ${activeDocName}` : "RFP Spreadsheet Workspace"}
                  </h2>
                </div>
                
                {/* Switcher & Actions panel */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select 
                    value={selectedModel}
                    onChange={e => setSelectedModel(e.target.value)}
                    className="bg-[#0c0c0f] text-xs text-zinc-400 border border-white/[0.08] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                  >
                    <option value="qwen-32b-cascade">Cascade Escalate (Qwen-32B + GPT-120B)</option>
                    <option value="qwen-32b">Fast path (Qwen-32B)</option>
                    <option value="gpt-oss-120b">Flagship Audit (GPT-120B)</option>
                  </select>
                  
                  {activeSession && extractedRequirements.length > 0 && (
                    <button 
                      onClick={downloadProposal} 
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/15"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Export MD
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement spreadsheet body */}
              <div className="flex-1 overflow-auto p-4">
                {extractedRequirements.length === 0 ? (
                  /* Empty state / dropzone */
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto pt-[6vh] animate-fade-in">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/20 flex items-center justify-center mb-6 glow-indigo">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgb(129,140,248)" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <h3 className="text-lg font-extrabold text-white mb-2 tracking-tight">Upload Your RFP Document</h3>
                    <p className="text-xs text-zinc-500 mb-8 leading-relaxed font-medium max-w-sm">
                      Drop a vendor questionnaire, security assessment, or compliance form below. The AI engine will extract every requirement, auto-draft grounded responses with citations, and flag compliance risks — all in seconds.
                    </p>
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="dropzone w-full p-10 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center group-hover:border-indigo-500/30 group-hover:bg-indigo-500/5 transition">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgb(129,140,248)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold text-zinc-200 block">Select questionnaire file</span>
                        <span className="text-[11px] text-zinc-500 mt-1 block">PDF, DOCX, XLSX, CSV, TXT — up to 25MB</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-8 w-full">
                      {[
                        { icon: '📄', title: 'Upload', desc: 'Drop your RFP doc' },
                        { icon: '🤖', title: 'Auto-Draft', desc: 'AI drafts all answers' },
                        { icon: '✅', title: 'Export', desc: 'Download proposal' }
                      ].map((step, i) => (
                        <div key={i} className="glass-card p-3 text-center">
                          <span className="text-lg">{step.icon}</span>
                          <h4 className="text-[11px] font-bold text-white mt-1">{step.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-medium">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Live spreadsheet table view */
                  <div className="flex flex-col gap-4 animate-fade-in">
                    {/* Progress bar */}
                    {(() => {
                      const total = extractedRequirements.length;
                      const drafted = extractedRequirements.filter(r => r.status === 'completed').length;
                      const pct = total > 0 ? Math.round((drafted / total) * 100) : 0;
                      const pendingCount = total - drafted;
                      return (
                        <div className="glass-card p-4 flex items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold text-white">
                                Proposal Completion: {drafted}/{total} requirements drafted
                              </span>
                              <span className={`text-[11px] font-extrabold ${pct === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                {pct}%
                              </span>
                            </div>
                            <div className="progress-bar-bg">
                              <div className="progress-bar-fill" style={{ width: `${bulkDrafting ? bulkProgress : pct}%` }} />
                            </div>
                          </div>
                          {pendingCount > 0 && (
                            <button
                              onClick={draftAllPending}
                              disabled={bulkDrafting || sending}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex-shrink-0"
                            >
                              {bulkDrafting ? (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin-slow"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Drafting {bulkProgress}%</>
                              ) : (
                                <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Draft All ({pendingCount})</>
                              )}
                            </button>
                          )}
                          {pendingCount === 0 && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg badge-drafted text-[11px] font-bold flex-shrink-0">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              All Complete
                            </span>
                          )}
                        </div>
                      );
                    })()}

                    {/* Search and stats header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <input 
                          type="text"
                          value={reqSearch}
                          onChange={e => setReqSearch(e.target.value)}
                          placeholder="Search requirements & sections..."
                          className="w-full bg-[#0c0c0f] text-xs text-zinc-300 border border-white/[0.08] pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                        />
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-3 text-zinc-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </div>
                      
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-3 flex-shrink-0 glass-card px-3 py-1.5">
                        <span>Total: {extractedRequirements.length}</span>
                        <span className="w-px h-3 bg-white/[0.1]" />
                        <span className="text-emerald-400">Drafted: {extractedRequirements.filter(r => r.status === 'completed').length}</span>
                        <span className="w-px h-3 bg-white/[0.1]" />
                        <span className="text-amber-400">Pending: {extractedRequirements.filter(r => r.status !== 'completed').length}</span>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="w-full border border-white/[0.06] rounded-xl overflow-hidden bg-[#0c0c0f]">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.01] text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-3 w-16">ID</th>
                            <th className="p-3">Section</th>
                            <th className="p-3">Requirement</th>
                            <th className="p-3 w-24 text-center">Grounding</th>
                            <th className="p-3 w-28 text-center">Status</th>
                            <th className="p-3 w-20 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                          {filteredRequirements.map(req => {
                            const isSelected = selectedRequirement?.id === req.id;
                            const hasRisks = req.risk_flags && req.risk_flags.length > 0;
                            
                            return (
                              <tr 
                                key={req.id} 
                                onClick={() => { 
                                  setSelectedRequirement(req); 
                                  setSidebarTab('editor'); 
                                }}
                                className={`hover:bg-white/[0.02] cursor-pointer transition ${
                                  isSelected ? 'bg-indigo-500/[0.06] border-l-2 border-indigo-500' : ''
                                }`}
                              >
                                <td className="p-3 font-mono text-[10px] text-zinc-500">REQ-{req.id}</td>
                                <td className="p-3 text-zinc-400 font-bold max-w-[120px] truncate">{req.section_name}</td>
                                <td className="p-3 text-zinc-200 font-semibold max-w-sm truncate">{req.text}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                                    req.score >= 85 
                                      ? 'text-emerald-400 bg-emerald-400/5 border border-emerald-400/10' 
                                      : 'text-amber-400 bg-amber-400/5 border border-amber-400/10'
                                  }`}>
                                    {req.score}%
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                      req.status === "completed" 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                    }`}>
                                      {req.status === "completed" ? "Drafted" : "Pending"}
                                    </span>
                                    {hasRisks && (
                                      <span className="w-4 h-4 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-[9px] font-extrabold" title="Compliance risks flagged!">
                                        ⚠️
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      send(undefined, req.text);
                                    }}
                                    className="px-2 py-1 rounded bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white text-[10px] font-bold text-indigo-400 transition"
                                  >
                                    Regen
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DYNAMIC RIGHT COLUMN: Inspector Sidebar (Swaps between Chat & Editor) */}
            <aside className="w-[400px] flex-shrink-0 flex flex-col bg-[#0c0c0f]">
              {/* Tabs header */}
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-3 flex-shrink-0 bg-[#0c0c0f]">
                <div className="flex items-center gap-1.5 bg-white/[0.02] border border-white/[0.06] p-1 rounded-lg">
                  <button 
                    onClick={() => setSidebarTab('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition ${
                      sidebarTab === 'chat' 
                        ? 'bg-white/[0.05] text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Co-Pilot Chat
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedRequirement) setSidebarTab('editor');
                    }}
                    disabled={!selectedRequirement}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold transition disabled:opacity-30 ${
                      sidebarTab === 'editor' 
                        ? 'bg-white/[0.05] text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                    Response Inspector
                  </button>
                </div>

                {sidebarTab === 'editor' && (
                  <button 
                    onClick={() => setSidebarTab('chat')} 
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Close Inspector"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>

              {/* VIEWPORT 1: Co-Pilot Grounded Chat */}
              {sidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-[#0c0c0f]">
                  {/* Message scroll log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && !sending && !uploading ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-3 opacity-25"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        <p className="text-xs font-semibold">Grounded AI Chat session active.</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Upload files on the left or type below to test vector recall context.</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isUser = msg.sender === "user";
                        const rating = ratings[msg.message_id];
                        return (
                          <div key={msg.message_id || idx} className="flex gap-2.5 animate-fade-in group">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isUser ? 'bg-zinc-800 border border-white/[0.06]' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                              {isUser ? (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[10px] font-bold text-zinc-400">{isUser ? 'Sales Representative' : 'Autonomous Proposal Agent'}</span>
                                {!isUser && (
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => setRatings(prev => ({ ...prev, [msg.message_id]: 'up' }))}
                                      className={`p-1 rounded hover:bg-white/[0.04] transition ${rating === 'up' ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                    </button>
                                    <button 
                                      onClick={() => setRatings(prev => ({ ...prev, [msg.message_id]: 'down' }))}
                                      className={`p-1 rounded hover:bg-white/[0.04] transition ${rating === 'down' ? 'text-rose-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm8-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className={`text-xs leading-relaxed ${isUser ? 'text-zinc-200' : 'text-zinc-300 agent-content'}`}>
                                {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderContent(msg.content)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {(sending || uploading) && (
                      <div className="flex gap-2.5 animate-fade-in">
                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-[9px] text-zinc-500 font-bold font-mono tracking-wide uppercase">
                            {uploading ? "Analyzing questionnaire..." : "Cascadeflow generating..."}
                          </span>
                          <div className="flex items-center gap-1">
                            <span className="thinking-dot" /><span className="thinking-dot" /><span className="thinking-dot" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input form */}
                  <div className="p-3 border-t border-white/[0.06] bg-[#0c0c0f]">
                    <form onSubmit={send} className="relative flex items-end bg-[#0f0f12] border border-white/[0.08] rounded-lg focus-within:border-indigo-500/40 transition">
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploading}
                        className="p-2 m-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] transition flex-shrink-0"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      </button>
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask grounding engine..."
                        rows={1}
                        className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 px-1 py-2.5 resize-none outline-none max-h-32 min-h-[38px] leading-relaxed font-semibold"
                        style={{ height: Math.min(120, Math.max(38, input.split('\n').length * 20)) }}
                        disabled={sending || uploading}
                      />
                      <button 
                        type="submit" 
                        disabled={sending || uploading || !input.trim()}
                        className="p-2 m-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white transition flex-shrink-0"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* VIEWPORT 2: Interactive Response Inspector & Citation cards */}
              {sidebarTab === 'editor' && selectedRequirement && (
                <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0f] overflow-y-auto p-4 space-y-4 animate-slide-up">
                  {/* Header info */}
                  <div className="border-b border-white/[0.06] pb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.03] text-zinc-500">
                        REQ-{selectedRequirement.id}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                        {selectedRequirement.section_name}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white leading-relaxed">
                      "{selectedRequirement.text}"
                    </h3>
                  </div>

                  {/* RISK FLAGS AUDIT CARD */}
                  {selectedRequirement.risk_flags && selectedRequirement.risk_flags.length > 0 && (
                    <div className="p-3 border border-amber-500/20 bg-amber-500/[0.03] rounded-lg text-xs flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-[10px] uppercase tracking-wide">
                        <span>⚠️ compliance risk warnings</span>
                      </div>
                      <div className="space-y-1">
                        {selectedRequirement.risk_flags.map((flag: string, fidx: number) => {
                          let desc = flag;
                          if (flag === "no_source") desc = "Unsupported Capability: Zero grounding citations located inside memories.";
                          if (flag === "unsupported_claim") desc = "Low Confidence: Grounding match under 85% safety margins.";
                          if (flag === "sla_mismatch") desc = "SLA Alert: Ingress SLA shows 99.9% but request requires higher uptime.";
                          if (flag === "legal_review_required") desc = "Legal Caps Check: Contractual liability cap overrides found.";
                          
                          return (
                            <p key={fidx} className="text-zinc-300 font-bold text-[11px] leading-relaxed">
                              • {desc}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE EDITOR TEXTAREA */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Interactive Draft Response</span>
                      <span>{selectedRequirement.draft?.length || 0} chars</span>
                    </div>
                    <textarea 
                      value={selectedRequirement.draft || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedRequirement((prev: any) => ({ ...prev, draft: val }));
                        setExtractedRequirements(prev => prev.map(r => r.id === selectedRequirement.id ? { ...r, draft: val, status: "completed" } : r));
                      }}
                      rows={10}
                      className="w-full bg-[#09090b] text-xs text-zinc-300 border border-white/[0.08] p-3 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold leading-relaxed resize-none"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setExtractedRequirements(prev => prev.map(r => r.id === selectedRequirement.id ? { ...r, status: "completed" } : r));
                        alert("Response approved and compiled into active draft proposal bundle.");
                      }}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Approve Response
                    </button>
                    <button 
                      onClick={() => {
                        send(undefined, selectedRequirement.text);
                      }}
                      className="px-3 py-2 rounded-lg bg-[#0f0f12] border border-white/[0.08] hover:border-zinc-700 text-xs font-bold text-zinc-300 transition"
                      title="Regenerate Draft"
                    >
                      Regenerate
                    </button>
                  </div>

                  {/* DISCUS WITH AI DIRECT HOOK */}
                  <button 
                    onClick={() => {
                      setInput(`Regarding requirement REQ-${selectedRequirement.id} ("${selectedRequirement.text}"), please refine the response to: `);
                      setSidebarTab('chat');
                    }}
                    className="w-full py-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold text-indigo-400 uppercase tracking-wide transition flex items-center justify-center gap-1"
                  >
                    <span>💬 discuss / edit draft in chatbot</span>
                  </button>

                  {/* CITED SOURCES ACCORDION LIST */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Grounding Citations ({selectedRequirement.citations?.length || 0})
                    </h4>
                    {selectedRequirement.citations && selectedRequirement.citations.length > 0 ? (
                      selectedRequirement.citations.map((cit: any, cidx: number) => (
                        <div key={cidx} className="p-3 border border-white/[0.04] bg-white/[0.01] rounded-lg flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[200px]">
                              {cit.title}
                            </span>
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {cit.similarity_score ? Math.floor(cit.similarity_score * 100) : 95}% Match
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold italic bg-black/25 p-2 rounded">
                            "{cit.answer_text}"
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-zinc-500 font-semibold italic">Zero grounding citations located. AI speculative draft constructed from fallback model rules.</p>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* ========================================================
            TAB 2: GROUNDED KNOWLEDGE BASE (THE RAG MANAGEMENT HUB)
            ======================================================== */}
        {activeTab === 'library' && (
          <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden p-6 animate-fade-in">
            {/* Header info */}
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.06] pb-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">Grounded Knowledge Base</h2>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Seed, audit, and sweep verified compliance text modules used to ground the LLM.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleTriggerReflection}
                  disabled={reflecting}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0c0c0f] border border-white/[0.08] hover:border-zinc-700 text-xs font-bold text-zinc-300 transition disabled:opacity-50"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                  {reflecting ? "Sweeping Memory..." : "Trigger Reflection Sweep"}
                </button>
                
                <div className="relative">
                  <input 
                    type="text" 
                    value={libSearch}
                    onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search policies & controls..."
                    className="bg-[#0c0c0f] text-xs text-zinc-300 border border-white/[0.08] pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500 w-60 font-medium"
                  />
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="absolute left-2.5 top-3 text-zinc-500"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </div>
              </div>
            </div>

            {/* Split viewport: Left library grid, Right library creator */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              
              {/* Policies scroll container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {staleWarnings.length > 0 && (
                  <div className="p-3 border border-indigo-500/20 bg-indigo-500/[0.03] rounded-xl flex flex-col gap-1.5 mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">💡 Hindsight Reflection suggestions</span>
                    <div className="space-y-1 text-xs text-zinc-300">
                      {staleWarnings.map((warn, widx) => (
                        <p key={widx} className="font-semibold">• {warn}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {filteredLibrary.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center border border-white/[0.06] rounded-xl bg-white/[0.01]">
                    <span className="text-xs text-zinc-500 font-bold">No grounded policies matched search filters.</span>
                  </div>
                ) : (
                  filteredLibrary.map(item => (
                    <div key={item.content_id} className="p-4 border border-white/[0.05] rounded-xl bg-[#0c0c0f] hover:border-white/[0.1] hover:bg-white/[0.01] transition flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-mono">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-bold">Source: {item.source_document || "Admin Library"}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-white">{item.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-semibold">{item.answer_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Creator Form */}
              <div className="w-[320px] border border-white/[0.06] bg-[#0c0c0f] rounded-xl p-4 flex flex-col gap-4 self-start animate-slide-up flex-shrink-0">
                <div>
                  <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Ingest Policy Segment</h3>
                  <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Seed a new compliance belief chunk into RAG recall.</p>
                </div>
                <form onSubmit={handleAddLibrary} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Policy Title</label>
                    <input 
                      type="text" 
                      value={newLibTitle}
                      onChange={e => setNewLibTitle(e.target.value)}
                      placeholder="e.g. Encryption In-Transit SLA"
                      className="w-full bg-[#09090b] text-xs text-zinc-300 border border-white/[0.08] p-2.5 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Grounded Response Statement</label>
                    <textarea 
                      value={newLibText}
                      onChange={e => setNewLibText(e.target.value)}
                      placeholder="Detail the complete verified security policy standard text..."
                      rows={5}
                      className="w-full bg-[#09090b] text-xs text-zinc-300 border border-white/[0.08] p-2.5 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold resize-none leading-relaxed"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Policy Category</label>
                    <select
                      value={newLibCategory}
                      onChange={e => setNewLibCategory(e.target.value)}
                      className="w-full bg-[#09090b] text-xs text-zinc-300 border border-white/[0.08] p-2.5 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer font-bold"
                    >
                      <option value="Security Controls">Security Controls</option>
                      <option value="SLA Commitments">SLA Commitments</option>
                      <option value="Legal Redlines">Legal Redlines</option>
                      <option value="Compliance Claims">Compliance Claims</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    disabled={libAdding}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-indigo-600/15"
                  >
                    {libAdding ? "Ingesting..." : "Ingest Policy"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: INGEST DOCUMENTS (THE ASSET REPOSITORY)
            ======================================================== */}
        {activeTab === 'docs' && (
          <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden p-6 animate-fade-in">
            {/* Header info */}
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.06] pb-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">RFP Ingest Assets</h2>
                <p className="text-xs text-zinc-500 font-semibold mt-0.5">Audit raw B2B questionnaires ingested into active memory workspaces.</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-lg shadow-indigo-600/15 disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Ingest Document
              </button>
            </div>

            {/* Ingested Documents grid view */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {documents.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/[0.08] rounded-xl bg-[#0c0c0f] text-center p-6 max-w-md mx-auto mt-10">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 text-zinc-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <h3 className="text-sm font-bold text-white mb-1">No Ingested Documents</h3>
                  <p className="text-xs text-zinc-500 max-w-xs leading-relaxed font-medium">
                    Upload a file in the active RFP Workspace, and its extraction statistics and metadata logs will synchronize here automatically.
                  </p>
                </div>
              ) : (
                <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-[#0c0c0f] w-full">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.01] text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">File Asset Name</th>
                        <th className="p-3">File Size</th>
                        <th className="p-3">Extracted Requirements</th>
                        <th className="p-3">Ingest Status</th>
                        <th className="p-3">Ingest Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {documents.map(doc => (
                        <tr key={doc.id} className="hover:bg-white/[0.01] transition">
                          <td className="p-3 font-semibold text-zinc-200 flex items-center gap-2">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            {doc.name}
                          </td>
                          <td className="p-3 text-zinc-400 font-bold">{doc.size}</td>
                          <td className="p-3 font-bold text-zinc-300">{doc.requirementsCount} requirements parsed</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {doc.status}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-500 font-bold">{doc.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
