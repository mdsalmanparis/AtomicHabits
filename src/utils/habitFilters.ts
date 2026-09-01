import { getLogicalDate, isHabitScheduledForDate } from './dateUtils';
import type { Habit, HabitLog, StreakFreeze } from './dateUtils';

export type HabitFilterType = 'all' | 'uncompleted' | 'completed_strict' | 'failing';

export interface FilterOption {
  value: HabitFilterType;
  label: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Routines' },
  { value: 'uncompleted', label: 'Incomplete' },
  { value: 'completed_strict', label: 'Completed Only' },
  { value: 'failing', label: 'Failing Focus' }
];

/**
 * Calculates the failure rate of a habit from its creation date up to yesterday.
 */
export function calculateHabitFailureRate(
  habit: Habit,
  logs: HabitLog[],
  freezes: StreakFreeze[],
  dayOffsetHours: number
): number {
  const estDate = new Date('2026-08-18T00:00:00');
  const creationDate = new Date(habit.created_at);
  const startDate = creationDate > estDate ? creationDate : estDate;
  
  let activeDaysCount = 0;
  let missedDaysCount = 0;
  
  const current = new Date();
  current.setDate(current.getDate() - 1); // Exclude today
  
  while (true) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (dateStr < getLogicalDate(startDate, dayOffsetHours)) break;
    
    if (isHabitScheduledForDate(habit, dateStr)) {
      activeDaysCount++;
      const log = logs.find(l => l.habit_id === habit.id && l.logical_date === dateStr);
      const hasFreeze = freezes.some(f => f.habit_id === habit.id && f.logical_date === dateStr);
      
      if (log) {
        const count = Number(log.count_completed);
        const target = Number(habit.target_count);
        const minVal = habit.min_version_enabled ? Number(habit.min_version_count) : target;
        const completed = count >= target || (habit.min_version_enabled && count >= minVal);
        if (!completed && !hasFreeze) missedDaysCount++;
      } else if (!hasFreeze) {
        missedDaysCount++;
      }
    }
    current.setDate(current.getDate() - 1);
  }
  
  return activeDaysCount > 0 ? (missedDaysCount / activeDaysCount) * 100 : 0;
}

/**
 * Filters a list of habits according to the selected filter type.
 */
export function filterHabits(
  habits: Habit[],
  filterType: HabitFilterType,
  selectedDate: string,
  logs: HabitLog[],
  freezes: StreakFreeze[],
  dayOffsetHours: number
): Habit[] {
  if (filterType === 'all') {
    return habits;
  }

  return habits.filter(habit => {
    const log = logs.find(l => l.habit_id === habit.id && l.logical_date === selectedDate);
    const isFrozen = freezes.some(f => f.logical_date === selectedDate && f.habit_id === habit.id);

    if (filterType === 'uncompleted') {
      // Uncompleted includes everything that is NOT completed (either normal target or safety net target),
      // and also not skipped or justified.
      const completed = log && (log.is_skipped || log.is_justified || log.count_completed >= habit.target_count || (habit.min_version_enabled && log.is_minimum_version));
      return !completed && !isFrozen;
    }

    if (filterType === 'completed_strict') {
      // Completed only (should NOT show Frozen/skipped/Justified)
      if (isFrozen || !log || log.is_skipped || log.is_justified) {
        return false;
      }
      return log.count_completed >= habit.target_count;
    }

    if (filterType === 'failing') {
      // Failing focus: failure rate is above 25%
      const rate = calculateHabitFailureRate(habit, logs, freezes, dayOffsetHours);
      return rate >= 25;
    }

    return true;
  });
}

export interface SubHabit {
  id: string;
  name: string;
}

export interface RecoveryData {
  is_recovery: boolean;
  sub_habits: SubHabit[];
  recovery_start_date: string;
  original_target_count: number;
}

export function getRecoveryData(habit: Habit): RecoveryData | null {
  if (!habit.min_version_enabled || !habit.min_version_description) return null;
  const desc = habit.min_version_description.trim();
  if (desc.startsWith('{') && desc.endsWith('}')) {
    try {
      const parsed = JSON.parse(desc);
      if (parsed && parsed.is_recovery) {
        return parsed as RecoveryData;
      }
    } catch (e) {
      // ignore
    }
  }
  return null;
}

export function encodeSubHabitCompletions(completedIndices: number[]): number {
  const count = completedIndices.length;
  let bitmask = 0;
  completedIndices.forEach(idx => {
    bitmask += Math.pow(2, idx);
  });
  return count + (bitmask / 1000);
}

