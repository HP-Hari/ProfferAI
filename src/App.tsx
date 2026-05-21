import { useState, useEffect } from 'react';
import { DBState, Activity, TeamTask, SavedDraft } from './types.js';
import Sidebar from './components/Sidebar.js';
import LoginView from './components/LoginView.js';
import DashboardView from './components/DashboardView.js';
import DealsView from './components/DealsView.js';
import DealWorkspaceView from './components/DealWorkspaceView.js';
import AccountsView from './components/AccountsView.js';
import AgentView from './components/AgentView.js';
import MemoryView from './components/MemoryView.js';
import TasksView from './components/TasksView.js';
import TemplatesView from './components/TemplatesView.js';
import SettingsView from './components/SettingsView.js';
import { Sparkles, Moon, Sun, User, Bell, Search, Brain } from 'lucide-react';
import { auth } from './firebase.js';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // DB State populated from full-stack Express API
  const [db, setDb] = useState<DBState | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedDealId, setSelectedDealId] = useState<string | undefined>(undefined);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('proffer_theme') as 'light' | 'dark') || 'dark';
  });

  // Input prefill link from templates
  const [templateInputText, setTemplateInputText] = useState('');

  // Firebase auth state subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setDb(null);
      }
    });
    return unsubscribe;
  }, []);

  // Pack security authentication headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (auth.currentUser) {
      headers['authorization'] = `Bearer ${auth.currentUser.uid}`;
    }
    return headers;
  };

  // Fetch complete DB state from Express full-stack layer
  const fetchDbState = async () => {
    if (!auth.currentUser) return;
    try {
      const res = await fetch('/api/db', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDb(data);
      }
    } catch (err) {
      console.error('Error contacting Express server API:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDbState();
    }
  }, [isAuthenticated, currentUser]);

  // Update theme on DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('proffer_theme', theme);
  }, [theme]);

  // Handle successful Demo User Auth login login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Full-Stack DB Operations:
  // Reset database back to default seeded metrics
  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/db/reset', { 
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle dynamic task completion states
  const handleToggleTask = async (id: string) => {
    if (!db || !auth.currentUser) return;
    
    // Optimistic UI updates
    const updatedTasks = db.tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'pending' ? 'completed' : 'pending' as 'pending' | 'completed' };
      }
      return t;
    });
    setDb({ ...db, tasks: updatedTasks });

    try {
      await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error('Failed syncing task adjustment to backend:', err);
      // Revert if error
      fetchDbState();
    }
  };

  // Log custom updates notes live
  const handleLogActivity = async (activity: Activity) => {
    if (!db || !auth.currentUser) return;

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(activity)
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear Objection resolved on-the-spot
  const handleResolveObjection = async (id: string, resolution: string) => {
    if (!db || !auth.currentUser) return;

    // Optimistic status mapping
    const updatedObjections = db.objections.map(o => {
      if (o.id === id) {
        return { ...o, status: 'resolved' as 'resolved' | 'unresolved', resolution };
      }
      return o;
    });
    setDb({ ...db, objections: updatedObjections });

    try {
      const res = await fetch(`/api/objections/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id, resolution })
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error(err);
      fetchDbState();
    }
  };

  // Record a task from Workspace Forms fields
  const handleAddTask = async (task: Partial<TeamTask>) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(task)
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save generated outreach email templates permanently to SQLite/JSON Db arrays
  const handleSaveDraft = async (draft: Partial<SavedDraft>) => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draft)
      });
      if (res.ok) {
        await fetchDbState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Execute Gemini-powered or classified simulation response
  const handleSubmitChat = async (message: string, dealId?: string, accountId?: string) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ message, dealId, accountId })
    });
    if (res.ok) {
      const data = await res.json();
      // Side effect: fetch DB state in case new observations memories were logged by AI agent
      fetchDbState();
      return data;
    }
    throw new Error('Server returned unresolvable routing parameters.');
  };

  // Route View navigation handler
  const handleNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (view === 'deal_workspace' && id) {
      setSelectedDealId(id);
    } else if (view === 'agent' && id) {
      setSelectedDealId(id);
    }
  };

  // Unauthenticated user fallback branded login card
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Database loading spinner
  if (!db) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center">
        <Brain className="w-8 h-8 text-teal-400 animate-pulse" />
        <span className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-3.5">
          Connecting neural sales interfaces...
        </span>
      </div>
    );
  }

  const userEmail = currentUser?.email || 'demo@proffer.ai';
  const displayEmailName = userEmail.split('@')[0];
  const capitalizedUserName = displayEmailName.charAt(0).toUpperCase() + displayEmailName.slice(1);
  const userInitials = displayEmailName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transitioning-theme">
      {/* 1. Left persistent Navigation Sidebar panel */}
      <Sidebar
        db={db}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0C10]">
        
        {/* HEADER BRAND AND BAR SEARCH/CONTROLS */}
        <header className="h-16 border-b border-slate-200/50 dark:border-[#1E293B] bg-white dark:bg-[#0F1117]/50 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* Minimal search box design accent */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search deals telemetry, Hindsight logs, drafts..."
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 rounded-xl text-xs border border-slate-200/40 dark:border-[#1E293B] placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Dynamic visual health indicator representing GCP Spanner status */}
            <div className="flex items-center gap-1 bg-teal-500/5 dark:bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/10 text-[10px] font-mono select-none">
              <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
              <span className="text-teal-600 dark:text-teal-400 uppercase font-bold">SPANNERS ALIGNED</span>
            </div>

            {/* Theme Toggle (Persisted light / dark classes toggled seamlessly) */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl border border-slate-200/50 dark:border-[#1E293B] bg-slate-50 hover:bg-slate-100 dark:bg-[#11141D] dark:hover:bg-[#1F2433] text-slate-500 dark:text-slate-300 cursor-pointer"
              title="Toggle theme mode"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button className="p-2 rounded-xl border border-slate-200/50 dark:border-[#1E293B] bg-slate-50 dark:bg-[#11141D] text-slate-400 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            </button>

            {/* Active Professional user info tag */}
            <div className="flex items-center gap-2.5 border-l border-slate-200/45 dark:border-slate-800/80 pl-4 py-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 text-teal-400 dark:text-teal-350 flex items-center justify-center font-bold text-xs select-none border dark:border-[#1E293B]">
                {userInitials}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{capitalizedUserName}</span>
                <span className="block text-[9px] text-slate-400 font-semibold font-mono uppercase">Sales Professional</span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE PAGES CONTENT DELEGATE SWITCH */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/40 dark:bg-[#0A0C10] z-10 font-sans">
          {currentView === 'dashboard' && (
            <DashboardView
              db={db}
              onNavigate={handleNavigate}
              onToggleTask={handleToggleTask}
              onResetDb={handleResetDb}
            />
          )}

          {currentView === 'deals' && (
            <DealsView db={db} onNavigate={handleNavigate} />
          )}

          {currentView === 'deal_workspace' && (
            <DealWorkspaceView
              dealId={selectedDealId || db.deals[0]?.id || ''}
              db={db}
              onNavigate={handleNavigate}
              onResolveObjection={handleResolveObjection}
              onLogActivity={handleLogActivity}
              onToggleTask={handleToggleTask}
            />
          )}

          {currentView === 'accounts' && (
            <AccountsView db={db} onNavigate={handleNavigate} />
          )}

          {currentView === 'agent' && (
            <AgentView
              initialDealId={selectedDealId}
              db={db}
              onSubmitChat={handleSubmitChat}
              onSaveDraft={handleSaveDraft}
              onSaveTask={handleAddTask}
            />
          )}

          {currentView === 'memory' && (
            <MemoryView db={db} onNavigate={handleNavigate} />
          )}

          {currentView === 'tasks' && (
            <TasksView
              db={db}
              onToggleTask={handleToggleTask}
              onNavigate={handleNavigate}
              onAddTask={handleAddTask}
            />
          )}

          {currentView === 'templates' && (
            <TemplatesView
              db={db}
              onNavigate={handleNavigate}
              onSetInputText={setTemplateInputText}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView db={db} onResetDb={handleResetDb} />
          )}
        </main>

      </div>
    </div>
  );
}
