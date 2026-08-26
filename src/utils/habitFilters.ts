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
