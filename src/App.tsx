import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { AchievementsList } from './components/AchievementsList';
import { Settings } from './components/Settings';
import { Calendar, BarChart2, Trophy, Loader2, Sliders, Flame } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';

function App() {
  const init = useStore(state => state.init);
  const user = useStore(state => state.user);
  const isLoading = useStore(state => state.isLoading);
  const setUser = useStore(state => state.setUser);
  
  const [activeTab, setActiveTab] = useState<'habits' | 'analytics' | 'achievements' | 'settings'>('habits');

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
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center text-text-primary select-none transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-text-primary mb-4" />
        <h2 className="text-sm font-bold font-poppins tracking-widest text-neutral-500 uppercase">
          Initializing Habit Loop...
        </h2>
      </div>
    );
  }

  // If not logged in, show Auth
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col justify-between selection:bg-text-primary selection:text-bg-primary transition-colors">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Navigation / Header */}
        <header className="flex justify-between items-center border-b border-border-primary pb-4">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <div className="h-7 w-7 rounded bg-btn-primary-bg flex items-center justify-center text-btn-primary-text">
              <Flame className="h-4.5 w-4.5 text-red-500 fill-red-500 shrink-0" />
            </div>
            <span className="text-lg font-black font-poppins tracking-wider">
              HABIT<span className="text-neutral-400">PRO</span>
            </span>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-3 select-none">
            <nav className="flex items-center bg-card-bg border border-border-primary rounded-lg p-1">
              <button
                onClick={() => setActiveTab('habits')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-poppins transition-all cursor-pointer ${
                  activeTab === 'habits' 
                    ? 'bg-btn-primary-bg text-btn-primary-text font-bold' 
                    : 'text-neutral-500 hover:text-text-primary'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Routines</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-poppins transition-all cursor-pointer ${
                  activeTab === 'analytics' 
                    ? 'bg-btn-primary-bg text-btn-primary-text font-bold' 
                    : 'text-neutral-500 hover:text-text-primary'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Analytics</span>
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-poppins transition-all cursor-pointer ${
                  activeTab === 'achievements' 
                    ? 'bg-btn-primary-bg text-btn-primary-text font-bold' 
                    : 'text-neutral-500 hover:text-text-primary'
                }`}
              >
                <Trophy className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Badges</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-poppins transition-all cursor-pointer ${
                  activeTab === 'settings' 
                    ? 'bg-btn-primary-bg text-btn-primary-text font-bold' 
                    : 'text-neutral-500 hover:text-text-primary'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            </nav>
          </div>
        </header>

        {/* Core Workspace Content */}
        <main className="min-h-[60vh]">
          {activeTab === 'habits' && <Dashboard />}
          {activeTab === 'analytics' && <Analytics />}
          {activeTab === 'achievements' && <AchievementsList />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Footer Quote */}
      <footer className="w-full text-center py-6 border-t border-border-primary select-none">
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
