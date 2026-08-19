import { create } from 'zustand';
import { supabase } from '../supabaseClient';
import confetti from 'canvas-confetti';
import { calculateHabitStats, type Habit, getLogicalDate } from '../utils/dateUtils';

export interface Profile {
  id: string;
  display_name: string;
  xp: number;
  level: number;
  streak_shields: number;
  day_offset_hours: number;
  salah_tracker_enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id?: string;
}

export interface HabitLog {
  id?: string;
  habit_id: string;
  logical_date: string;
  count_completed: number;
  is_minimum_version: boolean;
  is_skipped: boolean;
  is_justified?: boolean;
  xp_earned: number;
}

export interface StreakFreeze {
  logical_date: string;
  habit_id: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  icon: string;
  unlocked_at?: string;
}

interface AppState {
  // Authentication & Profile
  user: any | null;
  profile: Profile;
  isLoading: boolean;
  isInitialized: boolean;
  
  // App Data
  categories: Category[];
  habits: Habit[];
  logs: HabitLog[];
  freezes: StreakFreeze[];
  achievements: Achievement[];
  
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  // Actions
  init: () => Promise<void>;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  
  // Data Mutators
  addCategory: (name: string, icon: string, color: string) => Promise<Category>;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'streak_count' | 'best_streak' | 'is_archived'>) => Promise<void>;
  updateHabit: (habitId: string, habitData: Partial<Omit<Habit, 'id' | 'created_at' | 'streak_count' | 'best_streak' | 'is_archived' | 'user_id'>>) => Promise<void>;
  archiveHabit: (habitId: string) => Promise<void>;
  deleteHabitPermanently: (habitId: string) => Promise<void>;
  logHabit: (habitId: string, countDelta: number, logicalDate?: string) => Promise<void>;
  toggleSkip: (habitId: string, logicalDate?: string) => Promise<void>;
  toggleJustify: (habitId: string, logicalDate?: string) => Promise<void>;
  buyStreakShield: () => Promise<void>;
  useStreakFreeze: (habitId: string, dateStr: string) => Promise<void>;
  toggleSalahTracker: (enabled: boolean) => Promise<void>;
  
  // Helpers
  checkAchievements: () => void;
  addXP: (amount: number) => Promise<void>;
  
  // Custom confirmation dialog
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  };
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  hideConfirm: () => void;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-health', name: 'Health & Body', icon: 'Activity', color: '#10b981' },
  { id: 'cat-work', name: 'Deep Work', icon: 'Briefcase', color: '#06b6d4' },
  { id: 'cat-mind', name: 'Mind & Focus', icon: 'Brain', color: '#8b5cf6' },
  { id: 'cat-routine', name: 'Routines', icon: 'Sun', color: '#ef4444' }
];

