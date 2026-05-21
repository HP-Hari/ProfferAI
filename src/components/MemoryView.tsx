import { useState } from 'react';
import { Activity, Sparkles, Filter, Calendar, Layers, ShieldAlert, BadgeInfo, Star } from 'lucide-react';
import { DBState, MemoryEvent, Reflection } from '../types.js';

interface MemoryViewProps {
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
}

export default function MemoryView({ db, onNavigate }: MemoryViewProps) {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState('all');

  // Filter Hindsight memories
  const filteredMemories = db.memories.filter((mem) => {
    const matchesType = selectedType === 'all' || mem.type === selectedType;
    const matchesDeal = selectedDeal === 'all' || mem.dealId === selectedDeal;
    return matchesType && matchesDeal;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500" />
            <span>Hindsight Semantic Memory Layer</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tracking {db.memories.length} persistent historic events and commitments indexed chronologically
          </p>
        </div>
        
        {/* CascadeFlow statistics */}
        <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <div className="text-xs">
            <span className="block font-bold text-slate-700 dark:text-slate-250">Agent Reflection Synthesis</span>
            <span className="text-[10px] text-slate-400 font-mono">3 core learned heuristics compiled</span>
          </div>
        </div>
      </div>

      {/* TIMELINE FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3.5 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Filter by Category */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-56 text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Memory Event Types</option>
            <option value="commitment">Commitments & Promises</option>
            <option value="stakeholder">Stakeholder Discovery</option>
            <option value="objection">Objections resolved/logged</option>
            <option value="competitor">Competitor pressure movements</option>
            <option value="milestone">Deal process milestones</option>
          </select>

          {/* Filter by Deal */}
          <select
            value={selectedDeal}
            onChange={(e) => setSelectedDeal(e.target.value)}
            className="w-full sm:w-56 text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Scoped Deals</option>
            {db.deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Trigger */}
        {(selectedType !== 'all' || selectedDeal !== 'all') && (
          <button
            onClick={() => {
              setSelectedType('all');
              setSelectedDeal('all');
            }}
            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer shrink-0"
          >
            Clear Search Filter
          </button>
        )}
      </div>

      {/* CORE SPLIT: TIMELINE STREAMS & INSIGHT REFLECTIONS FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Memory Timeline Column (Left - Spans 2 Cols) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 lg:col-span-2 space-y-5">
          <div>
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-zinc-100">
              Hindsight Persistent Timeline Stream
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronologically logged event vectors supporting prompt generation
            </p>
          </div>

          {filteredMemories.length > 0 ? (
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-6 ml-3 space-y-6">
              {filteredMemories.map((mem) => {
                const deal = db.deals.find(d => d.id === mem.dealId);
                
                return (
                  <div key={mem.id} className="relative group p-4 bg-slate-50/55 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950 border border-slate-100/60 dark:border-slate-900 rounded-2xl space-y-2 transition-all">
                    {/* Bullet marker */}
                    <div className={`absolute -left-8.5 top-5 w-4.5 h-4.5 rounded-full border bg-white dark:bg-slate-900 flex items-center justify-center ${
                      mem.type === 'commitment' ? 'border-amber-500 text-amber-500' :
                      mem.type === 'stakeholder' ? 'border-blue-500 text-blue-500' :
                      mem.type === 'objection' ? 'border-orange-500 text-orange-500' :
                      'border-indigo-500 text-indigo-500'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    </div>

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-[9px] font-mono leading-none font-bold uppercase px-2 py-0.5 border rounded-md ${
                        mem.type === 'commitment' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                        mem.type === 'stakeholder' ? 'bg-blue-500/10 text-blue-500 border-blue-500/10' :
                        mem.type === 'objection' ? 'bg-orange-500/10 text-orange-500 border-orange-500/10' :
                        'bg-indigo-500/10 text-indigo-500 border-indigo-500/10'
                      }`}>
                        {mem.type}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{new Date(mem.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed font-semibold">
                      "{mem.summary}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono border-t border-slate-100 dark:border-slate-900 pt-2 text-slate-400">
                      {deal && (
                        <span>SCOPED DEAL: <strong onClick={() => onNavigate('deal_workspace', deal.id)} className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer">{deal.name}</strong></span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Weight: {mem.score}/10</span>
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching persistent memories scoped for this selector.
            </div>
          )}
        </div>

        {/* Multi-step learned insights index (Right-hand Column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
              SaaS Strategic Reflections
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Learned sales behavior rules synthesized over time
            </p>
          </div>

          <div className="space-y-4">
            {db.reflections.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-950 space-y-3 hover:border-indigo-500/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 border rounded-md ${
                    ref.category === 'pricing' ? 'bg-rose-500/10 text-rose-500 border-rose-500/10' :
                    ref.category === 'relationship' ? 'bg-amber-500/10 text-amber-500 border-amber-500/10' :
                    'bg-indigo-500/20 text-indigo-500 border-indigo-500/10'
                  }`}>
                    {ref.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Severity: <strong className="text-red-500 uppercase">{ref.severity}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-650 dark:text-slate-400 font-sans leading-relaxed italic">
                  "{ref.insight}"
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
