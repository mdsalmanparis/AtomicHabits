import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { HabitCard } from './HabitCard';
import { HabitForm } from './HabitForm';
import { getLogicalDate, formatFriendlyDate, addDays } from '../utils/dateUtils';
import { 
  Plus, 
  Shield, 
  Sparkles, 
  Activity,
  Briefcase,
  Brain,
  Sun
} from 'lucide-react';

interface DashboardProps {}

const LIFE_PHASES_META = [
  { id: 'all_day', name: 'All Day / Optional', desc: 'No specific time constraint', icon: Sparkles },
  { id: 'phase_1', name: 'Phase 1 (1 PM - 4 PM)', desc: 'Afternoon Kickoff', icon: Sun },
  { id: 'phase_2', name: 'Phase 2 (4 PM - 8 PM)', desc: 'Prime Focus', icon: Activity },
  { id: 'phase_3', name: 'Phase 3 (8 PM - 12 AM)', desc: 'Night Shift Core', icon: Brain },
  { id: 'phase_4', name: 'Phase 4 (12 AM - 4 AM)', desc: 'Late Night Burn', icon: Briefcase }
];

export const Dashboard: React.FC<DashboardProps> = () => {
  const profile = useStore(state => state.profile);
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const buyStreakShield = useStore(state => state.buyStreakShield);
  
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | undefined>(undefined);

  const activeHabits = habits.filter(h => !h.is_archived);

  // Group habits by cue phase
  const habitsByPhase = LIFE_PHASES_META.reduce((acc, phase) => {
    acc[phase.id] = activeHabits.filter(h => h.cue_phase === phase.id);
    return acc;
  }, {} as Record<string, typeof activeHabits>);

  const handleBuyShield = async () => {
    if (confirm('Exchange 150 XP for 1 Streak Shield?')) {
      await buyStreakShield();
    }
  };

  const todayLogicalStr = getLogicalDate(new Date(), profile.day_offset_hours);
  const [selectedDate, setSelectedDate] = useState(todayLogicalStr);

  // Calculate completed out of total active habits for the selectedDate
  const totalCount = activeHabits.length;
  let completedCount = 0;
  activeHabits.forEach(h => {
    const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
    if (log) {
      if (log.is_skipped || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
        completedCount++;
      }
    }
  });
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const dateSwitcherRange = Array.from({ length: 7 }, (_, i) => {
    return addDays(todayLogicalStr, -i);
  }).reverse();

  // Level progress XP percentage
  const currentXP = profile.xp;
  const currentLevel = profile.level;
  const xpBasis = (currentLevel - 1) * 200;
  const xpNeeded = currentLevel * 200;
  const currentLevelProgress = currentXP - xpBasis;
  const levelXPNeeded = xpNeeded - xpBasis;
  const xpPercentage = Math.min(100, Math.round((currentLevelProgress / levelXPNeeded) * 100));

  return (
    <div className="space-y-6 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      
      {/* Top Header Card */}
      <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Identity Title & Progress Ring */}
          <div className="flex items-center gap-4">
            {totalCount > 0 && (
              <div className="relative flex items-center justify-center h-16 w-16 shrink-0 select-none">
                <svg className="h-16 w-16 -rotate-90">
                  <circle
                    className="text-neutral-850 stroke-[4px]"
                    fill="transparent"
                    r={24}
                    cx={32}
                    cy={32}
                  />
                  <circle
                    className="text-text-primary transition-all duration-500 ease-out stroke-[4px]"
                    strokeDasharray={2 * Math.PI * 24}
                    style={{ strokeDashoffset: (2 * Math.PI * 24) - (percentage / 100) * (2 * Math.PI * 24) }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={24}
                    cx={32}
                    cy={32}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-text-primary font-poppins leading-none">
                    {completedCount}/{totalCount}
                  </span>
                  <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    Done
                  </span>
                </div>
              </div>
            )}

            <div>
              <h1 className="text-2xl font-black font-poppins text-text-primary tracking-tight">
                Welcome, {profile.display_name}
              </h1>
              <p className="text-xs text-neutral-500 font-semibold select-none mt-0.5">
                {formatFriendlyDate(selectedDate)}, Ends at 5AM
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto select-none">
            {/* Buy Streak Shield */}
            <button
              onClick={handleBuyShield}
              disabled={profile.xp < 150}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 border border-border-primary rounded-lg text-xs font-semibold text-cyan-450 hover:border-cyan-800 hover:bg-cyan-950/20 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Shields: {profile.streak_shields} (Buy: 150 XP)</span>
            </button>
          </div>
        </div>

        {/* Level & XP Progress Indicator */}
        <div className="space-y-1.5 select-none">
          <div className="flex justify-between text-xs font-bold font-poppins text-text-primary">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              <span>Level {profile.level}</span>
            </div>
            <span className="text-neutral-400">
              {currentXP} XP <span className="text-neutral-600 font-normal">/ {xpNeeded} needed</span>
            </span>
          </div>
          
          <div className="w-full h-2 bg-bg-primary rounded border border-border-primary overflow-hidden">
            <div 
              className="h-full bg-text-primary transition-all duration-500 ease-out"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Habits Header & Quick Action */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h2 className="text-lg font-bold font-poppins text-text-primary select-none">Daily Routines</h2>
          <p className="text-xs text-neutral-500 select-none">Complete habits before 5:00 AM to keep your streak going</p>
        </div>
        
        <button
          onClick={() => setShowHabitForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-btn-primary-bg text-btn-primary-text font-extrabold text-xs rounded-lg font-poppins hover:bg-btn-primary-hover transition-colors shadow-lg cursor-pointer select-none"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Horizontal Date Picker */}
      <div className="flex gap-2 pb-2 overflow-x-auto select-none pt-1 scrollbar-none">
        {dateSwitcherRange.map(dStr => {
          const isToday = dStr === todayLogicalStr;
          const isSelected = dStr === selectedDate;
          
          const dateObj = new Date(dStr + 'T00:00:00');
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dStr.split('-')[2];
          
          return (
            <button
              key={dStr}
              onClick={() => setSelectedDate(dStr)}
              className={`flex flex-col items-center justify-center py-2 px-3.5 rounded-xl border transition-all cursor-pointer min-w-[62px] ${
                isSelected 
                  ? 'bg-btn-primary-bg border-btn-primary-bg text-btn-primary-text font-black scale-105 shadow-md' 
                  : 'bg-card-bg border-border-primary text-neutral-450 hover:border-border-hover hover:text-text-primary'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-80">
                {dayName}
              </span>
              <span className="text-sm font-black font-poppins mt-0.5">
                {dayNum}
              </span>
              {isToday && (
                <span className="text-[8px] font-bold tracking-widest uppercase mt-0.5 opacity-70">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Phase Lists */}
      <div className="space-y-6">
        {LIFE_PHASES_META.map(phase => {
          const phaseHabits = habitsByPhase[phase.id] || [];
          const PhaseIcon = phase.icon;
          
          if (phaseHabits.length === 0) return null;

          return (
            <div key={phase.id} className="space-y-3">
              {/* Phase Header */}
              <div className="flex items-center gap-2 border-b border-border-primary pb-2 select-none">
                <PhaseIcon className="h-4 w-4 text-neutral-505" />
                <h3 className="text-xs font-extrabold tracking-widest text-neutral-400 uppercase font-poppins">
                  {phase.name}
                </h3>
                <span className="text-[10px] text-neutral-600 font-medium">
                  — {phase.desc} ({phaseHabits.length} active)
                </span>
              </div>

              {/* Habit Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phaseHabits.map(habit => (
                  <HabitCard 
                    key={habit.id} 
                    habit={habit} 
                    selectedDate={selectedDate} 
                    onEditClick={() => {
                      setEditHabitId(habit.id);
                      setShowHabitForm(true);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {activeHabits.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border-primary rounded-2xl space-y-4 select-none">
            <div className="inline-flex p-4 rounded-full bg-card-bg border border-border-primary text-neutral-500">
              <Plus className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary font-poppins">No habits active</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
              </p>
            </div>
            <button
              onClick={() => {
                setEditHabitId(undefined);
                setShowHabitForm(true);
              }}
              className="px-4 py-2 border border-border-primary text-text-primary rounded-lg text-xs font-semibold hover:border-border-hover cursor-pointer"
            >
              Add Your First Habit
            </button>
          </div>
        )}
      </div>

      {/* Habit Create Form Modal */}
      {showHabitForm && (
        <HabitForm 
          editHabitId={editHabitId}
          onClose={() => {
            setShowHabitForm(false);
            setEditHabitId(undefined);
          }} 
        />
      )}
    </div>
  );
};
