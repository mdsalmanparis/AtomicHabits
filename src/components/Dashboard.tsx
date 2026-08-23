import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { QuarterlyGoal } from '../store/useStore';
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
  Check,
  Edit2,
  Ban,
  Circle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface DashboardProps {
  activeTab: 'habits' | 'growth';
  showHabitForm?: boolean;
  setShowHabitForm?: (show: boolean) => void;
}

const LIFE_PHASES_META = [
  { id: 'all_day', name: 'All Day / Optional', desc: 'No specific time constraint', icon: Sparkles },
  { id: 'phase_1', name: 'Phase 1 (1 PM - 4 PM)', desc: 'Afternoon Kickoff', icon: Sun },
  { id: 'phase_2', name: 'Phase 2 (4 PM - 8 PM)', desc: 'Prime Focus', icon: Activity },
  { id: 'phase_3', name: 'Phase 3 (8 PM - 12 AM)', desc: 'Night Shift Core', icon: Brain },
  { id: 'phase_4', name: 'Phase 4 (12 AM - 4 AM)', desc: 'Late Night Burn', icon: Briefcase }
];

const PHASE_ROMAN_NAMES: Record<string, string> = {
  all_day: 'All Day',
  phase_1: 'Phase I',
  phase_2: 'Phase II',
  phase_3: 'Phase III',
  phase_4: 'Phase IV'
};

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
        className="h-9 px-3 bg-neutral-100 dark:bg-neutral-900 border border-border-primary rounded-xl text-[10px] text-text-primary font-bold flex items-center justify-between gap-2 focus:border-indigo-500 cursor-pointer min-w-[130px] sm:min-w-[140px] shrink-0 hover:border-neutral-400 transition-colors"
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
        className="cred-input h-10 px-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer select-none"
      >
        <Calendar className="h-4 w-4 text-indigo-500" />
        <span>Due: {value}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 bg-card-bg border border-border-primary rounded-xl shadow-xl z-50 p-4 select-none animate-fadeIn">
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

