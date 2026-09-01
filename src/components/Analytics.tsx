import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { calculateHabitStats, getLogicalDate, addDays, getDatesRange, isHabitScheduledForDate } from '../utils/dateUtils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceArea,
  ComposedChart,
  Line,
  Legend
} from 'recharts';
import { Trophy, CircleDot, Flame, RefreshCw, Sparkles, Activity, TrendingUp, Shield } from 'lucide-react';
import * as Icons from 'lucide-react';
import { getLevelTitle, getTotalXPForLevel } from '../utils/levelUtils';
import { getRecoveryData, getRecoveryStats, isEligibleForRecovery } from '../utils/habitFilters';



export interface AnalyticsProps {
  onNavigate?: (tab: 'habits' | 'analytics' | 'achievements' | 'settings' | 'vita') => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onNavigate }) => {
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const freezes = useStore(state => state.freezes);
  const profile = useStore(state => state.profile);
  const sleepLogs = useStore(state => state.sleepLogs) || [];
  const moodLogs = useStore(state => state.moodLogs) || [];

  // Level progress XP percentage
  const currentXP = profile.xp;
  const currentLevel = profile.level;
  const xpBasis = getTotalXPForLevel(currentLevel);
  const xpNeeded = getTotalXPForLevel(currentLevel + 1);
  const currentLevelProgress = currentXP - xpBasis;
  const levelXPNeeded = xpNeeded - xpBasis;
  const xpPercentage = levelXPNeeded > 0
    ? Math.min(100, Math.round((Math.max(0, currentLevelProgress) / levelXPNeeded) * 100))
    : 100;
  const levelTitle = getLevelTitle(currentLevel);

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
  
  const ESTABLISHED_DATE = '2026-08-18';
  
  const heatmapData = last28Days.map(dateStr => {
    if (dateStr < ESTABLISHED_DATE) {
      return {
        date: dateStr,
        status: 'not_started' as any,
        completedCount: 0,
        minCount: 0,
        frozenCount: 0,
        percentage: 0,
        activeTotal: 0
      };
    }

    let completedCount = 0;
    let minCount = 0;
    let frozenCount = 0;
    const scheduledHabits = activeHabits.filter(h => isHabitScheduledForDate(h, dateStr));
    const activeTotal = scheduledHabits.length;
    const isFrozen = freezes.some(f => f.logical_date === dateStr);
    
    scheduledHabits.forEach(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
      
      if (log) {
        const target = h.target_count;
        const minVal = h.min_version_enabled ? h.min_version_count : target;
        
        if (log.is_skipped || log.is_justified) {
          completedCount++; // Skipped/justified counts as completed for consistency
        } else if (log.count_completed >= target) {
          completedCount++;
        } else if (h.min_version_enabled && log.count_completed >= minVal) {
          minCount++;
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
        if (isFrozen && completedCount === 0 && minCount === 0) {
          status = 'frozen';
        } else {
          status = 'min_version';
        }
      }
    } else if (isFrozen) {
      status = 'frozen';
    }
    
    const percentage = activeTotal > 0 ? Math.round(((completedCount + minCount) / activeTotal) * 100) : 100;
    
    return {
      date: dateStr,
      status,
      completedCount,
      minCount,
      frozenCount,
      percentage,
      activeTotal
    };
  });

  const last7Days = last28Days.slice(-7);

  const getDynamicIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Check;
    return <IconComponent className="h-4 w-4 shrink-0 text-text-primary" />;
  };


  // Find most failing non-Salah habits in the last 28 days
  const nonSalahActiveHabits = activeHabits.filter(h => !h.is_salah);
  const habitsFailureList = nonSalahActiveHabits.map(h => {
    let missedCount = 0;
    let scheduledDays = 0;
    
    const creationDateStr = h.created_at ? h.created_at.split('T')[0] : ESTABLISHED_DATE;
    const startCheckingDate = creationDateStr > ESTABLISHED_DATE ? creationDateStr : ESTABLISHED_DATE;
    const activeDates = last28Days.filter(dateStr => dateStr >= startCheckingDate && dateStr < todayStr);
    
    activeDates.forEach(dateStr => {
      if (isHabitScheduledForDate(h, dateStr)) {
        scheduledDays++;
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
        const hasFreeze = freezes.some(f => f.habit_id === h.id && f.logical_date === dateStr);
        
        if (log) {
          const count = Number(log.count_completed);
          const target = Number(h.target_count);
          const minVal = h.min_version_enabled ? Number(h.min_version_count) : target;
          const completed = count >= target || (h.min_version_enabled && count >= minVal);
          
          if (!completed && !hasFreeze) {
            missedCount++;
          }
        } else if (!hasFreeze) {
          missedCount++;
        }
      }
    });

    const failureRate = scheduledDays > 0 ? Math.round((missedCount / scheduledDays) * 100) : 0;
    return {
      habit: h,
      missedCount,
      scheduledDays,
      failureRate
    };
  }).filter(item => item.scheduledDays > 0);

  // Sort descending by missedCount, then by failureRate, filter only missed, limit to max 6
  const sortedFailureList = [...habitsFailureList]
    .sort((a, b) => b.missedCount - a.missedCount || b.failureRate - a.failureRate)
    .filter(item => item.missedCount > 0)
    .slice(0, 6);

  const mostFailing = sortedFailureList[0];
  

  const renderAiBlueprint = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-poppins">
        {lines.map((line, index) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Header 2 or bold subtitle lines (e.g. ## Habit-Stacking Formula)
          if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.startsWith('-'))) {
            const cleanText = trimmed.replace(/^[#\*\s]+/, '').replace(/[\*]+$/, '');
            return (
              <h5 key={index} className="font-extrabold text-[10px] text-text-primary uppercase tracking-wider border-b border-border-primary pb-1 pt-2 animate-fadeIn">
                {cleanText}
              </h5>
            );
          }

          // Bullet points (e.g. - **Drink 4L Water** -> ...)
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            const cleanText = trimmed.replace(/^[\-\*\s]+/, '');
            
            // Parse bold elements in bullet point
            const parts = cleanText.split('**');
            const parsedContent = parts.map((part, pIdx) => {
              if (pIdx % 2 === 1) {
                return <strong key={pIdx} className="font-extrabold text-text-primary">{part}</strong>;
              }
              return part;
            });

            return (
              <div key={index} className="flex items-start gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 pl-1 mt-1 animate-fadeIn leading-relaxed font-medium">
                <span className="text-text-primary shrink-0 mt-0.5">•</span>
                <span>{parsedContent}</span>
              </div>
            );
          }

          // Default text paragraph
          return (
            <p key={index} className="text-[11px] text-neutral-500 leading-relaxed font-medium animate-fadeIn">
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'habits' | 'wellbeing' | 'improvements'>('habits');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const askAiCoach = async () => {
    setIsLoadingAi(true);
    setAiError(null);
    setAiResponse(null);

    if (!mostFailing) return;

    const nonSalahSuccessHabits = activeHabits.filter(h => !h.is_salah);
    const successfulListText = nonSalahSuccessHabits.length > 0
      ? nonSalahSuccessHabits.map(h => {
          const stats = calculateHabitStats(h, logs, freezes, profile.day_offset_hours);
          return `- "${h.name}": ${stats.completionRate}% success rate.`;
        }).join('\n')
      : 'None';

    const prompt = `
I am using a habit tracker based on Atomic Habits by James Clear.
My single most failing habit is: "${mostFailing.habit.name}".
My successful habits (which exclude prayer/Salah habits):
${successfulListText}

Analyze this data and provide a concise, actionable, laser-focused blueprint ONLY for my most failing habit "${mostFailing.habit.name}".
CRITICAL INSTRUCTIONS:
- Do NOT mention or suggest any prayer/Salah habits (e.g. Fajr, Dhuhr, Asr, Maghrib, Isha, Jummah).
- Focus ONLY on "${mostFailing.habit.name}". Do NOT generate stacking formulas or minimum versions for any other habits.
- Do NOT use any emojis, icons, or unicode symbols (such as 1️⃣, 2️⃣, 🚀, 👍, ✨, etc.) in your entire response.
- Use only standard text and clean markdown bullet points.
- Structure your response under exactly two headers:
  * Habit-Stacking Formula (pairing "${mostFailing.habit.name}" to stack immediately after one of my successful habits listed above)
  * 2-Minute Minimum Version (a tiny starting version of "${mostFailing.habit.name}" to establish consistency)
- Use double line breaks between sections for a pretty, clean format.
- Keep the entire response under 100 words.
    `;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY || ''}`
        },
        body: JSON.stringify({
          model: 'groq/compound-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an elite productivity coach trained in James Clear\'s Atomic Habits methodology. Provide highly actionable, concise advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from Groq API');
      }

      const data = await response.json();
      setAiResponse(data.choices[0].message.content);
    } catch (err: any) {
      console.error(err);
      setAiError('Could not connect to AI Coach. Please check your internet connection.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  useEffect(() => {
    if (mostFailing && !aiResponse && !isLoadingAi) {
      askAiCoach();
    }
  }, [mostFailing?.habit.id]);

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

  // Circadian phase averages (Last 14 days)
  const phaseTotals = {
    phase_1: { done: 0, total: 0, label: 'Morning' },
    phase_2: { done: 0, total: 0, label: 'Afternoon' },
    phase_3: { done: 0, total: 0, label: 'Evening' },
    phase_4: { done: 0, total: 0, label: 'Night' }
  };
  
  const last14Days = getDatesRange(addDays(todayStr, -13), todayStr);
  last14Days.forEach(dateStr => {
    activeHabits.forEach(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
      const isDone = log ? (log.count_completed >= h.target_count || (h.min_version_enabled && log.count_completed >= h.min_version_count)) : false;
      if (h.cue_phase in phaseTotals) {
        phaseTotals[h.cue_phase as keyof typeof phaseTotals].total++;
        if (isDone) {
          phaseTotals[h.cue_phase as keyof typeof phaseTotals].done++;
        }
      }
    });
  });
  
  const circadianCompletionRates = Object.values(phaseTotals).map(p => ({
    name: p.label,
    percentage: p.total > 0 ? Math.round((p.done / p.total) * 100) : 0,
    completions: `${p.done}/${p.total}`
  }));

  const activeTrendDays = last28Days.filter(dateStr => dateStr >= ESTABLISHED_DATE);
  const trendData = activeTrendDays.map(dateStr => {
    let completedCount = 0;
    let totalScheduled = 0;
    
    activeHabits.forEach(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
      if (log && !log.is_skipped && !log.is_justified) {
        totalScheduled++;
        if (log.count_completed >= h.target_count) {
          completedCount++;
        }
      } else if (!log || (!log.is_skipped && !log.is_justified)) {
        totalScheduled++;
      }
    });
    
    const percentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;
    const dateObj = new Date(dateStr + 'T00:00:00');
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      date: label,
      percentage,
      isWeekend
    };
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
    
    // Calculate weekly trend for habits under this identity
    const habitsForId = activeHabits.filter(h => (h.identity.charAt(0).toUpperCase() + h.identity.slice(1)) === name);
    
    // Count completions in last 7 days
    let current7 = 0;
    let prev7 = 0;
    
    const last7Days = last28Days.slice(-7);
    last7Days.forEach(day => {
      habitsForId.forEach(h => {
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === day);
        if (log && log.count_completed >= h.target_count && !log.is_skipped) {
          current7++;
        }
      });
    });
    
    const prev7DaysList = Array.from({ length: 7 }, (_, i) => addDays(todayStr, -(i + 7)));
    prev7DaysList.forEach(day => {
      habitsForId.forEach(h => {
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === day);
        if (log && log.count_completed >= h.target_count && !log.is_skipped) {
          prev7++;
        }
      });
    });
    
    let trend: 'improving' | 'maintaining' | 'starting' = 'starting';
    if (votes > 0) {
      if (current7 > prev7) {
        trend = 'improving';
      } else {
        trend = 'maintaining';
      }
    }
    
    return { name, votes, level, votesProgress, trend };
  });

  const pieData = identityList.map(item => ({
    name: item.name,
    value: item.votes
  })).filter(p => p.value > 0);

  // --- Wellbeing Analytics Data Calculations ---
  const waterHabit = habits.find(h => h.name.toLowerCase().includes('water'));

  // 1. Sleep & Energy Correlation Data (Last 14 Days)
  const sleepEnergyData = last14Days.map(dStr => {
    const sleepLog = sleepLogs.find(s => s.logical_date === dStr);
    const moodLog = moodLogs.find(m => m.logical_date === dStr);
    
    // Convert energy state to numeric score (1-3)
    let energyScore = 0;
    if (moodLog?.energy === 'high') energyScore = 3;
    else if (moodLog?.energy === 'medium') energyScore = 2;
    else if (moodLog?.energy === 'low') energyScore = 1;
    
    const displayDate = new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return {
      date: displayDate,
      sleepHours: sleepLog ? Number(sleepLog.duration_hours) : 0,
      energy: energyScore,
      energyLabel: moodLog?.energy ? moodLog.energy.toUpperCase() : 'N/A',
      mood: moodLog?.mood ? moodLog.mood : 'N/A'
    };
  });

  // 2. Hydration Trends vs Target Data (Last 14 Days)
  const hydrationData = last14Days.map(dStr => {
    const displayDate = new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const waterLog = waterHabit ? logs.find(l => l.habit_id === waterHabit.id && l.logical_date === dStr) : null;
    const actualWater = waterLog ? Number(waterLog.count_completed) : 0;
    const targetWater = waterHabit ? Number(waterHabit.target_count) : 2.5; // fallback
    
    return {
      date: displayDate,
      actual: actualWater,
      target: targetWater
    };
  });

  // 3. Mood & Energy Distribution (Last 30 Days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    return addDays(todayStr, -i);
  });
  
  const moodCounts: Record<string, number> = {
    happy: 0,
    okay: 0,
    hyperactive: 0,
    sad: 0,
    depressed: 0
  };

  moodLogs.forEach(m => {
    if (last30Days.includes(m.logical_date) && m.mood) {
      moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
    }
  });

  const moodColors: Record<string, string> = {
    happy: '#10b981',       // Emerald
    okay: '#6366f1',        // Indigo
    hyperactive: '#eab308', // Amber
    sad: '#3b82f6',        // Blue
    depressed: '#ef4444'    // Red
  };

  const moodChartData = Object.entries(moodCounts)
    .filter(([_, count]) => count > 0)
    .map(([mood, count]) => ({
      name: mood.toUpperCase(),
      value: count,
      color: moodColors[mood] || '#a3a3a3'
    }));

  const energyCounts: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0
  };
  
  moodLogs.forEach(m => {
    if (last30Days.includes(m.logical_date) && m.energy) {
      energyCounts[m.energy] = (energyCounts[m.energy] || 0) + 1;
    }
  });

  const energyColors: Record<string, string> = {
    high: '#10b981',   // Emerald
    medium: '#6366f1', // Indigo
    low: '#ef4444'     // Red
  };

  const energyChartData = Object.entries(energyCounts)
    .filter(([_, count]) => count > 0)
    .map(([energy, count]) => ({
      name: energy.toUpperCase(),
      value: count,
      color: energyColors[energy] || '#a3a3a3'
    }));

  // Averages calculations for Wellbeing Overview Cards
  const loggedSleeps = sleepLogs.filter(s => last14Days.includes(s.logical_date));
  const avgSleep = loggedSleeps.length > 0
    ? (loggedSleeps.reduce((acc, curr) => acc + Number(curr.duration_hours), 0) / loggedSleeps.length).toFixed(1)
    : '0.0';

  const loggedMoods = moodLogs.filter(m => last14Days.includes(m.logical_date));
  const positiveMoodCount = loggedMoods.filter(m => m.mood === 'happy' || m.mood === 'hyperactive' || m.mood === 'okay').length;
  const moodPositivityRate = loggedMoods.length > 0
    ? Math.round((positiveMoodCount / loggedMoods.length) * 100)
    : 0;

  const highEnergyCount = loggedMoods.filter(m => m.energy === 'high').length;
  const avgEnergyLabel = loggedMoods.length > 0
    ? highEnergyCount / loggedMoods.length >= 0.5 ? 'HIGH' : loggedMoods.some(m => m.energy === 'medium') ? 'MEDIUM' : 'LOW'
    : 'N/A';

  const waterLogs = waterHabit ? logs.filter(l => l.habit_id === waterHabit.id && last14Days.includes(l.logical_date)) : [];
  const avgWater = waterLogs.length > 0
    ? (waterLogs.reduce((acc, curr) => acc + Number(curr.count_completed), 0) / 14).toFixed(1)
    : '0.0';

  const COLORS = ['var(--btn-primary-bg)', '#a3a3a3', '#525252', 'var(--border-color)', '#d4d4d4', '#171717'];

  const hasWellbeingData = sleepLogs.length > 0 || moodLogs.length > 0 || (waterHabit && logs.some(l => l.habit_id === waterHabit.id));

  return (
    <div className="space-y-8 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      
      {/* Header with Settings & Badges shortcuts */}
      <div className="flex justify-between items-center border-b border-border-primary pb-3 mb-6 select-none">
        <div>
          <h2 className="text-lg font-black font-poppins text-text-primary uppercase tracking-wider">
            Analytics & Progress
          </h2>
          <p className="text-[10px] text-neutral-505 font-semibold uppercase tracking-wider mt-0.5">
            Your habit loop statistics
          </p>
        </div>
        
        {/* Settings and badges icons in analytics tab */}
        <div className="flex items-center gap-2">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('achievements')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card-bg border border-border-primary hover:border-border-hover rounded-xl text-[10px] font-bold text-neutral-500 hover:text-text-primary transition-colors cursor-pointer"
                title="View Badges"
              >
                <Trophy className="h-4 w-4 text-amber-500 fill-amber-500/10" />
                <span>Badges</span>
              </button>
              
              <button
                onClick={() => onNavigate('settings')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-card-bg border border-border-primary hover:border-border-hover rounded-xl text-[10px] font-bold text-neutral-500 hover:text-text-primary transition-colors cursor-pointer"
                title="Settings"
              >
                <Icons.Sliders className="h-4 w-4 text-indigo-500" />
                <span>Settings</span>
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Level & XP Progress Indicator */}
      <div className="cred-glass p-6 rounded-2xl border border-border-primary select-none flex flex-col md:flex-row items-center gap-6">
        {/* Left: Shield Icon with Level inside, Title below */}
        <div className="flex flex-col items-center text-center shrink-0 min-w-[120px]">
          <div className="relative flex items-center justify-center">
            <Shield className="h-16 w-16 text-indigo-500 fill-indigo-500/10 stroke-[1.5px]" />
            <span className="absolute text-xl font-black font-poppins text-text-primary mt-0.5">
              {profile.level}
            </span>
          </div>
          <span className="text-[10px] font-black font-poppins text-text-primary uppercase tracking-wider mt-2.5 max-w-[140px] leading-tight">
            {levelTitle}
          </span>
        </div>

        {/* Right: XP Details & Progress Bar */}
        <div className="w-full space-y-2.5 flex-1">
          <div className="flex justify-between items-end text-[10px] font-black font-poppins uppercase tracking-wider text-text-primary">
            <span>Level Progress</span>
            <span className="text-neutral-400">
              {currentXP} <span className="text-neutral-500 font-bold">/ {xpNeeded} XP</span>
            </span>
          </div>
          
          <div className="w-full h-3 bg-bg-primary rounded-full border border-border-primary overflow-hidden p-[2px]">
            <div 
              className="h-full bg-text-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          
          <p className="text-[9px] text-neutral-500 font-extrabold uppercase tracking-wide">
            {xpNeeded - currentXP > 0 
              ? `${xpNeeded - currentXP} XP required to unlock Level ${profile.level + 1}` 
              : 'Max Level Completed'}
          </p>
        </div>
      </div>

      {/* Analytics Tab Selector */}
      <div className="flex border-b border-border-primary/50 gap-4 mb-6 select-none">
        <button
          onClick={() => setActiveAnalyticsTab('habits')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeAnalyticsTab === 'habits'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-450'
          }`}
        >
          Habit Metrics
        </button>
        <button
          onClick={() => setActiveAnalyticsTab('wellbeing')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeAnalyticsTab === 'wellbeing'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-450'
          }`}
        >
          Wellbeing Insights
        </button>
        <button
          onClick={() => setActiveAnalyticsTab('improvements')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            activeAnalyticsTab === 'improvements'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-450'
          }`}
        >
          Improvements & Recovery
        </button>
      </div>

      {activeAnalyticsTab === 'habits' ? (
        <>
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

      {/* Historical Consistency Trend Chart */}
      <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
        <div>
          <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wide">Historical Consistency Trend</h3>
          <p className="text-[10px] text-neutral-500">Overall daily consistency trend over the last 28 logical days</p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsistency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--btn-primary-bg)" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="var(--btn-primary-bg)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="var(--btn-secondary-border)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: 'var(--border-color)' }}
                tickFormatter={(val, index) => (index % 5 === 0 ? val : '')} // Only show some ticks to avoid clutter
              />
              <YAxis 
                stroke="var(--btn-secondary-border)" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: 'var(--border-color)' }}
                domain={[0, 100]}
                tickFormatter={tick => `${tick}%`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
                itemStyle={{ color: 'var(--text-color)' }}
                formatter={(value, _, props) => {
                  const isWeekend = props?.payload?.isWeekend;
                  return [`${value}%${isWeekend ? ' (Weekend)' : ''}`, 'Consistency'];
                }}
              />
              {trendData.map((d, i) => d.isWeekend ? (
                <ReferenceArea 
                  key={`ref-${i}`} 
                  x1={d.date} 
                  x2={d.date} 
                  fill="rgba(245, 158, 11, 0.05)" 
                  stroke="rgba(245, 158, 11, 0.12)"
                  strokeWidth={0.5}
                  strokeDasharray="2 2"
                />
              ) : null)}
              <Area 
                type="monotone" 
                dataKey="percentage" 
                stroke="var(--btn-primary-bg)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorConsistency)" 
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload && payload.isWeekend) {
                    return (
                      <circle 
                        key={props.key || `dot-${cx}-${cy}`}
                        cx={cx} 
                        cy={cy} 
                        r={4.5} 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        fill="var(--card-bg)"
                      />
                    );
                  }
                  return null;
                }}
                activeDot={{ r: 5.5, stroke: '#f59e0b', strokeWidth: 2, fill: 'var(--card-bg)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
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
              const hasCompletions = day.percentage > 0;
              const isPerfect = day.status === 'completed';
              const isFrozen = day.status === 'frozen';
              const isNotStarted = day.status === 'not_started';
              
              let borderClass = 'border-border-primary';
              let titleText = `${day.date}: Missed (0% completed)`;
              
              if (isNotStarted) {
                borderClass = 'border-border-primary/20 opacity-30 cursor-not-allowed';
                titleText = `${day.date}: App not established yet`;
              } else if (isPerfect) {
                borderClass = 'border-btn-primary-bg glow-green';
                titleText = `${day.date}: Perfect Day (100% completed)`;
              } else if (day.status === 'min_version') {
                borderClass = 'border-border-hover';
                titleText = `${day.date}: ${day.percentage}% Completed (Safety Net Met)`;
              } else if (isFrozen) {
                borderClass = 'border-cyan-800';
                titleText = `${day.date}: Streak Frozen`;
              } else if (day.percentage > 0) {
                borderClass = 'border-border-hover';
                titleText = `${day.date}: ${day.percentage}% Completed`;
              }
              
              return (
                <div 
                  key={idx}
                  className={`relative aspect-square rounded-md overflow-hidden border bg-bg-primary flex flex-col items-center justify-center text-[10px] font-extrabold font-poppins transition-all hover:scale-105 cursor-help ${borderClass}`}
                  title={titleText}
                >
                  {/* The water level progress fill */}
                  {hasCompletions && (
                    <div 
                      className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${
                        isFrozen 
                          ? 'bg-cyan-500/20' 
                          : isPerfect 
                            ? 'bg-btn-primary-bg' 
                            : 'bg-btn-primary-bg/15 dark:bg-white/15'
                      }`}
                      style={{ height: `${day.percentage}%` }}
                    />
                  )}
                  
                  {/* The date number */}
                  <span className={`relative z-10 ${isPerfect && !isFrozen ? 'text-btn-primary-text' : 'text-text-primary'}`}>
                    {day.date.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-3 text-[9px] font-bold tracking-wider text-neutral-500 uppercase pt-2 select-none">
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-bg-primary border border-border-primary" /> Missed (0%)</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-bg-primary border border-cyan-800" /> Frozen</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-btn-primary-bg/15 dark:bg-white/15 border border-border-hover" /> Partial</span>
            <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded bg-btn-primary-bg border border-btn-primary-bg" /> 100% Perfect</span>
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
                  <div className="flex flex-col gap-1">
                    <span className="font-extrabold text-text-primary font-poppins">{item.name}</span>
                    <div className="flex items-center gap-1.5">
                      {item.trend === 'improving' ? (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none leading-none shrink-0">
                          ↑ Improving
                        </span>
                      ) : item.trend === 'maintaining' ? (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none leading-none shrink-0">
                          → Maintaining
                        </span>
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-neutral-500/10 text-neutral-500 border border-neutral-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 select-none leading-none shrink-0">
                          Starting
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider bg-card-bg px-2 py-0.5 rounded border border-border-primary self-start">
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

        {/* Habit Diagnostician & Failure Analysis */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4 lg:col-span-2 animate-fadeIn">
          <div className="flex items-center gap-2 select-none border-b border-border-primary pb-3">
            <Icons.Activity className="h-4 w-4 text-red-500" />
            <div>
              <h3 className="text-sm font-extrabold font-poppins text-text-primary">Habit Diagnostician & Failure Analysis</h3>
              <p className="text-[10px] text-neutral-500">Identify your most missed habits in the last 28 days and get Atomic Habit strategies to succeed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* Left Column: Failure Rates Bar Chart list */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold font-poppins text-text-primary uppercase tracking-wider">Missed Habits Ranking</h4>
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                {sortedFailureList.map(item => {
                  const isPerfect = item.missedCount === 0;
                  return (
                    <div key={item.habit.id} className="space-y-1.5 animate-fadeIn">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-bg-primary border border-border-primary text-text-primary">
                            {getDynamicIcon(item.habit.icon)}
                          </div>
                          <span className="font-extrabold text-text-primary font-poppins">{item.habit.name}</span>
                        </div>
                        {isPerfect ? (
                          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider bg-emerald-500/10 dark:bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20">
                            0% Failure (Perfect)
                          </span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider bg-red-500/10 dark:bg-red-500/5 px-2 py-0.5 rounded border border-red-500/20">
                            Missed {item.missedCount} days ({item.failureRate}% failure)
                          </span>
                        )}
                      </div>
                      
                      <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden border border-border-primary">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isPerfect ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{ width: `${isPerfect ? 100 : item.failureRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {sortedFailureList.length === 0 && (
                  <div className="text-center py-8 text-xs text-neutral-500 font-medium">
                    <span className="font-bold text-text-primary">Perfect Consistency!</span> No habits missed in the last 28 days.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Tailored Prescription Panel */}
            <div className="p-4 border border-border-primary rounded-lg bg-bg-primary/50 flex flex-col justify-between min-h-[300px] space-y-4">
              {mostFailing ? (
                <>
                  <div className="flex-1">
                    {isLoadingAi || (!aiResponse && !aiError) ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3 animate-pulse">
                        <Icons.Loader2 className="h-6 w-6 animate-spin text-text-primary" />
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">AI Coach is reading your routine...</span>
                      </div>
                    ) : aiResponse ? (
                      <div className="space-y-3 animate-fadeIn">
                        <div className="flex items-center gap-2 border-b border-border-primary pb-2">
                          <Icons.Sparkles className="h-4.5 w-4.5 text-amber-500 fill-amber-500 animate-pulse" />
                          <div>
                            <h4 className="text-xs font-black font-poppins text-text-primary">AI Success Blueprint</h4>
                            <p className="text-[9px] text-neutral-500">James Clear Methodology Coach</p>
                          </div>
                        </div>
                        <div className="bg-card-bg border border-border-primary p-4 rounded-lg max-h-[220px] overflow-y-auto select-text">
                          {renderAiBlueprint(aiResponse)}
                        </div>
                      </div>
                    ) : null}

                    {aiError && (
                      <div className="mt-3 p-3 border border-red-500/20 bg-red-500/10 text-red-500 rounded text-[11px] font-bold">
                        {aiError}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border-primary flex items-center justify-end">
                    {!isLoadingAi && (
                      <button
                        onClick={askAiCoach}
                        className="bg-btn-primary-bg border border-btn-primary-bg text-btn-primary-text font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md select-none"
                      >
                        <Icons.Sparkles className="h-3 w-3 text-amber-500 fill-amber-500 animate-pulse" />
                        {aiResponse ? 'Ask AI Again' : 'Consult AI Coach'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                  <Icons.Trophy className="h-8 w-8 text-amber-500 animate-bounce" />
                  <span className="text-xs font-bold text-text-primary">Perfect Consistency Reached!</span>
                  <p className="text-[10px] text-neutral-500 max-w-[200px]">
                    No habits missed in the last 28 days. You have successfully aligned your daily votes with your target identities. Keep going!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Consistency Recharts Bar */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
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

        {/* Circadian Rhythm consistency Bar */}
        <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
          <div>
            <h3 className="text-sm font-extrabold font-poppins text-text-primary">Consistency by Circadian Phase</h3>
            <p className="text-[10px] text-neutral-500">Average completion rate for each circadian phase (Last 14 Days)</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circadianCompletionRates} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  formatter={(value, _, props) => [`${value}% (${props.payload.completions})`, 'Consistency']}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="#8b5cf6" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </>
  ) : activeAnalyticsTab === 'wellbeing' ? (
      /* Wellbeing Insights View */
      <div className="space-y-6 animate-fadeIn">
        {!hasWellbeingData ? (
          <div className="cred-card p-12 text-center rounded-xl border border-border-primary space-y-4 select-none">
            <div className="inline-flex p-4 rounded-full bg-card-bg border border-border-primary text-neutral-500">
              <Icons.Activity className="h-8 w-8" />
            </div>
            <div className="max-w-xs mx-auto">
              <h4 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">No Wellbeing Data</h4>
              <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
                Log sleep, mood, energy, or hydration in the routines page to populate your analyst reports.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 select-none">
              <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">Avg Sleep</span>
                  <Icons.Bed className="h-4 w-4 text-neutral-500 shrink-0" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
                    {avgSleep} <span className="text-neutral-500 text-xs font-normal">Hrs / Night</span>
                  </div>
                  <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">Last 14 days average</p>
                </div>
              </div>

              <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">Mood Positivity</span>
                  <Icons.Smile className="h-4 w-4 text-neutral-500 shrink-0" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
                    {moodPositivityRate}%
                  </div>
                  <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">Neutral or Positive days</p>
                </div>
              </div>

              <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">Avg Energy</span>
                  <Icons.Zap className="h-4 w-4 text-neutral-500 shrink-0" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
                    {avgEnergyLabel}
                  </div>
                  <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">Dominant vitality state</p>
                </div>
              </div>

              <div className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg flex flex-col justify-between min-h-[110px]">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 font-poppins">Avg Hydration</span>
                  <Icons.Droplet className="h-4 w-4 text-neutral-500 shrink-0" />
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-black text-text-primary font-poppins tracking-tight leading-none">
                    {avgWater} <span className="text-neutral-500 text-xs font-normal">L / Day</span>
                  </div>
                  <p className="text-[9px] text-neutral-450 mt-1.5 uppercase font-bold tracking-wider leading-none">Daily volume logged</p>
                </div>
              </div>
            </div>

            {/* Wellbeing Charts Grid 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary">Sleep & Energy Correlation</h3>
                  <p className="text-[10px] text-neutral-500">Sleep duration (Line) vs Energy score (Bars: 3=High, 2=Med, 1=Low)</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sleepEnergyData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--btn-secondary-border)" fontSize={10} tickLine={false} />
                      <YAxis yAxisId="left" stroke="var(--btn-secondary-border)" fontSize={10} tickLine={false} domain={[0, 12]} tickFormatter={v => `${v}h`} />
                      <YAxis yAxisId="right" orientation="right" stroke="var(--btn-secondary-border)" fontSize={10} tickLine={false} domain={[0, 3]} tickFormatter={v => v === 3 ? 'High' : v === 2 ? 'Med' : v === 1 ? 'Low' : ''} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                      <Bar yAxisId="right" dataKey="energy" fill="var(--btn-primary-bg)" radius={[2, 2, 0, 0]} maxBarSize={20} opacity={0.4} name="Energy Level" />
                      <Line yAxisId="left" type="monotone" dataKey="sleepHours" stroke="#f43f5e" strokeWidth={2.5} name="Sleep Hours" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary">Hydration Intake vs Target</h3>
                  <p className="text-[10px] text-neutral-500">Daily water intake (liters) vs daily target</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hydrationData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" stroke="var(--btn-secondary-border)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--btn-secondary-border)" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="actual" stroke="#0ea5e9" fill="rgba(14, 165, 233, 0.15)" strokeWidth={2.5} name="Intake (L)" />
                      <Line type="monotone" dataKey="target" stroke="#6b7280" strokeDasharray="4 4" dot={false} strokeWidth={1.5} name="Target (L)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Wellbeing Charts Grid 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary">Mood Distribution (Last 30 Days)</h3>
                  <p className="text-[10px] text-neutral-500">Frequency of daily mood states</p>
                </div>
                {moodChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs font-bold text-neutral-500 uppercase">No Mood Logs</div>
                ) : (
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="h-44 w-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={moodChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                            {moodChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {moodChartData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="uppercase tracking-wider">{item.name}:</span>
                          <span className="text-text-primary font-black">{item.value} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary">Energy Distribution (Last 30 Days)</h3>
                  <p className="text-[10px] text-neutral-500">Frequency of daily physical energy states</p>
                </div>
                {energyChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-xs font-bold text-neutral-500 uppercase">No Energy Logs</div>
                ) : (
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
                    <div className="h-44 w-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={energyChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                            {energyChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5">
                      {energyChartData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] font-bold text-neutral-600 dark:text-neutral-400">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="uppercase tracking-wider">{item.name}:</span>
                          <span className="text-text-primary font-black">{item.value} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    ) : (
      /* Improvements & Recovery View */
      <div className="space-y-6 animate-fadeIn select-none">
        {/* Intro Header */}
        <div className="cred-card p-6 rounded-xl border border-border-primary bg-card-bg/40 backdrop-blur-sm shadow-sm space-y-2">
          <h3 className="text-sm font-black font-poppins text-emerald-500 flex items-center gap-1.5">
            <span>🍃</span>
            <span>Eco Leaf Recovery Systems</span>
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed font-semibold uppercase tracking-wider">
            Consistent failure happens. Recovery Mode helps you scale down your habits to micro-actions (sub-habits) to maintain the daily voting habit streak. When consistency is rebuilt (7+ days), you can safely upgrade.
          </p>
        </div>

        {(() => {
          const activeRecovery = habits.filter(h => !h.is_archived && getRecoveryData(h));
          const eligibleRecovery = habits.filter(h => isEligibleForRecovery(h, logs, freezes, profile.day_offset_hours));

          if (activeRecovery.length === 0 && eligibleRecovery.length === 0) {
            return (
              <div className="text-center py-12 border border-dashed border-border-primary rounded-xl bg-card-bg/10">
                <Icons.Leaf className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-450">All Routines Stable</h4>
                <p className="text-[10px] text-neutral-505 mt-1 max-w-xs mx-auto font-bold uppercase tracking-wider">
                  No habits are currently failing or in Recovery Mode. Keep up the consistency!
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {/* Active Recovery Section */}
              {activeRecovery.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Active Recoveries ({activeRecovery.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeRecovery.map(h => {
                      const rec = getRecoveryData(h)!;
                      const rStats = getRecoveryStats(h, logs, freezes, profile.day_offset_hours)!;
                      const improvement = rStats.duringRate - rStats.beforeRate;

                      return (
                        <div key={h.id} className="cred-card p-5 rounded-xl border border-emerald-500/25 bg-card-bg space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="text-sm font-extrabold text-text-primary font-poppins">{h.name}</h5>
                              <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold mt-0.5">
                                Started recovery on {rec.recovery_start_date}
                              </p>
                            </div>
                            <span className="text-[9px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">
                              Streak: {rStats.currentStreak}d
                            </span>
                          </div>

                          {/* Before vs During Metric comparison */}
                          <div className="grid grid-cols-2 gap-3 bg-neutral-950/30 p-3 rounded-lg border border-border-primary/50">
                            <div>
                              <span className="block text-[8px] font-black uppercase text-neutral-500 tracking-wider">Before Rate</span>
                              <span className="text-base font-extrabold text-neutral-400">{rStats.beforeRate}%</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-black uppercase text-emerald-500 tracking-wider">During Rate</span>
                              <span className="text-base font-extrabold text-emerald-500 flex items-center gap-1.5">
                                <span>{rStats.duringRate}%</span>
                                {improvement > 0 && (
                                  <span className="text-[9px] font-black bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-400">
                                    +{improvement}%
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Sub-habits checklist read-only view */}
                          <div className="space-y-1.5 pt-1">
                            <span className="block text-[8px] font-black uppercase text-neutral-500 tracking-wider">Simplified Sub-Actions</span>
                            <div className="space-y-1">
                              {rec.sub_habits.map((sub) => (
                                <div key={sub.id} className="text-xs font-semibold text-text-primary flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span>{sub.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Upgrade or Archive CTA */}
                          <div className="pt-2 border-t border-border-primary flex justify-between gap-3">
                            {rStats.currentStreak >= 7 ? (
                              <button
                                onClick={() => {
                                  useStore.getState().setEditHabitId(h.id);
                                  useStore.getState().setShowHabitForm(true);
                                  if (onNavigate) onNavigate('habits');
                                }}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-450 text-black text-[10px] font-black uppercase tracking-wider py-2 rounded-lg cursor-pointer text-center"
                              >
                                🚀 Ready to Upgrade!
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  useStore.getState().setEditHabitId(h.id);
                                  useStore.getState().setShowHabitForm(true);
                                  if (onNavigate) onNavigate('habits');
                                }}
                                className="flex-1 bg-neutral-900 border border-border-primary hover:border-border-hover text-text-primary text-[10px] font-black uppercase tracking-wider py-2 rounded-lg cursor-pointer text-center"
                              >
                                Modify (Edit)
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to archive "${h.name}"?`)) {
                                  await useStore.getState().archiveHabit(h.id);
                                }
                              }}
                              className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer transition-colors"
                            >
                              Archive
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Eligible for Recovery Section */}
              {eligibleRecovery.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-500">Suggested Recoveries ({eligibleRecovery.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibleRecovery.map(h => (
                      <div key={h.id} className="cred-card p-5 rounded-xl border border-amber-500/25 bg-card-bg space-y-3">
                        <div>
                          <h5 className="text-sm font-extrabold text-text-primary font-poppins">{h.name}</h5>
                          <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-bold mt-0.5">
                            Consistent failures detected (missed/skipped for 3+ consecutive days)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              useStore.getState().setEditHabitId(h.id);
                              useStore.getState().setShowHabitForm(true);
                              if (onNavigate) onNavigate('habits');
                            }}
                            className="flex-1 bg-amber-500 hover:bg-amber-450 text-black text-[10px] font-black uppercase tracking-wider py-2 rounded-lg cursor-pointer text-center flex items-center justify-center gap-1.5"
                          >
                            <Icons.Leaf className="h-3 w-3 fill-current text-black" />
                            <span>Enter Recovery Mode</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Are you sure you want to archive "${h.name}"?`)) {
                                await useStore.getState().archiveHabit(h.id);
                              }
                            }}
                            className="bg-neutral-900 border border-border-primary hover:border-border-hover text-rose-500 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg cursor-pointer"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    )}

  </div>
);
};
