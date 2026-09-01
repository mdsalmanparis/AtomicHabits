import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { AchievementsList } from './components/AchievementsList';
import { Settings } from './components/Settings';
import { Vita, VITA_DATA } from './components/Vita';
import { Calendar, BarChart2, Flame, BookOpen } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const init = useStore(state => state.init);
  const user = useStore(state => state.user);
  const isLoading = useStore(state => state.isLoading);
  const setUser = useStore(state => state.setUser);
  
  // Initialize phase notifications reminders
  useNotifications();
  
  const [activeTab, setActiveTab] = useState<'habits' | 'growth' | 'analytics' | 'achievements' | 'settings' | 'vita'>('habits');
  const [randomRule] = useState<{ rule: string; category: string } | null>(() => {
    const allRules = VITA_DATA.flatMap(c => c.rules.map(r => ({ rule: r, category: c.title })));
    if (allRules.length === 0) return null;
    return allRules[Math.floor(Math.random() * allRules.length)];
  });

  useEffect(() => {
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [init, setUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-between text-text-primary select-none transition-colors p-6 max-w-md mx-auto text-center py-20">
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Flame className="h-12 w-12 text-red-500 fill-red-500/20 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <div className="space-y-1">
            <h1 className="text-base font-black font-poppins tracking-widest text-text-primary uppercase">
              Atomic Habits
            </h1>
          </div>
        </div>

        {randomRule && (
          <div className="w-full px-6 py-5 rounded-2xl bg-card-bg/40 border border-border-primary/40 backdrop-blur-sm shadow-xl select-none animate-fadeIn flex flex-col items-center gap-2">
            <span className="text-[8px] font-black tracking-[0.22em] text-indigo-500 dark:text-indigo-400 uppercase">
              {randomRule.category}
            </span>
            <p className="text-xs font-semibold font-poppins leading-relaxed text-text-primary/90 max-w-[280px]">
              "{randomRule.rule}"
            </p>
          </div>
        )}
      </div>
    );
  }

  // If not logged in, show Auth
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col justify-between selection:bg-text-primary selection:text-bg-primary transition-colors overflow-x-hidden">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 pb-16 space-y-6 flex-1">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center border-b border-border-primary pb-4">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="h-7 w-7 rounded bg-btn-primary-bg flex items-center justify-center text-btn-primary-text">
              <Flame className="h-4.5 w-4.5 text-red-500 fill-red-500 shrink-0" />
            </div>
            <span className="text-lg font-black font-poppins tracking-wider">
              Atomic <span className="text-neutral-450 dark:text-neutral-400 font-medium">HABITS</span>
            </span>
          </div>
        </header>
 
        {/* Core Workspace Content */}
        <main className="min-h-[60vh]">
          {activeTab === 'habits' && <Dashboard activeTab="habits" />}
          {activeTab === 'analytics' && <Analytics onNavigate={setActiveTab} />}
          {activeTab === 'achievements' && <AchievementsList onNavigate={setActiveTab} />}
          {activeTab === 'settings' && <Settings onNavigate={setActiveTab} />}
          {activeTab === 'vita' && <Vita />}
        </main>
      </div>

      {/* iOS Liquid Glass Capsule Bottom Floating Navigation Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2.5rem)] max-w-xs sm:max-w-sm select-none">
        <nav className="flex items-center justify-between bg-white/75 dark:bg-black/75 backdrop-blur-2xl backdrop-saturate-150 border border-black/10 dark:border-white/15 rounded-full px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5)] touch-manipulation select-none transition-colors">
          {/* 1. Routines Button (Left) */}
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation select-none ${
              activeTab === 'habits' 
                ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 shadow-sm scale-105' 
                : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Calendar className={`h-4 w-4 ${activeTab === 'habits' ? 'stroke-[2.5px]' : ''}`} />
            <span>Routines</span>
          </button>

          {/* 2. Vita Button (Center) */}
          <button
            onClick={() => setActiveTab('vita')}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation select-none ${
              activeTab === 'vita' 
                ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 shadow-sm scale-105' 
                : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <BookOpen className={`h-4 w-4 ${activeTab === 'vita' ? 'stroke-[2.5px]' : ''}`} />
            <span>Vita</span>
          </button>

          {/* 3. Analytics Button (Right) */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer touch-manipulation select-none ${
              activeTab === 'analytics' || activeTab === 'achievements' || activeTab === 'settings'
                ? 'text-black dark:text-white bg-black/10 dark:bg-white/15 shadow-sm scale-105' 
                : 'text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <BarChart2 className={`h-4 w-4 ${activeTab === 'analytics' || activeTab === 'achievements' || activeTab === 'settings' ? 'stroke-[2.5px]' : ''}`} />
            <span>Analytics</span>
          </button>
        </nav>
      </div>

      {/* Footer Quote */}
      <footer className="w-full text-center py-6 border-t border-border-primary select-none pb-24">
        <p className="text-[10px] text-neutral-600 font-medium max-w-xs mx-auto leading-relaxed">
          "Every action you take is a vote for the type of person you wish to become."
          <span className="block mt-1 font-bold text-neutral-700 font-poppins uppercase tracking-wider">
            — James Clear, Atomic Habits
          </span>
        </p>
      </footer>
      <ConfirmDialog />
    </div>
  );
}

export default App;
