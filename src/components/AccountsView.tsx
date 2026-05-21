import { useState } from 'react';
import { Target, Search, Users, Sparkles, SlidersHorizontal, ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DBState, Account } from '../types.js';

interface AccountsViewProps {
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
}

export default function AccountsView({ db, onNavigate }: AccountsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHealth, setSelectedHealth] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Multi-criteria filter for accounts lists
  const filteredAccounts = db.accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.domain.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHealth = selectedHealth === 'all' || acc.relationshipHealth === selectedHealth;

    const matchesIndustry = selectedIndustry === 'all' || acc.industry.includes(selectedIndustry);

    return matchesSearch && matchesHealth && matchesIndustry;
  });

  const industries = Array.from(new Set(db.accounts.map(a => a.industry.split(' ')[0])));

  return (
    <div className="space-y-6">
      {/* Header and Telemetry Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
            Accounts & Outbound Prospecting Desk
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tracking {db.accounts.length} enterprise accounts with targeted pain point intelligence mapping
          </p>
        </div>
        
        {/* Dynamic outreach brief shortcut */}
        <button
          onClick={() => onNavigate('agent')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>Launch Outbound Series</span>
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-3.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search account domain, industry verticals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {/* Relationship health filter dropdown */}
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Health Profiles</option>
              <option value="good">Good Relationship</option>
              <option value="fair">Fair Relationship</option>
              <option value="poor">Poor (At-Risk)</option>
            </select>

            {/* Industry Segment dropdown */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Verticals</option>
              {industries.map(ind => <option key={ind} value={ind}>{ind} Segment</option>)}
            </select>
          </div>
        </div>

        {/* Filters clean state */}
        {(searchTerm !== '' || selectedHealth !== 'all' || selectedIndustry !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedHealth('all');
              setSelectedIndustry('all');
            }}
            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer shrink-0"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* GRID OF ACCOUNTS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredAccounts.map((acc) => {
          const matchingDeals = db.deals.filter(d => d.accountId === acc.id);
          const activeSDRContactsCount = db.stakeholders.filter(s => s.accountId === acc.id).length;

          return (
            <div
              key={acc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200 group"
            >
              {/* Card Upper Segment */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Visual Account Logo Indicator with Gradient */}
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${acc.logoColor} text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs`}>
                      {acc.name.substring(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-slate-800 dark:text-white group-hover:text-teal-500 transition-colors">
                        {acc.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Domain: <strong className="text-slate-500 dark:text-slate-400">{acc.domain}</strong> &bull; Size: {acc.size}
                      </p>
                    </div>
                  </div>

                  {/* Relationship health tag matches schema */}
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${
                    acc.relationshipHealth === 'good' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    acc.relationshipHealth === 'fair' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-rose-550/10 bg-rose-500/15 text-rose-500 border-rose-500/20'
                  }`}>
                    {acc.relationshipHealth} Health
                  </span>
                </div>

                {/* Substantive summary mapping */}
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans fit-content">
                  {acc.summary}
                </p>

                {/* Pain Points mapping */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">
                    Detected Core Account Pain Points:
                  </h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {acc.likelyPainPoints.map((pain, pIdx) => (
                      <div
                        key={pIdx}
                        className="py-1.5 px-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/60 dark:border-slate-800/40 rounded-lg text-slate-600 dark:text-slate-350 text-[11px] font-sans leading-normal"
                      >
                        &bull;&nbsp;&nbsp;{pain}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Matching active contract deals or fallback message */}
                <div className="py-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-5 justify-between text-xs mt-3">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Matching Active Pipeline</span>
                    {matchingDeals.length > 0 ? (
                      <button
                        onClick={() => onNavigate('deal_workspace', matchingDeals[0]?.id)}
                        className="text-teal-500 font-semibold flex items-center gap-1 hover:underline mt-0.5"
                      >
                        <span>{matchingDeals[0]?.name}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-slate-400 italic block mt-0.5">No active contract deal linked</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-mono text-slate-400 font-bold">Key Contacts Mapped</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 block mt-0.5 font-mono">
                      {activeSDRContactsCount} Enterprise Contacts
                    </span>
                  </div>
                </div>

                {/* Competitior alerts */}
                {acc.competitorMentions.length > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-sans">
                    <ShieldAlert className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-500">Rival threat warning:</span> High renewal activity matching is occurring with competitor vendor <strong className="text-slate-700 dark:text-slate-200">"{acc.competitorMentions.join(', ')}"</strong> in this segment.
                    </div>
                  </div>
                )}
              </div>

              {/* Outreach suggestion ribbon and click shortcut */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs leading-normal font-sans">
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-[10px] uppercase font-mono tracking-wider text-teal-600 dark:text-teal-400">Suggested Outbound Direction:</span>
                  <p className="text-[11px] text-slate-500 mt-0.5 italic truncate max_width_xl">
                    "{acc.suggestedOutreach}"
                  </p>
                </div>
                
                {/* Instant generation trigger */}
                <button
                  onClick={() => {
                    // Navigate to AI chat with a special prefilled prompt scoped around outbound sequence for this account
                    onNavigate('agent');
                  }}
                  className="py-1.5 px-3 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 cursor-pointer shrink-0 text-center"
                >
                  Generate Sequence
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
