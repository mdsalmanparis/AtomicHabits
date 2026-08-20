import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getLevelTitle, getTotalXPForLevel } from '../utils/levelUtils';
import { 
  Trash2, Sun, Moon, FolderArchive, LogOut, 
  Award, CalendarDays, Shield 
} from 'lucide-react';
import * as Icons from 'lucide-react';

export const Settings: React.FC = () => {
  const habits = useStore(state => state.habits);
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);
  const deleteHabitPermanently = useStore(state => state.deleteHabitPermanently);
  const profile = useStore(state => state.profile);
  const updateDisplayName = useStore(state => state.updateDisplayName);
  const logout = useStore(state => state.logout);
  const showConfirm = useStore(state => state.showConfirm);
  const buyStreakShield = useStore(state => state.buyStreakShield);
  const toggleSalahTracker = useStore(state => state.toggleSalahTracker);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [updatingName, setUpdatingName] = useState(false);

  const archivedHabits = habits.filter(h => h.is_archived);
  const activeHabitsCount = habits.filter(h => !h.is_archived).length;

  const currentLevel = profile.level;
  const levelTitle = getLevelTitle(currentLevel);
  
  const currentLevelMinXP = getTotalXPForLevel(currentLevel);
  const nextLevelMinXP = getTotalXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = profile.xp - currentLevelMinXP;
  const xpNeededForNextLevel = nextLevelMinXP - currentLevelMinXP;
  const xpPercentage = xpNeededForNextLevel > 0 
    ? Math.round((Math.max(0, xpInCurrentLevel) / xpNeededForNextLevel) * 100) 
    : 100;

  const handleBuyShield = () => {
    showConfirm(
      'Buy Streak Shield',
      'Exchange 150 XP for 1 Streak Shield?',
      async () => {
        await buyStreakShield();
      }
    );
  };

  const handleDelete = (habitId: string, name: string) => {
    showConfirm(
      'Permanently Delete Habit',
      `Are you sure you want to PERMANENTLY delete "${name}"? This will delete all history and cannot be undone.`,
      async () => {
        await deleteHabitPermanently(habitId);
      }
    );
  };

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setUpdatingName(true);
    try {
      await updateDisplayName(displayName.trim());
      alert('Display name updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error updating name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleLogoutClick = () => {
    showConfirm(
      'Log Out',
      'Are you sure you want to log out?',
      async () => {
        await logout();
      }
    );
  };

  const handleToggleSalahTracker = async () => {
    try {
      await toggleSalahTracker(!profile.salah_tracker_enabled);
    } catch (err: any) {
      console.error(err);
      alert("Failed to toggle Salah Tracker. Did you run the SQL migration script in your Supabase SQL editor?\n\nError: " + (err.message || JSON.stringify(err)));
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Check;
    return <IconComponent className="h-4 w-4 text-text-primary" />;
  };

  return (
    <div className="space-y-6 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors max-w-2xl mx-auto">
      {/* Title */}
      <div className="border-b border-border-primary pb-4 select-none">
        <h2 className="text-xl font-bold font-poppins text-text-primary uppercase tracking-wider">Workspace settings</h2>
        <p className="text-xs text-neutral-500 mt-1">Configure your identity details, appearance, and manage archived routines</p>
      </div>

      {/* Gamified Profile Identity Card */}
      <div className="cred-card p-6 rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-4 border-b border-border-primary/50">
          <div className="h-16 w-16 rounded-2xl bg-text-primary text-bg-primary flex items-center justify-center font-extrabold text-2xl font-poppins select-none shrink-0 uppercase shadow-md">
            {profile.display_name.slice(0, 2)}
          </div>
          <div className="space-y-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wide">
                  {profile.display_name}
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1">
                  <Award className="h-3 w-3 text-red-500" />
                  Level {currentLevel} — {levelTitle}
                </p>
              </div>
              <div className="text-[10px] font-bold text-neutral-400 select-none bg-neutral-100 dark:bg-neutral-900 border border-border-primary px-2.5 py-1 rounded-md self-center sm:self-auto uppercase tracking-wider">
                Active Habits: {activeHabitsCount}
              </div>
            </div>
            
            {/* Level XP Progress */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-[10px] font-bold tracking-wider select-none text-neutral-500 uppercase">
                <span>XP Progress</span>
                <span>{Math.max(0, xpInCurrentLevel)} / {xpNeededForNextLevel} XP ({xpPercentage}%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 border border-border-primary overflow-hidden">
                <div 
                  className="h-full bg-text-primary transition-all duration-500 rounded-full"
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Name Form */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-bold font-poppins text-text-primary uppercase tracking-wider">Update Identity Name</h4>
            <p className="text-[10px] text-neutral-500">Customize how your name is shown throughout the workspace</p>
          </div>
          <form onSubmit={handleUpdateName} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="cred-input px-3.5 py-2.5 text-xs rounded-lg w-full sm:max-w-xs font-semibold focus:outline-none"
              placeholder="Display Name"
              maxLength={25}
              required
            />
            <button
              type="submit"
              disabled={updatingName || displayName.trim() === profile.display_name}
              className="px-4 py-2.5 rounded-lg cred-btn-secondary text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0"
            >
              {updatingName ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>
      </div>

      {/* Preferences & System Info Card */}
      <div className="cred-card p-6 rounded-xl space-y-5">
        <div className="border-b border-border-primary pb-3 select-none flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">Preferences</h3>
        </div>

        {/* Theme Select */}
        <div className="flex justify-between items-center select-none py-1">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-poppins text-text-primary uppercase tracking-wider">Theme Mode</h4>
            <p className="text-[10px] text-neutral-500">Switch between dark mode and high-contrast light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-primary rounded-lg text-xs font-semibold hover:border-border-hover hover:bg-card-bg text-text-primary transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-sky-500" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* Salah Tracker Toggle */}
        <div className="flex justify-between items-center select-none py-1 border-t border-border-primary/50 pt-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-poppins text-text-primary uppercase tracking-wider">5 Daily Salah Tracker</h4>
            <p className="text-[10px] text-neutral-500">Enable a dedicated horizontal prayer tracking card on Dashboard</p>
          </div>
          <button
            onClick={handleToggleSalahTracker}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              profile.salah_tracker_enabled
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20'
                : 'border-border-primary text-neutral-500 hover:border-border-hover'
            }`}
          >
            {profile.salah_tracker_enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Circadian Boundary Info */}
        <div className="flex justify-between items-start gap-4 select-none py-1 border-t border-border-primary/50 pt-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-poppins text-text-primary uppercase tracking-wider">Circadian Boundary</h4>
            <p className="text-[10px] text-neutral-500 leading-relaxed max-w-sm">
              Your logical routine date rolls over daily at <span className="text-text-primary font-bold">05:00:00 AM</span>. 
              Late night habits completed before 5 AM will count towards the previous day's consistency!
            </p>
          </div>
          <div className="bg-neutral-100 dark:bg-neutral-900 border border-border-primary p-2 rounded-lg shrink-0">
            <span className="text-[10px] font-extrabold text-neutral-400 font-mono tracking-wider">
              OFFSET: +5H
            </span>
          </div>
        </div>

        {/* Streak Shields Store */}
        <div className="flex justify-between items-center select-none py-1 border-t border-border-primary/50 pt-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold font-poppins text-text-primary uppercase tracking-wider">Streak Shields Store</h4>
            <p className="text-[10px] text-neutral-500">Exchange 150 XP for 1 Streak Shield (protects your streak if you miss a day)</p>
          </div>
          <button
            onClick={handleBuyShield}
            disabled={profile.xp < 150}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-primary rounded-lg text-xs font-bold text-cyan-400 hover:border-cyan-500 hover:bg-cyan-950/20 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none uppercase tracking-wider shrink-0"
          >
            <Shield className="h-3.5 w-3.5 fill-cyan-400/20" />
            <span>Buy (150 XP)</span>
          </button>
        </div>
      </div>

      {/* Archived Habits List Card */}
      <div className="cred-card p-6 rounded-xl space-y-4">
        <div className="border-b border-border-primary pb-3 select-none flex items-center gap-2">
          <FolderArchive className="h-4 w-4 text-neutral-500" />
          <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">Archived Habits</h3>
        </div>

        <div className="space-y-3 pt-1">
          {archivedHabits.map(habit => (
            <div 
              key={habit.id} 
              className="p-3 border border-border-primary rounded-lg bg-bg-primary/50 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 border border-border-primary rounded bg-card-bg">
                  {getIcon(habit.icon)}
                </div>
                <div className="min-w-0 select-none">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                    Becoming {habit.identity}
                  </span>
                  <h4 className="text-xs font-extrabold text-text-primary font-poppins truncate">
                    {habit.name}
                  </h4>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(habit.id, habit.name)}
                className="p-2 border border-border-primary hover:border-red-900/50 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 rounded transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Delete Permanently"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          ))}

          {archivedHabits.length === 0 && (
            <div className="text-center py-6 text-xs text-neutral-500 font-medium select-none">
              No archived habits found.
            </div>
          )}
        </div>
      </div>

      {/* Log Out Option Card */}
      <div className="cred-card p-6 rounded-xl space-y-4 border-red-900/20 bg-red-950/5">
        <div className="flex justify-between items-center select-none">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold font-poppins text-red-500 uppercase tracking-wider">Sign Out Session</h3>
            <p className="text-[10px] text-neutral-500">Disconnect from Supabase sync and return to auth workspace</p>
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 px-4 py-2 border border-red-900/30 rounded-lg text-xs font-semibold hover:border-red-500 hover:bg-red-950/20 text-red-500 hover:text-red-400 transition-all cursor-pointer shrink-0 uppercase tracking-wider"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