export const Dashboard: React.FC<DashboardProps> = ({ activeTab = 'habits', showHabitForm: propsShowHabitForm, setShowHabitForm: propsSetShowHabitForm }) => {
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

  const quarterlyGoals = useStore(state => state.quarterlyGoals) || [];
  const addQuarterlyGoal = useStore(state => state.addQuarterlyGoal);
  const updateQuarterlyGoal = useStore(state => state.updateQuarterlyGoal);
  const deleteQuarterlyGoal = useStore(state => state.deleteQuarterlyGoal);

  const milestones = useStore(state => state.milestones) || [];
  const addMilestone = useStore(state => state.addMilestone);
  const deleteMilestone = useStore(state => state.deleteMilestone);

  const weeklyReviews = useStore(state => state.weeklyReviews) || [];
  const saveWeeklyReview = useStore(state => state.saveWeeklyReview);


  const plannerPriorities = useStore(state => state.plannerPriorities) || [];
  const addPlannerPriority = useStore(state => state.addPlannerPriority);
  const togglePlannerPriority = useStore(state => state.togglePlannerPriority);
  const deletePlannerPriority = useStore(state => state.deletePlannerPriority);
  
  const [internalShowHabitForm, setInternalShowHabitForm] = useState(false);
  const showHabitForm = propsShowHabitForm !== undefined ? propsShowHabitForm : internalShowHabitForm;
  const setShowHabitForm = propsSetShowHabitForm !== undefined ? propsSetShowHabitForm : setInternalShowHabitForm;
  const [editHabitId, setEditHabitId] = useState<string | undefined>(undefined);
  const [sleepStart, setSleepStart] = useState('');
  const [sleepEnd, setSleepEnd] = useState('');
  const [selectedMood, setSelectedMood] = useState<'hyperactive' | 'happy' | 'okay' | 'sad' | 'depressed' | ''>('');
  const [selectedEnergy, setSelectedEnergy] = useState<'high' | 'medium' | 'low' | ''>('');
  
  const [moodActivePhase, setMoodActivePhase] = useState<'phase_1' | 'phase_2' | 'phase_3' | 'phase_4'>('phase_1');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all_day');
  const [groupBy, setGroupBy] = useState<'phase' | 'category' | 'flat'>('phase');
  const [sortBy, setSortBy] = useState<'default' | 'uncompleted' | 'failing' | 'alpha'>('default');
  const [filterBy, setFilterBy] = useState<'all' | 'uncompleted' | 'completed'>('all');
  const [dashboardTab, setDashboardTab] = useState<'checklist' | 'trackers'>('checklist');
  const [growthTab, setGrowthTab] = useState<'planner' | 'milestones' | 'review' | 'roadmap'>('planner');
  const [meditationDuration, setMeditationDuration] = useState(0);
  const [meditationTarget, setMeditationTarget] = useState(15);

  const [editingGoalTarget, setEditingGoalTarget] = useState<Record<string, string>>({});
  const [editingGoalTargetId, setEditingGoalTargetId] = useState<string | null>(null);
  const [collapsedQuarters, setCollapsedQuarters] = useState<Record<string, boolean>>({});
  const [activeHabitDropdown, setActiveHabitDropdown] = useState<string | null>(null);
  const [activeStatusDropdownId, setActiveStatusDropdownId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState('');
  const [editGoalHabit, setEditGoalHabit] = useState('');
  const [editGoalTarget, setEditGoalTarget] = useState('');
  const [growthNewTitle, setGrowthNewTitle] = useState('');
  const [growthNewQuarter, setGrowthNewQuarter] = useState('Q3-2026');
  const [growthNewHabit, setGrowthNewHabit] = useState('');
  const [growthNewTarget, setGrowthNewTarget] = useState('');
  const [growthActiveHabitDropdown, setGrowthActiveHabitDropdown] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [newMilestoneHabit, setNewMilestoneHabit] = useState('');
  const [reviewWins, setReviewWins] = useState('');
  const [reviewChallenges, setReviewChallenges] = useState('');
  const [reviewNextSteps, setReviewNextSteps] = useState('');
  const [newPriorityTitle, setNewPriorityTitle] = useState('');
  const [newPriorityDueDate, setNewPriorityDueDate] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const categories = useStore(state => state.categories) || [];


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
    setNewPriorityDueDate(selectedDate);
  }, [selectedDate]);





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
    let skipped = 0;
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
          skipped++;
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

    return { completed, skipped, frozen, justified, pending };
  };

  const activeHabits = habits.filter(h => !h.is_archived);

  // Helper to filter scheduled habits for a given date including Friday/non-Friday Salah rules
  const getFilteredScheduledHabitsForDate = (dateStr: string) => {
    const isFriday = new Date(dateStr + 'T00:00:00').getDay() === 5;
    const excludePrayer = isFriday ? 'Dhuhr' : 'Jummah';
    
    return activeHabits.filter(h => {
      if (!isHabitScheduledForDate(h, dateStr)) return false;
      if (h.is_salah && h.name === excludePrayer) return false;
      return true;
    });
  };

  const scheduledActiveHabits = getFilteredScheduledHabitsForDate(selectedDate);

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
    const isFrozen = freezes.some(f => f.logical_date === selectedDate && f.habit_id === h.id);
    if (isFrozen) {
      completedCount++;
    } else if (log) {
      if (log.is_skipped || log.is_justified || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
        completedCount++;
      }
    }
  });

  let welcomeCompleted = 0;
  let welcomeSkipped = 0;
  let welcomeFrozen = 0;
  let welcomeJustified = 0;
  let welcomePending = 0;

  scheduledActiveHabits.forEach(h => {
    const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
    const isFrozen = freezes.some(f => f.logical_date === selectedDate && f.habit_id === h.id);
    
    if (isFrozen) {
      welcomeFrozen++;
    } else if (log) {
      if (log.is_skipped) {
        welcomeSkipped++;
      } else if (log.is_justified) {
        welcomeJustified++;
      } else if (log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
        welcomeCompleted++;
      } else {
        welcomePending++;
      }
    } else {
      welcomePending++;
    }
  });

  const welcomeDoneTotal = welcomeCompleted + welcomeSkipped + welcomeFrozen + welcomeJustified;


  // Helper to calculate weekly trend (last 7 days vs previous 7 days)
  const getWeeklyTrend = () => {
    const current7Days = Array.from({ length: 7 }, (_, i) => addDays(todayLogicalStr, -i));
    const previous7Days = Array.from({ length: 7 }, (_, i) => addDays(todayLogicalStr, -i - 7));
    
    const getAvgCompletion = (days: string[]) => {
      let totalPercentage = 0;
      let trackedDays = 0;
      
      days.forEach(dStr => {
        const dayHabits = getFilteredScheduledHabitsForDate(dStr);
        const dayTotal = dayHabits.length;
        if (dayTotal > 0) {
          let dayCompleted = 0;
          dayHabits.forEach(h => {
            const log = logs.find(l => l.habit_id === h.id && l.logical_date === dStr);
            const isFrozen = freezes.some(f => f.logical_date === dStr && f.habit_id === h.id);
            if (isFrozen) {
              dayCompleted++;
            } else if (log) {
              if (log.is_skipped || log.is_justified || log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
                dayCompleted++;
              }
            }
          });
          totalPercentage += (dayCompleted / dayTotal) * 100;
          trackedDays++;
        }
      });
      
      return trackedDays > 0 ? totalPercentage / trackedDays : 0;
    };
    
    const avgCurrent = getAvgCompletion(current7Days);
    const avgPrevious = getAvgCompletion(previous7Days);
    const diff = Math.round(avgCurrent - avgPrevious);
    
    return {
      avgCurrent: Math.round(avgCurrent),
      avgPrevious: Math.round(avgPrevious),
      diff,
      status: diff > 0 ? 'improving' : diff < 0 ? 'low' : 'maintaining'
    };
  };

  const trend = getWeeklyTrend();

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
      
      {activeTab === 'habits' && (
        <>
          {/* Top Header Card */}
          <div className="cred-glass p-5 sm:p-6 rounded-2xl border border-border-primary space-y-3.5">
            {/* Header row: Left: welcome details, Right: Shields */}
            <div className="flex justify-between items-start w-full gap-4">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black font-poppins text-text-primary tracking-tight">
                  Hola, {profile.display_name}
                </h1>
                <p className="text-[10px] sm:text-xs text-neutral-500 font-semibold select-none flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>{formatFriendlyDate(selectedDate)} (Ends at 5AM)</span>
                  <span className="text-neutral-300 dark:text-neutral-800 select-none">•</span>
                  <span className={`inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                    trend.status === 'improving'
                      ? 'text-emerald-500'
                      : trend.status === 'low'
                      ? 'text-rose-500'
                      : 'text-neutral-445 dark:text-neutral-500'
                  }`}>
                    {trend.status === 'improving' ? (
                      <TrendingUp className="h-3 w-3 stroke-[3px]" />
                    ) : trend.status === 'low' ? (
                      <TrendingDown className="h-3 w-3 stroke-[3px]" />
                    ) : (
                      <span className="font-extrabold text-[12px] leading-none select-none">→</span>
                    )}
                    <span>
                      {trend.status === 'improving' ? 'Improving' : trend.status === 'low' ? 'Going Low' : 'Maintaining Same'} ({trend.diff > 0 ? `+${trend.diff}%` : `${trend.diff}%`} vs last week)
                    </span>
                  </span>
                </p>
              </div>

              {/* Streak Shields Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9px] font-black text-cyan-400 uppercase tracking-wider shrink-0 select-none">
                <Shield className="h-3.5 w-3.5 fill-cyan-400/20" />
                <span>Shields: {profile.streak_shields}</span>
              </div>
            </div>

            {/* Daily Status Capsules */}
            {totalCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 select-none pt-1">
                <span className="bg-text-primary text-bg-primary px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                  {welcomeDoneTotal}/{totalCount} Done
                </span>
                {welcomeCompleted > 0 && (
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    {welcomeCompleted} Completed
                  </span>
                )}
                {welcomeSkipped > 0 && (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    {welcomeSkipped} Skipped
                  </span>
                )}
                {welcomeJustified > 0 && (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    {welcomeJustified} Justified
                  </span>
                )}
                {welcomeFrozen > 0 && (
                  <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    {welcomeFrozen} Frozen
                  </span>
                )}
                {welcomePending > 0 && (
                  <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
                    {welcomePending} Pending
                  </span>
                )}
              </div>
            )}
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
          const dayScheduledHabits = getFilteredScheduledHabitsForDate(dStr);
          let dayTotalCount = dayScheduledHabits.length;
          dayScheduledHabits.forEach(h => {
            const log = logs.find(l => l.habit_id === h.id && l.logical_date === dStr);
            const isFrozen = freezes.some(f => f.logical_date === dStr && f.habit_id === h.id);
            if (isFrozen) {
              dayCompletedCount++;
            } else if (log) {
              if (log.is_skipped) {
                dayCompletedCount++;
              } else if (log.is_justified) {
                dayCompletedCount++;
              } else if (log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
                dayCompletedCount++;
              }
            }
          });
          
          const dayPercentage = dayTotalCount > 0 ? (dayCompletedCount / dayTotalCount) : 0;
          const isHighCompletion = dayPercentage >= 0.8;
          
          return (
            <button
              key={dStr}
              onClick={() => setSelectedDate(dStr)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-xl border transition-all cursor-pointer min-w-[62px] ${
                isSelected 
                  ? 'bg-btn-primary-bg border-btn-primary-bg text-btn-primary-text font-black scale-105 shadow-md' 
                  : isHighCompletion
                  ? 'bg-emerald-500/[0.03] border-emerald-500/35 hover:border-emerald-500/60 text-neutral-450 hover:text-text-primary'
                  : 'bg-card-bg border-border-primary text-neutral-450 hover:border-border-hover hover:text-text-primary'
              }`}
            >
              {isHighCompletion && (
                <Check className="h-3 w-3 text-emerald-500 absolute top-1 right-1 stroke-[3px]" />
              )}
              <span className={`text-[9px] uppercase tracking-wider font-extrabold ${!isSelected && isHighCompletion ? 'text-emerald-600/80 dark:text-emerald-400/80' : 'opacity-80'}`}>
                {dayName}
              </span>
              <span className={`text-sm font-black font-poppins mt-0.5 ${!isSelected && isHighCompletion ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
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
                      isHighCompletion
                        ? 'bg-emerald-500 dark:bg-emerald-400'
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
        </>
      )}

      {/* Dashboard Tab Selector */}
      {activeTab === 'habits' && (
        <div className="flex border-b border-border-primary/50 gap-4 mb-4 select-none">
          <button
            onClick={() => setDashboardTab('checklist')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              dashboardTab === 'checklist'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Routines ({processedHabits.length})
          </button>
          <button
            onClick={() => setDashboardTab('trackers')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              dashboardTab === 'trackers'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Wellbeing
          </button>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="flex border-b border-border-primary/50 gap-4 mb-4 select-none">
          <button
            onClick={() => setGrowthTab('planner')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              growthTab === 'planner'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Planner
          </button>
          <button
            onClick={() => setGrowthTab('milestones')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              growthTab === 'milestones'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Milestone
          </button>
          <button
            onClick={() => setGrowthTab('review')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              growthTab === 'review'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Review
          </button>
          <button
            onClick={() => setGrowthTab('roadmap')}
            className={`pb-2 text-xs font-black uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              growthTab === 'roadmap'
                ? 'border-indigo-500 text-indigo-500'
                : 'border-transparent text-neutral-500 hover:text-neutral-400'
            }`}
          >
            Roadmap
          </button>
        </div>
      )}

      {activeTab === 'growth' ? (
        growthTab === 'roadmap' ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-2 select-none">
            {/* Header */}
            <div className="border-b border-border-primary pb-4 select-none">
              <h1 className="text-2xl font-black font-poppins text-text-primary uppercase tracking-wider">
                Strategic Growth Roadmap
              </h1>
              <p className="text-[10.5px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                Release Objective Tracking • Q3 2026 — Q2 2027
              </p>
            </div>

          {/* Add Form Container */}
          <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wider">
                  Create Objective
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                  Set high impact milestones for the year ahead
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Objective Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Complete Advanced React Course..."
                    value={growthNewTitle}
                    onChange={(e) => setGrowthNewTitle(e.target.value)}
                    className="cred-input w-full h-10 px-4 rounded-xl text-xs font-bold outline-none transition-all"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Target Frequency (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50 (practices)"
                    value={growthNewTarget}
                    onChange={(e) => setGrowthNewTarget(e.target.value)}
                    className="cred-input w-full h-10 px-4 rounded-xl text-xs font-bold outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Target Quarter</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'Q3-2026', quarter: 'Q3', year: '2026', activeClass: 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/20' },
                      { key: 'Q4-2026', quarter: 'Q4', year: '2026', activeClass: 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20' },
                      { key: 'Q1-2027', quarter: 'Q1', year: '2027', activeClass: 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' },
                      { key: 'Q2-2027', quarter: 'Q2', year: '2027', activeClass: 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20' }
                    ].map(qOpt => (
                      <button
                        key={qOpt.key}
                        type="button"
                        onClick={() => setGrowthNewQuarter(qOpt.key)}
                        className={`h-10 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                          growthNewQuarter === qOpt.key
                            ? qOpt.activeClass
                            : 'bg-neutral-50 border-border-primary text-neutral-500 hover:border-border-hover dark:bg-neutral-900/40'
                        }`}
                      >
                        {qOpt.quarter} {qOpt.year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Supporting Habit</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setGrowthActiveHabitDropdown(!growthActiveHabitDropdown)}
                      className="cred-input w-full h-10 px-4 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer select-none"
                    >
                      <span>{growthNewHabit || 'No Supporting Habit'}</span>
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    </button>

                    {growthActiveHabitDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setGrowthActiveHabitDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-neutral-950 border border-border-primary rounded-xl shadow-lg z-50 p-1 select-none animate-fadeIn">
                          <button
                            type="button"
                            onClick={() => {
                              setGrowthNewHabit('');
                              setGrowthActiveHabitDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-semibold text-text-primary rounded-lg transition-colors cursor-pointer"
                          >
                            No Supporting Habit
                          </button>
                          {habits.map(h => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() => {
                                setGrowthNewHabit(h.name);
                                setGrowthActiveHabitDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-semibold text-text-primary rounded-lg transition-colors cursor-pointer"
                            >
                              {h.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!growthNewTitle.trim()}
                onClick={async () => {
                  const stableList = [
                    { key: 'Q3-2026', quarter: 'Q3', year: '2026', dueDate: '2026-09-30' },
                    { key: 'Q4-2026', quarter: 'Q4', year: '2026', dueDate: '2026-12-31' },
                    { key: 'Q1-2027', quarter: 'Q1', year: '2027', dueDate: '2027-03-31' },
                    { key: 'Q2-2027', quarter: 'Q2', year: '2027', dueDate: '2027-06-30' }
                  ];
                  const activeQ = stableList.find(qOpt => qOpt.key === growthNewQuarter);
                  if (activeQ && growthNewTitle.trim()) {
                    let yearPlan = yearlyPlans.find(p => p.title === activeQ.year);
                    if (!yearPlan) {
                      yearPlan = await addYearlyPlan(activeQ.year);
                    }
                    const targetVal = growthNewTarget ? parseInt(growthNewTarget, 10) : null;
                    addQuarterlyGoal(yearPlan.id, activeQ.quarter as any, growthNewTitle, growthNewHabit, activeQ.dueDate, targetVal);
                    setGrowthNewTitle('');
                    setGrowthNewHabit('');
                    setGrowthNewTarget('');
                  }
                }}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none shadow-md shadow-indigo-500/20 active:scale-95"
              >
                Save Objective
              </button>
            </div>
          </div>

          {/* Quarters Stack */}
          <div className="space-y-4">
            {[
              { key: 'Q3-2026', quarter: 'Q3', year: '2026', label: 'Q3 2026 (Jul-Sep)', dueDate: '2026-09-30', dueDateLabel: 'Sep 30, 2026', colorClass: 'text-rose-500 dark:text-rose-400', bgClass: 'bg-rose-500/10 border-rose-500/20 dark:border-rose-500/30', accent: 'rose' },
              { key: 'Q4-2026', quarter: 'Q4', year: '2026', label: 'Q4 2026 (Oct-Dec)', dueDate: '2026-12-31', dueDateLabel: 'Dec 31, 2026', colorClass: 'text-indigo-500 dark:text-indigo-400', bgClass: 'bg-indigo-500/10 border-indigo-500/20 dark:border-indigo-500/30', accent: 'indigo' },
              { key: 'Q1-2027', quarter: 'Q1', year: '2027', label: 'Q1 2027 (Jan-Mar)', dueDate: '2027-03-31', dueDateLabel: 'Mar 31, 2027', colorClass: 'text-emerald-500 dark:text-emerald-400', bgClass: 'bg-emerald-500/10 border-emerald-500/20 dark:border-emerald-500/30', accent: 'emerald' },
              { key: 'Q2-2027', quarter: 'Q2', year: '2027', label: 'Q2 2027 (Apr-Jun)', dueDate: '2027-06-30', dueDateLabel: 'Jun 30, 2027', colorClass: 'text-sky-500 dark:text-sky-400', bgClass: 'bg-sky-500/10 border-sky-500/20 dark:border-sky-500/30', accent: 'sky' }
            ].map(qOpt => {
              const yearPlan = yearlyPlans.find(p => p.title === qOpt.year);
              const qGoals = yearPlan ? quarterlyGoals.filter(g => g.yearly_plan_id === yearPlan.id && g.quarter === qOpt.quarter) : [];
              
              const hasGoals = qGoals.length > 0;
              const allCompleted = hasGoals && qGoals.every(g => g.status === 'completed' || g.is_completed);
              const isCollapsed = collapsedQuarters[qOpt.key] !== undefined ? collapsedQuarters[qOpt.key] : (hasGoals && allCompleted);

              const completedCount = qGoals.filter(g => g.status === 'completed' || g.is_completed).length;

              return (
                <div key={qOpt.key} className="cred-card p-6 rounded-xl border border-border-primary space-y-4 shadow-sm">
                  {/* Quarter Header */}
                  <div className="flex justify-between items-center select-none pb-2 border-b border-border-primary/50">
                    <button
                      onClick={() => setCollapsedQuarters(prev => ({ ...prev, [qOpt.key]: !isCollapsed }))}
                      className="flex items-center gap-2.5 text-xs font-black text-text-primary hover:opacity-80 transition-opacity cursor-pointer uppercase tracking-wider text-left"
                    >
                      <span className="text-[10px] text-neutral-400">{isCollapsed ? '▶' : '▼'}</span>
                      <span className={`${qOpt.colorClass}`}>{qOpt.label}</span>
                      <span className="text-[9px] text-neutral-450 font-bold lowercase bg-neutral-100 dark:bg-neutral-900 border border-border-primary px-2.5 py-0.5 rounded-full">
                        Due by {qOpt.dueDateLabel}
                      </span>
                      {hasGoals && (
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                          allCompleted 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                            : 'bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500'
                        }`}>
                          {completedCount}/{qGoals.length} Done
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Collapsible Objectives List */}
                  {!isCollapsed && (
                    <div className="space-y-3 pt-2">
                      {qGoals.length > 0 ? (
                        qGoals.map(goal => {
                          const percent = goal.total_target ? Math.min(100, Math.round((goal.current_progress / goal.total_target) * 100)) : 0;
                          const isEditingTarget = editingGoalTargetId === goal.id;
                          const isEditingGoal = editingGoalId === goal.id;

                          const handleToggleComplete = () => {
                            const isComp = !goal.is_completed;
                            const updates: Partial<QuarterlyGoal> = {
                              is_completed: isComp,
                              status: isComp ? 'completed' : (goal.current_progress > 0 ? 'in-progress' : 'planned')
                            };
                            updateQuarterlyGoal(goal.id, updates);
                          };

                          const handleIncrement = () => {
                            const nextProgress = goal.current_progress + 1;
                            const updates: Partial<QuarterlyGoal> = { current_progress: nextProgress };
                            if (goal.status === 'planned') {
                              updates.status = 'in-progress';
                            }
                            if (goal.total_target && nextProgress >= goal.total_target && goal.status !== 'completed') {
                              updates.status = 'completed';
                              updates.is_completed = true;
                            }
                            updateQuarterlyGoal(goal.id, updates);
                          };

                          const handleDecrement = () => {
                            const nextProgress = Math.max(0, goal.current_progress - 1);
                            const updates: Partial<QuarterlyGoal> = { current_progress: nextProgress };
                            if (nextProgress === 0 && goal.status === 'in-progress') {
                              updates.status = 'planned';
                            }
                            if (goal.total_target && nextProgress < goal.total_target && goal.status === 'completed') {
                              updates.status = 'in-progress';
                              updates.is_completed = false;
                            }
                            updateQuarterlyGoal(goal.id, updates);
                          };

                          return (
                            <div key={goal.id} className="p-4 bg-white/40 dark:bg-neutral-900/40 border border-border-primary/50 rounded-2xl space-y-3 hover:border-border-primary transition-all">
                              {isEditingGoal ? (
                                <div className="space-y-3 animate-fadeIn">
                                  <span className="text-[9px] font-black uppercase text-neutral-500 tracking-wider block">
                                    Edit Objective Details
                                  </span>
                                  <input
                                    type="text"
                                    value={editGoalTitle}
                                    onChange={(e) => setEditGoalTitle(e.target.value)}
                                    className="w-full h-9 px-3 bg-white dark:bg-neutral-950 border border-border-primary rounded-xl text-xs text-text-primary font-bold outline-none focus:border-indigo-500"
                                  />
                                  
                                  {/* Editor Habit Selection Dropdown */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={() => setActiveHabitDropdown(activeHabitDropdown === goal.id ? null : goal.id)}
                                      className="w-full h-9 px-3 bg-white dark:bg-neutral-955 border border-border-primary rounded-xl text-xs text-text-primary font-bold flex items-center justify-between hover:border-neutral-400 transition-colors cursor-pointer select-none"
                                    >
                                      <span>{editGoalHabit || 'No Supporting Habit'}</span>
                                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                                    </button>

                                    {activeHabitDropdown === goal.id && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setActiveHabitDropdown(null)} />
                                        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white dark:bg-neutral-950 border border-border-primary rounded-xl shadow-lg z-50 p-1 select-none animate-fadeIn">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditGoalHabit('');
                                              setActiveHabitDropdown(null);
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-semibold text-text-primary rounded-lg transition-colors cursor-pointer"
                                          >
                                            No Supporting Habit
                                          </button>
                                          {habits.map(h => (
                                            <button
                                              key={h.id}
                                              type="button"
                                              onClick={() => {
                                                setEditGoalHabit(h.name);
                                                setActiveHabitDropdown(null);
                                              }}
                                              className="w-full text-left px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-xs font-semibold text-text-primary rounded-lg transition-colors cursor-pointer"
                                            >
                                              {h.name}
                                            </button>
                                          ))}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <input
                                    type="number"
                                    min="1"
                                    value={editGoalTarget}
                                    onChange={(e) => setEditGoalTarget(e.target.value)}
                                    placeholder="Target frequency count..."
                                    className="w-full h-9 px-3 bg-white dark:bg-neutral-955 border border-border-primary rounded-xl text-xs text-text-primary font-bold outline-none focus:border-indigo-500"
                                  />
                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      onClick={() => setEditingGoalId(null)}
                                      className="h-8 px-3.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-text-primary border border-border-primary rounded-lg text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updatedTarget = editGoalTarget ? parseInt(editGoalTarget, 10) : null;
                                        updateQuarterlyGoal(goal.id, {
                                          title: editGoalTitle,
                                          supporting_habit: editGoalHabit || undefined,
                                          total_target: updatedTarget
                                        });
                                        setEditingGoalId(null);
                                      }}
                                      disabled={!editGoalTitle.trim()}
                                      className="h-8 px-4 bg-indigo-650 hover:bg-indigo-700 text-white border border-indigo-600 rounded-lg text-[9.5px] font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {/* Main row: checkbox, details, status & action buttons */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <button
                                        onClick={handleToggleComplete}
                                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 ${
                                          goal.status === 'completed' || goal.is_completed
                                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                                            : 'border-border-primary text-neutral-400 hover:border-neutral-500 dark:bg-neutral-950'
                                        }`}
                                      >
                                        {(goal.status === 'completed' || goal.is_completed) && <Check className="h-3 w-3 stroke-[3px]" />}
                                      </button>
                                      <div>
                                        <h4 className={`text-xs font-bold text-text-primary leading-tight ${goal.status === 'completed' || goal.is_completed ? 'line-through opacity-50' : ''}`}>
                                          {goal.title}
                                        </h4>
                                        {goal.supporting_habit && (
                                          <div className="flex items-center gap-1.5 mt-1 select-none">
                                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wide">Supporting:</span>
                                            <span className="text-[9.5px] font-black uppercase text-indigo-500 dark:text-indigo-400">
                                              {goal.supporting_habit}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right side alignment: Status pill & edit/delete buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                      {/* Status Switcher Badge */}
                                      <div className="relative">
                                        <button
                                          onClick={() => setActiveStatusDropdownId(activeStatusDropdownId === goal.id ? null : goal.id)}
                                          className={`text-[8.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                                            goal.status === 'completed'
                                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                              : goal.status === 'in-progress'
                                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                              : goal.status === 'failed'
                                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-455'
                                              : 'bg-neutral-100 dark:bg-neutral-800 border-border-primary text-neutral-600 dark:text-neutral-400'
                                          }`}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            goal.status === 'completed' ? 'bg-emerald-500' :
                                            goal.status === 'in-progress' ? 'bg-amber-500' :
                                            goal.status === 'failed' ? 'bg-rose-500' : 'bg-neutral-400'
                                          }`} />
                                          <span>{goal.status ? goal.status.replace('-', ' ') : 'planned'}</span>
                                        </button>

                                        {activeStatusDropdownId === goal.id && (
                                          <>
                                            <div className="fixed inset-0 z-40" onClick={() => setActiveStatusDropdownId(null)} />
                                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-neutral-955 border border-border-primary rounded-xl shadow-lg z-50 p-1 select-none animate-fadeIn">
                                              {[
                                                { val: 'planned', label: 'Planned', color: 'bg-neutral-450' },
                                                { val: 'in-progress', label: 'In Progress', color: 'bg-amber-500' },
                                                { val: 'completed', label: 'Completed', color: 'bg-emerald-500' },
                                                { val: 'failed', label: 'Failed', color: 'bg-rose-500' }
                                              ].map(opt => (
                                                <button
                                                  key={opt.val}
                                                  onClick={() => {
                                                    updateQuarterlyGoal(goal.id, {
                                                      status: opt.val as any,
                                                      is_completed: opt.val === 'completed'
                                                    });
                                                    setActiveStatusDropdownId(null);
                                                  }}
                                                  className={`w-full text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                                                    goal.status === opt.val ? 'bg-neutral-50 dark:bg-neutral-900 font-extrabold' : 'text-text-primary'
                                                  }`}
                                                >
                                                  <span className={`w-1.5 h-1.5 rounded-full ${opt.color}`} />
                                                  <span>{opt.label}</span>
                                                </button>
                                              ))}
                                            </div>
                                          </>
                                        )}
                                      </div>

                                      {/* Done Visual Text Indicator */}
                                      {(goal.status === 'completed' || goal.is_completed) && (
                                        <span className="text-[8.5px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/10">
                                          ✓ COMPLETED
                                        </span>
                                      )}

                                      {/* Edit & Delete Action Buttons */}
                                      <div className="flex items-center border-l border-border-primary/50 pl-2 gap-1">
                                        <button
                                          onClick={() => {
                                            setEditingGoalId(goal.id);
                                            setEditGoalTitle(goal.title);
                                            setEditGoalHabit(goal.supporting_habit || '');
                                            setEditGoalTarget(goal.total_target ? String(goal.total_target) : '');
                                          }}
                                          className="text-neutral-405 hover:text-indigo-500 transition-colors p-1"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => deleteQuarterlyGoal(goal.id)}
                                          className="text-neutral-405 hover:text-red-500 transition-colors p-1"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Progress Counters Section */}
                                  {goal.status === 'in-progress' && (
                                    <div className="p-3 bg-neutral-50/50 dark:bg-neutral-900/60 border border-border-primary/50 rounded-xl space-y-2.5 animate-fadeIn">
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={handleDecrement}
                                            className="h-7 w-7 rounded-lg bg-white dark:bg-neutral-800 border border-border-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 text-text-primary text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors"
                                          >
                                            -
                                          </button>

                                          <span className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 font-poppins px-1">
                                            {goal.total_target ? (
                                              <>
                                                Progress: <span className={`font-extrabold ${qOpt.colorClass}`}>{goal.current_progress}</span> / {goal.total_target}
                                              </>
                                            ) : (
                                              <>
                                                Count: <span className={`font-extrabold ${qOpt.colorClass}`}>{goal.current_progress}</span>
                                              </>
                                            )}
                                          </span>

                                          <button
                                            onClick={handleIncrement}
                                            className="h-7 w-7 rounded-lg bg-white dark:bg-neutral-800 border border-border-primary hover:bg-neutral-100 dark:hover:bg-neutral-700 text-text-primary text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors"
                                          >
                                            +
                                          </button>
                                        </div>

                                        <div className="text-right">
                                          {isEditingTarget ? (
                                            <div className="flex items-center gap-1 animate-fadeIn">
                                              <input
                                                type="number"
                                                min="1"
                                                value={editingGoalTarget[goal.id] || ''}
                                                onChange={(e) => setEditingGoalTarget(prev => ({ ...prev, [goal.id]: e.target.value }))}
                                                placeholder="Target"
                                                className="w-14 h-7 px-2 bg-white dark:bg-neutral-950 border border-border-primary rounded-lg text-xs text-text-primary font-bold outline-none text-center"
                                              />
                                              <button
                                                onClick={() => {
                                                  const targetVal = editingGoalTarget[goal.id];
                                                  const parsed = targetVal ? parseInt(targetVal, 10) : null;
                                                  updateQuarterlyGoal(goal.id, { total_target: parsed });
                                                  setEditingGoalTargetId(null);
                                                }}
                                                className={`px-2 h-7 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg cursor-pointer transition-colors ${
                                                  qOpt.accent === 'rose' ? 'bg-rose-500 hover:bg-rose-600' :
                                                  qOpt.accent === 'indigo' ? 'bg-indigo-500 hover:bg-indigo-600' :
                                                  qOpt.accent === 'emerald' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                                  'bg-sky-500 hover:bg-sky-600'
                                                }`}
                                              >
                                                Set
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setEditingGoalTargetId(goal.id);
                                                setEditingGoalTarget(prev => ({ ...prev, [goal.id]: goal.total_target ? String(goal.total_target) : '' }));
                                              }}
                                              className="text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-400 cursor-pointer tracking-wider"
                                            >
                                              {goal.total_target ? 'Edit Target' : '+ Add Target'}
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Progress Bar (visible for in-progress objectives with a set target) */}
                                      {goal.total_target && (
                                        <div className="w-full bg-neutral-200 dark:bg-neutral-850 rounded-full h-1.5 select-none overflow-hidden border border-border-primary/20">
                                          <div
                                            className={`h-full transition-all duration-300 ${
                                              qOpt.accent === 'rose' ? 'bg-rose-500' :
                                              qOpt.accent === 'indigo' ? 'bg-indigo-500' :
                                              qOpt.accent === 'emerald' ? 'bg-emerald-500' : 'bg-sky-500'
                                            }`}
                                            style={{ width: `${percent}%` }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-neutral-455 italic py-2 text-center font-bold">No objectives added to this quarter yet.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : growthTab === 'planner' ? (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-2 select-none">
          {/* Header */}
          <div className="border-b border-border-primary pb-4 select-none flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shrink-0">
              <Calendar className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-poppins text-text-primary uppercase tracking-wider leading-none">
                Daily Focus Planner
              </h1>
              <p className="text-[10.5px] text-neutral-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
                Organize and accomplish high-impact priorities
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Form (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className={`cred-card p-5 rounded-xl border border-border-primary space-y-4 relative ${isCalendarOpen ? 'z-30' : 'z-10'}`}>
                <h3 className="text-[11px] font-black uppercase text-neutral-450 tracking-wider">
                  New Task Priority
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Task Title</label>
                    <input
                      type="text"
                      value={newPriorityTitle}
                      onChange={(e) => setNewPriorityTitle(e.target.value)}
                      placeholder="What is the task priority?..."
                      className="cred-input h-10 px-3 rounded-xl text-xs font-bold placeholder:text-neutral-500 outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Schedule Date</label>
                    <div className="flex items-center justify-between gap-2.5">
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
                            setSelectedDate(newPriorityDueDate);
                            setNewPriorityTitle('');
                          }
                        }}
                        disabled={!newPriorityTitle.trim() || !newPriorityDueDate}
                        className="h-10 px-4 bg-btn-primary-bg text-btn-primary-text font-extrabold text-[9px] uppercase tracking-wider rounded-xl hover:bg-btn-primary-hover transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm select-none"
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: List (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <div className="flex justify-between items-center border-b border-border-primary/50 pb-2.5 select-none">
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">
                    Priorities for {selectedDate}
                  </h3>
                </div>

                <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {plannerPriorities.filter(p => p.due_date === selectedDate).length > 0 ? (
                    plannerPriorities
                      .filter(p => p.due_date === selectedDate)
                      .map(p => (
                        <div key={p.id} className="cred-card p-5 rounded-xl flex justify-between items-center gap-4 transition-all hover:border-border-hover select-none">
                          {/* Left info area */}
                          <div className="space-y-2 flex-1 min-w-0">
                            {/* Category style tag */}
                            <div className="flex items-center">
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-indigo-500/20 text-indigo-500 bg-indigo-500/5 text-[9px] font-bold tracking-wider uppercase">
                                <Target className="h-2.5 w-2.5" />
                                <span>Priority Task</span>
                              </span>
                            </div>

                            {/* Identity and Title */}
                            <div>
                              <div className="text-[10px] text-neutral-400 font-medium italic">
                                Action item for today
                              </div>
                              <h3 className={`text-base font-extrabold tracking-tight mt-0.5 font-poppins truncate leading-tight ${
                                p.is_completed
                                  ? 'line-through text-neutral-500 opacity-60'
                                  : p.is_skipped
                                  ? 'line-through text-amber-550 italic opacity-60'
                                  : 'text-text-primary'
                              }`}>
                                {p.title}
                              </h3>
                            </div>

                            {/* Bottom Actions: Skip / Delete */}
                            <div className="flex items-center gap-2 pt-1 select-none">
                              <button
                                onClick={() => togglePlannerPriority(p.id, { is_skipped: !p.is_skipped, is_completed: false })}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  p.is_skipped
                                    ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                                    : 'border-border-primary bg-bg-primary text-neutral-500 hover:border-amber-800 hover:text-amber-500'
                                }`}
                              >
                                <Ban className="h-3 w-3" />
                                <span>{p.is_skipped ? 'Skipped' : 'Skip'}</span>
                              </button>

                              <button
                                onClick={() => deletePlannerPriority(p.id)}
                                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-border-primary bg-bg-primary text-neutral-500 hover:border-red-800 hover:text-red-500 transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>

                          {/* Right completion check circle or skipped display */}
                          <div className="shrink-0 flex items-center justify-center">
                            {p.is_skipped ? (
                              <button
                                onClick={() => togglePlannerPriority(p.id, { is_skipped: false })}
                                className="h-12 min-w-[90px] px-3.5 rounded-xl border border-amber-600/40 bg-amber-500/5 text-amber-500 flex items-center justify-center gap-1.5 transition-all hover:bg-amber-500/10 cursor-pointer"
                                title="Click to undo skip"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Skipped</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => togglePlannerPriority(p.id, { is_completed: !p.is_completed, is_skipped: false })}
                                className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                                  p.is_completed
                                    ? 'bg-btn-primary-bg border-btn-primary-bg text-btn-primary-text scale-105 ring-2 ring-emerald-500 ring-offset-2 ring-offset-card-bg shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                    : 'bg-bg-primary border-border-primary text-neutral-500 hover:border-border-hover hover:text-text-primary'
                                }`}
                              >
                                {p.is_completed ? (
                                  <Check className="h-6 w-6 stroke-[3px]" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-[10px] text-neutral-500 italic text-center py-8 select-none font-bold">
                      No priorities scheduled for this date.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : growthTab === 'milestones' ? (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-2 select-none">
          {/* Header */}
          <div className="border-b border-border-primary pb-4 select-none flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
              <Award className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-poppins text-text-primary uppercase tracking-wider leading-none">
                Milestone Markers
              </h1>
              <p className="text-[10.5px] text-neutral-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
                Track critical release dates and project milestones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-5">
              <div className="cred-card p-5 rounded-xl border border-border-primary space-y-4">
                <h3 className="text-[11px] font-black uppercase text-neutral-450 tracking-wider">
                  New Achievement
                </h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-neutral-455 uppercase tracking-wider">Milestone Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Launched version 1.0!..."
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="cred-input h-10 px-3 rounded-xl text-xs font-bold placeholder:text-neutral-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-neutral-455 uppercase tracking-wider">Achieved Date</label>
                    <input
                      type="date"
                      value={newMilestoneDate}
                      onChange={(e) => setNewMilestoneDate(e.target.value)}
                      className="cred-input h-10 px-3 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-neutral-455 uppercase tracking-wider">Supported Routine / Habit (Optional)</label>
                    <select
                      value={newMilestoneHabit}
                      onChange={(e) => setNewMilestoneHabit(e.target.value)}
                      className="cred-input h-10 px-3 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- No Supported Habit --</option>
                      {processedHabits.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        if (newMilestoneTitle.trim() && newMilestoneDate) {
                          addMilestone(newMilestoneTitle, newMilestoneDate, newMilestoneHabit || null);
                          setNewMilestoneTitle('');
                          setNewMilestoneDate('');
                          setNewMilestoneHabit('');
                        }
                      }}
                      disabled={!newMilestoneTitle.trim() || !newMilestoneDate}
                      className="h-9 px-4 bg-amber-550 hover:bg-amber-600 text-neutral-900 font-bold text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
                    >
                      Add Milestone
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: List */}
            <div className="md:col-span-7">
              <div className="cred-card p-6 rounded-xl border border-border-primary space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-text-primary border-b border-border-primary/50 pb-2">
                  Achievement Timeline
                </h3>

                <div className="relative pl-4 space-y-6 max-h-[500px] overflow-y-auto pr-1">
                  {milestones.length > 0 && (
                    <div className="absolute left-[23px] top-3 bottom-3 w-[2px] bg-neutral-200 dark:bg-neutral-850" />
                  )}
                  {milestones
                    .sort((a, b) => new Date(b.target_date).getTime() - new Date(a.target_date).getTime())
                    .map(mil => {
                      const habit = processedHabits.find(h => h.id === mil.habit_id);
                      return (
                        <div key={mil.id} className="relative pl-8 select-none">
                          {/* Dot / Indicator */}
                          <div className="absolute left-0 top-1 h-6 w-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 z-10 shadow-sm">
                            <Award className="h-3.5 w-3.5 stroke-[2.5px]" />
                          </div>

                          {/* Milestone Card Redesign */}
                          <div className="cred-card p-4 rounded-xl border border-border-primary flex justify-between items-start gap-4 transition-all shadow-sm hover:border-border-hover">
                            <div className="space-y-2">
                              <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">
                                {mil.title}
                              </h4>
                              
                              <div className="flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-wider text-neutral-450">
                                <span className="bg-neutral-100 dark:bg-neutral-900/60 border border-border-primary/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-indigo-500" />
                                  <span>Achieved: {mil.target_date}</span>
                                </span>

                                {habit && (
                                  <span className="bg-indigo-500/10 text-indigo-550 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-indigo-500 fill-indigo-500/10" />
                                    <span>Habit: {habit.name}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => deleteMilestone(mil.id)}
                              className="text-neutral-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {milestones.length === 0 && (
                    <p className="text-xs text-neutral-500 italic text-center py-8 font-bold">No milestones defined yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn py-2 select-none font-poppins">
          {/* Header */}
          <div className="border-b border-border-primary pb-4 select-none">
            <h1 className="text-2xl font-black font-poppins text-text-primary uppercase tracking-wider">
              Weekly Review
            </h1>
            <p className="text-[10.5px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
              Reflect on wins, friction & tweak systems
            </p>
          </div>

          <div className="max-w-2xl mx-auto cred-card p-6 rounded-xl border border-border-primary space-y-4">
            <div className="flex items-center gap-2.5 select-none border-b border-border-primary/50 pb-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                <BookOpen className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-text-primary uppercase tracking-wider">
                  Weekly Reflection
                </h3>
                <p className="text-[10px] text-neutral-500 font-semibold tracking-wide uppercase mt-0.5">
                  Week of {activeMonday}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Weekly Wins</label>
                <textarea
                  value={reviewWins}
                  onChange={(e) => setReviewWins(e.target.value)}
                  placeholder="What went well this week? Celebrate your achievements..."
                  rows={3}
                  className="cred-input p-3 rounded-xl text-xs font-bold placeholder:text-neutral-500 outline-none resize-none"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Challenges faced</label>
                <textarea
                  value={reviewChallenges}
                  onChange={(e) => setReviewChallenges(e.target.value)}
                  placeholder="What friction did you encounter? Any missed habits..."
                  rows={3}
                  className="cred-input p-3 rounded-xl text-xs font-bold placeholder:text-neutral-500 outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-neutral-500">Next Week Adjustments</label>
                <textarea
                  value={reviewNextSteps}
                  onChange={(e) => setReviewNextSteps(e.target.value)}
                  placeholder="How will you tweak your environment or routines next week?"
                  rows={3}
                  className="cred-input p-3 rounded-xl text-xs font-bold placeholder:text-neutral-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end pt-2 border-t border-border-primary/50">
                <button
                  onClick={() => saveWeeklyReview(activeMonday, reviewWins, reviewChallenges, reviewNextSteps)}
                  className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-neutral-900 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-95"
                >
                  Save Reflection
                </button>
              </div>
            </div>
          </div>
        </div>
      )
      ) : dashboardTab === 'trackers' ? (
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
            </div>

            {/* Input View */}
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
            </div>

            {/* Input View */}
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
                      { 
                        value: 'depressed', 
                        icon: CloudRain, 
                        label: 'Down', 
                        activeClass: 'bg-sky-50/80 dark:bg-sky-950/30 border-sky-400 dark:border-sky-500 text-sky-600 dark:text-sky-400 shadow-sm shadow-sky-500/5', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-sky-555 hover:border-sky-300 dark:hover:border-sky-800 hover:bg-sky-50/30 dark:hover:bg-sky-950/10' 
                      },
                      { 
                        value: 'sad', 
                        icon: Frown, 
                        label: 'Sad', 
                        activeClass: 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/5', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-indigo-555 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10' 
                      },
                      { 
                        value: 'okay', 
                        icon: Meh, 
                        label: 'Okay', 
                        activeClass: 'bg-neutral-100 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 shadow-sm', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-neutral-650 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30' 
                      },
                      { 
                        value: 'happy', 
                        icon: Smile, 
                        label: 'Happy', 
                        activeClass: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/5', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-amber-550 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/10' 
                      },
                      { 
                        value: 'hyperactive', 
                        icon: Zap, 
                        label: 'Hyper', 
                        activeClass: 'bg-rose-50/85 dark:bg-rose-950/30 border-rose-400 dark:border-rose-500 text-rose-650 dark:text-rose-450 shadow-sm shadow-rose-500/5', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-rose-555 hover:border-rose-305 dark:hover:border-rose-800 hover:bg-rose-50/30 dark:hover:bg-rose-950/10' 
                      }
                    ].map(m => {
                      const MoodIcon = m.icon;
                      const isActive = selectedMood === m.value;
                      return (
                        <button
                          key={m.value}
                          onClick={() => setSelectedMood(m.value as any)}
                          className={`h-11 border rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                            isActive
                              ? `${m.activeClass} scale-105 font-bold`
                              : m.inactiveClass
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
                      { 
                        value: 'low', 
                        label: 'Low', 
                        activeClass: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10' 
                      },
                      { 
                        value: 'medium', 
                        label: 'Medium', 
                        activeClass: 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-450 shadow-sm', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-amber-550 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/10' 
                      },
                      { 
                        value: 'high', 
                        label: 'High', 
                        activeClass: 'bg-emerald-50/85 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500 text-emerald-655 dark:text-emerald-400 shadow-sm', 
                        inactiveClass: 'border-border-primary text-neutral-450 hover:text-emerald-555 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10' 
                      }
                    ].map(e => {
                      const isActive = selectedEnergy === e.value;
                      return (
                        <button
                          key={e.value}
                          onClick={() => setSelectedEnergy(e.value as any)}
                          className={`h-10 border rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                            isActive
                              ? `${e.activeClass} scale-105 font-bold`
                              : e.inactiveClass
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
              className="h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
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
            </div>

            {/* Input View */}
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
                      className="text-neutral-550 hover:text-teal-500 text-xs font-black p-1 select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
      ) : (
      <>
        {/* Checklist Organizer & Phase Selector Toolbar */}
        {scheduledActiveHabits.length > 0 && (
          <div className="cred-glass p-4 rounded-2xl border border-border-primary flex flex-col lg:flex-row justify-between items-center gap-6 select-none mb-6">
            {/* Left: Phase Circles (only if Group By is 'phase') */}
            <div className="flex-1 w-full overflow-x-auto scrollbar-none">
              {groupBy === 'phase' ? (
                <div className="flex items-center gap-6 justify-start py-1">
                  {LIFE_PHASES_META.map(phase => {
                    const phaseHabits = habitsByPhase[phase.id] || [];
                    const isSelected = selectedPhaseId === phase.id;
                    const metrics = getHabitListMetrics(phaseHabits);
                    const total = phaseHabits.length;
                    
                    if (total === 0) return null;
                    
                    const PhaseIcon = phase.icon;
                    
                    // Segmented progress ring around circle representation
                    const circumference = 2 * Math.PI * 26;
                    const segmentLength = circumference / total;
                    const gap = total > 1 ? 1.5 : 0;
                    const dashArray = `${segmentLength - gap} ${circumference - (segmentLength - gap)}`;
                    
                    return (
                      <button
                        key={phase.id}
                        onClick={() => setSelectedPhaseId(phase.id)}
                        className="flex flex-col items-center gap-2 focus:outline-none group shrink-0 cursor-pointer"
                      >
                        {/* Story Circle representation */}
                        <div className="relative flex items-center justify-center h-14 w-14 select-none">
                          <svg className="absolute h-14 w-14 -rotate-90">
                            {phaseHabits.map((h, idx) => {
                              const log = logs.find(l => l.habit_id === h.id && l.logical_date === selectedDate);
                              const isFrozen = freezes.some(f => f.logical_date === selectedDate && f.habit_id === h.id);
                              
                              let colorClass = "text-neutral-200 dark:text-neutral-800"; // pending
                              if (isFrozen) {
                                colorClass = "text-sky-400";
                              } else if (log) {
                                if (log.is_skipped) {
                                  colorClass = "text-amber-500";
                                } else if (log.is_justified) {
                                  colorClass = "text-purple-500";
                                } else if (log.count_completed >= h.target_count || (h.min_version_enabled && log.is_minimum_version)) {
                                  colorClass = "text-emerald-500";
                                }
                              }
                              
                              return (
                                <circle
                                  key={h.id}
                                  className={`${colorClass} transition-all duration-300 stroke-[3px]`}
                                  strokeDasharray={dashArray}
                                  strokeDashoffset={-idx * segmentLength}
                                  strokeLinecap="round"
                                  fill="transparent"
                                  stroke="currentColor"
                                  r={26}
                                  cx={28}
                                  cy={28}
                                />
                              );
                            })}
                          </svg>
                          
                          {/* Inner circle phase icon */}
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
                            isSelected 
                              ? 'bg-neutral-100 dark:bg-neutral-800 border-indigo-500 scale-105 shadow-sm text-indigo-500' 
                              : 'bg-card-bg border-border-primary text-neutral-500 group-hover:text-text-primary group-hover:border-border-hover'
                          }`}>
                            <PhaseIcon className="h-4 w-4" />
                          </div>
                        </div>
                        
                        {/* Label & completion info */}
                        <div className="text-center select-none animate-fadeIn">
                          <span className={`text-[9px] font-black uppercase tracking-wider block transition-colors ${
                            isSelected ? 'text-indigo-500' : 'text-neutral-500 group-hover:text-text-primary'
                          }`}>
                            {PHASE_ROMAN_NAMES[phase.id] || phase.name}
                          </span>
                          
                          <span className="text-[8px] font-extrabold text-neutral-400 dark:text-neutral-500 block mt-0.5 whitespace-nowrap">
                            {metrics.completed}/{total} Done
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
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
                  
                  <button
                    onClick={() => setShowHabitForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-[9px] font-black uppercase tracking-wider rounded-lg text-text-primary hover:border-neutral-400 transition-colors select-none shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5px] text-neutral-450 dark:text-neutral-550" />
                    <span>New Habit</span>
                  </button>
                </div>
              )}
            </div>

            {/* Right: Filters & dropdowns */}
            <div className="flex overflow-x-auto scrollbar-none gap-3 w-full lg:w-auto py-0.5 select-none">
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

              <CustomDropdown
                label="Filter By"
                value={filterBy}
                onChange={(val) => setFilterBy(val as any)}
                options={[
                  { value: 'all', label: 'All Habits' },
                  { value: 'uncompleted', label: 'Uncompleted Only' },
                  { value: 'completed', label: 'Completed Only' }
                ]}
              />
            </div>
          </div>
        )}

      {/* Checklist Sections */}
      <div className="space-y-6">
        {scheduledActiveHabits.length > 0 ? (
          <>
            {groupBy === 'phase' && (
              <div className="flex flex-col gap-6">

                {/* Selected Phase Habits View */}
                {(() => {
                  const activePhase = LIFE_PHASES_META.find(p => p.id === selectedPhaseId);
                  if (!activePhase) return null;
                  
                  const phaseHabits = habitsByPhase[activePhase.id] || [];
                  const metrics = getHabitListMetrics(phaseHabits);
                  const total = phaseHabits.length;
                  
                  return (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Phase Info & Detailed Breakdown */}
                      <div className="cred-glass p-4 rounded-2xl border border-border-primary/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 select-none">
                        <div>
                          <h3 className="text-xs font-black font-poppins text-text-primary uppercase tracking-wider">
                            {PHASE_ROMAN_NAMES[activePhase.id]} - {activePhase.name}
                          </h3>
                          <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
                            {activePhase.desc}
                          </p>
                        </div>
                        
                        {/* Down show like total, out of info custom design */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[8px] font-black uppercase tracking-wider">
                          {metrics.completed > 0 && (
                            <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                              {metrics.completed} Completed
                            </span>
                          )}
                          {metrics.skipped > 0 && (
                            <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                              {metrics.skipped} Skipped
                            </span>
                          )}
                          {metrics.justified > 0 && (
                            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-lg">
                              {metrics.justified} Justified
                            </span>
                          )}
                          {metrics.frozen > 0 && (
                            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                              {metrics.frozen} Frozen
                            </span>
                          )}
                          {metrics.pending > 0 && (
                            <span className="bg-neutral-100 dark:bg-neutral-900 border border-border-primary text-neutral-500 px-2 py-0.5 rounded-lg">
                              {metrics.pending} Pending
                            </span>
                          )}
                          <span className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
                            {total} {total === 1 ? 'Routine' : 'Routines'} Total
                          </span>
                        </div>
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
                })()}
              </div>
            )}

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
