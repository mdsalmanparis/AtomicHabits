import React from 'react';
import { useStore } from '../store/useStore';
import { calculateHabitStats, getLogicalDate, addDays, getDatesRange } from '../utils/dateUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Trophy, CircleDot, Flame, RefreshCw, Sparkles, Activity, TrendingUp } from 'lucide-react';



export const Analytics: React.FC = () => {
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const freezes = useStore(state => state.freezes);
  const profile = useStore(state => state.profile);

  const activeHabits = habits.filter(h => !h.is_archived);
  
  // 1. Consistency, Current Streak, and Best Streak stats
  let totalConsistency = 0;
  let maxCurrentStreak = 0;
  let maxBestStreak = 0;
  
  activeHabits.forEach(h => {
    const stats = calculateHabitStats(h, logs, freezes, profile.day_offset_hours);
    totalConsistency += stats.completionRate;
    if (stats.currentStreak > maxCurrentStreak) maxCurrentStreak = stats.currentStreak;
    if (stats.bestStreak > maxBestStreak) maxBestStreak = stats.bestStreak;
  });

  const avgConsistency = activeHabits.length > 0 
    ? Math.round(totalConsistency / activeHabits.length) 
    : 0;

  // 2. Heatmap & range: Aggregate last 28 days logical dates
  const todayStr = getLogicalDate(new Date(), profile.day_offset_hours);
  const date28DaysAgo = addDays(todayStr, -27);
  const last28Days = getDatesRange(date28DaysAgo, todayStr);
  
  const heatmapData = last28Days.map(dateStr => {
    let completedCount = 0;
    let minCount = 0;
    let frozenCount = 0;
    let activeTotal = activeHabits.length;
    
    activeHabits.forEach(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
      const isFrozen = freezes.some(f => f.logical_date === dateStr);
      
      if (log) {
        const target = h.target_count;
        const minVal = h.min_version_enabled ? h.min_version_count : target;
        
        if (log.is_skipped) {
          // skipped doesn't count towards completions but doesn't break
        } else if (log.count_completed >= target) {
          completedCount++;
        } else if (h.min_version_enabled && log.count_completed >= minVal) {
          minCount++;
        } else if (isFrozen) {
          frozenCount++;
        }
      } else if (isFrozen) {
        frozenCount++;
      }
    });

    let status: 'completed' | 'min_version' | 'frozen' | 'missed' = 'missed';
    if (activeTotal > 0) {
      if (completedCount === activeTotal) {
        status = 'completed';
      } else if (completedCount + minCount + frozenCount > 0) {
        if (frozenCount > 0 && completedCount === 0 && minCount === 0) {
          status = 'frozen';
        } else {
          status = 'min_version';
        }
      }
    }
    
    return {
      date: dateStr,
      status,
      completedCount,
      minCount,
      frozenCount
    };
  });

  const last7Days = last28Days.slice(-7);

  // 5. Day of the week averages
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyCompletionRates = dayNames.map((name, index) => {
    let completed = 0;
    let total = 0;
    
    logs.forEach(log => {
      const habit = activeHabits.find(h => h.id === log.habit_id);
      if (!habit) return;
      
      const logDate = new Date(log.logical_date + 'T00:00:00');
      if (logDate.getDay() === index) {
        total++;
        if (log.count_completed >= habit.target_count && !log.is_skipped) {
          completed++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { name, percentage };
  });

  // 6. Habit Score: calculated based on consistency, completion rate, current streak
  // (Scale of 0-100, weighting consistency 60% and current streak 40%)
  const habitScore = activeHabits.length > 0 
    ? Math.min(100, Math.round((avgConsistency * 0.6) + (Math.min(30, maxCurrentStreak) * 3.3 * 0.4))) 
    : 0;

  // 7. Week Review (Last 7 Days)
  const totalSchedulesThisWeek = activeHabits.length * 7;
  let totalCompletionsThisWeek = 0;

  const weeklyHabitStats = activeHabits.map(h => {
    let completedDays = 0;
    last7Days.forEach(day => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === day);
      if (log && log.count_completed >= h.target_count && !log.is_skipped) {
        completedDays++;
      }
    });
    const rate = Math.round((completedDays / 7) * 100);
    totalCompletionsThisWeek += completedDays;
    return { habit: h, rate };
  });

  const weeklyCompletedPct = totalSchedulesThisWeek > 0 
    ? Math.round((totalCompletionsThisWeek / totalSchedulesThisWeek) * 100) 
    : 0;

  // Best Habit (weekly)
  let bestHabitName = 'None';
  if (weeklyHabitStats.length > 0) {
    const sortedWeekly = [...weeklyHabitStats].sort((a, b) => b.rate - a.rate);
    if (sortedWeekly[0] && sortedWeekly[0].rate > 0) {
      bestHabitName = `${sortedWeekly[0].habit.name} (${sortedWeekly[0].rate}% consistency)`;
    }
  }

  // Struggling Habits (weekly consistency < 50%)
  const strugglingHabits = weeklyHabitStats
    .filter(w => w.rate < 50)
    .map(w => `${w.habit.name} (${w.rate}%)`);
  const strugglingText = strugglingHabits.length > 0 ? strugglingHabits.join(', ') : 'None';

  // Most Successful Day (from week averages)
  const sortedDays = [...weeklyCompletionRates].sort((a, b) => b.percentage - a.percentage);
  const mostSuccessfulDayName = sortedDays[0] && sortedDays[0].percentage > 0 
    ? `${sortedDays[0].name} (${sortedDays[0].percentage}% completion rate)` 
    : 'N/A';

  // 8. Identity ballot breakdowns
  const identityVotes: Record<string, number> = {};
  logs.forEach(log => {
    const h = activeHabits.find(habit => habit.id === log.habit_id);
    if (h && log.count_completed >= h.target_count && !log.is_skipped) {
      const displayName = h.identity.charAt(0).toUpperCase() + h.identity.slice(1);
      identityVotes[displayName] = (identityVotes[displayName] || 0) + 1;
    }
  });

  activeHabits.forEach(h => {
    const displayName = h.identity.charAt(0).toUpperCase() + h.identity.slice(1);
    if (identityVotes[displayName] === undefined) {
      identityVotes[displayName] = 0;
    }
  });

  const identityList = Object.entries(identityVotes).map(([name, votes]) => {
    const level = Math.floor(votes / 10) + 1;
    const votesProgress = votes % 10;
    return { name, votes, level, votesProgress };
  });

  const pieData = identityList.map(item => ({
    name: item.name,
    value: item.votes
  })).filter(p => p.value > 0);

  const COLORS = ['var(--btn-primary-bg)', '#a3a3a3', '#525252', 'var(--border-color)', '#d4d4d4', '#171717'];

  return (
    <div className="space-y-8 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Card 1: Consistency Percentage */}
        <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">
              Consistency
            </span>
            <TrendingUp className="h-4 w-4 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
              {avgConsistency}%
            </div>
            <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">
              Avg completion rate
            </p>
          </div>
        </div>

        {/* Card 2: Current Streak */}
        <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">
              Current Streak
            </span>
            <Flame className="h-4 w-4 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
              {maxCurrentStreak} <span className="text-neutral-500 text-xs font-normal">Days</span>
            </div>
            <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">
              Longest active streak
            </p>
          </div>
        </div>

        {/* Card 3: Best Streak */}
        <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">
              Best Streak
            </span>
            <Trophy className="h-4 w-4 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
              {maxBestStreak} <span className="text-neutral-500 text-xs font-normal">Days</span>
            </div>
            <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">
              Highest historical best
            </p>
          </div>
        </div>

        {/* Card 4: Total XP */}
        <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">
              Total XP
            </span>
            <Sparkles className="h-4 w-4 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
              {profile.xp} <span className="text-neutral-500 text-xs font-normal">XP</span>
            </div>
            <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">
              Total level points
            </p>
          </div>
        </div>

        {/* Card 5: Habit Score */}
        <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">
              Habit Score
            </span>
            <Activity className="h-4 w-4 text-neutral-500 shrink-0" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
              {habitScore}<span className="text-neutral-500 text-xs font-normal">/100</span>
            </div>
            <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">
              Overall health metric
            </p>
          </div>
        </div>
      </div>

      {/* Week Review Section */}
      <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
        <div className="flex items-center gap-2 select-none border-b border-border-primary pb-3">
          <RefreshCw className="h-4 w-4 text-neutral-505" />
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Logical Week Review</h3>
            <p className="text-[10px] text-neutral-500">Performance insights aggregated from the last 7 logical days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1 select-none">
          {/* Week Card 1: Completed Rate */}
          <div className="p-4 border border-border-primary rounded-lg bg-bg-primary/50 flex flex-col justify-between min-h-[90px]">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Completed Rate</span>
              <Activity className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            </div>
            <div className="mt-2">
              <h4 className="text-xl font-extrabold text-text-primary font-poppins leading-none">{weeklyCompletedPct}%</h4>
              <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-wider leading-none">Total scheduled met</p>
            </div>
          </div>

          {/* Week Card 2: Best Habit */}
          <div className="p-4 border border-border-primary rounded-lg bg-bg-primary/50 flex flex-col justify-between min-h-[90px]">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Best Habit</span>
              <Sparkles className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            </div>
            <div className="mt-2 min-w-0">
              <h4 className="text-sm font-extrabold text-text-primary font-poppins truncate leading-tight animate-none" title={bestHabitName.split(' (')[0]}>
                {bestHabitName.split(' (')[0]}
              </h4>
              <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-wider leading-none truncate">
                {bestHabitName.includes('(') ? bestHabitName.substring(bestHabitName.indexOf('(')) : 'No completions'}
              </p>
            </div>
          </div>

          {/* Week Card 3: Struggling Routines */}
          <div className="p-4 border border-border-primary rounded-lg bg-bg-primary/50 flex flex-col justify-between min-h-[90px]">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Struggling Routines</span>
              <Trophy className="h-3.5 w-3.5 text-neutral-500 shrink-0 rotate-180" />
            </div>
            <div className="mt-2 min-w-0">
              <h4 className="text-xs font-extrabold text-text-primary font-poppins truncate leading-tight animate-none" title={strugglingText.split(', ')[0]}>
                {strugglingText.split(', ')[0] || 'None'}
              </h4>
              <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-wider leading-none truncate">
                {strugglingHabits.length > 1 ? `+ ${strugglingHabits.length - 1} more habits` : 'Healthy Routines'}
              </p>
            </div>
          </div>

          {/* Week Card 4: Most Successful Day */}
          <div className="p-4 border border-border-primary rounded-lg bg-bg-primary/50 flex flex-col justify-between min-h-[90px]">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Most Successful Day</span>
              <Activity className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
            </div>
            <div className="mt-2 min-w-0">
              <h4 className="text-sm font-extrabold text-text-primary font-poppins truncate leading-tight animate-none" title={mostSuccessfulDayName.split(' (')[0]}>
                {mostSuccessfulDayName.split(' (')[0]}
              </h4>
              <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-wider leading-none truncate">
                {mostSuccessfulDayName.includes('(') ? mostSuccessfulDayName.substring(mostSuccessfulDayName.indexOf('(')) : 'No completions'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Heatmap Grid */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Grid of Consistency (Last 28 Days)</h3>
            <p className="text-[10px] text-neutral-500">Shows overall daily completions across all habits</p>
          </div>
          
          <div className="grid grid-cols-7 gap-2 select-none">
            {heatmapData.map((day, idx) => {
              let bgClass = 'bg-bg-primary border border-border-primary';
              let titleText = `${day.date}: Missed`;
              
              if (day.status === 'completed') {
                bgClass = 'bg-btn-primary-bg border-btn-primary-bg glow-green';
                titleText = `${day.date}: Perfect Day`;
              } else if (day.status === 'min_version') {
                bgClass = 'bg-card-bg border border-border-hover';
                titleText = `${day.date}: Safety Net Met`;
              } else if (day.status === 'frozen') {
                bgClass = 'bg-bg-primary border border-cyan-800';
                titleText = `${day.date}: Streak Frozen`;
              }
              
              return (
                <div 
                  key={idx}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center text-[8px] font-bold transition-all hover:scale-105 cursor-help ${bgClass}`}
                  title={titleText}
                >
                  <span className={day.status === 'completed' ? 'text-btn-primary-text' : 'text-neutral-500'}>
                    {day.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 text-[9px] font-bold tracking-wider text-neutral-500 uppercase pt-2 select-none">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-bg-primary border border-border-primary" /> Missed</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-bg-primary border border-cyan-800" /> Frozen</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-card-bg border border-border-hover" /> Safety Net</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-btn-primary-bg border border-btn-primary-bg" /> Complete</span>
          </div>
        </div>

        {/* Identity Ballots (Votes Cast Diagram) */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Identity Ballot Breakdown</h3>
            <p className="text-[10px] text-neutral-500">Casting votes for who you want to become (completions count)</p>
          </div>
          
          <div className="h-48 flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="105%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                    itemStyle={{ color: 'var(--text-color)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-neutral-500 flex flex-col items-center gap-2">
                <CircleDot className="h-6 w-6" />
                <span>No completions logged yet.</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 pt-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-neutral-450 font-medium">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Identity Transformation Levels Matrix */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 select-none border-b border-border-primary pb-3">
            <Sparkles className="h-4 w-4 text-neutral-505" />
            <div>
              <h3 className="text-sm font-extrabold font-poppins text-text-primary">Identity Leveling Matrix</h3>
              <p className="text-[10px] text-neutral-500">Every 10 completions levels up your identity shift progress</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {identityList.map(item => (
              <div key={item.name} className="p-3 border border-border-primary rounded-lg bg-bg-primary/50 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-text-primary font-poppins">{item.name}</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-card-bg px-2 py-0.5 rounded border border-border-primary">
                    Identity Lvl {item.level}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-bg-primary rounded-full overflow-hidden border border-border-primary">
                    <div 
                      className="h-full bg-text-primary rounded-full transition-all duration-300"
                      style={{ width: `${item.votesProgress * 10}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider text-neutral-500">
                    <span>{item.votes} total votes cast</span>
                    <span>{10 - item.votesProgress} more to level</span>
                  </div>
                </div>
              </div>
            ))}

            {identityList.length === 0 && (
              <div className="text-center py-4 text-xs text-neutral-500 font-medium sm:col-span-2">
                No identity habits created yet.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Consistency Recharts Bar */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Consistency by Day of the Week</h3>
            <p className="text-[10px] text-neutral-500">Average completion rate for each day of the week</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyCompletionRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--btn-secondary-border)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-color)' }} 
                />
                <YAxis 
                  stroke="var(--btn-secondary-border)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border-color)' }}
                  domain={[0, 100]}
                  tickFormatter={tick => `${tick}%`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                  itemStyle={{ color: 'var(--text-color)' }}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="var(--btn-primary-bg)" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