export function decodeSubHabitCompletions(countCompleted: number): { count: number; completedIndices: number[] } {
  const count = Math.floor(countCompleted);
  const bitmask = Math.round((countCompleted - count) * 1000);
  const completedIndices: number[] = [];
  for (let i = 0; i < 10; i++) {
    if ((bitmask & (1 << i)) !== 0) {
      completedIndices.push(i);
    }
  }
  return { count, completedIndices };
}

export function isEligibleForRecovery(
  habit: Habit,
  logs: HabitLog[],
  freezes: StreakFreeze[],
  _dayOffsetHours: number
): boolean {
  if (habit.is_archived || habit.is_salah || habit.name.toLowerCase().includes('water')) return false;
  if (getRecoveryData(habit)) return false;

  const creationDateStr = habit.created_at ? habit.created_at.slice(0, 10) : '';
  let consecutiveFails = 0;
  
  const checkDate = new Date();
  checkDate.setDate(checkDate.getDate() - 1);
  let daysChecked = 0;

  while (daysChecked < 30 && consecutiveFails < 3) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (creationDateStr && dateStr < creationDateStr) {
      break;
    }

    if (isHabitScheduledForDate(habit, dateStr)) {
      const log = logs.find(l => l.habit_id === habit.id && l.logical_date === dateStr);
      const hasFreeze = freezes.some(f => f.habit_id === habit.id && f.logical_date === dateStr);

      if (!hasFreeze) {
        const isCompleted = log && (
          log.count_completed >= habit.target_count || 
          (habit.min_version_enabled && log.is_minimum_version)
        );
        if (!isCompleted) {
          consecutiveFails++;
        } else {
          break;
        }
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
    daysChecked++;
  }

  return consecutiveFails >= 3;
}

export function getRecoveryStats(
  habit: Habit,
  logs: HabitLog[],
  freezes: StreakFreeze[],
  dayOffsetHours: number
) {
  const recData = getRecoveryData(habit);
  if (!recData) return null;

  const startDateStr = recData.recovery_start_date;
  const todayLogical = getLogicalDate(new Date(), dayOffsetHours);

  let beforeScheduledDays = 0;
  let beforeCompletedDays = 0;
  
  let checkDate = new Date(startDateStr + 'T00:00:00');
  checkDate.setDate(checkDate.getDate() - 1);
  let daysChecked = 0;

  while (daysChecked < 60 && beforeScheduledDays < 14) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (isHabitScheduledForDate(habit, dateStr)) {
      beforeScheduledDays++;
      const log = logs.find(l => l.habit_id === habit.id && l.logical_date === dateStr);
      const hasFreeze = freezes.some(f => f.habit_id === habit.id && f.logical_date === dateStr);
      if (!hasFreeze && log) {
        const isCompleted = log.count_completed >= recData.original_target_count || log.is_minimum_version;
        if (isCompleted) beforeCompletedDays++;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
    daysChecked++;
  }

  let duringScheduledDays = 0;
  let duringCompletedDays = 0;
  let currentStreak = 0;
  let streakIntact = true;

  checkDate = new Date(startDateStr + 'T00:00:00');
  
  while (true) {
    const year = checkDate.getFullYear();
    const month = String(checkDate.getMonth() + 1).padStart(2, '0');
    const day = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    if (dateStr >= todayLogical) break;

    if (isHabitScheduledForDate(habit, dateStr)) {
      duringScheduledDays++;
      const log = logs.find(l => l.habit_id === habit.id && l.logical_date === dateStr);
      const hasFreeze = freezes.some(f => f.habit_id === habit.id && f.logical_date === dateStr);
      
      let isCompleted = false;
      if (log) {
        isCompleted = log.count_completed >= habit.target_count;
      }

      if (isCompleted || hasFreeze) {
        duringCompletedDays++;
        if (streakIntact) currentStreak++;
      } else {
        streakIntact = false;
        currentStreak = 0;
      }
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  const todayLog = logs.find(l => l.habit_id === habit.id && l.logical_date === todayLogical);
  if (todayLog && todayLog.count_completed >= habit.target_count) {
    if (streakIntact) currentStreak++;
  }

  const beforeRate = beforeScheduledDays > 0 ? Math.round((beforeCompletedDays / beforeScheduledDays) * 100) : 0;
  const duringRate = duringScheduledDays > 0 ? Math.round((duringCompletedDays / duringScheduledDays) * 100) : 0;

  return {
    beforeRate,
    duringRate,
    currentStreak,
    daysInRecovery: duringScheduledDays
  };
}
