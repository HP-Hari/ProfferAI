import { Sparkles, FileText, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { DBState } from '../types.js';

interface TemplatesProps {
  db: DBState;
  onNavigate: (view: string, id?: string) => void;
  onSetInputText?: (text: string) => void;
}

export default function TemplatesView({ db, onNavigate, onSetInputText }: TemplatesProps) {
  
  const templateBlocks = [
    {
      title: 'Analyze Deal Blockers',
      description: 'Run comprehensive Hindsight diagnostic scanning current objections list and competitor pressure levels.',
      prompt: 'Summarize all active deal blockers, pricing objections, or competitor counter-offers. Cross-reference similar historical resolutions saved in Hindsight database.',
      category: 'Risk Mitigation',
      badge: 'Analytical'
    },
    {
      title: 'Buyer Meeting Briefing Card',
      description: 'Formulate an elegant profile brief for an upcoming buyer call detailing stakeholder maps and pain points.',
      prompt: 'Compile a deep meeting preparation brief card. Draft stakeholder sentiment indicators and suggest custom talking points to clear pending compliance blockers.',
      category: 'Deal Prep',
      badge: 'Strategic'
    },
    {
      title: 'Personalized Outbound Sequence',
      description: 'Generate three-stage personalized outreach email steps targeting account likely pain points.',
      prompt: 'Design a highly tailored outbound email prospecting sequence. Incorporate target business size, sector pain points, and suggest clear zero-latency value offerings.',
      category: 'Outbound',
      badge: 'Copywriting'
    },
    {
      title: 'SLA Support Tiers Negotiation',
      description: 'Draft a custom support tiers package resolving list price friction relative to competitors.',
      prompt: 'Draft an elegant support package comparison draft document that positions our 99.99% uptime guarantees while addressing buyers standard budget limitations.',
      category: 'Negotiation',
      badge: 'Commercial'
    }
  ];

  const handleApplyTemplate = (promptText: string) => {
    if (onSetInputText) {
      onSetInputText(promptText);
    }
    // Deep transition to AI Workspace and trigger immediately
    onNavigate('agent');
  };

  return (
    <div className="space-y-6">
      {/* Header and overview banners */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-teal-500" />
            <span>AI Guided Blueprint Library</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Pre-configured cognitive prompts designed by elite RevOps teams to map objections and drafting structures
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-teal-500/5 to-indigo-500/5 dark:from-teal-500/10 dark:to-indigo-500/10 border border-teal-500/10 rounded-2xl p-4.5 flex gap-3 text-xs leading-relaxed text-slate-650 text-slate-600 dark:text-slate-350 max-w-4xl font-sans">
        <Sparkles className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800 dark:text-slate-100 block mb-1">CascadeFlow Pre-Routing Engaged</strong>
          Clicking any blueprint below automatically loads the corresponding structured intent parameters and transfers context directly into your Copilot Workspace. You can edit the parameters freely before executing.
        </div>
      </div>

      {/* BLUEPRINTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {templateBlocks.map((block, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-500/20 hover:shadow-md transition-all duration-200 group"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  {block.category}
                </span>
                <span className="text-[9px] uppercase font-mono font-bold text-teal-500">
                  {block.badge}
                </span>
              </div>

              <div>
                <h3 className="font-display font-medium text-slate-850 text-slate-800 dark:text-white group-hover:text-teal-500 transition-colors text-sm">
                  {block.title}
                </h3>
                <p className="text-xs text-slate-400 leading-normal mt-1.5 font-sans">
                  {block.description}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-100/60 dark:border-slate-950 text-[10px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed italic truncate hover:text-clip">
                PROMPT: "{block.prompt}"
              </div>
            </div>

            <button
              onClick={() => handleApplyTemplate(block.prompt)}
              className="mt-5 w-full py-2 bg-slate-900 border border-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 hover:bg-slate-800 rounded-xl text-[11px] font-bold uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 cursor-pointer transition-all-custom select-none"
            >
              <span>Apply Blueprint</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
