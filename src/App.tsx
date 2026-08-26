import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { supabase } from './supabaseClient';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { AchievementsList } from './components/AchievementsList';
import { Settings } from './components/Settings';
import { Vita, VITA_DATA } from './components/Vita';
import { Calendar, BarChart2, Flame, Target, BookOpen } from 'lucide-react';
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
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
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

    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setNotificationPermission(perm);
        });
      } else {
        setNotificationPermission(Notification.permission);
      }
    }

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
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col justify-between selection:bg-text-primary selection:text-bg-primary transition-colors">
      {notificationPermission !== 'granted' && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 py-3 px-4 text-xs font-bold font-poppins flex flex-col sm:flex-row justify-between items-center gap-2 select-none animate-fadeIn">
          <span>⚠️ Phase Notifications are disabled! You must enable notifications for phase reminders to function.</span>
          <button
            onClick={async () => {
              if ('Notification' in window) {
                const perm = await Notification.requestPermission();
                setNotificationPermission(perm);
                if (perm === 'denied') {
                  alert("Notifications are blocked in your browser settings. Please click the lock icon in the browser address bar next to the URL and toggle 'Notifications' to 'Allow'.");
                }
              }
            }}
            className="bg-red-500 text-white font-bold px-3 py-1 rounded hover:bg-red-600 transition-colors cursor-pointer shrink-0 uppercase tracking-wider text-[10px]"
          >
            {notificationPermission === 'denied' ? 'How to Unblock' : 'Enable Now'}
          </button>
        </div>
      )}
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 pb-24 space-y-6 flex-1">
        
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
          {activeTab === 'growth' && <Dashboard activeTab="growth" />}
          {activeTab === 'analytics' && <Analytics onNavigate={setActiveTab} />}
          {activeTab === 'achievements' && <AchievementsList onNavigate={setActiveTab} />}
          {activeTab === 'settings' && <Settings onNavigate={setActiveTab} />}
          {activeTab === 'vita' && <Vita />}
        </main>
      </div>

      {/* Bottom Floating Navigation Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm sm:max-w-md select-none">
        <nav className="flex items-center justify-around bg-card-bg/95 backdrop-blur-md border border-border-primary rounded-2xl p-2.5 shadow-2xl">
          {/* Growth Button */}
          <button
            onClick={() => setActiveTab('growth')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'growth' 
                ? 'text-indigo-500 scale-105' 
                : 'text-neutral-500 hover:text-text-primary'
            }`}
          >
            <Target className={`h-4.5 w-4.5 ${activeTab === 'growth' ? 'stroke-[3px]' : ''}`} />
            <span>Growth</span>
          </button>

          {/* Routines Button */}
          <button
            onClick={() => setActiveTab('habits')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'habits' 
                ? 'text-indigo-500 scale-105' 
                : 'text-neutral-500 hover:text-text-primary'
            }`}
          >
            <Calendar className={`h-4.5 w-4.5 ${activeTab === 'habits' ? 'stroke-[3px]' : ''}`} />
            <span>Routines</span>
          </button>

          {/* Analytics Button */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'analytics' || activeTab === 'achievements' || activeTab === 'settings'
                ? 'text-indigo-500 scale-105' 
                : 'text-neutral-500 hover:text-text-primary'
            }`}
          >
            <BarChart2 className={`h-4.5 w-4.5 ${activeTab === 'analytics' || activeTab === 'achievements' || activeTab === 'settings' ? 'stroke-[3px]' : ''}`} />
            <span>Analytics</span>
          </button>

          {/* Vita Button */}
          <button
            onClick={() => setActiveTab('vita')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'vita' 
                ? 'text-indigo-500 scale-105' 
                : 'text-neutral-500 hover:text-text-primary'
            }`}
          >
            <BookOpen className={`h-4.5 w-4.5 ${activeTab === 'vita' ? 'stroke-[3px]' : ''}`} />
            <span>Vita</span>
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
