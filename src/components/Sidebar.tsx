import { LayoutDashboard, Target, Briefcase, Brain, Activity, CheckSquare, FileText, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { DBState, User } from '../types.js';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  db: DBState;
  user?: User | null;
  onLogout: () => void;
}

export default function Sidebar({ currentView, onNavigate, db, user, onLogout }: SidebarProps) {
  // Compute badge counts dynamically from state
  const atRiskDealsCount = db.deals.filter(d => d.healthScore <= 65).length;
  const pendingTasksCount = db.tasks.filter(t => t.status === 'pending').length;
  const unresolvedObjectionsCount = db.objections.filter(o => o.status === 'unresolved').length;
  
  // High priority task count as follow-ups
  const highPriorityTasksCount = db.tasks.filter(t => t.priority === 'high' && t.status === 'pending').length;

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'deals',
      label: 'Deals',
      icon: Briefcase,
      badge: atRiskDealsCount > 0 ? { count: atRiskDealsCount, color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' } : null
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Target,
      badge: highPriorityTasksCount > 0 ? { count: highPriorityTasksCount, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' } : null
    },
    {
      id: 'agent',
      label: 'AI Agent Workspace',
      icon: Brain,
      badge: { count: 'CO-PILOT', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' }
    },
    {
      id: 'memory',
      label: 'Hindsight Memory',
      icon: Activity,
      badge: unresolvedObjectionsCount > 0 ? { count: unresolvedObjectionsCount, color: 'bg-indigo-500/10 text-indigo-500 border-indigo-505/20 bg-indigo-500/10 border-indigo-500/20' } : null
    },
    {
      id: 'tasks',
      label: 'Tasks / Follow-ups',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? { count: pendingTasksCount, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' } : null
    },
    {
      id: 'templates',
      label: 'Templates & Guides',
      icon: FileText,
      badge: null
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-72 bg-white dark:bg-[#0F1117] border-r border-slate-200/80 dark:border-[#1E293B] h-screen sticky top-0 flex flex-col justify-between z-10 select-none">
      <div>
        {/* Logo block */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1E293B] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500 rounded flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-teal-500/10">
            P
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              Proffer<span className="text-teal-400">AI</span>
            </h1>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 dark:text-slate-500 font-semibold">
              Deal Intelligence Workspace
            </span>
          </div>
        </div>

        {/* Quick Agent Telemetry Metrics Panel on Sidebar */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#1E293B]/20 dark:bg-[#0A0C10] rounded-xl p-3 border border-slate-100 dark:border-[#1E293B] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500">
              <span>HINDSIGHT ENGINE</span>
              <span className="flex items-center gap-1 text-teal-400 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#1E293B]/25 dark:bg-[#11141D] p-1.5 rounded border border-slate-100 dark:border-[#1E293B]">
                <span className="block text-lg font-bold font-display text-slate-800 dark:text-slate-200">
                  {db.memories.length}
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Events</span>
              </div>
              <div className="bg-[#1E293B]/25 dark:bg-[#11141D] p-1.5 rounded border border-slate-100 dark:border-[#1E293B]">
                <span className="block text-lg font-bold font-display text-slate-800 dark:text-slate-200">
                  {db.reflections.length}
                </span>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || (item.id === 'deals' && currentView === 'deal_workspace');
            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group border ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white border-slate-200/50 dark:border-[#1E293B] shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1E293B]/30 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-100 ${
                    isActive ? 'text-teal-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.badge.color}`}>
                    {item.badge.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer AE Status Section */}
      <div className="p-4 border-t border-slate-100 dark:border-[#1E293B] bg-slate-50/50 dark:bg-[#11141D]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm border border-teal-200/20">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-none">
                Sarah Connor
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-1">
                Senior Account Executive
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-rose-500/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
