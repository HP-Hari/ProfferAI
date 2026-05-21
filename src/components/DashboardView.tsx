import { TrendingUp, FileClock, ShieldAlert, Sparkles, Plus, ExternalLink, ThumbsUp, ChevronRight, Check } from 'lucide-react';
import { DBState, Deal, TeamTask, Reflection } from '../types.js';

interface DashboardViewProps {
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
  onToggleTask: (id: string) => void;
  onResetDb: () => void;
}

export default function DashboardView({ db, onNavigate, onToggleTask, onResetDb }: DashboardViewProps) {
  // Aggregate Metrics Data
  const activeDeals = db.deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost');
  const totalPipeline = activeDeals.reduce((sum, d) => sum + d.value, 0);
  const atRiskDeals = db.deals.filter(d => d.healthScore <= 65);
  const unresolvedObjections = db.objections.filter(o => o.status === 'unresolved');
  const pendingTasks = db.tasks.filter(t => t.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
            AE Deal Intelligence Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Hello, <strong className="text-slate-700 dark:text-slate-300">Sarah Connor</strong>. Proffer Hindsight memory engine is synced with <strong className="text-slate-700 dark:text-slate-300">8 enterprise sales queues</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('agent')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Consult AI Copilot</span>
          </button>
          <button
            onClick={onResetDb}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-all border border-slate-200/10 cursor-pointer"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Weighted Pipeline
            </span>
            <span className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1.5 block">
              ${(totalPipeline * 0.75).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs text-slate-400 mt-2 block">
              From <strong className="text-slate-600 dark:text-slate-400">${totalPipeline.toLocaleString()}</strong> total
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-5ff/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 flex items-center justify-center border border-teal-200/20">
            <TrendingUp className="w-5 h-5 text-teal-500" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              At-Risk Pipeline
            </span>
            <span className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1.5 block">
              {atRiskDeals.length}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-500">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Needs immediate mitigation</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-500/20">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Active Objections
            </span>
            <span className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1.5 block">
              {unresolvedObjections.length}
            </span>
            <span className="text-xs text-slate-400 mt-2 block">
              Pricing & Security blockers
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
            <FileClock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              Outstanding Tasks
            </span>
            <span className="text-2xl font-bold font-display text-slate-900 dark:text-white mt-1.5 block">
              {pendingTasks.length}
            </span>
            <span className="text-xs text-slate-400 mt-2 block animate-pulse">
              <span className="inline-block w-1.5 h-1.5 bg-sky-500 rounded-full mr-1.5"></span>
              Due this calendar cycle
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center border border-blue-500/20">
            <Check className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </div>

      {/* RECENT DEALS & CRITICAL ALERTS BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Deal Health Tracker (Left Card - spans 2 cols) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm lg:col-span-2 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
                  Active Enterprise Engagements
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ordered by highest pipeline value
                </p>
              </div>
              <button
                onClick={() => onNavigate('deals')}
                className="text-xs font-semibold text-teal-500 hover:text-teal-600 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Manage pipeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pipeline Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/50">
                    <th className="py-3 px-5">Deal Workspace</th>
                    <th className="py-3 px-5">Stage</th>
                    <th className="py-3 px-5 text-right">Value</th>
                    <th className="py-3 px-5 text-center">Health Score</th>
                    <th className="py-3 px-5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                  {db.deals.slice(0, 5).map((deal) => {
                    const account = db.accounts.find(a => a.id === deal.accountId);
                    
                    return (
                      <tr key={deal.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="py-3 px-5">
                          <button
                            onClick={() => onNavigate('deal_workspace', deal.id)}
                            className="text-left font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-500 font-display transition-colors cursor-pointer block"
                          >
                            {deal.name}
                          </button>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {account ? account.name : ''} &bull; Owner: {deal.owner}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            deal.stage === 'Stalled' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                            deal.stage === 'Negotiation' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                            deal.stage === 'Late stage' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                            'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {deal.stage}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${deal.value.toLocaleString()}
                        </td>
                        <td className="py-3 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-12 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  deal.healthScore > 80 ? 'bg-emerald-500' :
                                  deal.healthScore > 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${deal.healthScore}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs font-mono font-bold ${
                              deal.healthScore > 80 ? 'text-emerald-500' :
                              deal.healthScore > 60 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {deal.healthScore}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-5 text-right">
                          <button
                            onClick={() => onNavigate('deal_workspace', deal.id)}
                            className="p-1 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200/10 cursor-pointer"
                            title="Open Workspace"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Quick insights callout banner */}
          <div className="m-5 mt-2 bg-gradient-to-r from-teal-500/5 to-blue-500/5 dark:from-teal-500/10 dark:to-blue-500/10 border border-teal-500/10 rounded-xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                AI Pipeline Diagnostic: Competitor pricing activity is escalating
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Proffer tracked an renewal discount matching attempt from SentinelOps on <strong className="text-slate-700 dark:text-slate-200">BluePeak Systems</strong>. Ask prompt: <em className="text-teal-500 font-medium">"Draft comparative SentinelOps ROI comparison"</em> inside current workspace to counter risk.
              </p>
            </div>
          </div>
        </div>

        {/* AI Insight feed (Right side Card) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
                  Agent Reflections (Hindsight)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Persistent learning models across verticals
                </p>
              </div>
              <button
                onClick={() => onNavigate('memory')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-b border-dashed border-slate-300"
              >
                Reflect
              </button>
            </div>

            <div className="p-5 space-y-4">
              {db.reflections.slice(0, 3).map((ref) => (
                <div key={ref.id} className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded ${
                      ref.category === 'pricing' ? 'bg-rose-500/10 text-rose-500' :
                      ref.category === 'relationship' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-indigo-500/10 text-indigo-500'
                    }`}>
                      {ref.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ref.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-sans fit-content">
                    "{ref.insight}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800/60 text-center">
            <button
              onClick={() => onNavigate('agent')}
              className="w-full py-2 rounded-xl text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/5 hover:bg-teal-500/10 dark:hover:bg-teal-500/15 border border-teal-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Consult Memory Matrix</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* LOWER GRID: UPCOMING TASKS PANEL & CORE ACTION TRIGGERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Tasks Section (Left - 2 Cols) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm lg:col-span-2 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 mb-4">
            <div>
              <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
                Upcoming AI Action Prompts
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tasks or generated drafts ready to execute
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-teal-500 hover:text-teal-600 cursor-pointer"
            >
              View all tasks
            </button>
          </div>

          <div className="space-y-3">
            {db.tasks.slice(0, 4).map((task) => {
              const deal = db.deals.find(d => d.id === task.dealId);
              
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all duration-150 ${
                    task.status === 'completed'
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/30 dark:border-slate-800/30 opacity-70'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                        task.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-teal-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${
                        task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'
                      } max-w-xl truncate`}>
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-slate-400">
                        {deal && (
                          <span className="text-slate-500 dark:text-slate-400 font-semibold uppercase">
                            {deal.name}
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                          task.priority === 'high' ? 'bg-rose-500/10 text-rose-500' :
                          task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {task.priority}
                        </span>
                        <span>&bull;</span>
                        <span>Due: {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    {task.suggestedMessage && task.status === 'pending' && (
                      <button
                        onClick={() => {
                          // Quick transition directly into agent draft workspace prefilled with contextual prompt!
                          onNavigate('agent');
                        }}
                        className="py-1 px-2.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/10 cursor-pointer transition-all"
                      >
                        Draft Text
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel (Right side Card) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-base text-slate-800 dark:text-white">
              Instant AI Assist
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct telemetry operation prompts
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => onNavigate('templates')}
              className="p-3 bg-gradient-to-tr from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-500/20 text-left cursor-pointer hover:shadow-sm transition-all group"
            >
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-teal-500 flex items-center justify-between">
                <span>Assess Deal Obstacles</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Analyze unresolved customer objections scoped by Hindsight history
              </p>
            </button>

            <button
              onClick={() => onNavigate('templates')}
              className="p-3 bg-gradient-to-tr from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-500/20 text-left cursor-pointer hover:shadow-sm transition-all group"
            >
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-teal-500 flex items-center justify-between">
                <span>Outbound Mail Sequences</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Design custom sequences using prospect company pain point records
              </p>
            </button>

            <button
              onClick={() => onNavigate('templates')}
              className="p-3 bg-gradient-to-tr from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-teal-500/20 text-left cursor-pointer hover:shadow-sm transition-all group"
            >
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-teal-500 flex items-center justify-between">
                <span>Sponsor Meeting Brief</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" />
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                Formulate comprehensive brief cards maps for enterprise decision makers
              </p>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
