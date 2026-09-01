import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import * as Icons from 'lucide-react';
import { getRecoveryData, isEligibleForRecovery } from '../utils/habitFilters';
import type { SubHabit } from '../utils/habitFilters';
import { getLogicalDate } from '../utils/dateUtils';

interface HabitFormProps {
  onClose: () => void;
  editHabitId?: string;
}

const PRESETS_ICONS = [
  'Check', 'Activity', 'BookOpen', 'Brain', 'Code', 'Dumbbell', 
  'Coffee', 'Flame', 'Heart', 'Sparkles', 'Moon', 'Sun', 
  'Music', 'Pencil', 'Trophy', 'Folder', 'User', 'Clock'
];

const PRESETS_COLORS = [
  '#ffffff', '#10b981', '#06b6d4', '#8b5cf6', '#ef4444', 
  '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#a855f7'
];

const LIFE_PHASES = [
  { id: 'all_day', name: 'All Day / Optional', desc: 'No specific time constraint (e.g. Drink Water)' },
  { id: 'phase_1', name: 'Phase 1 (1 PM - 4 PM)', desc: 'Afternoon Kickoff' },
  { id: 'phase_2', name: 'Phase 2 (4 PM - 8 PM)', desc: 'Prime Focus' },
  { id: 'phase_3', name: 'Phase 3 (8 PM - 12 AM)', desc: 'Night Shift Core' },
  { id: 'phase_4', name: 'Phase 4 (12 AM - 4 AM)', desc: 'Late Night Burn' }
];