const STATIC_ACHIEVEMENTS: Omit<Achievement, 'unlocked_at'>[] = [
  { id: 'atomic_start', title: 'Atomic Start', description: 'Create your first identity-based habit', xp_reward: 50, icon: 'Flame' },
  { id: 'streak_3', title: 'Consistent Catalyst', description: 'Reach a 3-day streak on any habit', xp_reward: 100, icon: 'Zap' },
  { id: 'streak_7', title: 'Habit Loop Master', description: 'Reach a 7-day streak on any habit', xp_reward: 200, icon: 'Crown' },
  { id: 'consistency_king', title: 'Unstoppable Habit', description: 'Reach a 14-day streak on any habit', xp_reward: 300, icon: 'Trophy' },
  { id: 'streak_30', title: 'Identity Shifted', description: 'Reach a 30-day streak on any habit', xp_reward: 500, icon: 'ShieldAlert' },
  { id: 'streak_60', title: 'Habitual Sentinel', description: 'Reach a 60-day streak on any habit', xp_reward: 800, icon: 'ShieldAlert' },
  { id: 'streak_100', title: 'Centennial Flame', description: 'Reach a 100-day streak on any habit', xp_reward: 1500, icon: 'Zap' },
  { id: 'streak_365', title: 'Orbit Completed', description: 'Reach a 365-day streak on any habit', xp_reward: 5000, icon: 'Crown' },
  { id: 'min_saviour', title: 'Show Up Anyway', description: 'Complete a habit via its Minimum Version to save a streak', xp_reward: 75, icon: 'Heart' },
  { id: 'shield_block', title: 'Streak Freeze', description: 'Use a Streak Freeze shield to prevent a reset', xp_reward: 75, icon: 'Shield' },
  { id: 'level_5', title: 'Self-Actualizer', description: 'Reach Level 5 in XP progress', xp_reward: 300, icon: 'TrendingUp' },
  { id: 'level_10', title: 'Decathlete Catalyst', description: 'Reach Level 10 in XP progress', xp_reward: 400, icon: 'TrendingUp' },
  { id: 'level_25', title: 'Silver Automator', description: 'Reach Level 25 in XP progress', xp_reward: 600, icon: 'Award' },
  { id: 'level_50', title: 'Gold Pioneer', description: 'Reach Level 50 in XP progress', xp_reward: 1000, icon: 'Crown' },
  { id: 'level_100', title: 'Centurion Titan', description: 'Reach Level 100 in XP progress', xp_reward: 2500, icon: 'Sparkles' },
  { id: 'cue_master', title: 'Master of Routine', description: 'Complete at least one habit in all 4 circadian phases', xp_reward: 150, icon: 'Clock' },
  { id: 'skipped_wisdom', title: 'Strategic Rest', description: 'Use your first Skip to take an intentional recovery day', xp_reward: 50, icon: 'Smile' },
  { id: 'justify_grace', title: 'Strategic Pivot', description: 'Use a Justified excused absence to handle life surprises', xp_reward: 75, icon: 'Scale' },
  { id: 'xp_hoarder', title: 'XP Titan', description: 'Accumulate 1,000 total XP points', xp_reward: 250, icon: 'Award' },
  { id: 'identity_champion', title: 'Identity Champion', description: 'Cast 50 total completions (votes) for a single identity', xp_reward: 250, icon: 'Sparkles' },
  { id: 'habits_5', title: 'Routines Builder', description: 'Maintain 5 or more active habits', xp_reward: 150, icon: 'Plus' },
  { id: 'habits_10', title: 'Polymath Architect', description: 'Maintain 10 or more active habits', xp_reward: 300, icon: 'Grid' },
  { id: 'early_bird', title: 'Dawn Treader', description: 'Complete a morning habit today', xp_reward: 100, icon: 'Sun' },
  { id: 'night_owl', title: 'Midnight Oil', description: 'Complete a night habit today', xp_reward: 100, icon: 'Moon' }
];

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: {
    id: '',
    display_name: 'Guest User',
    xp: 0,
    level: 1,
    streak_shields: 3,
    day_offset_hours: 5,
    salah_tracker_enabled: false
  },
  isLoading: true,
  isInitialized: false,
  categories: DEFAULT_CATEGORIES,
  habits: [],
  logs: [],
  freezes: [],
  achievements: STATIC_ACHIEVEMENTS.map(a => ({ ...a })),
  theme: 'dark',
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: undefined
  },
  showConfirm: (title, message, onConfirm, onCancel) => {
    set({
      confirmDialog: {
        isOpen: true,
        title,
        message,
        onConfirm,
        onCancel
      }
    });
  },
  hideConfirm: () => {
    set(state => ({
      confirmDialog: {
        ...state.confirmDialog,
        isOpen: false
      }
    }));
  },
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    localStorage.setItem('habitpro_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  },

  init: async () => {
    if (get().isInitialized) return;
    set({ isLoading: true });
    
    // Load theme
    const storedTheme = (localStorage.getItem('habitpro_theme') || 'dark') as 'dark' | 'light';
    set({ theme: storedTheme });
    if (storedTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        
        // Fetch Profile
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (!profile) {
          // Fallback if database trigger didn't run
          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              display_name: session.user.email?.split('@')[0] || 'User',
              xp: 0,
              level: 1,
              streak_shields: 3,
              day_offset_hours: 5,
              salah_tracker_enabled: false
            })
            .select()
            .single();
          profile = newProfile;
        }
        
        if (profile) {
          set({ profile });
        }
        
        // Fetch Categories
        let { data: userCategories } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', session.user.id);
          
        if (!userCategories || userCategories.length === 0) {
          const defaultsToInsert = [
            { user_id: session.user.id, name: 'Health & Body', icon: 'Activity', color: '#10b981' },
            { user_id: session.user.id, name: 'Deep Work', icon: 'Briefcase', color: '#06b6d4' },
            { user_id: session.user.id, name: 'Mind & Focus', icon: 'Brain', color: '#8b5cf6' },
            { user_id: session.user.id, name: 'Routines', icon: 'Sun', color: '#ef4444' }
          ];
          const { data: inserted } = await supabase
            .from('categories')
            .insert(defaultsToInsert)
            .select();
          if (inserted) {
            userCategories = inserted;
          }
        }
          
        set({ categories: userCategories || [] });
        
        // Fetch Habits
        const { data: habits } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', session.user.id);
        set({ habits: habits || [] });
        
        // Fetch Logs
        const { data: logs } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', session.user.id);
        set({ logs: logs || [] });
        
        // Fetch Freezes
        const { data: freezes } = await supabase
          .from('streak_freezes_used')
          .select('*')
          .eq('user_id', session.user.id);
        set({ freezes: freezes || [] });
        
        // Fetch unlocked achievements
        let unlockedIds = new Set<string>();
        try {
          const { data: unlocked, error: unlockedError } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', session.user.id);
          if (unlockedError) throw unlockedError;
          unlockedIds = new Set(unlocked?.map(u => u.achievement_id) || []);
        } catch (err) {
          console.warn('Could not load user achievements:', err);
        }
        
        set({
          achievements: STATIC_ACHIEVEMENTS.map(a => ({
            ...a,
            unlocked_at: unlockedIds.has(a.id) ? new Date().toISOString() : undefined
          })),
          isInitialized: true
        });
        
      } else {
        set({ user: null });
      }
    } catch (e) {
      console.error('Error initializing store:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      get().init();
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      isInitialized: false,
      profile: {
        id: '',
        display_name: 'Guest User',
        xp: 0,
        level: 1,
        streak_shields: 3,
        day_offset_hours: 5,
        salah_tracker_enabled: false
      },
      habits: [],
      logs: [],
      freezes: []
    });
  },

  updateDisplayName: async (name: string) => {
    const { user, profile } = get();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', user.id);
    if (error) throw error;
    set({ profile: { ...profile, display_name: name } });
  },

  addCategory: async (name, icon, color) => {
    const { user, categories } = get();
    if (!user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name,
        icon,
        color,
        user_id: user.id
      })
      .select()
      .single();
      
    if (error) throw error;
    set({ categories: [...categories, data] });
    return data;
  },

  addHabit: async (habitData) => {
    const { user, habits } = get();
    if (!user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from('habits')
      .insert({
        ...habitData,
        user_id: user.id
      })
      .select()
      .single();
      
    if (error) throw error;
    set({ habits: [...habits, data] });
    
    // Award Atomic Start Achievement
    const firstHabit = habits.length === 0;
    if (firstHabit) {
      get().addXP(50);
      set(state => {
        const ach = state.achievements.map(a => 
          a.id === 'atomic_start' ? { ...a, unlocked_at: new Date().toISOString() } : a
        );
        return { achievements: ach };
      });
      await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: 'atomic_start'
      });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  },

  updateHabit: async (habitId, habitData) => {
    const { user, habits, logs, freezes, profile } = get();
    if (!user) return;

    const { error } = await supabase
      .from('habits')
      .update(habitData)
      .eq('id', habitId);

    if (error) throw error;

    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const merged = { ...h, ...habitData };
        const stats = calculateHabitStats(merged, logs, freezes, profile.day_offset_hours);
        return {
          ...merged,
          streak_count: stats.currentStreak,
          best_streak: stats.bestStreak
        };
      }
      return h;
    });

    set({ habits: updatedHabits });

    const updatedH = updatedHabits.find(h => h.id === habitId);
    if (updatedH) {
      await supabase
        .from('habits')
        .update({
          streak_count: updatedH.streak_count,
          best_streak: updatedH.best_streak
        })
        .eq('id', habitId);
    }
  },

  archiveHabit: async (habitId) => {
    const { habits, user } = get();
    if (!user) return;

    await supabase
      .from('habits')
      .update({ is_archived: true })
      .eq('id', habitId);

    const updated = habits.map(h => h.id === habitId ? { ...h, is_archived: true } : h);
    set({ habits: updated });
  },

  deleteHabitPermanently: async (habitId) => {
    const { habits, logs, user } = get();
    if (!user) return;

    await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    const updatedHabits = habits.filter(h => h.id !== habitId);
    const updatedLogs = logs.filter(l => l.habit_id !== habitId);
    set({ habits: updatedHabits, logs: updatedLogs });
  },

  logHabit: async (habitId, countDelta, logicalDate) => {
    const { user, logs, habits, profile, freezes } = get();
    if (!user) return;

    const targetDate = logicalDate || getLogicalDate(new Date(), profile.day_offset_hours);
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const existingLog = logs.find(l => l.habit_id === habitId && l.logical_date === targetDate);
    const newCount = Math.max(0, (existingLog ? existingLog.count_completed : 0) + countDelta);
    
    const target = habit.target_count;
    const minVal = habit.min_version_enabled ? habit.min_version_count : target;
    const isCompleted = newCount >= target;
    const isMinMet = habit.min_version_enabled && newCount >= minVal;
    
    let xpAwarded = 0;
    if (habit.type === 'single_tick') {
      if (isCompleted) xpAwarded = habit.xp_reward;
    } else {
      // Proportional XP reward for frequency-based habits (e.g. 6/4 results in 1.5x XP)
      xpAwarded = Math.round((newCount / target) * habit.xp_reward);
    }
    
    const updatedLog: HabitLog = {
      habit_id: habitId,
      logical_date: targetDate,
      count_completed: newCount,
      is_minimum_version: isMinMet && !isCompleted,
      is_skipped: false,
      is_justified: false,
      xp_earned: xpAwarded
    };
    
    let updatedLogs = [...logs];
    if (existingLog) {
      updatedLogs = logs.map(l => l.habit_id === habitId && l.logical_date === targetDate ? updatedLog : l);
    } else {
      updatedLogs.push(updatedLog);
    }
    
    set({ logs: updatedLogs });

    let dbError = null;
    if (existingLog) {
      const { error } = await supabase
        .from('habit_logs')
        .update(updatedLog)
        .eq('habit_id', habitId)
        .eq('logical_date', targetDate);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          ...updatedLog,
          user_id: user.id
        });
      dbError = error;
    }
      
    if (dbError) {
      console.error("Error saving habit log:", dbError);
      throw dbError;
    }
    
    // Adjust XP
    const xpDelta = xpAwarded - (existingLog ? existingLog.xp_earned : 0);
    if (xpDelta !== 0) {
      await get().addXP(xpDelta);
    }
    
    // Recalculate streak values
    const updatedHabits = get().habits.map(h => {
      if (h.id === habitId) {
        const stats = calculateHabitStats(h, updatedLogs, freezes, profile.day_offset_hours);
        return {
          ...h,
          streak_count: stats.currentStreak,
          best_streak: stats.bestStreak
        };
      }
      return h;
    });
    
    set({ habits: updatedHabits });

    const updatedH = updatedHabits.find(h => h.id === habitId);
    if (updatedH) {
      await supabase
        .from('habits')
        .update({
          streak_count: updatedH.streak_count,
          best_streak: updatedH.best_streak
        })
        .eq('id', habitId);
    }
    
    // Evaluate achievements
    get().checkAchievements();
  },

  toggleSkip: async (habitId, logicalDate) => {
    const { user, logs, habits, profile, freezes } = get();
    if (!user) return;

    const targetDate = logicalDate || getLogicalDate(new Date(), profile.day_offset_hours);
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const existingLog = logs.find(l => l.habit_id === habitId && l.logical_date === targetDate);
    const wasSkipped = existingLog ? existingLog.is_skipped : false;
    
    let updatedLog: HabitLog;
    if (wasSkipped) {
      updatedLog = {
        habit_id: habitId,
        logical_date: targetDate,
        count_completed: 0,
        is_minimum_version: false,
        is_skipped: false,
        is_justified: false,
        xp_earned: 0
      };
    } else {
      updatedLog = {
        habit_id: habitId,
        logical_date: targetDate,
        count_completed: 0,
        is_minimum_version: false,
        is_skipped: true,
        is_justified: false,
        xp_earned: 0
      };
    }
    
    let updatedLogs = [...logs];
    if (existingLog) {
      updatedLogs = logs.map(l => l.habit_id === habitId && l.logical_date === targetDate ? updatedLog : l);
    } else {
      updatedLogs.push(updatedLog);
    }
    
    set({ logs: updatedLogs });

    let dbError = null;
    if (existingLog) {
      const { error } = await supabase
        .from('habit_logs')
        .update(updatedLog)
        .eq('habit_id', habitId)
        .eq('logical_date', targetDate);
      dbError = error;
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({
          ...updatedLog,
          user_id: user.id
        });
      dbError = error;
    }
      
    if (dbError) {
      console.error("Error toggling skip log:", dbError);
      throw dbError;
    }
    
    const xpDelta = 0 - (existingLog ? existingLog.xp_earned : 0);
    if (xpDelta !== 0) {
      await get().addXP(xpDelta);
    }
    
    // Recalculate streaks
    const updatedHabits = get().habits.map(h => {
      if (h.id === habitId) {
        const stats = calculateHabitStats(h, updatedLogs, freezes, profile.day_offset_hours);
        return {
          ...h,
          streak_count: stats.currentStreak,
          best_streak: stats.bestStreak
        };
      }
      return h;
    });
    
    set({ habits: updatedHabits });

    const updatedH = updatedHabits.find(h => h.id === habitId);
    if (updatedH) {
      await supabase
        .from('habits')
        .update({
          streak_count: updatedH.streak_count,
          best_streak: updatedH.best_streak
        })
        .eq('id', habitId);
    }
  },

  toggleJustify: async (habitId, logicalDate) => {
    const { user, logs, habits, profile, freezes } = get();
    if (!user) return;

    const targetDate = logicalDate || getLogicalDate(new Date(), profile.day_offset_hours);
    
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const existingLog = logs.find(l => l.habit_id === habitId && l.logical_date === targetDate);
    const wasJustified = existingLog ? existingLog.is_justified : false;
    
    let updatedLog: HabitLog;
    if (wasJustified) {
      updatedLog = {
        habit_id: habitId,
        logical_date: targetDate,
        count_completed: 0,
        is_minimum_version: false,
        is_skipped: false,
        is_justified: false,
        xp_earned: 0
      };
    } else {
      updatedLog = {
        habit_id: habitId,
        logical_date: targetDate,
        count_completed: 0,
        is_minimum_version: false,
        is_skipped: false,
        is_justified: true,
        xp_earned: 0
      };
    }
    
    let updatedLogs = [...logs];
    if (existingLog) {
      updatedLogs = logs.map(l => l.habit_id === habitId && l.logical_date === targetDate ? updatedLog : l);
    } else {
      updatedLogs.push(updatedLog);
    }
    
    set({ logs: updatedLogs });

    const { error: upsertError } = await supabase
      .from('habit_logs')
      .upsert({
        ...updatedLog,
        user_id: user.id
      }, {
        onConflict: 'habit_id,logical_date'
      });
      
    if (upsertError) {
      console.error("Error toggling justify log:", upsertError);
      throw upsertError;
    }
    
    const xpDelta = 0 - (existingLog ? existingLog.xp_earned : 0);
    if (xpDelta !== 0) {
      await get().addXP(xpDelta);
    }
    
    // Recalculate streaks
    const updatedHabits = get().habits.map(h => {
      if (h.id === habitId) {
        const stats = calculateHabitStats(h, updatedLogs, freezes, profile.day_offset_hours);
        return {
          ...h,
          streak_count: stats.currentStreak,
          best_streak: stats.bestStreak
        };
      }
      return h;
    });
    
    set({ habits: updatedHabits });

    const updatedH = updatedHabits.find(h => h.id === habitId);
    if (updatedH) {
      await supabase
        .from('habits')
        .update({
          streak_count: updatedH.streak_count,
          best_streak: updatedH.best_streak
        })
        .eq('id', habitId);
    }
  },

  buyStreakShield: async () => {
    const { profile, user } = get();
    if (!user) return;

    if (profile.xp < 150) {
      alert("Insufficient XP! Streak Freeze Shield costs 150 XP.");
      return;
    }
    
    const updatedProfile = {
      ...profile,
      xp: profile.xp - 150,
      streak_shields: profile.streak_shields + 1
    };
    
    set({ profile: updatedProfile });

    await supabase
      .from('profiles')
      .update({
        xp: updatedProfile.xp,
        streak_shields: updatedProfile.streak_shields
      })
      .eq('id', user.id);
  },

  useStreakFreeze: async (habitId, dateStr) => {
    const { profile, user, freezes, habits, logs } = get();
    if (!user) return;

    if (profile.streak_shields <= 0) {
      alert("No Streak Freeze Shields left! Buy one using XP.");
      return;
    }
    
    const isAlreadyFrozen = freezes.some(f => f.logical_date === dateStr && f.habit_id === habitId);
    if (isAlreadyFrozen) return;
    
    const updatedProfile = {
      ...profile,
      streak_shields: profile.streak_shields - 1
    };
    
    const newFreeze: StreakFreeze = { logical_date: dateStr, habit_id: habitId };
    const updatedFreezes = [...freezes, newFreeze];
    
    set({ profile: updatedProfile, freezes: updatedFreezes });
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ streak_shields: updatedProfile.streak_shields })
      .eq('id', user.id);
      
    if (profileError) {
      console.error("Error updating profiles shields:", profileError);
      throw profileError;
    }
      
    const { error: freezeError } = await supabase
      .from('streak_freezes_used')
      .insert({
        user_id: user.id,
        habit_id: habitId,
        logical_date: dateStr
      });

    if (freezeError) {
      console.error("Error inserting streak freeze:", freezeError);
      throw freezeError;
    }
    
    // Recalculate streaks
    const updatedHabits = habits.map(h => {
      const stats = calculateHabitStats(h, logs, updatedFreezes, profile.day_offset_hours);
      return {
        ...h,
        streak_count: stats.currentStreak,
        best_streak: stats.bestStreak
      };
    });
    
    set({ habits: updatedHabits });

    for (const h of updatedHabits) {
      await supabase
        .from('habits')
        .update({
          streak_count: h.streak_count,
          best_streak: h.best_streak
        })
        .eq('id', h.id);
    }
    
    // Unlock shield block achievement
    const alreadyUnlocked = get().achievements.find(a => a.id === 'shield_block')?.unlocked_at;
    if (!alreadyUnlocked) {
      get().addXP(75);
      set(state => {
        const ach = state.achievements.map(a => 
          a.id === 'shield_block' ? { ...a, unlocked_at: new Date().toISOString() } : a
        );
        return { achievements: ach };
      });
      await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: 'shield_block'
      });
    }
  },

  toggleSalahTracker: async (enabled: boolean) => {
    const { user, profile, habits } = get();
    if (!user) return;

    const updatedProfile = {
      ...profile,
      salah_tracker_enabled: enabled
    };
    set({ profile: updatedProfile });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ salah_tracker_enabled: enabled })
      .eq('id', user.id);

    if (profileError) {
      console.error("Error updating salah tracker settings:", profileError);
      throw profileError;
    }

    if (enabled) {
      const salahNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const missingSalah = salahNames.filter(name => !habits.some(h => h.is_salah && h.name === name));
      
      if (missingSalah.length > 0) {
        const phasesMap: Record<string, string> = {
          'Fajr': 'phase_1',
          'Dhuhr': 'phase_2',
          'Asr': 'phase_3',
          'Maghrib': 'phase_3',
          'Isha': 'phase_4'
        };
        
        const newHabitsToInsert = missingSalah.map(name => ({
          user_id: user.id,
          identity: 'a devoted Muslim',
          name: name,
          icon: name === 'Fajr' ? 'Sunrise' : name === 'Dhuhr' ? 'Sun' : name === 'Asr' ? 'SunDim' : name === 'Maghrib' ? 'Sunset' : 'Moon',
          type: 'single_tick',
          target_count: 1,
          frequency_unit: 'daily',
          cue_phase: phasesMap[name] || 'phase_1',
          min_version_enabled: false,
          xp_reward: 15,
          streak_count: 0,
          best_streak: 0,
          is_archived: false,
          is_salah: true
        }));
        
        const { data: insertedHabits, error: habitsError } = await supabase
          .from('habits')
          .insert(newHabitsToInsert)
          .select();
          
        if (habitsError) {
          console.error("Error auto-inserting salah habits:", habitsError);
          throw habitsError;
        }
        
        if (insertedHabits) {
          set({ habits: [...habits, ...insertedHabits] });
        }
      }

      const currentHabits = get().habits;
      const hasWater = currentHabits.some(h => h.name.toLowerCase().includes('water') && !h.is_archived);
      if (!hasWater) {
        const defaultWater = {
          user_id: user.id,
          identity: 'a hydrated person',
          name: 'Drink Water',
          icon: 'Droplet',
          type: 'frequency',
          target_count: 4,
          frequency_unit: 'daily',
          cue_phase: 'all_day',
          min_version_enabled: false,
          xp_reward: 10,
          streak_count: 0,
          best_streak: 0,
          is_archived: false,
          is_salah: false
        };
        
        const { data: insertedWater, error: waterError } = await supabase
          .from('habits')
          .insert(defaultWater)
          .select()
          .single();
          
        if (waterError) {
          console.error("Error auto-inserting default water habit:", waterError);
        } else if (insertedWater) {
          set(state => ({ habits: [...state.habits, insertedWater] }));
        }
      }
    }
  },

  addXP: async (amount) => {
    const { profile, user } = get();
    if (!user) return;

    const newXP = profile.xp + amount;
    const newLevel = Math.floor(newXP / 200) + 1;
    const leveledUp = newLevel > profile.level;
    
    const updatedProfile = {
      ...profile,
      xp: newXP,
      level: newLevel
    };
    
    set({ profile: updatedProfile });

    await supabase
      .from('profiles')
      .update({ xp: newXP, level: newLevel })
      .eq('id', user.id);
    
    if (leveledUp) {
      confetti({ particleCount: 200, spread: 100, colors: ['#ffd700', '#ffffff'] });
      
      // Check Level 5 Achievement
      if (newLevel >= 5) {
        const alreadyUnlocked = get().achievements.find(a => a.id === 'level_5')?.unlocked_at;
        if (!alreadyUnlocked) {
          get().addXP(300);
          set(state => {
            const ach = state.achievements.map(a => 
              a.id === 'level_5' ? { ...a, unlocked_at: new Date().toISOString() } : a
            );
            return { achievements: ach };
          });
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: 'level_5'
          });
        }
      }
    }
  },

  checkAchievements: () => {
    const { habits, logs, freezes, profile, achievements, user } = get();
    if (!user) return;
    
    const checkAward = async (id: string, xpReward: number) => {
      const achIndex = achievements.findIndex(a => a.id === id);
      if (achIndex !== -1 && !achievements[achIndex].unlocked_at) {
        await get().addXP(xpReward);
        
        set(state => {
          const ach = state.achievements.map(a => 
            a.id === id ? { ...a, unlocked_at: new Date().toISOString() } : a
          );
          return { achievements: ach };
        });
        
        await supabase.from('user_achievements').insert({
          user_id: user.id,
          achievement_id: id
        });
        
        confetti({ particleCount: 120, spread: 70, colors: ['#00ff66', '#ffffff'] });
      }
    };
    
    // Check streaks
    let maxStreak = 0;
    habits.forEach(h => {
      const stats = calculateHabitStats(h, logs, freezes, profile.day_offset_hours);
      if (stats.currentStreak > maxStreak) {
        maxStreak = stats.currentStreak;
      }
    });
    
    if (maxStreak >= 3) checkAward('streak_3', 100);
    if (maxStreak >= 7) checkAward('streak_7', 200);
    if (maxStreak >= 14) checkAward('consistency_king', 300);
    if (maxStreak >= 30) checkAward('streak_30', 500);
    if (maxStreak >= 60) checkAward('streak_60', 800);
    if (maxStreak >= 100) checkAward('streak_100', 1500);
    if (maxStreak >= 365) checkAward('streak_365', 5000);
    
    const hasMinVersionLog = logs.some(l => l.is_minimum_version && l.count_completed > 0);
    if (hasMinVersionLog) checkAward('min_saviour', 75);

    // Check Cue Master (completing habits in all 4 circadian phases)
    const completedPhases = new Set<string>();
    habits.forEach(h => {
      const hasCompletions = logs.some(l => l.habit_id === h.id && l.count_completed >= h.target_count);
      if (hasCompletions && h.cue_phase.startsWith('phase_')) {
        completedPhases.add(h.cue_phase);
      }
    });
    if (completedPhases.size >= 4) {
      checkAward('cue_master', 150);
    }

    // Check Skipped Wisdom (using first skip)
    const hasSkipped = logs.some(l => l.is_skipped);
    if (hasSkipped) {
      checkAward('skipped_wisdom', 50);
    }

    // Check Justify Grace
    const hasJustified = logs.some(l => l.is_justified);
    if (hasJustified) {
      checkAward('justify_grace', 75);
    }

    // Check XP Titan (1000 total XP)
    if (profile.xp >= 1000) {
      checkAward('xp_hoarder', 250);
    }

    // Check level achievements
    if (profile.level >= 5) checkAward('level_5', 300);
    if (profile.level >= 10) checkAward('level_10', 400);
    if (profile.level >= 25) checkAward('level_25', 600);
    if (profile.level >= 50) checkAward('level_50', 1000);
    if (profile.level >= 100) checkAward('level_100', 2500);

    // Check active habits count
    const activeHabitsCount = habits.filter(h => !h.is_archived).length;
    if (activeHabitsCount >= 5) checkAward('habits_5', 150);
    if (activeHabitsCount >= 10) checkAward('habits_10', 300);

    // Check early morning and night owl completions
    const hasEarlyMorning = logs.some(l => {
      const h = habits.find(habit => habit.id === l.habit_id);
      return h && h.cue_phase === 'phase_1' && l.count_completed >= h.target_count;
    });
    if (hasEarlyMorning) checkAward('early_bird', 100);

    const hasNightOwl = logs.some(l => {
      const h = habits.find(habit => habit.id === l.habit_id);
      return h && h.cue_phase === 'phase_4' && l.count_completed >= h.target_count;
    });
    if (hasNightOwl) checkAward('night_owl', 100);

    // Check Identity Champion (50 completions of a single identity)
    const identityCounts: Record<string, number> = {};
    logs.forEach(l => {
      const h = habits.find(habit => habit.id === l.habit_id);
      if (h && l.count_completed >= h.target_count) {
        identityCounts[h.identity] = (identityCounts[h.identity] || 0) + 1;
      }
    });
    const maxIdentityCompletions = Math.max(0, ...Object.values(identityCounts));
    if (maxIdentityCompletions >= 50) {
      checkAward('identity_champion', 250);
    }
  }
}));
