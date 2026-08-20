import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Bed,
  Smile,
  CloudRain,
  Frown,
  Meh,
  Sliders,
  Clock,
  Zap,
  Battery,
  Target,
  Award,
  BookOpen,
  Calendar,
  Trash2,
  Check
} from 'lucide-react';

interface DashboardProps {}

const LIFE_PHASES_META = [
  { id: 'all_day', name: 'All Day / Optional', desc: 'No specific time constraint', icon: Sparkles },
  { id: 'phase_1', name: 'Phase 1 (1 PM - 4 PM)', desc: 'Afternoon Kickoff', icon: Sun },
  { id: 'phase_2', name: 'Phase 2 (4 PM - 8 PM)', desc: 'Prime Focus', icon: Activity },
  { id: 'phase_3', name: 'Phase 3 (8 PM - 12 AM)', desc: 'Night Shift Core', icon: Brain },
  { id: 'phase_4', name: 'Phase 4 (12 AM - 4 AM)', desc: 'Late Night Burn', icon: Briefcase }
];

interface CustomDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  icon?: React.ReactNode;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative flex flex-col gap-1 select-none">
      <span className="text-[8px] font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-[10px] text-text-primary font-bold flex items-center justify-between gap-2 focus:border-indigo-500 cursor-pointer min-w-[140px] hover:border-neutral-400 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {activeOption.label}
        </span>
        <ChevronDown className={`h-3 w-3 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 md:left-0 md:right-auto top-full mt-1.5 w-48 bg-white dark:bg-neutral-950 border border-border-primary rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-fadeIn">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-[10px] text-left font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  opt.value === value
                    ? 'bg-indigo-500/10 text-indigo-500'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                }`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <span className="text-indigo-500 text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface CustomCalendarPickerProps {
  value: string;
  onChange: (val: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
}

const CustomCalendarPicker: React.FC<CustomCalendarPickerProps> = ({
  value,
  onChange,
  isOpen,
  setIsOpen,
  calendarMonth,
  setCalendarMonth
}) => {
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { numDays, firstDay };
  };

  const { numDays, firstDay } = getDaysInMonth(calendarMonth);
  const monthName = calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    const y = calendarMonth.getFullYear();
    const m = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(i).padStart(2, '0');
    days.push(`${y}-${m}-${dayStr}`);
  }

  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold flex items-center gap-2 hover:border-neutral-400 transition-colors cursor-pointer select-none"
      >
        <Calendar className="h-4 w-4 text-indigo-500" />
        <span>Due: {value}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-neutral-950 border border-border-primary rounded-2xl shadow-xl z-50 p-4 select-none animate-fadeIn">
            {/* Header switcher */}
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-neutral-500 hover:text-text-primary cursor-pointer text-xs font-bold"
              >
                ◀
              </button>
              <span className="text-[10px] font-black uppercase text-text-primary tracking-wider font-poppins">
                {monthName}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-neutral-500 hover:text-text-primary cursor-pointer text-xs font-bold"
              >
                ▶
              </button>
            </div>

            {/* Weekdays header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {weekdays.map(wd => (
                <span key={wd} className="text-[8px] font-black uppercase text-neutral-400 dark:text-neutral-500">
                  {wd}
                </span>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((dayStr, idx) => {
                if (!dayStr) return <div key={`empty-${idx}`} />;
                const isSelected = dayStr === value;
                const dateNum = dayStr.split('-')[2];
                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => {
                      onChange(dayStr);
                      setIsOpen(false);
                    }}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500 text-white font-black'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                    }`}
                  >
                    {parseInt(dateNum, 10)}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = () => {
  const profile = useStore(state => state.profile);
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const freezes = useStore(state => state.freezes);
  const logHabit = useStore(state => state.logHabit);
  const sleepLogs = useStore(state => state.sleepLogs) || [];
  const logSleep = useStore(state => state.logSleep);
  const deleteSleepLog = useStore(state => state.deleteSleepLog);
  const moodLogs = useStore(state => state.moodLogs) || [];
  const logMood = useStore(state => state.logMood);
  const deleteMoodLog = useStore(state => state.deleteMoodLog);

  const meditationLogs = useStore(state => state.meditationLogs) || [];
  const logMeditation = useStore(state => state.logMeditation);
  const deleteMeditationLog = useStore(state => state.deleteMeditationLog);

  const yearlyPlans = useStore(state => state.yearlyPlans) || [];
  const addYearlyPlan = useStore(state => state.addYearlyPlan);
  const deleteYearlyPlan = useStore(state => state.deleteYearlyPlan);

  const quarterlyGoals = useStore(state => state.quarterlyGoals) || [];
  const addQuarterlyGoal = useStore(state => state.addQuarterlyGoal);
  const toggleQuarterlyGoal = useStore(state => state.toggleQuarterlyGoal);
  const deleteQuarterlyGoal = useStore(state => state.deleteQuarterlyGoal);

  const milestones = useStore(state => state.milestones) || [];
  const addMilestone = useStore(state => state.addMilestone);
  const toggleMilestone = useStore(state => state.toggleMilestone);
  const deleteMilestone = useStore(state => state.deleteMilestone);

  const weeklyReviews = useStore(state => state.weeklyReviews) || [];
  const saveWeeklyReview = useStore(state => state.saveWeeklyReview);


  const plannerPriorities = useStore(state => state.plannerPriorities) || [];
  const addPlannerPriority = useStore(state => state.addPlannerPriority);
  const togglePlannerPriority = useStore(state => state.togglePlannerPriority);
  const deletePlannerPriority = useStore(state => state.deletePlannerPriority);
  
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editHabitId, setEditHabitId] = useState<string | undefined>(undefined);
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [selectedMood, setSelectedMood] = useState<'hyperactive' | 'happy' | 'okay' | 'sad' | 'depressed' | ''>('');
  const [selectedEnergy, setSelectedEnergy] = useState<'high' | 'medium' | 'low' | ''>('');
  
  const [sleepViewMode, setSleepViewMode] = useState<'input' | 'chart'>('input');
  const [moodViewMode, setMoodViewMode] = useState<'input' | 'chart'>('input');
  const [moodActivePhase, setMoodActivePhase] = useState<'phase_1' | 'phase_2' | 'phase_3' | 'phase_4'>('phase_1');
  const [groupBy, setGroupBy] = useState<'phase' | 'category' | 'flat'>('phase');
  const [sortBy, setSortBy] = useState<'default' | 'uncompleted' | 'failing' | 'alpha'>('default');
  const [filterBy, setFilterBy] = useState<'all' | 'uncompleted' | 'completed' | 'salah' | 'habits'>('all');
  const [dashboardTab, setDashboardTab] = useState<'checklist' | 'trackers' | 'planner'>('checklist');
  const [meditationDuration, setMeditationDuration] = useState(0);
  const [meditationTarget, setMeditationTarget] = useState(15);
  const [meditationViewMode, setMeditationViewMode] = useState<'input' | 'chart'>('input');

  const [newYearlyTitle, setNewYearlyTitle] = useState('');
  const [newQuarterlyTitle, setNewQuarterlyTitle] = useState<Record<string, string>>({});
  const [newQuarterlyQuarter, setNewQuarterlyQuarter] = useState<Record<string, 'Q1' | 'Q2' | 'Q3' | 'Q4'>>({});
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [reviewWins, setReviewWins] = useState('');
  const [reviewChallenges, setReviewChallenges] = useState('');
  const [reviewNextSteps, setReviewNextSteps] = useState('');
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newPriorityDueDate, setNewPriorityDueDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const categories = useStore(state => state.categories) || [];
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

  const currentSleepLog = sleepLogs.find(s => s.logical_date === selectedDate);
  const sleepDuration = currentSleepLog ? Number(currentSleepLog.duration_hours) : 0;

  useEffect(() => {
    if (currentSleepLog) {
      setSleepStart(currentSleepLog.start_time);
      setSleepEnd(currentSleepLog.end_time);
    } else {
      setSleepStart('');
      setSleepEnd('');
    }
  }, [currentSleepLog, selectedDate]);

  const currentMoodLog = moodLogs.find(m => m.logical_date === selectedDate && m.phase === moodActivePhase);

  useEffect(() => {
    if (currentMoodLog) {
      setSelectedMood(currentMoodLog.mood);
      setSelectedEnergy(currentMoodLog.energy);
    } else {
      setSelectedMood('');
      setSelectedEnergy('');
    }
  }, [currentMoodLog, selectedDate, moodActivePhase]);

  const currentMeditationLog = meditationLogs.find(m => m.logical_date === selectedDate);

  useEffect(() => {
    if (currentMeditationLog) {
      setMeditationDuration(Number(currentMeditationLog.duration_minutes));
      setMeditationTarget(Number(currentMeditationLog.target_minutes));
    } else {
      setMeditationDuration(0);
      setMeditationTarget(15);
    }
  }, [currentMeditationLog, selectedDate]);

  const getMondayOfDateStr = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, '0');
    const dayNum = String(monday.getDate()).padStart(2, '0');
    return `${y}-${m}-${dayNum}`;
  };

  const activeMonday = getMondayOfDateStr(selectedDate);
  const currentWeeklyReview = weeklyReviews.find(w => w.week_start_date === activeMonday);

  useEffect(() => {
    if (currentWeeklyReview) {
      setReviewWins(currentWeeklyReview.wins);
      setReviewChallenges(currentWeeklyReview.challenges);
      setReviewNextSteps(currentWeeklyReview.next_steps);
    } else {
      setReviewWins('');
      setReviewChallenges('');
      setReviewNextSteps('');
    }
  }, [currentWeeklyReview, selectedDate]);

  useEffect(() => {
    setNewPriorityDueDate(addDays(selectedDate, 1));
  }, [selectedDate]);



  // Helper to generate last 7 days of dates up to selectedDate
  const getLast7Days = (endDateStr: string) => {
    const dates = [];
    const endDate = new Date(endDateStr + 'T00:00:00');
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(endDate.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  const getLinePath = (points: {x: number, y: number}[]) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');
  };

  const getAreaPath = (points: {x: number, y: number}[], bottomY: number) => {
    if (points.length === 0) return '';
    const linePath = getLinePath(points);
    return `${linePath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  };

  const last7Days = getLast7Days(selectedDate);

  // Sleep Chart data points
  const sleepChartData = last7Days.map(dateStr => {
    const log = sleepLogs.find(s => s.logical_date === dateStr);
    return {
      date: dateStr,
      label: dateStr.split('-').slice(1).join('/'),
      hours: log ? Number(log.duration_hours) : 0
    };
  });

  // Mood/Energy Chart data points
  const moodScoreMap: Record<string, number> = { depressed: 1, sad: 2, okay: 3, happy: 4, hyperactive: 5 };
  const energyScoreMap: Record<string, number> = { low: 1, medium: 2, high: 3 };

  const moodChartData = last7Days.map(dateStr => {
    const dayLogs = moodLogs.filter(m => m.logical_date === dateStr);
    if (dayLogs.length === 0) {
      return {
        date: dateStr,
        label: dateStr.split('-').slice(1).join('/'),
        mood: 0,
        energy: 0
      };
    }
    const moodSum = dayLogs.reduce((sum, log) => sum + (moodScoreMap[log.mood] || 0), 0);
    const energySum = dayLogs.reduce((sum, log) => sum + (energyScoreMap[log.energy] || 0), 0);
    return {
      date: dateStr,
      label: dateStr.split('-').slice(1).join('/'),
      mood: Number((moodSum / dayLogs.length).toFixed(2)),
      energy: Number((energySum / dayLogs.length).toFixed(2))
    };
  });

  // Meditation Chart data points
  const meditationChartData = last7Days.map(dateStr => {
    const log = meditationLogs.find(m => m.logical_date === dateStr);
    return {
      date: dateStr,
      label: dateStr.split('-').slice(1).join('/'),
      duration: log ? Number(log.duration_minutes) : 0,
      target: log ? Number(log.target_minutes) : 15
    };
  });

  const getHabitFailureRate = (habitId: string) => {
    const h = habits.find(hab => hab.id === habitId);
    if (!h) return 0;
    const estDate = new Date('2026-08-18T00:00:00');
    const creationDate = new Date(h.created_at);
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
      
      if (dateStr < getLogicalDate(startDate, profile.day_offset_hours)) break;
      
      if (isHabitScheduledForDate(h, dateStr)) {
        activeDaysCount++;
        const log = logs.find(l => l.habit_id === h.id && l.logical_date === dateStr);
        const hasFreeze = freezes.some(f => f.habit_id === h.id && f.logical_date === dateStr);
        
        if (log) {
          const count = Number(log.count_completed);
          const target = Number(h.target_count);
          const minVal = h.min_version_enabled ? Number(h.min_version_count) : target;
          const completed = count >= target || (h.min_version_enabled && count >= minVal);
          if (!completed && !hasFreeze) missedDaysCount++;
        } else if (!hasFreeze) {
          missedDaysCount++;
        }
      }
      current.setDate(current.getDate() - 1);
    }
    
    return activeDaysCount > 0 ? (missedDaysCount / activeDaysCount) * 100 : 0;
  };

  const getHabitListMetrics = (habitsList: typeof habits) => {
    let completed = 0;
    let frozen = 0;
    let justified = 0;
    let pending = 0;

    habitsList.forEach(h => {
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

    return { completed, frozen, justified, pending };
  };

  const activeHabits = habits.filter(h => !h.is_archived);
  const scheduledActiveHabits = activeHabits.filter(h => isHabitScheduledForDate(h, selectedDate));

  // If Salah Tracker is enabled, filter Salah and Water habits out of the standard cue phase lists
  const normalActiveHabits = profile.salah_tracker_enabled
    ? scheduledActiveHabits.filter(h => !h.is_salah && !h.name.toLowerCase().includes('water'))
    : scheduledActiveHabits;

  // Filter pipeline
  let processedHabits = [...normalActiveHabits];

  if (filterBy === 'uncompleted') {
    processedHabits = processedHabits.filter(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
      const completed = log && (log.is_skipped || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version));
      return !completed;
    });
  } else if (filterBy === 'completed') {
    processedHabits = processedHabits.filter(h => {
      const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
      const completed = log && (log.is_skipped || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version));
      return completed;
    });
  } else if (filterBy === 'salah') {
    processedHabits = processedHabits.filter(h => h.is_salah);
  } else if (filterBy === 'habits') {
    processedHabits = processedHabits.filter(h => !h.is_salah);
  }

  // Sort pipeline
  if (sortBy === 'alpha') {
    processedHabits.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'uncompleted') {
    processedHabits.sort((a, b) => {
      const logA = logs.find(l => l.habit_id === a.id && l.logical_date === selectedDate);
      const compA = logA && (logA.is_skipped || logA.count_completed >= a.target_count || (a.min_version_enabled && logA.is_minimum_version)) ? 1 : 0;
      
      const logB = logs.find(l => l.habit_id === b.id && l.logical_date === selectedDate);
      const compB = logB && (logB.is_skipped || logB.count_completed >= b.target_count || (b.min_version_enabled && logB.is_minimum_version)) ? 1 : 0;
      
      return compA - compB; // uncompleted first
    });
  } else if (sortBy === 'failing') {
    processedHabits.sort((a, b) => getHabitFailureRate(b.id) - getHabitFailureRate(a.id));
  } else if (sortBy === 'default') {
    const phaseOrder = { all_day: 0, phase_1: 1, phase_2: 2, phase_3: 3, phase_4: 4 };
    processedHabits.sort((a, b) => (phaseOrder[a.cue_phase as keyof typeof phaseOrder] || 0) - (phaseOrder[b.cue_phase as keyof typeof phaseOrder] || 0));
  }

  // Group habits by cue phase (using processedHabits)
  const habitsByPhase = LIFE_PHASES_META.reduce((acc, phase) => {
    acc[phase.id] = processedHabits.filter(h => h.cue_phase === phase.id);
    return acc;
  }, {} as Record<string, typeof processedHabits>);

  // Group habits by category (using processedHabits)
  const habitsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = {
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      habits: processedHabits.filter(h => h.category_id === cat.id)
    };
    return acc;
  }, {} as Record<string, { name: string, color: string, icon: string, habits: typeof processedHabits }>);

  // Uncategorized habits
  const uncategorizedHabits = processedHabits.filter(h => !h.category_id || !categories.some(c => c.id === h.category_id));

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

      {/* Dashboard Tab Selector */}
      <div className="flex border-b border-border-primary/50 gap-4 mb-4 select-none">
        <button
          onClick={() => setDashboardTab('checklist')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            dashboardTab === 'checklist'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Checklist ({processedHabits.length})
        </button>
        <button
          onClick={() => setDashboardTab('trackers')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            dashboardTab === 'trackers'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Wellbeing Trackers
        </button>
        <button
          onClick={() => setDashboardTab('planner')}
          className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
            dashboardTab === 'planner'
              ? 'border-indigo-500 text-indigo-500'
              : 'border-transparent text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Growth Planner
        </button>
      </div>

      {dashboardTab === 'trackers' ? (
        <div className="space-y-6">
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

      {/* Wellbeing Grid (Sleep, Mood & Meditation) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sleep Tracker Section */}
        <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-indigo-500 shrink-0">
                  <Bed className="h-5 w-5 animate-pulse fill-indigo-500/10" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                    Sleep Tracker
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-semibold tracking-wide mt-1 uppercase flex items-center gap-1">
                    <span>Target: 8.00 Hours</span>
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-border-primary rounded-xl">
                <button
                  onClick={() => setSleepViewMode('input')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    sleepViewMode === 'input'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Sliders className="h-3 w-3" />
                  <span>Log</span>
                </button>
                <button
                  onClick={() => setSleepViewMode('chart')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    sleepViewMode === 'chart'
                      ? 'bg-white dark:bg-neutral-800 text-indigo-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Activity className="h-3 w-3" />
                  <span>Chart</span>
                </button>
              </div>
            </div>

            {sleepViewMode === 'input' ? (
              /* Input View */
              <div className="space-y-4 mt-4 select-none">
                {/* Row 1: Circular progress ring & details */}
                <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 p-3 border border-border-primary/50 rounded-xl gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center h-14 w-14 shrink-0 select-none">
                      <svg className="h-14 w-14 -rotate-90">
                        <circle
                          className="text-neutral-200 dark:text-neutral-800 stroke-[4px]"
                          fill="transparent"
                          stroke="currentColor"
                          r={22}
                          cx={28}
                          cy={28}
                        />
                        <circle
                          className="text-indigo-500 transition-all duration-500 ease-out stroke-[4px] drop-shadow-[0_0_3px_rgba(99,102,241,0.25)]"
                          strokeDasharray={2 * Math.PI * 22}
                          style={{ strokeDashoffset: (2 * Math.PI * 22) - (Math.min(100, (sleepDuration / 8) * 100) / 100) * (2 * Math.PI * 22) }}
                          strokeLinecap="round"
                          fill="transparent"
                          stroke="currentColor"
                          r={22}
                          cx={28}
                          cy={28}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-text-primary font-poppins leading-none">
                          {Math.round((sleepDuration / 8) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-[8px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Sleep Quality</h4>
                      <div className="text-xs font-extrabold text-text-primary font-poppins leading-none">
                        {sleepDuration} Hrs <span className="text-neutral-500 text-[9px] font-normal">/ 8.00 Hrs</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-indigo-500 leading-none block whitespace-pre-line">
                      {sleepDuration >= 8 ? 'Target Met! 🎉' : `${(8 - sleepDuration).toFixed(2)} Hrs\nLeft`}
                    </span>
                  </div>
                </div>

                {/* Row 2: Time inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Slept At */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Slept At</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl focus-within:border-indigo-500 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <input
                        type="time"
                        value={sleepStart}
                        onChange={(e) => setSleepStart(e.target.value)}
                        className="bg-transparent text-xs text-text-primary font-poppins font-semibold outline-none w-full border-none p-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Woke At */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Woke At</label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl focus-within:border-indigo-500 transition-colors">
                      <Clock className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                      <input
                        type="time"
                        value={sleepEnd}
                        onChange={(e) => setSleepEnd(e.target.value)}
                        className="bg-transparent text-xs text-text-primary font-poppins font-semibold outline-none w-full border-none p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="mt-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-border-primary/50 rounded-xl select-none">
                <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                  Weekly Sleep Duration (Hours)
                </span>
                <div className="h-28 mt-2 flex items-center justify-center">
                  {(() => {
                    const svgW = 450;
                    const svgH = 100;
                    const pad = { top: 15, bottom: 20, left: 30, right: 15 };
                    const pts = sleepChartData.map((d, i) => {
                      const x = pad.left + (i / 6) * (svgW - pad.left - pad.right);
                      const y = pad.top + (1 - Math.min(12, d.hours) / 12) * (svgH - pad.top - pad.bottom);
                      return { x, y, hours: d.hours, label: d.label };
                    });
                    const lPath = getLinePath(pts);
                    const aPath = getAreaPath(pts, svgH - pad.bottom);

                    return (
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal Gridlines */}
                        <line x1={pad.left} y1={pad.top} x2={svgW - pad.right} y2={pad.top} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={pad.top + (svgH - pad.top - pad.bottom) / 2} x2={svgW - pad.right} y2={pad.top + (svgH - pad.top - pad.bottom) / 2} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={svgH - pad.bottom} x2={svgW - pad.right} y2={svgH - pad.bottom} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />

                        {/* Y-Axis Labels */}
                        <text x={pad.left - 6} y={pad.top + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">12h</text>
                        <text x={pad.left - 6} y={pad.top + (svgH - pad.top - pad.bottom) / 2 + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">6h</text>
                        <text x={pad.left - 6} y={svgH - pad.bottom + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">0h</text>

                        {/* Area & Line */}
                        {pts.length > 0 && <path d={aPath} fill="url(#sleepGrad)" />}
                        {pts.length > 0 && <path d={lPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Dots & Values */}
                        {pts.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#6366f1" />
                            {p.hours > 0 && (
                              <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[8px] font-black fill-indigo-500 dark:fill-indigo-400">
                                {p.hours.toFixed(1)}
                              </text>
                            )}
                            <text x={p.x} y={svgH - 4} textAnchor="middle" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">
                              {p.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-primary/50">
            {currentSleepLog && (
              <button
                onClick={() => deleteSleepLog(selectedDate)}
                className="h-9 px-3 border border-border-primary hover:border-red-900/30 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => logSleep(sleepStart, sleepEnd, selectedDate)}
              disabled={!sleepStart || !sleepEnd}
              className="h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              Save Sleep Log
            </button>
          </div>
        </div>

        {/* Mood & Energy Tracker Section */}
        <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-amber-500 shrink-0">
                  <Smile className="h-5 w-5 animate-pulse fill-amber-500/10" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                    Mood & Energy
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-semibold tracking-wide mt-1 uppercase flex items-center gap-1">
                    <span>Log wellbeing per phase</span>
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-border-primary rounded-xl">
                <button
                  onClick={() => setMoodViewMode('input')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    moodViewMode === 'input'
                      ? 'bg-white dark:bg-neutral-800 text-amber-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Sliders className="h-3 w-3" />
                  <span>Log</span>
                </button>
                <button
                  onClick={() => setMoodViewMode('chart')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    moodViewMode === 'chart'
                      ? 'bg-white dark:bg-neutral-800 text-amber-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Activity className="h-3 w-3" />
                  <span>Chart</span>
                </button>
              </div>
            </div>

            {moodViewMode === 'input' ? (
              /* Input View */
              <div className="mt-4 select-none">
                {/* Phase Selection Tabs */}
                <div className="flex border-b border-border-primary/50 gap-2 mb-3">
                  {[
                    { id: 'phase_1', label: 'Phase 1' },
                    { id: 'phase_2', label: 'Phase 2' },
                    { id: 'phase_3', label: 'Phase 3' },
                    { id: 'phase_4', label: 'Phase 4' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setMoodActivePhase(tab.id as any)}
                      className={`pb-1 text-[9px] font-extrabold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                        moodActivePhase === tab.id
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-neutral-500 hover:text-neutral-400'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Mood & Energy Selectors */}
                <div className="grid grid-cols-1 gap-3.5">
                  {/* Mood selector */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                      Mood for {moodActivePhase.toUpperCase().replace('_', ' ')}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { value: 'depressed', icon: CloudRain, label: 'Down', colorClass: 'text-sky-500 border-sky-500/30 hover:border-sky-500 hover:bg-sky-950/10' },
                        { value: 'sad', icon: Frown, label: 'Sad', colorClass: 'text-indigo-400 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-950/10' },
                        { value: 'okay', icon: Meh, label: 'Okay', colorClass: 'text-neutral-500 border-neutral-500/30 hover:border-neutral-500 hover:bg-neutral-950/10' },
                        { value: 'happy', icon: Smile, label: 'Happy', colorClass: 'text-amber-500 border-amber-500/30 hover:border-amber-500 hover:bg-amber-950/10' },
                        { value: 'hyperactive', icon: Zap, label: 'Hyper', colorClass: 'text-red-500 border-red-500/30 hover:border-red-500 hover:bg-red-950/10' }
                      ].map(m => {
                        const MoodIcon = m.icon;
                        const isActive = selectedMood === m.value;
                        return (
                          <button
                            key={m.value}
                            onClick={() => setSelectedMood(m.value as any)}
                            className={`h-11 border rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isActive
                                ? `${m.colorClass.split(' ')[0]} bg-neutral-900 border-current scale-105 font-bold shadow-lg shadow-black/10`
                                : 'border-border-primary text-neutral-500 hover:text-neutral-400'
                            }`}
                          >
                            <MoodIcon className="h-4.5 w-4.5" />
                            <span className="text-[7px] font-extrabold uppercase mt-1 tracking-wider leading-none">{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Energy selector */}
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                      Energy for {moodActivePhase.toUpperCase().replace('_', ' ')}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'low', label: 'Low', colorClass: 'text-red-500 border-red-500/30 hover:border-red-500 hover:bg-red-950/10' },
                        { value: 'medium', label: 'Medium', colorClass: 'text-yellow-500 border-yellow-500/30 hover:border-yellow-500 hover:bg-yellow-950/10' },
                        { value: 'high', label: 'High', colorClass: 'text-green-500 border-green-500/30 hover:border-green-500 hover:bg-green-950/10' }
                      ].map(e => {
                        const isActive = selectedEnergy === e.value;
                        return (
                          <button
                            key={e.value}
                            onClick={() => setSelectedEnergy(e.value as any)}
                            className={`h-10 border rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              isActive
                                ? `${e.colorClass.split(' ')[0]} bg-neutral-900 border-current scale-105 font-bold shadow-lg shadow-black/10`
                                : 'border-border-primary text-neutral-500 hover:text-neutral-400'
                            }`}
                          >
                            <Battery className="h-4.5 w-4.5" />
                            <span className="text-[9px] font-bold uppercase tracking-wider">{e.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="mt-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-border-primary/50 rounded-xl select-none">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                    Weekly Wellbeing (Daily Avg)
                  </span>
                  <div className="flex items-center gap-2 text-[8px] font-extrabold uppercase">
                    <span className="flex items-center gap-1 text-amber-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mood (1-5)
                    </span>
                    <span className="flex items-center gap-1 text-green-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Energy (1-3)
                    </span>
                  </div>
                </div>

                <div className="h-28 mt-2 flex items-center justify-center">
                  {(() => {
                    const svgW = 450;
                    const svgH = 100;
                    const pad = { top: 15, bottom: 20, left: 30, right: 15 };
                    
                    const mPts = moodChartData.map((d, i) => {
                      const x = pad.left + (i / 6) * (svgW - pad.left - pad.right);
                      const y = pad.top + (1 - (d.mood || 0) / 5) * (svgH - pad.top - pad.bottom);
                      return { x, y, val: d.mood, label: d.label };
                    });

                    const ePts = moodChartData.map((d, i) => {
                      const x = pad.left + (i / 6) * (svgW - pad.left - pad.right);
                      const y = pad.top + (1 - (d.energy || 0) / 3) * (svgH - pad.top - pad.bottom);
                      return { x, y, val: d.energy, label: d.label };
                    });

                    const mLine = getLinePath(mPts);
                    const eLine = getLinePath(ePts);

                    return (
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                        {/* Horizontal Gridlines */}
                        <line x1={pad.left} y1={pad.top} x2={svgW - pad.right} y2={pad.top} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={pad.top + (svgH - pad.top - pad.bottom) / 2} x2={svgW - pad.right} y2={pad.top + (svgH - pad.top - pad.bottom) / 2} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={svgH - pad.bottom} x2={svgW - pad.right} y2={svgH - pad.bottom} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />

                        {/* Y-Axis Labels */}
                        <text x={pad.left - 6} y={pad.top + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">Max</text>
                        <text x={pad.left - 6} y={pad.top + (svgH - pad.top - pad.bottom) / 2 + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">Mid</text>
                        <text x={pad.left - 6} y={svgH - pad.bottom + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">Min</text>

                        {/* Lines */}
                        {mPts.length > 0 && <path d={mLine} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                        {ePts.length > 0 && <path d={eLine} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Dots */}
                        {mPts.map((p, idx) => (
                          <circle key={`m-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#f59e0b" />
                        ))}
                        {ePts.map((p, idx) => (
                          <circle key={`e-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="#10b981" />
                        ))}

                        {/* X-Axis Date Labels */}
                        {mPts.map((p, idx) => (
                          <text key={`l-${idx}`} x={p.x} y={svgH - 4} textAnchor="middle" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">
                            {p.label}
                          </text>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border-primary/50">
            {currentMoodLog && (
              <button
                onClick={() => deleteMoodLog(moodActivePhase, selectedDate)}
                className="h-9 px-3 border border-border-primary hover:border-red-900/30 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Reset {moodActivePhase.toUpperCase().replace('_', ' ')}
              </button>
            )}
            <button
              onClick={() => logMood(selectedMood as any, selectedEnergy as any, moodActivePhase, selectedDate)}
              disabled={!selectedMood || !selectedEnergy}
              className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              Save wellbeing Log
            </button>
          </div>
        </div>

        {/* Meditation Tracker Section */}
        <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-teal-500 shrink-0">
                  <Sparkles className="h-5 w-5 animate-pulse fill-teal-500/10" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                    Meditation
                  </h3>
                  <p className="text-[10px] text-teal-500 font-bold tracking-wide mt-1 uppercase flex items-center gap-1">
                    <span>Target: {meditationTarget} min</span>
                  </p>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-900 p-0.5 border border-border-primary rounded-xl">
                <button
                  onClick={() => setMeditationViewMode('input')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    meditationViewMode === 'input'
                      ? 'bg-white dark:bg-neutral-800 text-teal-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Sliders className="h-3 w-3" />
                  <span>Log</span>
                </button>
                <button
                  onClick={() => setMeditationViewMode('chart')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    meditationViewMode === 'chart'
                      ? 'bg-white dark:bg-neutral-800 text-teal-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-400'
                  }`}
                >
                  <Activity className="h-3 w-3" />
                  <span>Chart</span>
                </button>
              </div>
            </div>

            {meditationViewMode === 'input' ? (
              /* Input View */
              <div className="space-y-4 mt-4 select-none">
                {/* Row 1: Circular progress */}
                <div className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50 p-3 border border-border-primary/50 rounded-xl gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center h-14 w-14 shrink-0 select-none">
                      <svg className="h-14 w-14 -rotate-90">
                        <circle
                          className="text-neutral-200 dark:text-neutral-800 stroke-[4px]"
                          fill="transparent"
                          stroke="currentColor"
                          r={22}
                          cx={28}
                          cy={28}
                        />
                        <circle
                          className="text-teal-500 transition-all duration-500 ease-out stroke-[4px] drop-shadow-[0_0_3px_rgba(20,184,166,0.25)]"
                          strokeDasharray={2 * Math.PI * 22}
                          style={{ strokeDashoffset: (2 * Math.PI * 22) - (Math.min(100, (meditationDuration / meditationTarget) * 100) / 100) * (2 * Math.PI * 22) }}
                          strokeLinecap="round"
                          fill="transparent"
                          stroke="currentColor"
                          r={22}
                          cx={28}
                          cy={28}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-text-primary font-poppins leading-none">
                          {Math.round((meditationDuration / meditationTarget) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-[8px] uppercase font-bold text-neutral-600 dark:text-neutral-400 tracking-wider">Mindfulness</h4>
                      <div className="text-xs font-extrabold text-text-primary font-poppins leading-none">
                        {meditationDuration} min <span className="text-neutral-500 text-[9px] font-normal">/ {meditationTarget} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[8px] font-black uppercase text-teal-500 leading-none block whitespace-pre-line">
                      {meditationDuration >= meditationTarget ? 'Zen Master! 🧘' : `${(meditationTarget - meditationDuration).toFixed(0)} min\nleft`}
                    </span>
                  </div>
                </div>

                {/* Row 2: Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Duration Log */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Log Session (Min)</label>
                    <div className="flex items-center justify-between px-3 py-1 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl focus-within:border-teal-500 transition-colors">
                      <button
                        onClick={() => setMeditationDuration(prev => Math.max(0, prev - 5))}
                        className="text-neutral-500 hover:text-teal-500 text-xs font-black p-1 select-none"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={meditationDuration}
                        onChange={(e) => setMeditationDuration(Number(e.target.value))}
                        className="bg-transparent text-xs text-text-primary font-poppins font-semibold outline-none w-12 text-center border-none p-0 cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setMeditationDuration(prev => prev + 5)}
                        className="text-neutral-500 hover:text-teal-500 text-xs font-black p-1 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Daily Target Frequency */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Daily Goal (Min)</label>
                    <div className="flex items-center justify-between px-3 py-1 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl focus-within:border-teal-500 transition-colors">
                      <button
                        onClick={() => setMeditationTarget(prev => Math.max(1, prev - 5))}
                        className="text-neutral-500 hover:text-teal-500 text-xs font-black p-1 select-none"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={meditationTarget}
                        onChange={(e) => setMeditationTarget(Number(e.target.value))}
                        className="bg-transparent text-xs text-text-primary font-poppins font-semibold outline-none w-12 text-center border-none p-0 cursor-pointer [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setMeditationTarget(prev => prev + 5)}
                        className="text-neutral-500 hover:text-teal-500 text-xs font-black p-1 select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Chart View */
              <div className="mt-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 border border-border-primary/50 rounded-xl select-none">
                <span className="text-[9px] uppercase font-extrabold text-neutral-600 dark:text-neutral-400 tracking-wider leading-none">
                  Weekly Meditation History (Minutes)
                </span>
                <div className="h-28 mt-2 flex items-center justify-center">
                  {(() => {
                    const svgW = 450;
                    const svgH = 100;
                    const pad = { top: 15, bottom: 20, left: 30, right: 15 };
                    
                    // Max minutes in chart is 60 or max target
                    const maxVal = Math.max(60, ...meditationChartData.map(d => Math.max(d.duration, d.target)));
                    
                    const pts = meditationChartData.map((d, i) => {
                      const x = pad.left + (i / 6) * (svgW - pad.left - pad.right);
                      const y = pad.top + (1 - d.duration / maxVal) * (svgH - pad.top - pad.bottom);
                      return { x, y, duration: d.duration, target: d.target, label: d.label };
                    });

                    const lPath = getLinePath(pts);
                    const aPath = getAreaPath(pts, svgH - pad.bottom);

                    return (
                      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Horizontal Gridlines */}
                        <line x1={pad.left} y1={pad.top} x2={svgW - pad.right} y2={pad.top} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={pad.top + (svgH - pad.top - pad.bottom) / 2} x2={svgW - pad.right} y2={pad.top + (svgH - pad.top - pad.bottom) / 2} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" strokeDasharray="3,3" />
                        <line x1={pad.left} y1={svgH - pad.bottom} x2={svgW - pad.right} y2={svgH - pad.bottom} className="stroke-neutral-200 dark:stroke-neutral-800" strokeWidth="1" />

                        {/* Y-Axis Labels */}
                        <text x={pad.left - 6} y={pad.top + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">{maxVal}m</text>
                        <text x={pad.left - 6} y={pad.top + (svgH - pad.top - pad.bottom) / 2 + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">{Math.round(maxVal / 2)}m</text>
                        <text x={pad.left - 6} y={svgH - pad.bottom + 3} textAnchor="end" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">0m</text>

                        {/* Area & Line */}
                        {pts.length > 0 && <path d={aPath} fill="url(#medGrad)" />}
                        {pts.length > 0 && <path d={lPath} fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

                        {/* Dots & Values */}
                        {pts.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="3.5" fill="#14b8a6" />
                            {p.duration > 0 && (
                              <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[8px] font-black fill-teal-600 dark:fill-teal-400">
                                {p.duration}m
                              </text>
                            )}
                            <text x={p.x} y={svgH - 4} textAnchor="middle" className="text-[8px] font-bold fill-neutral-400 dark:fill-neutral-500">
                              {p.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border-primary/50">
            {currentMeditationLog && (
              <button
                onClick={() => deleteMeditationLog(selectedDate)}
                className="h-9 px-3 border border-border-primary hover:border-red-900/30 hover:bg-red-950/10 text-neutral-500 hover:text-red-500 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => logMeditation(meditationDuration, meditationTarget, selectedDate)}
              disabled={meditationDuration <= 0}
              className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
            >
              Save meditation Log
            </button>
          </div>
        </div>
      </div>
      </div>
      ) : dashboardTab === 'planner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Plan Tomorrow & Weekly Review */}
          <div className="space-y-6">
            
            {/* Daily Priorities Planner */}
            <div className={`cred-glass p-6 rounded-2xl border border-border-primary space-y-4 relative ${isCalendarOpen ? 'z-30' : 'z-10'}`}>
              <div className="flex items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-indigo-500 shrink-0">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                      Daily Focus Planner
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                      Set and check off priorities for any date
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Priority Form */}
              <div className="space-y-3 p-3 bg-neutral-50 dark:bg-neutral-900/30 border border-border-primary/50 rounded-2xl">
                <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block select-none">
                  Add Strategic Priority
                </span>
                
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newPriorityTitle}
                    onChange={(e) => setNewPriorityTitle(e.target.value)}
                    placeholder="What is the task priority?..."
                    className="h-10 px-3 bg-white dark:bg-neutral-955 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-indigo-500 outline-none"
                  />
                  
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Custom Calendar Picker */}
                    <CustomCalendarPicker
                      value={newPriorityDueDate}
                      onChange={(val) => setNewPriorityDueDate(val)}
                      isOpen={isCalendarOpen}
                      setIsOpen={setIsCalendarOpen}
                      calendarMonth={calendarMonth}
                      setCalendarMonth={setCalendarMonth}
                    />

                    <button
                      onClick={() => {
                        if (newPriorityTitle.trim() && newPriorityDueDate) {
                          addPlannerPriority(newPriorityTitle, newPriorityDueDate);
                          setNewPriorityTitle('');
                        }
                      }}
                      disabled={!newPriorityTitle.trim() || !newPriorityDueDate}
                      className="h-10 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      Schedule Task
                    </button>
                  </div>
                </div>
              </div>

              {/* Priorities List for Current Selected Date */}
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block select-none">
                  Priorities for {selectedDate}
                </span>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {plannerPriorities.filter(p => p.due_date === selectedDate).length > 0 ? (
                    plannerPriorities
                      .filter(p => p.due_date === selectedDate)
                      .map(p => (
                        <div key={p.id} className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-border-primary rounded-xl flex justify-between items-center gap-3 select-none">
                          <div className="flex items-center gap-3">
                            {/* Complete checkbox */}
                            <button
                              onClick={() => togglePlannerPriority(p.id, { is_completed: !p.is_completed, is_skipped: false })}
                              className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                                p.is_completed
                                  ? 'bg-indigo-500 border-indigo-500 text-white'
                                  : 'border-border-primary text-neutral-450 hover:border-neutral-500'
                              }`}
                            >
                              {p.is_completed && <Check className="h-3 w-3 stroke-[3px]" />}
                            </button>

                            <div>
                              <p className={`text-xs font-bold leading-tight ${
                                p.is_completed
                                  ? 'line-through text-neutral-500 opacity-60'
                                  : p.is_skipped
                                  ? 'line-through text-amber-500/70 italic font-medium'
                                  : 'text-text-primary'
                              }`}>
                                {p.title}
                              </p>
                              {p.is_skipped && (
                                <span className="text-[7px] font-black uppercase text-amber-500 tracking-wider mt-0.5 block">
                                  Skipped / Excused
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Skip button */}
                            <button
                              onClick={() => togglePlannerPriority(p.id, { is_skipped: !p.is_skipped, is_completed: false })}
                              className={`px-2.5 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                                p.is_skipped
                                  ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm'
                                  : 'border-border-primary text-neutral-500 hover:border-neutral-400'
                              }`}
                            >
                              Skip
                            </button>
                            {/* Delete button */}
                            <button
                              onClick={() => deletePlannerPriority(p.id)}
                              className="text-neutral-450 hover:text-red-500 transition-colors p-1.5"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic text-center py-4 select-none">
                      No priorities scheduled for this date.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Weekly Review Panel */}
            <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
              <div className="flex justify-between items-start gap-2 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-amber-500 shrink-0">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                      Weekly Reflection
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                      Week of {activeMonday}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Weekly Wins</label>
                  <textarea
                    value={reviewWins}
                    onChange={(e) => setReviewWins(e.target.value)}
                    placeholder="What went well this week? Celebrate your achievements..."
                    rows={2}
                    className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Challenges faced</label>
                  <textarea
                    value={reviewChallenges}
                    onChange={(e) => setReviewChallenges(e.target.value)}
                    placeholder="What friction did you encounter? Any missed habits..."
                    rows={2}
                    className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-neutral-500 tracking-wider">Next Week Adjustments</label>
                  <textarea
                    value={reviewNextSteps}
                    onChange={(e) => setReviewNextSteps(e.target.value)}
                    placeholder="How will you tweak your environment or routines next week?"
                    rows={2}
                    className="p-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2 border-t border-border-primary/50">
                  <button
                    onClick={() => saveWeeklyReview(activeMonday, reviewWins, reviewChallenges, reviewNextSteps)}
                    className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Save Reflection
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Roadmap & Milestones */}
          <div className="space-y-6">
            
            {/* Yearly & Quarterly Roadmap */}
            <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
              <div className="flex items-center justify-between gap-2 select-none">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-teal-500 shrink-0">
                    <Target className="h-5 w-5 text-teal-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                      Strategic Roadmap
                    </h3>
                    <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                      Align yearly plans to quarterly actions
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Yearly Plan Form */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Yearly Vision Plan (e.g. Read 24 books)..."
                  value={newYearlyTitle}
                  onChange={(e) => setNewYearlyTitle(e.target.value)}
                  className="flex-1 h-9 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-teal-500 outline-none"
                />
                <button
                  onClick={() => {
                    if (newYearlyTitle.trim()) {
                      addYearlyPlan(newYearlyTitle);
                      setNewYearlyTitle('');
                    }
                  }}
                  className="h-9 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Add Plan
                </button>
              </div>

              {/* Plans List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {yearlyPlans.map(plan => {
                  const planGoals = quarterlyGoals.filter(g => g.yearly_plan_id === plan.id);
                  return (
                    <div key={plan.id} className="p-4 bg-neutral-50 dark:bg-neutral-900/40 border border-border-primary rounded-2xl space-y-3">
                      <div className="flex justify-between items-center select-none">
                        <span className="text-xs font-black text-text-primary uppercase tracking-wide">
                          {plan.title}
                        </span>
                        <button
                          onClick={() => deleteYearlyPlan(plan.id)}
                          className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Quarters Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                          const goal = planGoals.find(g => g.quarter === q);
                          return (
                            <div key={q} className="p-2.5 bg-white dark:bg-neutral-950 border border-border-primary/50 rounded-xl flex items-center justify-between gap-2">
                              <div>
                                <span className="text-[8px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
                                  {q} Goal
                                </span>
                                {goal ? (
                                  <p className={`text-[10px] font-bold text-text-primary leading-tight mt-0.5 ${goal.is_completed ? 'line-through opacity-50' : ''}`}>
                                    {goal.title}
                                  </p>
                                ) : (
                                  <p className="text-[10px] italic text-neutral-500 mt-0.5">
                                    No goal set
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 select-none">
                                {goal ? (
                                  <>
                                    <button
                                      onClick={() => toggleQuarterlyGoal(goal.id, !goal.is_completed)}
                                      className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                                        goal.is_completed
                                          ? 'bg-teal-500/20 border-teal-500 text-teal-500'
                                          : 'border-border-primary text-neutral-400 hover:border-neutral-500'
                                      }`}
                                    >
                                      {goal.is_completed && <Check className="h-3 w-3 stroke-[3px]" />}
                                    </button>
                                    <button
                                      onClick={() => deleteQuarterlyGoal(goal.id)}
                                      className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  /* Inline setting form */
                                  <div className="flex flex-col items-end gap-1">
                                    <button
                                      onClick={() => {
                                        const titleVal = newQuarterlyTitle[plan.id] || '';
                                        if (titleVal.trim()) {
                                          addQuarterlyGoal(plan.id, q as any, titleVal);
                                          setNewQuarterlyTitle(prev => ({ ...prev, [plan.id]: '' }));
                                        }
                                      }}
                                      className="text-[9px] font-black uppercase tracking-wider text-teal-500 hover:text-teal-400 cursor-pointer"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Goal Inline Creator Input Field (if any quarter is unset) */}
                      {planGoals.length < 4 && (
                        <div className="pt-2 border-t border-border-primary/50 flex gap-2">
                          <select
                            value={newQuarterlyQuarter[plan.id] || 'Q1'}
                            onChange={(e) => setNewQuarterlyQuarter(prev => ({ ...prev, [plan.id]: e.target.value as any }))}
                            className="h-8 px-2 bg-white dark:bg-neutral-950 border border-border-primary rounded-xl text-[10px] text-text-primary font-bold outline-none cursor-pointer"
                          >
                            {['Q1', 'Q2', 'Q3', 'Q4']
                              .filter(quarterOption => !planGoals.some(g => g.quarter === quarterOption))
                              .map(quarterOption => (
                                <option key={quarterOption} value={quarterOption}>{quarterOption}</option>
                              ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Set new Quarterly goal..."
                            value={newQuarterlyTitle[plan.id] || ''}
                            onChange={(e) => setNewQuarterlyTitle(prev => ({ ...prev, [plan.id]: e.target.value }))}
                            className="flex-1 h-8 px-2.5 bg-white dark:bg-neutral-950 border border-border-primary rounded-xl text-[10px] text-text-primary font-bold outline-none"
                          />
                          <button
                            onClick={() => {
                              const q = newQuarterlyQuarter[plan.id] || ['Q1', 'Q2', 'Q3', 'Q4'].find(qo => !planGoals.some(g => g.quarter === qo)) || 'Q1';
                              const title = newQuarterlyTitle[plan.id] || '';
                              if (title.trim()) {
                                addQuarterlyGoal(plan.id, q as any, title);
                                setNewQuarterlyTitle(prev => ({ ...prev, [plan.id]: '' }));
                              }
                            }}
                            className="h-8 px-3 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-850 text-text-primary font-extrabold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            Save Goal
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {yearlyPlans.length === 0 && (
                  <p className="text-xs text-neutral-500 italic text-center py-4">No yearly plans defined yet</p>
                )}
              </div>
            </div>

            {/* Milestone Markers */}
            <div className="cred-glass p-6 rounded-2xl border border-border-primary space-y-4">
              <div className="flex items-center gap-2.5 select-none">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-amber-500 shrink-0">
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                    Milestone Markers
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                    Track critical dates and target milestones
                  </p>
                </div>
              </div>

              {/* Add Milestone Form */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Milestone title (e.g. Launch Beta)..."
                    value={newMilestoneTitle}
                    onChange={(e) => setNewMilestoneTitle(e.target.value)}
                    className="flex-1 h-9 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold placeholder:text-neutral-500 focus:border-amber-500 outline-none"
                  />
                  <input
                    type="date"
                    value={newMilestoneDate}
                    onChange={(e) => setNewMilestoneDate(e.target.value)}
                    className="h-9 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-xs text-text-primary font-bold focus:border-amber-500 outline-none cursor-pointer"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (newMilestoneTitle.trim() && newMilestoneDate) {
                        addMilestone(newMilestoneTitle, newMilestoneDate);
                        setNewMilestoneTitle('');
                        setNewMilestoneDate('');
                      }
                    }}
                    disabled={!newMilestoneTitle.trim() || !newMilestoneDate}
                    className="h-8 px-4 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Add Milestone
                  </button>
                </div>
              </div>

              {/* Milestones List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {milestones
                  .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
                  .map(mil => (
                    <div key={mil.id} className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-border-primary rounded-xl flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleMilestone(mil.id, !mil.is_completed)}
                          className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                            mil.is_completed
                              ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                              : 'border-border-primary text-neutral-400 hover:border-neutral-500'
                          }`}
                        >
                          {mil.is_completed && <Check className="h-3 w-3 stroke-[3px]" />}
                        </button>
                        <div>
                          <p className={`text-xs font-bold leading-tight ${mil.is_completed ? 'line-through opacity-50' : 'text-text-primary'}`}>
                            {mil.title}
                          </p>
                          <span className="text-[8px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">
                            Due: {mil.target_date}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteMilestone(mil.id)}
                        className="text-neutral-500 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                {milestones.length === 0 && (
                  <p className="text-xs text-neutral-500 italic text-center py-4">No milestones defined yet</p>
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
      <>
        {/* Checklist Organizer Toolbar */}
      {scheduledActiveHabits.length > 0 && (
        <div className="cred-glass p-4 rounded-2xl border border-border-primary flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 select-none mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-indigo-500 shrink-0">
              <Sliders className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-black font-poppins text-text-primary uppercase tracking-wider leading-none">
                Checklist Organizer
              </h4>
              <p className="text-[9px] text-neutral-500 font-semibold tracking-wide uppercase mt-1 leading-none">
                Customize checklist sorting & grouping
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Group By selector */}
            <CustomDropdown
              label="Group By"
              value={groupBy}
              onChange={(val) => setGroupBy(val as any)}
              options={[
                { value: 'phase', label: 'Circadian Phases' },
                { value: 'category', label: 'Habit Categories' },
                { value: 'flat', label: 'Consolidated List' }
              ]}
            />

            {/* Sort By selector */}
            <CustomDropdown
              label="Sort By"
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={[
                { value: 'default', label: 'Default Phase Wise' },
                { value: 'uncompleted', label: 'Uncompleted First' },
                { value: 'failing', label: 'Failing First' },
                { value: 'alpha', label: 'Alphabetical (A-Z)' }
              ]}
            />

            {/* Filter selector */}
            <CustomDropdown
              label="Filter By"
              value={filterBy}
              onChange={(val) => setFilterBy(val as any)}
              options={[
                { value: 'all', label: 'All Habits' },
                { value: 'uncompleted', label: 'Uncompleted Only' },
                { value: 'completed', label: 'Completed Only' },
                { value: 'salah', label: 'Salah Tracker Only' },
                { value: 'habits', label: 'Habits Only' }
              ]}
            />
          </div>
        </div>
      )}

      {/* Checklist Sections */}
      <div className="space-y-6">
        {scheduledActiveHabits.length > 0 ? (
          <>
            {groupBy === 'phase' && LIFE_PHASES_META.map(phase => {
              const phaseHabits = habitsByPhase[phase.id] || [];
              if (phaseHabits.length === 0) return null;
              const PhaseIcon = phase.icon;
              const metrics = getHabitListMetrics(phaseHabits);
              const isCollapsed = collapsedPhases[phase.id];

              return (
                <div key={phase.id} className="space-y-3">
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

                    <div className="flex items-center gap-1.5 select-none">
                      {metrics.completed > 0 && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.completed} done
                        </span>
                      )}
                      {metrics.frozen > 0 && (
                        <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.frozen} frozen
                        </span>
                      )}
                      {metrics.justified > 0 && (
                        <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.justified} excused
                        </span>
                      )}
                      {metrics.pending > 0 && (
                        <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.pending} left
                        </span>
                      )}
                      <span className="text-[9px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-border-primary text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none">
                        {phaseHabits.length} {phaseHabits.length === 1 ? 'routine' : 'routines'}
                      </span>
                    </div>
                  </div>

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

            {groupBy === 'category' && (
              <>
                {Object.entries(habitsByCategory).map(([catId, catInfo]) => {
                  if (catInfo.habits.length === 0) return null;
                  const metrics = getHabitListMetrics(catInfo.habits);
                  
                  return (
                    <div key={catId} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border-primary pb-2 select-none">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-lg border border-border-primary flex items-center justify-center shrink-0 font-bold text-[8px]" style={{ backgroundColor: catInfo.color + '20', color: catInfo.color, borderColor: catInfo.color + '40' }}>
                            📁
                          </span>
                          <div>
                            <h3 className="text-xs font-black tracking-wider text-text-primary uppercase font-poppins leading-none">
                              {catInfo.name}
                            </h3>
                            <p className="text-[9px] text-neutral-500 font-semibold tracking-wider uppercase mt-1 leading-none">
                              Habit Category Focus
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 select-none">
                          {metrics.completed > 0 && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.completed} done
                            </span>
                          )}
                          {metrics.frozen > 0 && (
                            <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.frozen} frozen
                            </span>
                          )}
                          {metrics.justified > 0 && (
                            <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.justified} excused
                            </span>
                          )}
                          {metrics.pending > 0 && (
                            <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.pending} left
                            </span>
                          )}
                          <span className="text-[9px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-border-primary text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none">
                            {catInfo.habits.length} {catInfo.habits.length === 1 ? 'routine' : 'routines'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        {catInfo.habits.map(habit => (
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

                {uncategorizedHabits.length > 0 && (() => {
                  const metrics = getHabitListMetrics(uncategorizedHabits);
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border-primary pb-2 select-none">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3.5 h-3.5 rounded-lg border border-border-primary bg-neutral-100 dark:bg-neutral-900 text-neutral-500 flex items-center justify-center shrink-0 font-bold text-[8px]">
                            📁
                          </span>
                          <div>
                            <h3 className="text-xs font-black tracking-wider text-text-primary uppercase font-poppins leading-none">
                              Uncategorized
                            </h3>
                            <p className="text-[9px] text-neutral-500 font-semibold tracking-wider uppercase mt-1 leading-none">
                              No Category Assigned
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 select-none">
                          {metrics.completed > 0 && (
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.completed} done
                            </span>
                          )}
                          {metrics.frozen > 0 && (
                            <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.frozen} frozen
                            </span>
                          )}
                          {metrics.justified > 0 && (
                            <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.justified} excused
                            </span>
                          )}
                          {metrics.pending > 0 && (
                            <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                              {metrics.pending} left
                            </span>
                          )}
                          <span className="text-[9px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-border-primary text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none">
                            {uncategorizedHabits.length} {uncategorizedHabits.length === 1 ? 'routine' : 'routines'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                        {uncategorizedHabits.map(habit => (
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
                })()}
              </>
            )}

            {groupBy === 'flat' && (() => {
              const metrics = getHabitListMetrics(processedHabits);
              if (processedHabits.length === 0) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border-primary pb-2 select-none">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-text-primary shrink-0">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black tracking-wider text-text-primary uppercase font-poppins leading-none">
                          Consolidated Checklist
                        </h3>
                        <p className="text-[9px] text-neutral-500 font-semibold tracking-wider uppercase mt-1 leading-none">
                          All Scheduled Routines
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 select-none">
                      {metrics.completed > 0 && (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.completed} done
                        </span>
                      )}
                      {metrics.frozen > 0 && (
                        <span className="text-[8px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.frozen} frozen
                        </span>
                      )}
                      {metrics.justified > 0 && (
                        <span className="text-[8px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.justified} excused
                        </span>
                      )}
                      {metrics.pending > 0 && (
                        <span className="text-[8px] bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                          {metrics.pending} left
                        </span>
                      )}
                      <span className="text-[9px] bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded-md border border-border-primary text-neutral-500 font-bold uppercase tracking-wider shrink-0 select-none">
                        {processedHabits.length} {processedHabits.length === 1 ? 'routine' : 'routines'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    {processedHabits.map(habit => (
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
            })()}

            {processedHabits.length === 0 && (
              <div className="cred-glass p-8 text-center rounded-2xl border border-border-primary/50 select-none">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">No active habits match the selected organize filters</p>
              </div>
            )}
          </>
        ) : (
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
      </>
      )}

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
