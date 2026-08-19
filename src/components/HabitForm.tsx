import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import * as Icons from 'lucide-react';

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
  const habits = useStore(state => state.habits);
  
  const editHabit = editHabitId ? habits.find(h => h.id === editHabitId) : undefined;
  
  // Habit fields
  const [identity, setIdentity] = useState(editHabit?.identity || '');
  const [name, setName] = useState(editHabit?.name || '');
  const [categoryId, setCategoryId] = useState(editHabit?.category_id || categories[0]?.id || '');
  const [habitIcon, setHabitIcon] = useState(editHabit?.icon || 'Check');
  const [habitType, setHabitType] = useState<'single_tick' | 'frequency'>(editHabit?.type || 'single_tick');
  const [targetCount, setTargetCount] = useState(editHabit?.target_count || 1);
  const [cuePhase, setCuePhase] = useState(editHabit?.cue_phase || 'all_day');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !name.trim()) {
      alert('Please fill out the identity and habit action.');
      return;
    }

    try {
      const data = {
        identity,
        name,
        category_id: categoryId || undefined,
        icon: habitIcon,
        type: habitType,
        target_count: habitType === 'single_tick' ? 1 : targetCount,
        frequency_unit: 'daily',
        cue_phase: cuePhase,
        min_version_enabled: minEnabled,
        min_version_description: minEnabled ? minDesc : undefined,
        min_version_count: minEnabled ? minCount : 1,
        xp_reward: 10
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-card-bg border border-border-primary rounded-2xl p-6 md:p-8 space-y-6 my-auto select-none transition-colors">
        
        {/* Form Header */}
        <div className="flex justify-between items-center border-b border-border-primary pb-4">
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

        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 border-t border-border-primary pt-4">
            {editHabitId && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Archive habit: "${editHabit?.name}"?`)) {
                    await archiveHabit(editHabitId);
                    onClose();
                  }
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
