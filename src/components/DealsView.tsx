import { useState } from 'react';
import { Search, Filter, ShieldAlert, Plus, CheckCircle2, ChevronRight, AlertCircle, Sparkles, MessageSquareDot } from 'lucide-react';
import { DBState, Deal } from '../types.js';

interface DealsViewProps {
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
}

export default function DealsView({ db, onNavigate }: DealsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedHealth, setSelectedHealth] = useState('all');
  const [selectedOwner, setSelectedOwner] = useState('all');

  // Filter deals based on standard criteria
  const filteredDeals = db.deals.filter((deal) => {
    const account = db.accounts.find(a => a.id === deal.accountId);
    const matchesSearch =
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account && account.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      deal.owner.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = selectedStage === 'all' || deal.stage === selectedStage;

    let matchesHealth = true;
    if (selectedHealth === 'at-risk') {
      matchesHealth = deal.healthScore <= 65;
    } else if (selectedHealth === 'good') {
      matchesHealth = deal.healthScore > 80;
    } else if (selectedHealth === 'stalled') {
      matchesHealth = deal.stage === 'Stalled';
    }

    const matchesOwner = selectedOwner === 'all' || deal.owner === selectedOwner;

    return matchesSearch && matchesStage && matchesHealth && matchesOwner;
  });

  // Unique lists of owners & stages for dropdown filters
  const stages = ['Discovery', 'Evaluation', 'Proposal', 'Negotiation', 'Late stage', 'Stalled'];
  const owners = Array.from(new Set(db.deals.map((d) => d.owner)));

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
            Pipeline Analytics
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tracking {filteredDeals.length} of {db.deals.length} active enterprise enterprise contracts
          </p>
        </div>
        
        {/* Custom AI prompt shortcut */}
        <div className="bg-teal-500/5 dark:bg-teal-500/10 border border-teal-500/15 rounded-xl px-4 py-2.5 flex items-center gap-3 max-w-md shrink-0">
          <Sparkles className="w-5 h-5 text-teal-500 shrink-0" />
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
            Ask AI: <span className="font-semibold text-slate-800 dark:text-slate-100 cursor-pointer hover:underline" onClick={() => onNavigate('agent', db.deals[0]?.id)}>“Summarize risks in active pipeline”</span> to run multi-step CascadeFlow report.
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS GRID */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row items-center gap-3.5 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search deal workspace, account, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Stage Dropdown */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stages</option>
              {stages.map(st => <option key={st} value={st}>{st}</option>)}
            </select>

            {/* Health Filter */}
            <select
              value={selectedHealth}
              onChange={(e) => setSelectedHealth(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Risk Classes</option>
              <option value="at-risk">At-Risk Health (≤65%)</option>
              <option value="good">High Health (&gt;80%)</option>
              <option value="stalled">Stalled Stage</option>
            </select>

            {/* Owner Filter */}
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Owners</option>
              {owners.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Clear Filters Trigger */}
        {(searchTerm !== '' || selectedStage !== 'all' || selectedHealth !== 'all' || selectedOwner !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedStage('all');
              setSelectedHealth('all');
              setSelectedOwner('all');
            }}
            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer shrink-0"
          >
            Clear Active Filters
          </button>
        )}
      </div>

      {/* PIPELINE LISTING TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm overflow-hidden">
        {filteredDeals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/40 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/60">
                  <th className="py-4 px-6">Deal Details</th>
                  <th className="py-4 px-4 text-center">Health Range</th>
                  <th className="py-4 px-4 text-right">Contract Value</th>
                  <th className="py-4 px-4">Stage</th>
                  <th className="py-4 px-4 text-center">Unresolved Blockers</th>
                  <th className="py-4 px-4">Urgent Risk Factor</th>
                  <th className="py-4 px-6 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {filteredDeals.map((deal) => {
                  const account = db.accounts.find(a => a.id === deal.accountId);
                  const unresolvedCount = db.objections.filter(o => o.dealId === deal.id && o.status === 'unresolved').length;
                  const hasRisks = deal.healthScore <= 65;

                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors"
                    >
                      {/* Deal & Account Metadata */}
                      <td className="py-5 px-6">
                        <div>
                          <button
                            onClick={() => onNavigate('deal_workspace', deal.id)}
                            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-500 font-display transition-colors cursor-pointer text-left block"
                          >
                            {deal.name}
                          </button>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="font-medium text-slate-600 dark:text-slate-400">
                              {account ? account.name : 'Independent Account'}
                            </span>
                            <span>&bull;</span>
                            <span>Close: {deal.closeDate}</span>
                            <span>&bull;</span>
                            <span>Rep: {deal.owner}</span>
                          </div>
                        </div>
                      </td>

                      {/* Health Indicator */}
                      <td className="py-5 px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                            <span className={`${
                              deal.healthScore > 80 ? 'text-emerald-500' :
                              deal.healthScore > 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {deal.healthScore}%
                            </span>
                          </div>
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                deal.healthScore > 80 ? 'bg-emerald-500' :
                                deal.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${deal.healthScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Contract Value */}
                      <td className="py-5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${deal.value.toLocaleString()}
                      </td>

                      {/* Stage Tag */}
                      <td className="py-5 px-4 font-sans text-xs">
                        <span className={`inline-block font-mono font-bold px-2 py-0.5 rounded-full border ${
                          deal.stage === 'Stalled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                          deal.stage === 'Negotiation' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          deal.stage === 'Late stage' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          deal.stage === 'Proposal' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}>
                          {deal.stage}
                        </span>
                      </td>

                      {/* Objections count bubble */}
                      <td className="py-5 px-4 text-center">
                        {unresolvedCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <MessageSquareDot className="w-3.5 h-3.5 shrink-0" />
                            <span>{unresolvedCount}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      {/* Top Risk Indicator Text */}
                      <td className="py-5 px-4 max-w-xs shrink-0 font-sans text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        {deal.topRisk ? (
                          <div className="flex items-start gap-1.5">
                            {hasRisks ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <span className="truncate block hover:text-clip" title={deal.topRisk}>
                              {deal.topRisk}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No direct risk detected</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-5 px-6 text-center">
                        <button
                          onClick={() => onNavigate('deal_workspace', deal.id)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/5 hover:bg-teal-500/10 border border-teal-500/10 hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer mx-auto"
                        >
                          <span>Workspace</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="font-display font-bold text-slate-700 dark:text-slate-300 text-sm">
              No matching deals located
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Refine your active filters, clear text inputs, or search other pipeline keywords to explore.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
