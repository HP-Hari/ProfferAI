import React, { useState } from 'react';
import { CheckSquare, Calendar, Star, Sparkles, MessageSquare, Check, Plus } from 'lucide-react';
import { DBState, TeamTask } from '../types.js';

interface TasksViewProps {
  db: DBState;
  onToggleTask: (id: string) => void;
  onNavigate: (view: string, id?: string) => void;
  onAddTask: (task: any) => Promise<void>;
}

export default function TasksView({ db, onToggleTask, onNavigate, onAddTask }: TasksViewProps) {
  const [activeSegment, setActiveSegment] = useState<'pending' | 'completed'>('pending');
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedDeal, setSelectedDeal] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const filteredTasks = db.tasks.filter(t => {
    return activeSegment === 'pending' ? t.status === 'pending' : t.status === 'completed';
  });

  const handleAddTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const partialTask: Partial<TeamTask> = {
      dealId: selectedDeal || db.deals[0]?.id || '',
      description: newTaskText,
      dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
      priority: taskPriority,
      status: 'pending',
      owner: 'Sarah Connor'
    };

    await onAddTask(partialTask);
    setNewTaskText('');
    setSelectedDeal('');
  };

  return (
    <div className="space-y-6">
      {/* Header telemetry blocks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800 dark:text-white tracking-tight">
            Team Focus and Follow-ups
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tracking {db.tasks.filter(t => t.status === 'pending').length} open critical follow-up loops and action items
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSegment('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display border cursor-pointer ${
              activeSegment === 'pending'
                ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
          >
            Pending Loops
          </button>
          <button
            onClick={() => setActiveSegment('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display border cursor-pointer ${
              activeSegment === 'completed'
                ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
            }`}
          >
            Completed Loops
          </button>
        </div>
      </div>

      {/* TWO COLUMNS SECTIONS: QUICK INJECT FORM & TASK CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task listing panel (Left - Spans 2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.length > 0 ? (
            <div className="space-y-3.5">
              {filteredTasks.map((task) => {
                const deal = db.deals.find(d => d.id === task.dealId);
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-xs flex flex-col justify-between gap-3 transition-opacity ${
                      task.status === 'completed' ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3.5 justify-between">
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => onToggleTask(task.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                            task.status === 'completed'
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 text-transparent hover:border-teal-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </button>
                        <div>
                          <p className={`text-xs font-medium ${
                            task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-250'
                          } font-sans leading-relaxed`}>
                            {task.description}
                          </p>

                          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-slate-400">
                            {deal && (
                              <span className="font-bold uppercase text-slate-500 dark:text-slate-400 select-none">
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
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Due: {task.dueDate}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pre-compiled outreach message box if pending */}
                    {task.suggestedMessage && task.status === 'pending' && (
                      <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-900/60 flex items-start gap-2.5">
                        <MessageSquare className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="block text-[9px] font-mono uppercase font-bold text-teal-600 dark:text-teal-400">AI Suggested Messenger Composition:</span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic leading-relaxed">
                            "{task.suggestedMessage}"
                          </p>
                          <button
                            onClick={() => onNavigate('agent', task.dealId)}
                            className="mt-2 text-[10px] font-semibold text-teal-500 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Load and dispatch inside Copilot</span>
                            <Sparkles className="w-3 h-3 animate-pulse" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex flex-col justify-center items-center">
              <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
              <h4 className="font-display font-semibold text-slate-700 dark:text-slate-300 text-sm mt-3">All clear on tasks loop</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Excellent job! All operations tasks in this selection segment are complete.</p>
            </div>
          )}
        </div>

        {/* Quick inject custom Task template (Right Column) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-xs space-y-4 h-fit">
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">
              Log Custom Follow-up Loop
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Directly persist tasks to pipeline sync queues
            </p>
          </div>

          <form onSubmit={handleAddTaskSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Task Objective Detail</label>
              <textarea
                rows={3}
                placeholder="Log objective task details (e.g., arrange technical sync)..."
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-teal-500"
                required
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Map Scoped Deal Context</label>
              <select
                value={selectedDeal}
                onChange={(e) => setSelectedDeal(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="">Select Scoped Deal Target</option>
                {db.deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 text-slate-400">Risk Severity Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPriority(p)}
                    className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border cursor-pointer select-none transition-all ${
                      taskPriority === p
                        ? p === 'high' ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-xs font-semibold' :
                          p === 'medium' ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-xs font-semibold' :
                          'bg-slate-500/10 border-slate-500 text-slate-500 shadow-xs font-semibold'
                        : 'bg-transparent border-slate-200 text-slate-400 hover:text-slate-600 dark:border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 border border-slate-800 text-white dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800 transition-all font-display text-center"
            >
              <Plus className="w-4 h-4" />
              <span>Record Task</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
