import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { HabitCard } from './HabitCard';
import { HabitForm } from './HabitForm';
import { getLogicalDate, formatFriendlyDate, addDays, calculateHabitStats, isHabitScheduledForDate } from '../utils/dateUtils';
import { 
  Plus, 
  Shield, 
  Sparkles, 
  Activity,
  Briefcase,
  Brain,
  Sun,
  Sunrise,
  SunDim,
  Sunset,
  Moon,
  Compass,
  Flame,
  Droplet,
  ChevronDown,
  ChevronRight
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
  const freezes = useStore(state => state.freezes);
  const logHabit = useStore(state => state.logHabit);
  
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | undefined>(undefined);
  const [collapsedPhases, setCollapsedPhases] = useState<Record<string, boolean>>({
    all_day: false,
    phase_1: false,
    phase_2: false,
    phase_3: false,
    phase_4: false
  });

  const togglePhaseCollapse = (phaseId: string) => {
    setCollapsedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  const todayLogicalStr = getLogicalDate(new Date(), profile.day_offset_hours);
  const [selectedDate, setSelectedDate] = useState(todayLogicalStr);

  const activeHabits = habits.filter(h => !h.is_archived);
  const scheduledActiveHabits = activeHabits.filter(h => isHabitScheduledForDate(h, selectedDate));

  // If Salah Tracker is enabled, filter Salah and Water habits out of the standard cue phase lists
  const normalActiveHabits = profile.salah_tracker_enabled
    ? scheduledActiveHabits.filter(h => !h.is_salah && !h.name.toLowerCase().includes('water'))
    : scheduledActiveHabits;

  // Group habits by cue phase (using normalActiveHabits)
  const habitsByPhase = LIFE_PHASES_META.reduce((acc, phase) => {
    acc[phase.id] = normalActiveHabits.filter(h => h.cue_phase === phase.id);
    return acc;
  }, {} as Record<string, typeof normalActiveHabits>);

  // Calculate completed out of total active habits for the selectedDate
  const totalCount = scheduledActiveHabits.length;
  let completedCount = 0;
  scheduledActiveHabits.forEach(h => {
    const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
    if (log) {
      if (log.is_skipped || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
        completedCount++;
      }
    }
  });
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Salah Tracker specific state and calculations
  const allActiveSalahHabits = habits.filter(h => h.is_salah && !h.is_archived);
  
  const isSelectedFriday = new Date(selectedDate + 'T00:00:00').getDay() === 5;
  const excludePrayer = isSelectedFriday ? 'Dhuhr' : 'Jummah';
  
  const salahHabits = allActiveSalahHabits.filter(h => h.name !== excludePrayer);
  
  const salahOrder: Record<string, number> = {
    'Fajr': 1,
    'Dhuhr': 2,
    'Jummah': 2,
    'Asr': 3,
    'Maghrib': 4,
    'Isha': 5
  };
  salahHabits.sort((a, b) => (salahOrder[a.name] || 99) - (salahOrder[b.name] || 99));

  const salahStatus = salahHabits.map(h => {
    const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
    const isCompleted = log ? log.count_completed >= h.target_count : false;
    const isSkipped = log ? log.is_skipped : false;
    const isJustified = log ? log.is_justified : false;
    
    return {
      habit: h,
      isCompleted,
      isSkipped,
      isJustified
    };
  });
  
  const salahCompletedCount = salahStatus.filter(s => s.isCompleted).length;

  const handleToggleSalah = (habitId: string, isCompleted: boolean) => {
    logHabit(habitId, isCompleted ? -1 : 1, selectedDate);
  };

  const getSalahStreak = () => {
    if (allActiveSalahHabits.length === 0) return 0;
    let streak = 0;
    let checkDate = todayLogicalStr;
    
    while (true) {
      const isFridayCheck = new Date(checkDate + 'T00:00:00').getDay() === 5;
      const excludeCheck = isFridayCheck ? 'Dhuhr' : 'Jummah';
      const targetSalahs = allActiveSalahHabits.filter(h => h.name !== excludeCheck);
      
      const allCompleted = targetSalahs.length > 0 && targetSalahs.every(h => {
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === checkDate);
        return log && log.count_completed >= h.target_count;
      });
      
      const isFrozen = freezes.some(f => f.logical_date === checkDate && targetSalahs.some(sh => sh.id === f.habit_id));
      const allExcused = targetSalahs.length > 0 && targetSalahs.every(h => {
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === checkDate);
        return log && (log.is_skipped || log.is_justified);
      });
      
      if (allCompleted) {
        streak++;
      } else if (isFrozen || allExcused) {
        // Keep streak
      } else {
        if (checkDate === todayLogicalStr) {
          // Ignore today
        } else {
          break;
        }
      }
      checkDate = addDays(checkDate, -1);
    }
    return streak;
  };

  const getNextPrayer = () => {
    const now = new Date();
    const hrs = now.getHours();
    const mins = now.getMinutes();
    const totalMins = hrs * 60 + mins;
    
    const isFridayToday = now.getDay() === 5;
    const dhuhrName = isFridayToday ? 'Jummah' : 'Dhuhr';
    
    if (totalMins <= 300) return { name: 'Fajr', time: '05:00' };
    if (totalMins <= 750) return { name: dhuhrName, time: '12:30' };
    if (totalMins <= 945) return { name: 'Asr', time: '15:45' };
    if (totalMins <= 1110) return { name: 'Maghrib', time: '18:30' };
    if (totalMins <= 1200) return { name: 'Isha', time: '20:00' };
    return { name: 'Fajr', time: '05:00 (Tomorrow)' };
  };

  const salahStreak = getSalahStreak();
  const nextPrayer = getNextPrayer();

  // Water Tracker specific calculations
  const waterHabit = activeHabits.find(h => h.name.toLowerCase().includes('water'));
  const waterLog = waterHabit ? logs.find(l => l.habit_id === waterHabit.id && l.logical_date === selectedDate) : null;
  const waterCount = waterLog?.count_completed ?? 0;
  
  const getWaterStreak = () => {
    if (!waterHabit) return 0;
    const stats = calculateHabitStats(waterHabit, logs, freezes, profile.day_offset_hours);
    return stats.currentStreak;
  };
  const waterStreak = getWaterStreak();

  const dateSwitcherRange = Array.from({ length: 7 }, (_, i) => {
    return addDays(todayLogicalStr, -i);
  });

  const salahLast7Days = dateSwitcherRange.map(dStr => {
    const dayName = new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' });
    const isFridayDay = new Date(dStr + 'T00:00:00').getDay() === 5;
    const excludeDay = isFridayDay ? 'Dhuhr' : 'Jummah';
    const dayTargetHabits = allActiveSalahHabits.filter(h => h.name !== excludeDay);
    
    const dayCompleted = dayTargetHabits.length > 0 && dayTargetHabits.every(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dStr);
      return log && log.count_completed >= h.target_count;
    });
    const dayCompletedCount = dayTargetHabits.filter(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dStr);
      return log && log.count_completed >= h.target_count;
    }).length;
    
    return {
      dateStr: dStr,
      dayName,
      dayCompleted,
      dayCompletedCount
    };
  }).reverse();



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
                    className="text-neutral-200 dark:text-neutral-800 stroke-[4px]"
                    fill="transparent"
                    stroke="currentColor"
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
                    stroke="currentColor"
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
            <div className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-900/50 border border-border-primary rounded-lg text-xs font-bold text-cyan-400 uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 fill-cyan-400/20" />
              <span>Shields: {profile.streak_shields}</span>
            </div>
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

          // Calculate consistency stats for this specific day
          let dayCompletedCount = 0;
          let dayTotalCount = 0;
          const dayHasFreeze = freezes.some(f => f.logical_date === dStr);
          let dayHasSkip = false;
          let dayHasJustified = false;

          activeHabits.forEach(h => {
            const log = logs.find(l => l.habit_id === h.id && l.logical_date === dStr);
            dayTotalCount++;
            if (log) {
              if (log.is_skipped) dayHasSkip = true;
              if (log.is_justified) dayHasJustified = true;
              if (log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
                dayCompletedCount++;
              }
            }
          });
          
          const dayPercentage = dayTotalCount > 0 ? (dayCompletedCount / dayTotalCount) : 0;
          
          return (
            <button
              key={dStr}
              onClick={() => setSelectedDate(dStr)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl border transition-all cursor-pointer min-w-[62px] ${
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
              {/* Daily Completion Visual Indicator */}
              {dayTotalCount > 0 && (
                <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden border border-border-primary/20 shrink-0">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      dayPercentage === 1
                        ? 'bg-amber-400'
                        : dayHasFreeze
                        ? 'bg-sky-400'
                        : dayHasSkip
                        ? 'bg-amber-600'
                        : dayHasJustified
                        ? 'bg-purple-550'
                        : isSelected
                        ? 'bg-btn-primary-text'
                        : 'bg-text-primary opacity-60'
                    }`}
                    style={{ width: `${dayPercentage * 100}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Salah Tracker Section */}
      {profile.salah_tracker_enabled && salahHabits.length > 0 && (
        <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-text-primary shrink-0">
                <Compass className="h-5 w-5 animate-pulse text-amber-500 fill-amber-500/10" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                  Salah Tracker
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold tracking-wide mt-1 uppercase flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500/20" />
                  <span>Streak: {salahStreak} {salahStreak === 1 ? 'day' : 'days'} • Next: {nextPrayer.name} at {nextPrayer.time}</span>
                </p>
              </div>
            </div>

            <div className="text-[10px] text-right font-bold text-neutral-400 uppercase tracking-widest self-stretch sm:self-auto flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-border-primary/50 pt-2 sm:pt-0">
              <span className="sm:hidden">Daily Progress</span>
              <span className="text-emerald-500 font-black">{salahCompletedCount}/5 Completed</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-800 border border-border-primary overflow-hidden select-none">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${(salahCompletedCount / 5) * 100}%` }}
            />
          </div>

          {/* Horizontal Clickable Prayers List */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-4 pt-1">
            {salahStatus.map(s => {
              const isCompleted = s.isCompleted;
              const name = s.habit.name;
              
              const detailsMap: Record<string, { icon: React.ReactNode, time: string }> = {
                'Fajr': { icon: <Sunrise className="h-5 w-5" />, time: '05:00' },
                'Dhuhr': { icon: <Sun className="h-5 w-5" />, time: '12:30' },
                'Jummah': { icon: <Sun className="h-5 w-5" />, time: '12:30' },
                'Asr': { icon: <SunDim className="h-5 w-5" />, time: '15:45' },
                'Maghrib': { icon: <Sunset className="h-5 w-5" />, time: '18:30' },
                'Isha': { icon: <Moon className="h-5 w-5" />, time: '20:00' }
              };
              
              const detail = detailsMap[name] || { icon: <Compass className="h-5 w-5" />, time: '--:--' };
              
              return (
                <button
                  key={s.habit.id}
                  onClick={() => handleToggleSalah(s.habit.id, isCompleted)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isCompleted 
                      ? 'bg-amber-400 border-amber-400 text-bg-primary font-black scale-[1.02] shadow-md'
                      : 'bg-card-bg border-border-primary text-text-primary hover:border-border-hover'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg mb-1.5 ${isCompleted ? 'bg-bg-primary/20 text-bg-primary' : 'text-neutral-500'}`}>
                    {detail.icon}
                  </div>
                  <span className="text-xs font-black font-poppins">{name}</span>
                  <span className={`text-[9px] mt-0.5 tracking-wider ${isCompleted ? 'text-bg-primary/70 font-semibold' : 'text-neutral-500 font-medium'}`}>
                    {detail.time}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Salah Weekly Spark Tracker */}
          <div className="border-t border-border-primary/50 pt-3 flex items-center justify-between select-none">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Weekly Tracking</span>
            <div className="flex gap-1.5">
              {salahLast7Days.map(day => (
                <div 
                  key={day.dateStr}
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                    day.dayCompleted
                      ? 'bg-amber-400 border-amber-400 text-bg-primary font-bold'
                      : day.dayCompletedCount > 0
                      ? 'border-amber-405/50 text-amber-500 bg-amber-500/10'
                      : 'border-border-primary text-neutral-500 bg-card-bg'
                  }`}
                  title={`${day.dateStr}: ${day.dayCompletedCount}/5 completed`}
                >
                  {day.dayName}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}      {/* Water Tracker Section */}
      {profile.salah_tracker_enabled && waterHabit && (
        <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 select-none">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-text-primary shrink-0">
                <Droplet className="h-5 w-5 animate-pulse text-sky-500 fill-sky-500/10" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                  Water Tracker
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold tracking-wide mt-1 uppercase flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-red-500 fill-red-500/20" />
                  <span>Streak: {waterStreak} {waterStreak === 1 ? 'day' : 'days'} • Target: {waterHabit.target_count} L</span>
                </p>
              </div>
            </div>

            <div className="text-[10px] text-right font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest self-stretch sm:self-auto flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-border-primary/50 pt-2 sm:pt-0">
              <span className="sm:hidden">Intake Goal</span>
              <span className="text-sky-500 font-black">{waterCount} / {waterHabit.target_count} L</span>
            </div>
          </div>

          {/* Polished Intake Progress & Controls split layout */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 select-none">
            {/* Left: Circular progress ring */}
            <div className="md:col-span-2 flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-border-primary/50 rounded-xl">
              <div className="relative flex items-center justify-center h-16 w-16 shrink-0 select-none">
                <svg className="h-16 w-16 -rotate-90">
                  <circle
                    className="text-neutral-200 dark:text-neutral-800 stroke-[4.5px]"
                    fill="transparent"
                    stroke="currentColor"
                    r={26}
                    cx={32}
                    cy={32}
                  />
                  <circle
                    className="text-sky-500 transition-all duration-500 ease-out stroke-[4.5px] drop-shadow-[0_0_3px_rgba(14,165,233,0.25)]"
                    strokeDasharray={2 * Math.PI * 26}
                    style={{ strokeDashoffset: (2 * Math.PI * 26) - (Math.min(100, (waterCount / waterHabit.target_count) * 100) / 100) * (2 * Math.PI * 26) }}
                    strokeLinecap="round"
                    fill="transparent"
                    stroke="currentColor"
                    r={26}
                    cx={32}
                    cy={32}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-text-primary font-poppins leading-none">
                    {Math.round((waterCount / waterHabit.target_count) * 100)}%
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <h4 className="text-[9px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Hydration Level</h4>
                <div className="text-base font-extrabold text-text-primary font-poppins leading-none">
                  {waterCount} L <span className="text-neutral-500 text-xs font-normal">/ {waterHabit.target_count} L</span>
                </div>
                <p className="text-[9px] text-neutral-600 dark:text-neutral-400 font-semibold uppercase tracking-wide mt-1">
                  {waterCount >= waterHabit.target_count ? 'Goal Completed! 🎉' : `${(waterHabit.target_count - waterCount).toFixed(2)}L Left`}
                </p>
              </div>
            </div>

            {/* Right: Tactile Quick Adjust buttons */}
            <div className="md:col-span-3 flex flex-col justify-center gap-2">
              <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                Fluid Intake Logs
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    if (waterCount > 0) logHabit(waterHabit.id, -0.25, selectedDate);
                  }}
                  disabled={waterCount === 0}
                  className="h-10 border border-border-primary hover:border-red-900/30 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  title="Remove 250ml"
                >
                  - 250ml
                </button>
                <button
                  onClick={() => logHabit(waterHabit.id, 0.25, selectedDate)}
                  className="h-10 border border-border-primary hover:border-sky-500 hover:bg-sky-950/10 text-text-primary rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Add 250ml Cup"
                >
                  <span className="text-[10px] font-black">+ 0.25L</span>
                  <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider">Cup</span>
                </button>
                <button
                  onClick={() => logHabit(waterHabit.id, 0.5, selectedDate)}
                  className="h-10 border border-border-primary hover:border-sky-500 hover:bg-sky-950/10 text-text-primary rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Add 500ml Bottle"
                >
                  <span className="text-[10px] font-black">+ 0.5L</span>
                  <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider">Bottle</span>
                </button>
                <button
                  onClick={() => logHabit(waterHabit.id, 1, selectedDate)}
                  className="h-10 border border-border-primary hover:border-sky-500 hover:bg-sky-950/10 text-text-primary rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer"
                  title="Add 1 Liter Jug"
                >
                  <span className="text-[10px] font-black">+ 1.0L</span>
                  <span className="text-[7px] text-neutral-500 font-bold uppercase tracking-wider">Jug</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phase Lists */}
      <div className="space-y-6">
        {LIFE_PHASES_META.map(phase => {
          const phaseHabits = habitsByPhase[phase.id] || [];
          const PhaseIcon = phase.icon;
          
          if (phaseHabits.length === 0) return null;

          const isCollapsed = collapsedPhases[phase.id];

          // Calculate breakdown metrics
          let completed = 0;
          let frozen = 0;
          let justified = 0;
          let pending = 0;

          phaseHabits.forEach(h => {
            const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
            const isFrozen = freezes.some(f => f.logical_date === selectedDate && f.habit_id === h.id);
            
            if (isFrozen) {
              frozen++;
            } else if (log) {
              if (log.is_skipped) {
                completed++;
              } else if (log.is_justified) {
                justified++;
              } else if (log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
                completed++;
              } else {
                pending++;
              }
            } else {
              pending++;
            }
          });

          return (
            <div key={phase.id} className="space-y-3">
              {/* Collapsible Phase Header */}
              <div 
                onClick={() => togglePhaseCollapse(phase.id)}
                className="flex items-center justify-between border-b border-border-primary pb-2 select-none cursor-pointer group hover:border-border-hover transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-text-primary shrink-0 transition-all group-hover:scale-105">
                    <PhaseIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black tracking-wider text-text-primary uppercase font-poppins leading-none flex items-center gap-1.5">
                      {phase.name}
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-neutral-500" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-neutral-500" />
                      )}
                    </h3>
                    <p className="text-[9px] text-neutral-500 font-semibold tracking-wider uppercase mt-1 leading-none">
                      {phase.desc}
                    </p>
                  </div>
                </div>

                {/* Breakdown badges */}
                <div className="flex items-center gap-1.5 select-none">
                  {completed > 0 && (
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {completed} done
                    </span>
                  )}
                  {frozen > 0 && (
                    <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {frozen} frozen
                    </span>
                  )}
                  {justified > 0 && (
                    <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {justified} excused
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                      {pending} left
                    </span>
                  )}
                  <span className="text-[9px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-border-primary text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none">
                    {phaseHabits.length} {phaseHabits.length === 1 ? 'routine' : 'routines'}
                  </span>
                </div>
              </div>

              {/* Habit Cards Grid (rendered only if NOT collapsed) */}
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
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
              )}
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
