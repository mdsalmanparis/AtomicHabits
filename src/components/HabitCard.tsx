import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  calculateHabitStats,
  type Habit,
  getLogicalDate,
  addDays,
  getDatesRange,
} from '../utils/dateUtils';
import * as Icons from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  selectedDate?: string;
  onEditClick?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  selectedDate,
  onEditClick,
}) => {
  const logHabit = useStore((state) => state.logHabit);
  const toggleSkip = useStore((state) => state.toggleSkip);
  const toggleJustify = useStore((state) => state.toggleJustify);
  const profile = useStore((state) => state.profile);
  const logs = useStore((state) => state.logs);
  const freezes = useStore((state) => state.freezes);
  const categories = useStore((state) => state.categories);
  const useStreakFreeze = useStore(
    (state) => state.useStreakFreeze
  );
  const showConfirm = useStore((state) => state.showConfirm);

  const [isExpanded, setIsExpanded] = useState(false);

  const stats = calculateHabitStats(
    habit,
    logs,
    freezes,
    profile.day_offset_hours
  );

  const todayStr = getLogicalDate(
    new Date(),
    profile.day_offset_hours
  );

  const activeDateStr = selectedDate || todayStr;

  const activeLog = logs.find(
    (l) =>
      l.habit_id === habit.id &&
      l.logical_date === activeDateStr
  );

  const activeCount = activeLog?.count_completed ?? 0;

  const activeStatus =
    stats.history[activeDateStr]?.status || 'pending';

  const isSkipped = activeStatus === 'skipped';
  const isJustified = activeStatus === 'justified';

  const category = categories.find(
    (c) => c.id === habit.category_id
  );

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

    logHabit(
      habit.id,
      isDone ? -1 : 1,
      activeDateStr
    );
  };

  const handleToggleMin = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const isMinMet =
      activeCount >= habit.min_version_count;

    logHabit(
      habit.id,
      isMinMet
        ? -activeCount
        : habit.min_version_count -
            activeCount,
      activeDateStr
    );
  };

  const handleFreeze = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    showConfirm(
      'Streak Freeze Shield',
      `Use 1 Streak Shield to freeze your streak for ${activeDateStr}?`,
      async () => {
        await useStreakFreeze(habit.id, activeDateStr);
      }
    );
  };

  const handleToggleSkip = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // toggleSkip handles both:
    // pending -> skipped
    // skipped -> active/undo
    toggleSkip(habit.id, activeDateStr);
  };

  const handleToggleJustify = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    toggleJustify(habit.id, activeDateStr);
  };

  const getIcon = (
    iconName: string,
    className: string = 'h-5 w-5'
  ) => {
    const IconComponent =
      (Icons as any)[iconName] || Icons.Check;

    return (
      <IconComponent className={className} />
    );
  };

  /*
   * Main completion/action area.
   *
   * If skipped, this becomes the SINGLE prominent
   * skipped control. Clicking it calls toggleSkip()
   * and therefore allows the user to undo the skip.
   */
  const renderActionSection = () => {
    if (isSkipped) {
      return (
        <button
          onClick={handleToggleSkip}
          title="Click to undo skip"
          className="h-12 min-w-[120px] px-5 rounded-xl border border-amber-600/40 dark:border-amber-700/70 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center gap-2 transition-all hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
        >
          <Icons.Ban className="h-4 w-4" />

          <span className="text-xs font-bold uppercase tracking-widest">
            Skipped
          </span>
        </button>
      );
    }

    if (isJustified) {
      return (
        <button
          onClick={handleToggleJustify}
          title="Click to undo justification"
          className="h-12 min-w-[120px] px-5 rounded-xl border border-purple-600/40 dark:border-purple-800/70 bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 flex items-center justify-center gap-2 transition-all hover:bg-purple-100 dark:hover:bg-purple-950/50 hover:border-purple-500 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
        >
          <Icons.Scale className="h-4 w-4" />

          <span className="text-xs font-bold uppercase tracking-widest">
            Justified
          </span>
        </button>
      );
    }

    if (activeStatus === 'frozen') {
      return (
        <button
          className="h-12 min-w-[120px] px-5 rounded-xl border border-sky-600/35 dark:border-sky-800/70 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 flex items-center justify-center gap-2 select-none cursor-default"
          title="Streak is frozen for today"
        >
          <Icons.Shield className="h-4 w-4" />

          <span className="text-xs font-bold uppercase tracking-widest">
            Frozen
          </span>
        </button>
      );
    }

    if (habit.type === 'single_tick') {
      const isDone =
        activeStatus === 'completed';

      return (
        <button
          onClick={handleToggleSingle}
          className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
            isDone
              ? 'bg-btn-primary-bg border-btn-primary-bg text-btn-primary-text scale-105 ring-2 ring-emerald-500 ring-offset-2 ring-offset-card-bg shadow-[0_0_12px_rgba(16,185,129,0.2)]'
              : 'bg-bg-primary border-border-primary text-neutral-500 hover:border-border-hover hover:text-text-primary'
          }`}
        >
          {isDone ? (
            <Icons.Check className="h-6 w-6 stroke-[3px]" />
          ) : (
            <Icons.Circle className="h-5 w-5" />
          )}
        </button>
      );
    }

    const pct = Math.round(
      (activeCount /
        habit.target_count) *
        100
    );

    const isCompleted = activeCount >= habit.target_count;

    return (
      <div className="flex items-center gap-3 select-none">
        {/* Decrement */}
        <button
          onClick={handleDecrement}
          disabled={activeCount === 0}
          className="h-9 w-9 rounded-lg border border-border-primary text-neutral-400 hover:border-border-hover hover:text-text-primary flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          aria-label="Decrease completion"
        >
          <Icons.Minus className="h-4 w-4" />
        </button>

        {/* Progress */}
        <div className="text-center min-w-[55px]">
          <div className={`text-sm font-black font-poppins ${isCompleted ? 'text-amber-500' : 'text-text-primary'}`}>
            {activeCount}{' '}
            <span className="text-neutral-500 text-xs font-normal">
              / {habit.target_count}
            </span>
          </div>

          <div className={`text-[10px] font-extrabold tracking-wider mt-0.5 ${isCompleted ? 'text-amber-500' : 'text-neutral-500'}`}>
            {pct}%
          </div>
        </div>

        {/* Increment */}
        <button
          onClick={handleIncrement}
          className="h-9 w-9 rounded-lg border border-border-primary text-text-primary bg-card-bg hover:border-border-hover flex items-center justify-center transition-all cursor-pointer"
          aria-label="Increase completion"
        >
          <Icons.Plus className="h-4 w-4" />
        </button>
      </div>
    );
  };

  /*
   * Last 14 logical days.
   */
  const last14Days = getDatesRange(
    addDays(todayStr, -13),
    todayStr
  );

  return (
    <div
      className={`cred-card rounded-xl overflow-hidden transition-all duration-300 ${
        isExpanded
          ? 'ring-1 ring-border-hover'
          : ''
      }`}
    >
      {/* Header */}
      <div
        className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
        onClick={() =>
          setIsExpanded(!isExpanded)
        }
      >
        {/* Habit Identity */}
        <div className="space-y-2 flex-1 min-w-0">
          {/* Category */}
          {category && (
            <div className="flex items-center">
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider uppercase"
                style={{
                  borderColor: `${category.color}30`,
                  color: category.color,
                }}
              >
                {getIcon(
                  category.icon,
                  'h-3 w-3'
                )}

                {category.name}
              </span>
            </div>
          )}

          {/* Identity & Name */}
          <div>
            <div className="text-xs text-neutral-400 font-medium italic">
              Becoming {habit.identity}
            </div>

            <h3 className="text-base font-extrabold tracking-tight text-text-primary mt-0.5 font-poppins truncate flex items-center gap-1.5">
              {habit.name}

              <Icons.ChevronDown
                className={`h-4 w-4 text-neutral-600 shrink-0 transition-transform ${
                  isExpanded
                    ? 'rotate-180 text-text-primary'
                    : ''
                }`}
              />
            </h3>
          </div>

          {/* Visual Progress Bar for Frequency Habits */}
          {habit.type === 'frequency' && (
            <div className="w-full h-1 bg-neutral-200 dark:bg-neutral-850 rounded-full mt-2.5 overflow-hidden border border-border-primary/20 shrink-0 select-none">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  activeCount > habit.target_count
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse'
                    : activeCount === habit.target_count
                    ? 'bg-amber-400'
                    : 'bg-text-primary opacity-60'
                }`}
                style={{ width: `${Math.min(100, (activeCount / habit.target_count) * 100)}%` }}
              />
            </div>
          )}

          {/* Habit Info */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Streak */}
            <div
              className={`flex items-center gap-1 text-xs font-bold font-poppins ${
                stats.statusToday === 'frozen'
                  ? 'text-sky-400'
                  : stats.statusToday === 'skipped'
                  ? 'text-amber-500'
                  : stats.statusToday === 'justified'
                  ? 'text-purple-500'
                  : stats.completedToday || stats.minCompletedToday
                  ? 'text-red-500' // Red color for completed streaks
                  : 'text-neutral-500'
              }`}
              title={
                stats.statusToday === 'frozen'
                  ? 'Streak Frozen'
                  : stats.statusToday === 'justified'
                  ? 'Streak Justified'
                  : `${stats.currentStreak} day streak`
              }
            >
              {stats.statusToday === 'frozen' ? (
                <Icons.Shield className="h-3.5 w-3.5" />
              ) : stats.statusToday === 'justified' ? (
                <Icons.Scale className="h-3.5 w-3.5" />
              ) : (
                <>
                  <Icons.Flame className="h-3.5 w-3.5" />
                  <span>
                    {stats.currentStreak} day streak
                  </span>
                  {stats.bestStreak > stats.currentStreak && (
                    <span className="text-[10px] text-neutral-600 font-normal ml-1">
                      (best {stats.bestStreak})
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Minimum Version */}
            {habit.min_version_enabled && (
              <button
                onClick={handleToggleMin}
                disabled={
                  isSkipped ||
                  stats.completedToday
                }
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

                <span>
                  Min:{' '}
                  {habit.min_version_description}
                </span>
              </button>
            )}

            {/*
             * IMPORTANT:
             *
             * The Skip button is intentionally NOT rendered here.
             *
             * There is now only ONE skip UI:
             * the large Skipped/action button.
             */}
             {!isSkipped && !isJustified && (
               <button
                 onClick={handleToggleSkip}
                 className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-border-primary bg-bg-primary text-neutral-500 hover:border-amber-800 hover:text-amber-500 transition-all cursor-pointer"
                 title="Skip this habit today"
               >
                 <Icons.Ban className="h-3.5 w-3" />
                 <span>Skip</span>
               </button>
             )}

             {!isSkipped && !isJustified && (
               <button
                 onClick={handleToggleJustify}
                 className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-border-primary bg-bg-primary text-neutral-500 hover:border-purple-800 hover:text-purple-500 transition-all cursor-pointer"
                 title="Justify this habit today"
               >
                 <Icons.Scale className="h-3.5 w-3.5" />
                 <span>Justify</span>
               </button>
             )}

            {/* Freeze */}
            {activeStatus === 'missed' &&
              profile.streak_shields > 0 && (
                <button
                  onClick={handleFreeze}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-900 text-sky-400 bg-sky-950/20 hover:bg-sky-950/40 hover:border-sky-600 transition-all cursor-pointer"
                  title="Use a Streak Shield"
                >
                  <Icons.Shield className="h-3.5 w-3.5" />

                  <span>Freeze</span>
                </button>
              )}
          </div>
        </div>

        {/* Completion / Skip Control */}
        <div
          onClick={(e) =>
            e.stopPropagation()
          }
          className="shrink-0 flex flex-col items-end justify-center gap-2"
        >
          {renderActionSection()}
        </div>
      </div>

      {/* Expanded Accordion */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-2.5 border-t border-border-primary bg-card-bg/20 space-y-3 select-none animate-fadeIn">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              Personal Consistency (Last 14 Days)
            </span>
          </div>

          {/* Heatmap */}
          <div className="grid grid-cols-7 gap-1.5 max-w-sm">
            {last14Days.map(
              (dateStr) => {
                const dayStatus =
                  stats.history[dateStr]
                    ?.status || 'missed';

                const dayLog =
                  logs.find(
                    (l) =>
                      l.habit_id ===
                        habit.id &&
                      l.logical_date ===
                        dateStr
                  );

                const completedCount =
                  dayLog?.count_completed ??
                  0;

                const percentage =
                  habit.target_count > 0
                    ? Math.round(
                        (completedCount /
                          habit.target_count) *
                          100
                      )
                    : 0;

                const dayNum =
                  dateStr.split('-')[2];

                let boxClass =
                  'bg-bg-primary border border-border-primary';

                let numClass =
                  'text-neutral-600';

                let textTitle = `${dateStr}: ${percentage}% (${completedCount}/${habit.target_count})`;

                /*
                 * Frozen day
                 */
                if (
                  dayStatus === 'frozen'
                ) {
                  boxClass =
                    'bg-sky-950/30 border border-sky-800';

                  numClass =
                    'text-sky-400';

                  textTitle =
                    `${dateStr}: Streak Frozen`;
                }

                /*
                 * Skipped day
                 */
                else if (
                  dayStatus ===
                  'skipped'
                ) {
                  boxClass =
                    'bg-bg-primary border border-dashed border-amber-900';

                  numClass =
                    'text-amber-500';

                  textTitle =
                    `${dateStr}: Skipped`;
                }

                /*
                 * Justified day
                 */
                else if (
                  dayStatus ===
                  'justified'
                ) {
                  boxClass =
                    'bg-purple-950/20 border border-dashed border-purple-800';

                  numClass =
                    'text-purple-400';

                  textTitle =
                    `${dateStr}: Justified excused absence`;
                }

                /*
                 * Single tick
                 */
                else if (
                  habit.type ===
                  'single_tick'
                ) {
                  if (
                    dayStatus ===
                    'completed'
                  ) {
                    boxClass =
                      'bg-amber-400 border-amber-400';

                    numClass =
                      'text-black';

                    textTitle =
                      `${dateStr}: Completed`;
                  } else if (
                    dayStatus ===
                    'min_version'
                  ) {
                    boxClass =
                      'bg-card-bg border border-border-hover';

                    numClass =
                      'text-text-primary';

                    textTitle =
                      `${dateStr}: Safety Net Completed`;
                  }
                }

                /*
                 * Frequency habit:
                 * percentage-based heatmap
                 */
                else {
                  if (
                    percentage > 100
                  ) {
                    boxClass =
                      'bg-amber-500 border-amber-300 ring-1 ring-amber-350';

                    numClass =
                      'text-black font-extrabold';
                  } else if (
                    percentage === 100
                  ) {
                    boxClass =
                      'bg-amber-400 border-amber-400';

                    numClass =
                      'text-black';
                  } else if (
                    percentage >= 75
                  ) {
                    boxClass =
                      'bg-amber-400/70 border-amber-400/60';

                    numClass =
                      'text-amber-100';
                  } else if (
                    percentage >= 50
                  ) {
                    boxClass =
                      'bg-amber-400/45 border-amber-400/40';

                    numClass =
                      'text-amber-200';
                  } else if (
                    percentage >= 25
                  ) {
                    boxClass =
                      'bg-amber-400/20 border-amber-400/25';

                    numClass =
                      'text-amber-300';
                  } else if (
                    percentage > 0
                  ) {
                    boxClass =
                      'bg-amber-400/10 border-amber-400/15';

                    numClass =
                      'text-amber-500';
                  }
                }

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-md flex flex-col items-center justify-center text-[9px] font-bold transition-all hover:scale-105 cursor-help ${boxClass}`}
                    title={textTitle}
                  >
                    {habit.type ===
                    'single_tick' ? (
                      <span
                        className={
                          numClass
                        }
                      >
                        {dayNum}
                      </span>
                    ) : (
                      <>
                        <span
                          className={`text-[10px] ${numClass}`}
                        >
                          {percentage}%
                        </span>

                        <span className="text-[7px] text-neutral-600">
                          {dayNum}
                        </span>
                      </>
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-border-primary/50">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-bold tracking-wider text-neutral-600 uppercase select-none">
              {habit.type ===
              'single_tick' ? (
                <>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-bg-primary border border-border-primary" />
                    Missed
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-sky-950/30 border border-sky-800" />
                    Frozen
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-bg-primary border border-dashed border-amber-900" />
                    Skipped
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-purple-950/20 border border-dashed border-purple-800" />
                    Justified
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-card-bg border border-border-hover" />
                    Safety Net
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-400 border border-amber-400" />
                    Complete
                  </span>
                </>
              ) : (
                <>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-bg-primary border border-border-primary" />
                    0%
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-400/20 border border-amber-400/25" />
                    25%
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-400/45 border border-amber-400/40" />
                    50%
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-400/70 border border-amber-400/60" />
                    75%
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-400 border border-amber-400" />
                    100%
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-amber-500 border border-amber-300 ring-1 ring-amber-350" />
                    Extra
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-sky-950/30 border border-sky-800" />
                    Frozen
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-bg-primary border border-dashed border-amber-900" />
                    Skipped
                  </span>

                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded bg-purple-950/20 border border-dashed border-purple-800" />
                    Justified
                  </span>
                </>
              )}
            </div>

            {/* Edit */}
            <div>
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
        </div>
      )}
    </div>
  );
};