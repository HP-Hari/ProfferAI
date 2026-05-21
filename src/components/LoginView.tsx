import React, { useState } from 'react';
import { Brain, Sparkles, Key, Mail, Lock, LogIn, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Prefill the standard credentials from specification
  const applyDemoCredentials = () => {
    setEmail('demo@proffer.ai');
    setPassword('Demo@123');
    setErrorMessage('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (email === 'demo@proffer.ai' && password === 'Demo@123') {
      setIsLoading(true);
      // Simulate slight network authorization lag for premium feel
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 900);
    } else {
      setErrorMessage('Invalid authentication parameters. Try prefilling the demo credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Visual Ambient Background Bloobs */}
      <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        
        {/* UPPER BRAND ICON & HEADINGS */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
            <Brain className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-white tracking-tight">Proffer AI</h1>
            <p className="text-indigo-200/60 text-xs font-mono uppercase tracking-widest mt-1.5">Enterprise Sales Workspace</p>
          </div>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-normal">
            The AI sales workspace that remembers every deal and tells you what to do next.
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6.5 shadow-2xl relative">
          
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* ERROR FLAG */}
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-450 text-rose-400 leading-normal font-sans">
                {errorMessage}
              </div>
            )}

            {/* ACTIONS FOOTER */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-white text-slate-950 hover:bg-slate-100 disabled:opacity-50 text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Authorizing secure session...' : 'Sign In'}</span>
            </button>

          </form>

          {/* QUICK DEMO LOGIN SHORTCUT */}
          <div className="border-t border-slate-850 border-dashed mt-5 pt-4 text-center">
            <span className="text-[10px] text-slate-500 block mb-2 font-mono uppercase tracking-wider">
              Preview Demo Mode Available
            </span>
            <button
              type="button"
              onClick={applyDemoCredentials}
              className="py-1.5 px-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/15 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider cursor-pointer select-none transition-colors"
            >
              Use Demo Account
            </button>
          </div>

        </div>

        {/* COMPLIANCE & SECURITY BANNER */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-600">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>FIPS 140-2 Compliant Single Sign-On</span>
        </div>

      </div>

    </div>
  );
}
