import { Shield, Database, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { DBState } from '../types.js';

interface SettingsProps {
  db: DBState;
  onResetDb: () => void;
}

export default function SettingsView({ db, onResetDb }: SettingsProps) {
  
  const handleResetClick = () => {
    onResetDb();
    alert('Full-stack in-memory database telemetry has been successfully re-seeded with factory values.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header and Telemetry Stats */}
      <div className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
          System Core Diagnostics & Workspace Settings
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          System version 1.25.0 &bull; Telemetry matrices connected to persistent GCP cloud infrastructures
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Connection States */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/6 pb-3">
            <Key className="w-5 h-5 text-teal-500" />
            <h3 className="font-display font-semibold text-sm text-slate-850 dark:text-slate-150">
              Integrations connection states
            </h3>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="block font-bold text-slate-700 dark:text-slate-250">Gemini SDK Server Routing</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Fully proxy-shielded endpoint protection active</p>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="block font-bold text-slate-700 dark:text-slate-250">CascadeFlow Agent Memory Bus</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Dual-path classification and semantic router</p>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACTIVE</span>
              </span>
            </div>

            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center justify-between">
              <div className="text-xs">
                <span className="block font-bold text-slate-700 dark:text-slate-250">GCP Spanner Ledger Synced</span>
                <p className="text-[10px] text-slate-400 mt-0.5">High velocity global ACID transactions writeback</p>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>CONNECTED</span>
              </span>
            </div>
          </div>
        </div>

        {/* Factory Reset Data */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/6 pb-3">
            <Database className="w-5 h-5 text-indigo-500" />
            <h3 className="font-display font-semibold text-sm text-slate-850 dark:text-slate-150">
              Telemetry database controls
            </h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-sans">
            Resetting database tables will delete current unresolved objection updates, custom note logs, and custom tasks. Factory-prescribed demo accounts and mock objects will re-populate instantly.
          </p>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <span>WARNING: This operation directly updates local system memory caches. Proceed with caution.</span>
          </div>

          <button
            onClick={handleResetClick}
            className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white dark:text-rose-950 text-xs font-semibold rounded-xl text-center cursor-pointer font-display select-none transition-all"
          >
            Re-seed factory dataset (Reset Database)
          </button>
        </div>

      </div>

    </div>
  );
}