export const HabitForm: React.FC<HabitFormProps> = ({ onClose, editHabitId }) => {
  const categories = useStore(state => state.categories);
  const addCategory = useStore(state => state.addCategory);
  const addHabit = useStore(state => state.addHabit);
  const updateHabit = useStore(state => state.updateHabit);
  const archiveHabit = useStore(state => state.archiveHabit);
  const showConfirm = useStore(state => state.showConfirm);
  const habits = useStore(state => state.habits);
  const logs = useStore(state => state.logs);
  const freezes = useStore(state => state.freezes);
  const profile = useStore(state => state.profile);
  
  const editHabit = editHabitId ? habits.find(h => h.id === editHabitId) : undefined;
  const initialRecovery = editHabit ? getRecoveryData(editHabit) : null;
  const showRecoveryOption = editHabit ? (!!initialRecovery || isEligibleForRecovery(editHabit, logs, freezes, profile.day_offset_hours)) : false;
  
  // Habit fields
  const [identity, setIdentity] = useState(editHabit?.identity || '');
  const [name, setName] = useState(editHabit?.name || '');
  const [categoryId, setCategoryId] = useState(editHabit?.category_id || categories[0]?.id || '');
  const [habitIcon, setHabitIcon] = useState(editHabit?.icon || 'Check');
  const [habitType, setHabitType] = useState<'single_tick' | 'frequency'>(editHabit?.type || 'single_tick');
  const [targetCount, setTargetCount] = useState(editHabit?.target_count || 1);
  const [cuePhase, setCuePhase] = useState(editHabit?.cue_phase || 'all_day');
  const [repeatDays, setRepeatDays] = useState<number[]>(editHabit?.repeat_days || [0, 1, 2, 3, 4, 5, 6]);
  
  // Recovery Mode (Eco Leaf) States
  const [isRecovery, setIsRecovery] = useState(!!initialRecovery);
  const [subHabits, setSubHabits] = useState<SubHabit[]>(initialRecovery?.sub_habits || []);
  const [newSubName, setNewSubName] = useState('');
  
  // Minimum version
  const [minEnabled, setMinEnabled] = useState(editHabit?.min_version_enabled || false);
  const [minDesc, setMinDesc] = useState(editHabit?.min_version_description || '');
  const [minCount, setMinCount] = useState(editHabit?.min_version_count || 1);
  
  // New Category Fields
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#ffffff');
  const [newCatIcon, setNewCatIcon] = useState('Folder');

  // Custom Dropdowns Open States
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCueDropdownOpen, setIsCueDropdownOpen] = useState(false);

  const selectedCategory = categories.find(c => c.id === categoryId) || categories[0];
  const selectedCue = LIFE_PHASES.find(p => p.id === cuePhase) || LIFE_PHASES[0];

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const created = await addCategory(newCatName, newCatIcon, newCatColor);
      setCategoryId(created.id);
      setShowNewCat(false);
      setNewCatName('');
    } catch (e) {
      console.error(e);
      alert('Error creating category.');
    }
  };

  const handleAddSubHabit = () => {
    if (!newSubName.trim()) return;
    const newSub: SubHabit = {
      id: Math.random().toString(36).substring(2, 9),
      name: newSubName.trim()
    };
    setSubHabits([...subHabits, newSub]);
    setNewSubName('');
  };

  const handleRemoveSubHabit = (id: string) => {
    setSubHabits(subHabits.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !name.trim()) {
      alert('Please fill out the identity and habit action.');
      return;
    }

    try {
      if (isRecovery && subHabits.length === 0) {
        alert('Please add at least one sub-habit for Recovery Mode.');
        return;
      }

      let data: any;

      if (isRecovery) {
        const recJson = JSON.stringify({
          is_recovery: true,
          sub_habits: subHabits,
          recovery_start_date: initialRecovery?.recovery_start_date || getLogicalDate(new Date(), profile.day_offset_hours),
          original_target_count: initialRecovery?.original_target_count || editHabit?.target_count || targetCount
        });

        data = {
          identity,
          name,
          category_id: categoryId || undefined,
          icon: habitIcon,
          type: 'frequency',
          target_count: subHabits.length,
          frequency_unit: 'daily',
          cue_phase: cuePhase,
          min_version_enabled: true,
          min_version_description: recJson,
          min_version_count: 1,
          xp_reward: 10,
          repeat_days: repeatDays
        };
      } else {
        const restoredTargetCount = initialRecovery ? initialRecovery.original_target_count : targetCount;

        data = {
          identity,
          name,
          category_id: categoryId || undefined,
          icon: habitIcon,
          type: habitType,
          target_count: habitType === 'single_tick' ? 1 : restoredTargetCount,
          frequency_unit: 'daily',
          cue_phase: cuePhase,
          min_version_enabled: minEnabled,
          min_version_description: minEnabled ? minDesc : undefined,
          min_version_count: minEnabled ? minCount : 1,
          xp_reward: 10,
          repeat_days: repeatDays
        };
      }

      if (editHabitId) {
        await updateHabit(editHabitId, data);
      } else {
        await addHabit(data);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error saving habit.');
    }
  };

  const getDynamicIcon = (iconName: string, color?: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent className="h-4 w-4 shrink-0 text-text-primary" style={color ? { color } : undefined} />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-hidden select-none">
      <div className="w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-card-bg border border-border-primary rounded-2xl flex flex-col shadow-2xl overflow-hidden my-auto transition-all">
        
        {/* Form Header */}
        <div className="flex justify-between items-center border-b border-border-primary p-4 sm:p-6 shrink-0 bg-card-bg z-10">
          <div>
            <h2 className="text-xl font-bold font-poppins text-text-primary">
              {editHabitId ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1">Design an identity-based system for consistency</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border-primary hover:border-border-hover text-neutral-400 hover:text-text-primary transition-colors cursor-pointer"
          >
            <Icons.X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 flex flex-col min-h-0">
          {/* Identity Statement */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Identity Statement (Who are you becoming?)
            </label>
            <input 
              type="text" 
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              placeholder="e.g. A focused developer, A fit athlete, A mindful writer"
              className="w-full px-4 py-3 rounded-lg cred-input text-sm"
              required
            />
          </div>

          {/* Habit Action */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Habit Action (What will you do?)
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Code for 1 hour, Run 2 miles, Meditate for 10 minutes"
              className="w-full px-4 py-3 rounded-lg cred-input text-sm"
              required
            />
          </div>

          {/* Category & Cue selection custom dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category selection */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Category
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                  setIsCueDropdownOpen(false);
                }}
                className="w-full px-3 py-3 rounded-lg cred-input text-xs flex justify-between items-center text-left cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: selectedCategory?.color }} />
                  {getDynamicIcon(selectedCategory?.icon, selectedCategory?.color)}
                  <span className="text-text-primary font-medium truncate">{selectedCategory?.name}</span>
                </div>
                <Icons.ChevronDown className={`h-3.5 w-3.5 text-neutral-500 shrink-0 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute z-30 w-full mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 max-h-[160px] overflow-y-auto">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategoryId(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2.5 hover:bg-card-bg text-left text-xs flex items-center gap-2 text-text-primary font-medium cursor-pointer"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      {getDynamicIcon(cat.icon, cat.color)}
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCat(true);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2.5 hover:bg-card-bg text-left text-xs text-neutral-400 font-semibold border-t border-border-primary cursor-pointer"
                  >
                    + Create Custom Category
                  </button>
                </div>
              )}
            </div>

            {/* Cue Phase selection */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Cue (Circadian Phase)
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCueDropdownOpen(!isCueDropdownOpen);
                  setIsCategoryDropdownOpen(false);
                }}
                className="w-full px-3 py-1.5 rounded-lg cred-input text-xs flex justify-between items-center text-left cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-text-primary font-medium block truncate">{selectedCue.name}</span>
                  <span className="text-[9px] text-neutral-500 font-normal truncate block">{selectedCue.desc}</span>
                </div>
                <Icons.ChevronDown className={`h-3.5 w-3.5 text-neutral-500 shrink-0 transition-transform ${isCueDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isCueDropdownOpen && (
                <div className="absolute z-30 w-full mt-1 bg-bg-primary border border-border-primary rounded-lg shadow-xl py-1 max-h-[180px] overflow-y-auto">
                  {LIFE_PHASES.map(phase => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => {
                        setCuePhase(phase.id);
                        setIsCueDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2.5 hover:bg-card-bg text-left text-xs text-text-primary cursor-pointer"
                    >
                      <span className="font-bold block truncate">{phase.name}</span>
                      <span className="text-[9px] text-neutral-500 truncate block">{phase.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Create custom category popover */}
          {showNewCat && (
            <div className="p-4 rounded-lg border border-border-primary bg-bg-primary space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-text-primary">Create Custom Category</span>
                <button 
                  type="button" 
                  onClick={() => setShowNewCat(false)} 
                  className="text-neutral-500 hover:text-text-primary cursor-pointer"
                >
                  <Icons.X className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Category Name"
                  className="w-full px-3 py-2 rounded-lg cred-input text-xs"
                />
                
                {/* Preset Colors */}
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block mb-1">Color</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESETS_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCatColor(color)}
                        className={`h-5 w-5 rounded-full border ${
                          newCatColor === color ? 'border-text-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preset Icons */}
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block mb-1">Icon</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESETS_ICONS.slice(0, 8).map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewCatIcon(icon)}
                        className={`p-1.5 rounded border ${
                          newCatIcon === icon ? 'bg-card-bg border-border-primary text-text-primary' : 'border-transparent text-neutral-550'
                        }`}
                      >
                        {getDynamicIcon(icon)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="w-full py-2 bg-btn-primary-bg text-btn-primary-text font-semibold rounded text-xs cursor-pointer hover:bg-btn-primary-hover transition-colors"
                >
                  Add Category
                </button>
              </div>
            </div>
          )}

          {/* Type Toggle & Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border-primary pt-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Evaluation Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHabitType('single_tick')}
                  className={`flex-1 py-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                    habitType === 'single_tick' 
                      ? 'bg-btn-primary-bg text-btn-primary-text border-btn-primary-bg font-bold' 
                      : 'bg-bg-primary text-neutral-500 border-border-primary hover:border-border-hover'
                  }`}
                >
                  Single Tick
                </button>
                <button
                  type="button"
                  onClick={() => setHabitType('frequency')}
                  className={`flex-1 py-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                    habitType === 'frequency' 
                      ? 'bg-btn-primary-bg text-btn-primary-text border-btn-primary-bg font-bold' 
                      : 'bg-bg-primary text-neutral-500 border-border-primary hover:border-border-hover'
                  }`}
                >
                  Count/Frequency
                </button>
              </div>
            </div>

            {habitType === 'frequency' && (
              <div>
                <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  Daily Target Count
                </label>
                <div className="flex items-center border border-border-primary rounded-lg overflow-hidden bg-bg-primary">
                  <button
                    type="button"
                    onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
                    className="px-3 py-2 text-neutral-500 hover:text-text-primary"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={targetCount}
                    onChange={e => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full text-center bg-transparent border-none text-text-primary text-xs focus:ring-0 focus:outline-none animate-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTargetCount(targetCount + 1)}
                    className="px-3 py-2 text-neutral-500 hover:text-text-primary"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Repeat Days Selector */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Repeat Days (Weekly Schedule)
            </label>
            <div className="flex justify-between gap-1 bg-bg-primary border border-border-primary rounded-lg p-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, idx) => {
                const isSelected = repeatDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (repeatDays.length > 1) {
                          setRepeatDays(repeatDays.filter(d => d !== idx));
                        }
                      } else {
                        setRepeatDays([...repeatDays, idx].sort());
                      }
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-btn-primary-bg text-btn-primary-text'
                        : 'text-neutral-500 hover:text-text-primary'
                    }`}
                  >
                    {dayName[0]}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Habit will only show on your checklist on selected days. Streaks won't break on rest days.
            </p>
          </div>

          {/* Icon picker */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
              Select Habit Icon
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-bg-primary border border-border-primary rounded-lg max-h-[100px] overflow-y-auto">
              {PRESETS_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setHabitIcon(icon)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer ${
                    habitIcon === icon 
                      ? 'bg-card-bg border-border-hover scale-105 text-text-primary' 
                      : 'border-transparent hover:bg-card-bg text-neutral-500'
                  }`}
                >
                  {getDynamicIcon(icon)}
                </button>
              ))}
            </div>
          </div>

          {/* Recovery Mode (Eco Leaf / Light Mode) */}
          {showRecoveryOption && (
            <div className="border-t border-border-primary pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-500 flex items-center gap-1.5">
                    <Icons.Leaf className="h-3.5 w-3.5 text-emerald-500 fill-current" />
                    <span>Recovery Mode</span>
                  </span>
                  <span className="text-[10px] text-neutral-505 block mt-0.5 font-bold uppercase tracking-wider">
                    Reduce this routine to micro-habits to recover from consistent failures
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isRecovery;
                    setIsRecovery(nextVal);
                    if (nextVal && subHabits.length === 0) {
                      setSubHabits([{ id: Math.random().toString(36).substring(2, 9), name: `Light: ${name}` }]);
                    }
                  }}
                  className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                    isRecovery ? 'bg-emerald-500' : 'bg-card-bg border border-border-primary'
                  }`}
                >
                  <div 
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                      isRecovery ? 'bg-black translate-x-4' : 'bg-neutral-500'
                    }`}
                  />
                </button>
              </div>

              {isRecovery && (
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-3 animate-fadeIn">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">
                    🌿 Define Recovery Sub-Habits
                  </span>
                  
                  {/* List of current sub-habits */}
                  <div className="space-y-2">
                    {subHabits.map((sub, sIdx) => (
                      <div key={sub.id} className="flex items-center justify-between bg-card-bg/60 border border-border-primary/50 rounded-lg px-2.5 py-1.5">
                        <span className="text-xs font-semibold text-text-primary">
                          {sIdx + 1}. {sub.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubHabit(sub.id)}
                          className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-400 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}

                    {subHabits.length === 0 && (
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider text-center py-2">
                        No sub-habits added yet. Add at least one!
                      </p>
                    )}
                  </div>

                  {/* Add sub-habit input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      placeholder="e.g. 10 squats, write 1 sentence"
                      className="flex-1 px-3 py-1.5 rounded-md cred-input text-xs"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubHabit();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubHabit}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 font-black px-3 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Minimum Version (Atomic Habits Two-Minute Rule) */}
          <div className="border-t border-border-primary pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">Enable Minimum Version Safety Net</span>
                <span className="text-[10px] text-neutral-500">Atomic Habits "2-minute rule" to prevent skipping streaks on bad days</span>
              </div>
              <button
                type="button"
                onClick={() => setMinEnabled(!minEnabled)}
                className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none ${
                  minEnabled ? 'bg-btn-primary-bg' : 'bg-card-bg border border-border-primary'
                }`}
              >
                <div 
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                    minEnabled ? 'bg-btn-primary-text translate-x-4' : 'bg-neutral-500'
                  }`}
                />
              </button>
            </div>

            {minEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-card-bg border border-border-primary rounded-lg animate-fadeIn">
                <div className="sm:col-span-2">
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Minimum Version Action
                  </label>
                  <input
                    type="text"
                    value={minDesc}
                    onChange={e => setMinDesc(e.target.value)}
                    placeholder="e.g. Read 1 page, Do 1 pushup"
                    className="w-full px-3 py-2 rounded-md cred-input text-xs"
                    required={minEnabled}
                  />
                </div>
                {habitType === 'frequency' && (
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                      Min Count
                    </label>
                    <input
                      type="number"
                      value={minCount}
                      onChange={e => setMinCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-md cred-input text-xs text-center animate-none"
                      min={1}
                      max={targetCount - 1}
                      required={minEnabled}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky Form Actions Bar pinned to bottom */}
          <div className="sticky -bottom-4 sm:-bottom-6 left-0 right-0 bg-card-bg/95 backdrop-blur-md pt-3 pb-2 border-t border-border-primary flex flex-col sm:flex-row gap-3 z-30 shrink-0 select-none shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
            {editHabitId && (
              <button
                type="button"
                onClick={() => {
                  showConfirm(
                    'Archive Habit',
                    `Archive habit: "${editHabit?.name}"?`,
                    async () => {
                      await archiveHabit(editHabitId);
                      onClose();
                    }
                  );
                }}
                className="py-3 px-4 rounded-lg border border-red-900/60 text-red-500 bg-red-950/15 hover:bg-red-950/30 hover:border-red-650 text-sm cursor-pointer transition-colors font-bold uppercase tracking-wider select-none shrink-0"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg cred-btn-secondary text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-lg cred-btn-primary text-sm cursor-pointer"
            >
              {editHabitId ? 'Save Changes' : 'Start Habit Loop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
