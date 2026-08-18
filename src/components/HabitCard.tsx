import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  calculateHabitStats, 
  type Habit, 
  getLogicalDate, 
  addDays, 
  getDatesRange 
} from '../utils/dateUtils';
import * as Icons from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  selectedDate?: string;
  onEditClick?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, selectedDate, onEditClick }) => {
  const logHabit = useStore(state => state.logHabit);
  const toggleSkip = useStore(state => state.toggleSkip);
  const archiveHabit = useStore(state => state.archiveHabit);
  const profile = useStore(state => state.profile);
  const logs = useStore(state => state.logs);
  const freezes = useStore(state => state.freezes);
  const categories = useStore(state => state.categories);
  const useStreakFreeze = useStore(state => state.useStreakFreeze);

  const [isExpanded, setIsExpanded] = useState(false);

  const stats = calculateHabitStats(habit, logs, freezes, profile.day_offset_hours);
  const todayStr = getLogicalDate(new Date(), profile.day_offset_hours);
  const activeDateStr = selectedDate || todayStr;
  
  const todayLog = logs.find(l => l.habit_id === habit.id && l.logical_date === activeDateStr);
  const activeCount = todayLog ? todayLog.count_completed : 0;
  
  const activeStatus = stats.history[activeDateStr]?.status || 'pending';
  
  const category = categories.find(c => c.id === habit.category_id);

  const handleIncrement = () => {
    logHabit(habit.id, 1, activeDateStr);
  };

  const handleDecrement = () => {
    if (activeCount > 0) {
      logHabit(habit.id, -1, activeDateStr);
    }
  };

  const handleToggleSingle = () => {
    const isDone = activeStatus === 'completed';
    logHabit(habit.id, isDone ? -1 : 1, activeDateStr);
  };

  const handleToggleMin = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMinMet = activeCount >= habit.min_version_count;
    logHabit(habit.id, isMinMet ? -activeCount : habit.min_version_count - activeCount, activeDateStr);
  };

  const handleFreeze = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Use 1 Streak Shield to freeze your streak for ${activeDateStr}?`)) {
      useStreakFreeze(activeDateStr);
    }
  };

  const handleToggleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSkip(habit.id, activeDateStr);
  };

  const getIcon = (iconName: string, className: string = 'h-5 w-5') => {
    const IconComponent = (Icons as any)[iconName] || Icons.Check;
    return <IconComponent className={className} />;
  };

  const renderActionSection = () => {
    if (activeStatus === 'skipped') {
      return (
        <div className="h-12 flex items-center justify-center text-xs font-bold text-amber-505 select-none uppercase tracking-widest border border-amber-900/50 bg-amber-950/20 px-4 rounded-xl">
          Skipped
        </div>
      );
    }
    
    if (habit.type === 'single_tick') {
      const isDone = activeStatus === 'completed';
      return (
        <button
          onClick={handleToggleSingle}
          className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            isDone 
              ? 'bg-btn-primary-bg border-btn-primary-bg text-btn-primary-text glow-green scale-105' 
              : 'bg-bg-primary border-border-primary text-neutral-500 hover:border-border-hover hover:text-text-primary'
          }`}
        >
          {isDone ? <Icons.Check className="h-6 w-6 stroke-[3px]" /> : <Icons.Circle className="h-5 w-5" />}
        </button>
      );
    } else {
      // Frequency completion view
      const pct = Math.min(100, Math.round((activeCount / habit.target_count) * 100));
      return (
        <div className="flex items-center gap-3 select-none">
          {/* Decrement */}
          <button
            onClick={handleDecrement}
            disabled={activeCount === 0}
            className="h-8 w-8 rounded-lg border border-border-primary text-neutral-400 hover:border-border-hover hover:text-text-primary flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <Icons.Minus className="h-4 w-4" />
          </button>
          
          {/* Progress */}
          <div className="text-center min-w-[50px]">
            <div className="text-sm font-extrabold text-text-primary font-poppins">
              {activeCount} <span className="text-neutral-500 text-xs font-normal">/ {habit.target_count}</span>
            </div>
            <div className="text-[10px] text-neutral-500 font-bold tracking-wider mt-0.5">
              {pct}%
            </div>
          </div>

          {/* Increment */}
          <button
            onClick={handleIncrement}
            className="h-8 w-8 rounded-lg border border-border-primary text-text-primary bg-card-bg hover:border-border-hover flex items-center justify-center transition-colors cursor-pointer"
          >
            <Icons.Plus className="h-4 w-4" />
          </button>
        </div>
      );
    }
  };

  // Generate date history for the last 14 days
  const last14Days = getDatesRange(addDays(todayStr, -13), todayStr);

  return (
    <div className={`cred-card rounded-xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-border-hover' : ''}`}>
      {/* Clickable Header Container */}
      <div 
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Habit description & Identity */}
        <div className="space-y-2 flex-1 min-w-0">
          {/* Top details: Category & Cue Phase */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wider text-neutral-500 uppercase select-none">
            {category && (
              <span 
                className="flex items-center gap-1 px-2 py-0.5 rounded border"
                style={{ borderColor: `${category.color}30`, color: category.color }}
              >
                {getIcon(category.icon, 'h-3 w-3')}
                {category.name}
              </span>
            )}
            <span className="bg-card-bg border border-border-primary px-2 py-0.5 rounded text-neutral-400">
              {habit.cue_phase === 'all_day' ? 'All Day' : habit.cue_phase.replace('_', ' ')}
            </span>
          </div>

          {/* Identity & Name */}
          <div>
            <div className="text-xs text-neutral-400 font-medium italic">
              Becoming {habit.identity}
            </div>
            <h3 className="text-base font-extrabold tracking-tight text-text-primary mt-0.5 font-poppins truncate flex items-center gap-1.5">
              {habit.name}
              <Icons.ChevronDown className={`h-4 w-4 text-neutral-600 shrink-0 transition-transform ${isExpanded ? 'rotate-185 text-text-primary' : ''}`} />
            </h3>
          </div>

          {/* Bottom Details: Streaks, Min-Versions & Freezes */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Flame streak count */}
            <div 
              className={`flex items-center gap-1 text-xs font-bold font-poppins ${
                stats.statusToday === 'frozen' 
                  ? 'text-cyan-400' 
                  : stats.statusToday === 'skipped'
                  ? 'text-amber-500'
                  : stats.completedToday || stats.minCompletedToday
                  ? 'text-text-primary' 
                  : 'text-neutral-500'
              }`}
            >
              {stats.statusToday === 'frozen' ? (
                <Icons.Shield className="h-3.5 w-3.5" />
              ) : stats.statusToday === 'skipped' ? (
                <Icons.Ban className="h-3.5 w-3.5" />
              ) : (
                <Icons.Flame className="h-3.5 w-3.5" />
              )}
              <span>{stats.currentStreak} day streak</span>
              {stats.bestStreak > stats.currentStreak && (
                <span className="text-[10px] text-neutral-600 font-normal ml-1">
                  (best {stats.bestStreak})
                </span>
              )}
            </div>

            {/* Minimum version safety net */}
            {habit.min_version_enabled && (
              <button
                onClick={handleToggleMin}
                disabled={stats.statusToday === 'skipped'}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                  stats.completedToday
                    ? 'bg-card-bg border-border-primary text-neutral-500 pointer-events-none'
                    : stats.minCompletedToday
                    ? 'bg-card-bg border-border-hover text-text-primary'
                    : 'bg-bg-primary border-border-primary text-neutral-500 hover:border-border-hover hover:text-text-primary'
                }`}
                title={`Safety net version: ${habit.min_version_description}`}
              >
                <Icons.Heart className="h-3 w-3" />
                <span>Min: {habit.min_version_description}</span>
              </button>
            )}

            {/* Skip Toggle */}
            <button
              onClick={handleToggleSkip}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                activeStatus === 'skipped'
                  ? 'bg-amber-950/20 border-amber-900 text-amber-500 hover:border-amber-600'
                  : 'bg-bg-primary border-border-primary text-neutral-500 hover:border-border-hover hover:text-text-primary'
              }`}
              title="Skip this habit today without breaking your streak"
            >
              <Icons.Ban className="h-3.5 w-3" />
              <span>{activeStatus === 'skipped' ? 'Skipped' : 'Skip'}</span>
            </button>

            {/* Action to freeze if pending / missed */}
            {activeStatus === 'missed' && profile.streak_shields > 0 && (
              <button
                onClick={handleFreeze}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-cyan-900 text-cyan-500 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-600 transition-all cursor-pointer"
              >
                <Icons.Shield className="h-3.5 w-3.5" />
                <span>Freeze</span>
              </button>
            )}
          </div>
        </div>

        {/* Completion Control */}
        <div 
          onClick={e => e.stopPropagation()} 
          className="shrink-0 flex flex-col items-end justify-center gap-2"
        >
          {renderActionSection()}
          
          {/* Archive Action */}
          <button 
            onClick={() => {
              if (confirm(`Archive habit: "${habit.name}"?`)) {
                archiveHabit(habit.id);
              }
            }}
            className="text-neutral-700 hover:text-red-500 text-[10px] uppercase font-bold tracking-wider pt-1 hover:underline select-none cursor-pointer"
          >
            Archive
          </button>
        </div>
      </div>

      {/* Expanded Accordion: Habit-Specific Heatmap */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2.5 border-t border-border-primary bg-card-bg/20 space-y-3 select-none animate-fadeIn">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Personal Consistency (Last 14 Days)
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 max-w-sm">
            {last14Days.map(dateStr => {
              const dayStatus = stats.history[dateStr]?.status || 'missed';
              
              let boxClass = 'bg-bg-primary border border-border-primary';
              let numClass = 'text-neutral-600';
              let textTitle = `${dateStr}: Pending / Missed`;
              
              if (dayStatus === 'completed') {
                boxClass = 'bg-btn-primary-bg border-btn-primary-bg';
                numClass = 'text-btn-primary-text';
                textTitle = `${dateStr}: Completed`;
              } else if (dayStatus === 'min_version') {
                boxClass = 'bg-card-bg border border-border-hover';
                numClass = 'text-text-primary';
                textTitle = `${dateStr}: Safety Net Completed`;
              } else if (dayStatus === 'frozen') {
                boxClass = 'bg-bg-primary border border-cyan-800';
                numClass = 'text-cyan-500';
                textTitle = `${dateStr}: Streak Frozen`;
              } else if (dayStatus === 'skipped') {
                boxClass = 'bg-bg-primary border border-dashed border-amber-900';
                numClass = 'text-amber-500';
                textTitle = `${dateStr}: Skipped`;
              }
              
              const dayNum = dateStr.split('-')[2];
              
              return (
                <div 
                  key={dateStr}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition-all hover:scale-105 cursor-help ${boxClass}`}
                  title={textTitle}
                >
                  <span className={numClass}>{dayNum}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-border-primary/50">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-bold tracking-wider text-neutral-600 uppercase select-none">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-bg-primary border border-border-primary" /> Missed</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-bg-primary border border-cyan-800" /> Frozen</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-bg-primary border border-dashed border-amber-900" /> Skipped</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-card-bg border border-border-hover" /> Safety Net</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-btn-primary-bg border border-btn-primary-bg" /> Complete</span>
            </div>

            {onEditClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick();
                }}
                className="text-neutral-500 hover:text-text-primary text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 hover:underline select-none cursor-pointer"
              >
                <Icons.Pencil className="h-3 w-3" />
                Edit Habit
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
