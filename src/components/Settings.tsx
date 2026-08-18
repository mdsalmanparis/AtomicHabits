import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Trash2, Sun, Moon, FolderArchive, User, LogOut } from 'lucide-react';
import * as Icons from 'lucide-react';

export const Settings: React.FC = () => {
  const habits = useStore(state => state.habits);
  const theme = useStore(state => state.theme);
  const toggleTheme = useStore(state => state.toggleTheme);
  const deleteHabitPermanently = useStore(state => state.deleteHabitPermanently);
  const profile = useStore(state => state.profile);
  const updateDisplayName = useStore(state => state.updateDisplayName);
  const logout = useStore(state => state.logout);

  const [displayName, setDisplayName] = useState(profile.display_name);
  const [updatingName, setUpdatingName] = useState(false);

  const archivedHabits = habits.filter(h => h.is_archived);

  const handleDelete = async (habitId: string, name: string) => {
    if (confirm(`Are you sure you want to PERMANENTLY delete "${name}"? This will delete all history and cannot be undone.`)) {
      await deleteHabitPermanently(habitId);
    }
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

  const handleLogoutClick = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Check;
    return <IconComponent className="h-4 w-4 text-text-primary" />;
  };

  return (
    <div className="space-y-8 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      {/* Title */}
      <div className="border-b border-border-primary pb-4 select-none">
        <h2 className="text-xl font-bold font-poppins text-text-primary">Settings & Maintenance</h2>
        <p className="text-xs text-neutral-500 mt-1">Configure your preference workspace and clean up archived routines</p>
      </div>

      {/* Profile Settings Card */}
      <div className="cred-card p-6 rounded-xl space-y-4">
        <div className="border-b border-border-primary pb-3 select-none flex items-center gap-2">
          <User className="h-4 w-4 text-neutral-505" />
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Profile Details</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Customize how you are welcomed in the workspace</p>
          </div>
        </div>
        <form onSubmit={handleUpdateName} className="flex flex-col sm:flex-row gap-3 pt-1">
          <input 
            type="text" 
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="cred-input px-3.5 py-2.5 text-xs rounded-lg w-full sm:max-w-xs font-semibold"
            placeholder="Display Name"
            required
          />
          <button
            type="submit"
            disabled={updatingName || displayName.trim() === profile.display_name}
            className="px-4 py-2.5 rounded-lg cred-btn-secondary text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:pointer-events-none shrink-0"
          >
            {updatingName ? 'Updating...' : 'Update Name'}
          </button>
        </form>
      </div>

      {/* Theme Config Card */}
      <div className="cred-card p-6 rounded-xl space-y-4">
        <div className="flex justify-between items-center select-none">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Application Theme</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Toggle between dark mode and high-contrast light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 border border-border-primary rounded-lg text-xs font-semibold hover:border-border-hover hover:bg-card-bg text-text-primary transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4" />
                <span>Switch to Light</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>Switch to Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Archived Habits List Card */}
      <div className="cred-card p-6 rounded-xl space-y-4">
        <div className="border-b border-border-primary pb-3 select-none flex items-center gap-2">
          <FolderArchive className="h-4 w-4 text-neutral-505" />
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Archived Habits</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Permanently delete archived routines to clean up your history</p>
          </div>
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
      <div className="cred-card p-6 rounded-xl space-y-4 border-neutral-800 bg-neutral-950/20">
        <div className="flex justify-between items-center select-none">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Sign Out Session</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Disconnect from Supabase sync and return to auth workspace</p>
          </div>
          <button
            onClick={handleLogoutClick}
            className="flex items-center gap-2 px-4 py-2 border border-neutral-800 rounded-lg text-xs font-semibold hover:border-red-500 hover:bg-red-950/10 text-neutral-400 hover:text-red-550 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

    </div>
  );
};
