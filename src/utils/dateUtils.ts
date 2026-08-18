/**
 * Date and Streak calculation utilities tailored for Custom Day Boundaries (Night Shift)
 */

export function getLogicalDate(date: Date = new Date(), offsetHours: number = 5): string {
  const localTime = new Date(date.getTime());
  // Shift local time back by offsetHours
  localTime.setHours(localTime.getHours() - offsetHours);
  
  const year = localTime.getFullYear();
  const month = String(localTime.getMonth() + 1).padStart(2, '0');
  const day = String(localTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

export function getDatesRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let current = startDateStr;
  while (current <= endDateStr) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export interface Habit {
  id: string;
  identity: string;
  name: string;
  category_id?: string;
  icon: string;
  type: 'single_tick' | 'frequency';
  target_count: number;
  frequency_unit: string;
  cue_phase: string;
  min_version_enabled: boolean;
  min_version_description?: string;
  min_version_count: number;
  xp_reward: number;
  streak_count: number;
  best_streak: number;
  is_archived: boolean;
  created_at: string;
}

export interface HabitLog {
  habit_id: string;
  logical_date: string;
  count_completed: number;
  is_minimum_version: boolean;
  is_skipped?: boolean;
  xp_earned: number;
}

export interface StreakFreeze {
  logical_date: string;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completedToday: boolean;
  completedYesterday: boolean;
  minCompletedToday: boolean;
  statusToday: 'completed' | 'min_version' | 'frozen' | 'skipped' | 'pending' | 'missed';
  completionRate: number; // last 30 days percentage
  history: Record<string, { count: number; status: 'completed' | 'min_version' | 'frozen' | 'skipped' | 'missed' }>;
}

/**
 * Calculates current/best streaks and full history status.
 * Evaluates backwards from today's logical date.
 */
export function calculateHabitStats(
  habit: Habit,
  logs: HabitLog[],
  freezes: StreakFreeze[],
  dayOffset: number = 5
): HabitStats {
  const todayStr = getLogicalDate(new Date(), dayOffset);
  const yesterdayStr = addDays(todayStr, -1);
  
  // Index logs and freezes by logical date for O(1) lookups
  const logsMap = new Map<string, HabitLog>();
  logs.forEach(l => {
    if (l.habit_id === habit.id) {
      logsMap.set(l.logical_date, l);
    }
  });
  
  const freezesSet = new Set<string>(freezes.map(f => f.logical_date));
  
  const creationDateStr = habit.created_at.split('T')[0];
  const allDates = getDatesRange(creationDateStr, todayStr);
  
  const history: HabitStats['history'] = {};
  
  allDates.forEach(dateStr => {
    const log = logsMap.get(dateStr);
    const hasFreeze = freezesSet.has(dateStr);
    
    let status: 'completed' | 'min_version' | 'frozen' | 'skipped' | 'missed' = 'missed';
    let count = 0;
    
    if (log) {
      count = log.count_completed;
      const target = habit.target_count;
      const minCount = habit.min_version_enabled ? habit.min_version_count : target;
      
      if (log.is_skipped) {
        status = 'skipped';
      } else if (count >= target) {
        status = 'completed';
      } else if (habit.min_version_enabled && count >= minCount) {
        status = 'min_version';
      } else if (hasFreeze) {
        status = 'frozen';
      } else {
        status = 'missed';
      }
    } else if (hasFreeze) {
      status = 'frozen';
    }
    
    history[dateStr] = { count, status };
  });

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  
  // Sort all logical dates from creation to yesterday (or today if completed)
  const sortedDates = [...allDates].sort();
  
  // We evaluate streaks day by day from the start
  sortedDates.forEach(dateStr => {
    const status = history[dateStr]?.status || 'missed';
    
    if (status === 'completed' || status === 'min_version') {
      tempStreak++;
    } else if (status === 'frozen' || status === 'skipped') {
      // Streak is frozen/skipped - it maintains the current count, does not reset, does not increment
    } else {
      // It's a miss
      if (dateStr !== todayStr) {
        // If it's missed today, we don't break the streak *yet* until the day ends
        tempStreak = 0;
      }
    }
    
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
  });
  
  // Current streak calculation (looking backwards from today/yesterday)
  let checkDate = todayStr;
  const todayStatus = history[todayStr]?.status || 'missed';
  
  // If not completed today, check if yesterday was completed/frozen/skipped
  if (todayStatus === 'missed' || todayStatus === 'frozen' || todayStatus === 'skipped') {
    checkDate = yesterdayStr;
  }
  
  currentStreak = 0;
  let streakBroken = false;
  
  while (!streakBroken && checkDate >= creationDateStr) {
    const status = history[checkDate]?.status || 'missed';
    
    if (status === 'completed' || status === 'min_version') {
      currentStreak++;
    } else if (status === 'frozen' || status === 'skipped') {
      // ignore, does not count as completed, but does not break streak
    } else {
      // If we check checkDate = todayStr and it's missed, we don't break it yet
      if (checkDate === todayStr) {
        // skip breaking
      } else {
        streakBroken = true;
      }
    }
    checkDate = addDays(checkDate, -1);
  }
  
  // Completion rate (last 30 days)
  let completions30 = 0;
  let checkDate30 = todayStr;
  for (let i = 0; i < 30; i++) {
    const status = history[checkDate30]?.status || 'missed';
    if (status === 'completed' || status === 'min_version' || status === 'frozen' || status === 'skipped') {
      completions30++;
    }
    checkDate30 = addDays(checkDate30, -1);
    if (checkDate30 < creationDateStr) break;
  }
  const daysTracked = Math.min(30, allDates.length);
  const completionRate = daysTracked > 0 ? Math.round((completions30 / daysTracked) * 100) : 0;
  
  const todayLog = logsMap.get(todayStr);
  const todayCount = todayLog ? todayLog.count_completed : 0;
  const target = habit.target_count;
  const minCount = habit.min_version_enabled ? habit.min_version_count : target;
  
  const completedToday = todayCount >= target && !(todayLog && todayLog.is_skipped);
  const minCompletedToday = habit.min_version_enabled && todayCount >= minCount && !(todayLog && todayLog.is_skipped);
  
  const yesterdayLog = logsMap.get(yesterdayStr);
  const yesterdayCount = yesterdayLog ? yesterdayLog.count_completed : 0;
  const completedYesterday = (yesterdayCount >= target || (habit.min_version_enabled && yesterdayCount >= minCount)) && !(yesterdayLog && yesterdayLog.is_skipped);
  
  let statusToday: HabitStats['statusToday'] = 'pending';
  if (todayLog && todayLog.is_skipped) {
    statusToday = 'skipped';
  } else if (todayCount >= target) {
    statusToday = 'completed';
  } else if (habit.min_version_enabled && todayCount >= minCount) {
    statusToday = 'min_version';
  } else if (freezesSet.has(todayStr)) {
    statusToday = 'frozen';
  } else if (new Date().getHours() >= dayOffset && todayCount === 0) {
    // If it's past day offset and nothing is done, it's pending
    statusToday = 'pending';
  }
  
  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    completedToday,
    completedYesterday,
    minCompletedToday,
    statusToday,
    completionRate,
    history
  };
}

export function formatFriendlyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  
  let suffix = 'th';
  if (day === 1 || day === 21 || day === 31) suffix = 'st';
  else if (day === 2 || day === 22) suffix = 'nd';
  else if (day === 3 || day === 23) suffix = 'rd';
  
  return `${monthName} ${day}${suffix}`;
}
