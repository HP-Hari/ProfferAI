import React, { useState } from 'react';
import { ShieldAlert, Users, CalendarCheck, Sparkles, AlertCircle, FileSpreadsheet, PlusCircle, PenTool, CheckSquare, MessageSquareCode, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { DBState, Deal, Stakeholder, Objection, Activity, TeamTask, MemoryEvent } from '../types.js';

interface DealWorkspaceProps {
  dealId: string;
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
  onResolveObjection: (id: string, resolution: string) => void;
  onLogActivity: (activity: Activity) => void;
  onToggleTask: (id: string) => void;
}

export default function DealWorkspaceView({
  dealId,
  db,
  onNavigate,
  onResolveObjection,
  onLogActivity,
  onToggleTask
}: DealWorkspaceProps) {
  const deal = db.deals.find(d => d.id === dealId);
  const [activeTab, setActiveTab] = useState<'timeline' | 'objections' | 'stakeholders'>('timeline');

  // Input state for logging fresh timeline note
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Input state for resolving objection
  const [resolvingObjectionId, setResolvingObjectionId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  if (!deal) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Workspace Deal record not found.</p>
        <button onClick={() => onNavigate('deals')} className="text-teal-500 underline text-xs mt-3 select-none">
          Return to Deal Directory
        </button>
      </div>
    );
  }

  const account = db.accounts.find(a => a.id === deal.accountId);
  const stakeholders = db.stakeholders.filter(s => deal.stakeholderIds.includes(s.id));
  const objections = db.objections.filter(o => o.dealId === deal.id);
  const tasks = db.tasks.filter(t => t.dealId === deal.id);
  const activities = db.activities.filter(a => a.dealId === deal.id);
  const memories = db.memories.filter(m => m.dealId === deal.id);

  // Handle Note Logger Submission
  const handleLogNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteBody.trim()) return;

    setIsSubmittingNote(true);
    const activity: Activity = {
      id: '',
      dealId: deal.id,
      type: 'note_created',
      timestamp: new Date().toISOString(),
      title: newNoteTitle,
      description: newNoteBody,
      badge: 'AE Field Note'
    };

    await onLogActivity(activity);
    setNewNoteTitle('');
    setNewNoteBody('');
    setIsSubmittingNote(false);
  };

  // Handle Objection Resolving Submission
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingObjectionId || !resolutionText.trim()) return;

    await onResolveObjection(resolvingObjectionId, resolutionText);
    setResolvingObjectionId(null);
    setResolutionText('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Command Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onNavigate('deals')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/60 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200/10 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
                {deal.name}
              </h2>
              <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                deal.stage === 'Stalled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-xs' :
                deal.stage === 'Negotiation' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20'
              }`}>
                Stage: {deal.stage}
              </span>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
              Account Domain: <strong className="text-slate-600 dark:text-slate-300 hover:underline">{account ? account.domain : ''}</strong> &bull; Close Deadline: {deal.closeDate}
            </p>
          </div>
        </div>

        {/* Dynamic Action Trigger into the Copilot Chat workspace pre-loaded with this Deal context */}
        <button
          onClick={() => onNavigate('agent', deal.id)}
          className="px-4.5 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex items-center gap-2 shadow-md shrink-0 cursor-pointer transition-all-custom"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>Consult Copilot on this Deal</span>
        </button>
      </div>

      {/* 2. Top Metric Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shrink-0 shadow-xs">
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 block uppercase">Contract Value</span>
          <span className="text-xl font-bold font-display text-slate-800 dark:text-slate-100 block mt-1">
            ${deal.value.toLocaleString()}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shrink-0 shadow-xs">
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 block uppercase">Owner Rep</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block mt-1.5 truncate">
            {deal.owner}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shrink-0 shadow-xs">
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 block uppercase">Hindsight Memory</span>
          <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 block mt-1.5">
            {memories.length} Persisted Logs
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-4 shadow-xs">
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 block uppercase">Pipeline Health</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-bold font-mono ${
              deal.healthScore > 80 ? 'text-emerald-500' :
              deal.healthScore > 60 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {deal.healthScore}%
            </span>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  deal.healthScore > 80 ? 'bg-emerald-500' :
                  deal.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${deal.healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Core Workspace Dashboard Bento-Grid SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT TWO-COLUMNS BENTO CELL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Insights & Next Best Action Panel */}
          <div className="bg-gradient-to-tr from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl border border-slate-800 p-5 shadow-lg space-y-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-5 -translate-y-5 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="font-display font-semibold text-sm tracking-wide uppercase">AI Deal Coach Analysis</span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                CASCADEFLOW ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans fit-content">
              {deal.summary}
            </p>

            {/* Action Recommendations Box */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800/80 p-4 space-y-3">
              <h4 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                Recommended Next Best Actions:
              </h4>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/50 flex items-start gap-2.5 text-xs">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                        task.status === 'completed'
                          ? 'bg-teal-500 border-teal-600 text-slate-950'
                          : 'border-slate-800 text-transparent hover:border-teal-500/40'
                      }`}
                    >
                      <CheckSquare className="w-3 h-3 stroke-[3px]" />
                    </button>
                    <div className="flex-1">
                      <p className={`font-sans leading-relaxed ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                        {task.description}
                      </p>
                      {task.suggestedMessage && task.status === 'pending' && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2 bg-slate-950/40 p-2 rounded-md border border-slate-900/60">
                          <span className="font-semibold text-teal-400">DRAFT OUTREACH:</span>
                          <span className="truncate italic font-mono flex-1">{task.suggestedMessage}</span>
                          <button
                            onClick={() => onNavigate('agent', deal.id)}
                            className="text-teal-400 font-semibold hover:underline flex items-center gap-0.5 shrink-0"
                          >
                            <span>Draft</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DYNAMIC TAB CONTROLS (Timeline vs Stakeholder Map vs Objections Panel) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-800/60 flex items-center bg-slate-50/50 dark:bg-slate-950/40">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-5 py-3.5 text-xs font-semibold font-display border-b-2 transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'border-teal-500 text-slate-800 dark:text-white bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Hindsight Memory Timeline
              </button>
              <button
                onClick={() => setActiveTab('objections')}
                className={`px-5 py-3.5 text-xs font-semibold font-display border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'objections'
                    ? 'border-teal-500 text-slate-800 dark:text-white bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Objections Clearing Room
                {objections.filter(o => o.status === 'unresolved').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('stakeholders')}
                className={`px-5 py-3.5 text-xs font-semibold font-display border-b-2 transition-all cursor-pointer ${
                  activeTab === 'stakeholders'
                    ? 'border-teal-500 text-slate-800 dark:text-white bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Stakeholder Map
              </button>
            </div>

            {/* TAB CONTENTS */}
            <div className="p-5">
              
              {/* Tab 1: Timeline & Log Note */}
              {activeTab === 'timeline' && (
                <div className="space-y-6">
                  {/* Log Note Form */}
                  <form onSubmit={handleLogNote} className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <PenTool className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold font-display uppercase tracking-wider">Log Call Note or Update Timeline</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">WILL DYNAMICALLY UPDATE HINDSIGHT STREAM</span>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Log Event Title (e.g., Sync meeting on data residency)..."
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400"
                        required
                      />
                      <textarea
                        rows={2}
                        placeholder="Detail commitments, stakeholder quotes, objections raised, or team next steps..."
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        className="w-full px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400"
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingNote}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 disabled:opacity-50 hover:shadow-xs transition-all text-white font-semibold text-[11px] rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isSubmittingNote ? 'Persisting Note...' : 'Persist Note to Hindsight'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Combined Chronological Stream (Activities + Memories + Timeline) */}
                  <div className="relative border-l border-slate-100 dark:border-slate-800 pl-5 ml-2.5 space-y-5">
                    {activities.map((act) => (
                      <div key={act.id} className="relative group">
                        {/* Bullet indicators */}
                        <div className={`absolute -left-7.5 top-1.5 w-4 h-4 rounded-full border-2 bg-white dark:bg-slate-900 transition-transform group-hover:scale-110 flex items-center justify-center ${
                          act.type === 'objection_logged' ? 'border-amber-500 bg-amber-500/10' :
                          act.type === 'agent_reflection' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500' :
                          'border-teal-500 bg-teal-500/10'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-display">
                              {act.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {act.badge && (
                            <span className={`inline-block text-[9px] font-mono leading-none font-bold uppercase px-1.5 py-0.5 rounded-md mt-1 ${
                              act.type === 'agent_reflection' ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/10' : 'bg-slate-150/15 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {act.badge}
                            </span>
                          )}
                          <p className="text-xs font-sans text-slate-500 dark:text-slate-400 leading-normal mt-1.5">
                            {act.description}
                          </p>
                          {act.details && (
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-lg p-2.5 mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                              {act.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {memories.map((mem) => (
                      <div key={mem.id} className="relative group p-3 bg-gradient-to-r from-teal-500/5 to-transparent border border-teal-500/10 rounded-xl space-y-1">
                        <div className="absolute -left-7.5 top-3.5 w-4 h-4 rounded-full border-2 border-teal-500 bg-white dark:bg-slate-900 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold uppercase text-teal-600 dark:text-teal-400 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>Hindsight Hashed Concept</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Memory Weight: {mem.score}/10
                          </span>
                        </div>
                        <p className="text-xs font-sans text-slate-700 dark:text-slate-300 font-medium">
                          "{mem.summary}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Objections Clearing Area */}
              {activeTab === 'objections' && (
                <div className="space-y-4">
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal font-sans">
                      Clearing objections is critical to pipeline health. Unresolved contract, feature or pricing blocks directly compress deal velocity. Use the on-the-spot form below to update status metrics dynamically.
                    </p>
                  </div>

                  {objections.length > 0 ? (
                    <div className="space-y-3.5">
                      {objections.map((obj) => (
                        <div key={obj.id} className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-150 dark:border-slate-900 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className={`text-[9px] tracking-wider uppercase font-mono font-bold px-1.5 py-0.5 rounded border ${
                              obj.type === 'pricing' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                              obj.type === 'security' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                              obj.type === 'competitor' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                              'bg-slate-500/10 text-slate-500'
                            }`}>
                              {obj.type}
                            </span>
                            <span className={`text-[10px] font-mono leading-none font-bold uppercase px-2 py-0.5 rounded-full ${
                              obj.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500 animate-pulse'
                            }`}>
                              {obj.status}
                            </span>
                          </div>
                          
                          <p className="text-xs font-sans text-slate-700 dark:text-slate-300 font-semibold">
                            "{obj.text}"
                          </p>

                          {/* Resolution box */}
                          {obj.status === 'resolved' ? (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2.5 text-xs text-slate-600 dark:text-slate-300 font-sans">
                              <strong className="text-emerald-500">RESOLUTION MEMORIZED:</strong> {obj.resolution || 'Resolved.'}
                            </div>
                          ) : (
                            <div>
                              {resolvingObjectionId === obj.id ? (
                                <form onSubmit={handleResolveSubmit} className="space-y-2 mt-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-3">
                                  <label className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Record Commercial Resolution Detail</label>
                                  <textarea
                                    rows={2}
                                    placeholder="Input context of resolution (e.g., accepted alternative standard SLA tier schedules)..."
                                    value={resolutionText}
                                    onChange={(e) => setResolutionText(e.target.value)}
                                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                                    required
                                  ></textarea>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setResolvingObjectionId(null)}
                                      className="py-1 px-2.5 text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      className="py-1 px-3 bg-emerald-500 text-slate-950 hover:bg-emerald-600 text-[10px] font-bold rounded cursor-pointer"
                                    >
                                      Save & Resolve
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                <button
                                  onClick={() => {
                                    setResolvingObjectionId(obj.id);
                                    setResolutionText('');
                                  }}
                                  className="mt-1 py-1 px-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 text-[10px] font-bold font-mono uppercase tracking-wider rounded cursor-pointer"
                                >
                                  Clear Objection Status
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center font-sans h-32 flex flex-col items-center justify-center">
                      <p className="text-slate-400 font-semibold text-xs leading-none">No objections recorded for this cycle.</p>
                      <span className="text-[10px] text-slate-400 mt-2 block">High health accounts are typically free of unresolved blocker nodes.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Stakeholders map */}
              {activeTab === 'stakeholders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                    <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-400">Account Decision Hierarchy</h4>
                    <span className="text-[10px] text-slate-400 font-mono">SCOPED: {stakeholders.length} CONTACTS</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stakeholders.map((stk) => (
                      <div key={stk.id} className="p-3.5 bg-slate-50/50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-950 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 font-display">
                              {stk.name}
                            </h5>
                            <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded ${
                              stk.status === 'Champion' ? 'bg-emerald-500/10 text-emerald-500' :
                              stk.status === 'Decision Maker' ? 'bg-blue-500/10 text-blue-500' :
                              stk.status === 'Blocker' ? 'bg-rose-500/10 text-rose-500' :
                              'bg-slate-500/10 text-slate-500'
                            }`}>
                              {stk.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{stk.role}</p>
                          <div className="space-y-1 mt-2.5 text-[11px] text-slate-400 py-1.5 border-t border-slate-100 dark:border-slate-900">
                            <div>Email: <strong className="text-slate-600 dark:text-slate-400">{stk.email}</strong></div>
                            <div>Phone: <strong className="text-slate-600 dark:text-slate-400">{stk.phone}</strong></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 px-2.5 py-1.5 rounded-lg mt-2 font-mono">
                          <span className="text-[10px] text-slate-400">Alignment Index</span>
                          <span className={`text-xs font-bold ${
                            stk.alignmentPercent > 80 ? 'text-emerald-500' :
                            stk.alignmentPercent > 50 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {stk.alignmentPercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: HEALTH & COMPLIANCE ALERTS */}
        <div className="space-y-6">
          
          {/* Health & Risk assessment cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/6 pb-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-100">
                Risk Audit Feed
              </h3>
            </div>

            <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-500 uppercase block tracking-wider">
                CURRENT THREAT INDICATOR
              </span>
              <p className="text-xs font-sans text-slate-700 dark:text-slate-300 font-medium leading-normal">
                {deal.topRisk || 'No serious threat indicators flagged by CascadeFlow.'}
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider block uppercase">
                INTELLIGENT REVELATIONS:
              </span>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1 border border-slate-100 dark:border-slate-900">
                <span className="block text-[10px] font-bold text-teal-500 font-display">Competitor Tracker</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {deal.competitiorList.length > 0 
                  ? `Rival vendor identified in bidding: "${deal.competitiorList.join(', ')}"` 
                  : 'No active competitive pressure tracked on this engagement.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 space-y-1 border border-slate-100 dark:border-slate-900">
                <span className="block text-[10px] font-bold text-teal-500 font-display">Contract Health Score Analysis</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Weighted metrics place pipeline speed at <strong className="text-slate-700 dark:text-slate-300">{deal.healthScore === 100 ? 'optimal' : deal.healthScore > 75 ? 'above standard' : 'stagnated'}</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Account Profile Summary Card */}
          {account && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/6 pb-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${account.logoColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                  {account.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {account.name} Project Profile
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono uppercase">{account.industry}</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase font-mono text-slate-400 font-semibold">HQ Operational Sizing</span>
                  <strong className="text-slate-700 dark:text-slate-200 mt-0.5 block">{account.size}</strong>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-mono text-slate-400 font-semibold">Account Health Segment</span>
                  <span className={`inline-block font-mono font-bold text-[10px] uppercase mt-1 px-2 py-0.5 rounded ${
                    account.relationshipHealth === 'good' ? 'bg-emerald-500/10 text-emerald-500' :
                    account.relationshipHealth === 'fair' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-rose-500/10 text-rose-500'
                  }`}>
                    {account.relationshipHealth} Relationship
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="block text-[10px] uppercase font-mono text-slate-400 font-semibold mb-1">Presumed Operational Bottlenecks</span>
                  {account.likelyPainPoints.map((pain, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-950 rounded-lg text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                      &bull; {pain}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                <button
                  onClick={() => onNavigate('accounts')}
                  className="text-xs font-semibold text-teal-500 hover:text-teal-600 cursor-pointer"
                >
                  View Accounts Desk
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
