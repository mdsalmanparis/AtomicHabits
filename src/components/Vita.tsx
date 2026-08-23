import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export interface VitaCategory {
  title: string;
  icon: string;
  rules: string[];
}

export const VITA_DATA: VitaCategory[] = [
  {
    title: 'Mindset & Identity',
    icon: 'Brain',
    rules: [
      'Decide who you want to become, not just what you want to achieve',
      'Take full ownership — no blaming circumstances or people',
      'Treat failure as data, not identity',
      'Compare yourself to who you were yesterday, not to others',
      'Get comfortable being a beginner repeatedly',
      'Choose long-term gain over short-term comfort',
      'Question your own assumptions regularly',
      'Stay curious — ask "why" more than you explain',
      'See discipline as self-respect, not punishment',
      'Detach your self-worth from outcomes you can\'t control'
    ]
  },
  {
    title: 'Health & Body',
    icon: 'Heart',
    rules: [
      'Sleep 7-8 hours, same time daily',
      'Exercise most days — strength + cardio',
      'Walk daily, even just 20-30 min',
      'Drink enough water',
      'Eat whole foods, minimize ultra-processed junk',
      'Get sunlight in the morning',
      'Limit alcohol and avoid drugs',
      'Get regular health checkups, don\'t ignore symptoms',
      'Stretch or do mobility work',
      'Track your sleep, weight, or energy if it helps you improve'
    ]
  },
  {
    title: 'Mind & Learning',
    icon: 'BookOpen',
    rules: [
      'Read daily, even 10-20 pages',
      'Learn one new skill deliberately every few months',
      'Journal — thoughts, goals, reflections',
      'Study people who\'ve done what you want to do',
      'Take notes on what you learn and revisit them',
      'Learn to write clearly — it forces clear thinking',
      'Learn basic finance and investing',
      'Learn how to sell/communicate — it\'s a life skill, not just business',
      'Practice deep focus — no multitasking on important work',
      'Meditate or practice stillness daily, even 5-10 min'
    ]
  },
  {
    title: 'Discipline & Productivity',
    icon: 'Zap',
    rules: [
      'Wake up at a consistent time',
      'Plan your day the night before or first thing in the morning',
      'Do your hardest task first (eat the frog)',
      'Use a calendar/task system religiously',
      'Batch similar tasks together',
      'Protect deep work blocks — phone away',
      'Say no to things that don\'t align with your goals',
      'Review your week every Sunday',
      'Set quarterly goals, not just yearly ones',
      'Track progress, not just intentions',
      'Finish what you start before jumping to the next shiny thing',
      'Build systems, not just goals ("I write 500 words daily" > "I\'ll write a book someday")'
    ]
  },
  {
    title: 'Money & Career',
    icon: 'Briefcase',
    rules: [
      'Spend less than you earn — always',
      'Save and invest a fixed % of every income, automatically',
      'Build multiple skills that stack (rare + valuable combos win)',
      'Learn to negotiate',
      'Build in public or share your work — visibility creates opportunity',
      'Take calculated risks early, when you have less to lose',
      'Don\'t tie your entire income to one employer forever',
      'Understand compound interest — in money, skills, and relationships',
      'Track your net worth, even loosely',
      'Reinvest early profits/skills into growth, not just lifestyle'
    ]
  },
  {
    title: 'Relationships & Communication',
    icon: 'Users',
    rules: [
      'Be radically honest, but kind',
      'Build a small circle of high-integrity people',
      'Actively listen more than you speak',
      'Follow up and follow through — reliability builds trust',
      'Help people without expecting anything back',
      'Stay in touch with mentors and old connections',
      'Learn to disagree respectfully',
      'Give credit generously',
      'Set boundaries with toxic people, even family',
      'Show up for people during their hard times — that\'s what\'s remembered'
    ]
  },
  {
    title: 'Emotional Mastery',
    icon: 'Smile',
    rules: [
      'Sit with discomfort instead of numbing it',
      'Respond, don\'t react — pause before replying when angry',
      'Process emotions instead of suppressing them',
      'Practice gratitude daily, specifically (not generic)',
      'Forgive people — for your peace, not theirs',
      'Accept what you can\'t control, fast',
      'Build resilience by doing hard things on purpose',
      'Don\'t seek constant validation — build internal confidence'
    ]
  },
  {
    title: 'Habits That Compound Long-Term',
    icon: 'TrendingUp',
    rules: [
      'Read biographies of people who built what you want',
      'Reflect monthly: what worked, what didn\'t, what\'s next',
      'Keep learning even after you "succeed" — complacency kills growth',
      'Build a personal brand/reputation for one specific thing',
      'Document your journey — content, notes, portfolio',
      'Surround yourself with people ahead of you in the game',
      'Teach what you learn — it deepens your own understanding',
      'Audit your habits every few months — cut what\'s not working',
      'Delay gratification on big purchases',
      'Avoid lifestyle inflation as income grows'
    ]
  },
  {
    title: 'Environment & Discipline Hacks',
    icon: 'Layers',
    rules: [
      'Design your environment so good habits are easy, bad ones are hard',
      'Remove distractions physically (delete apps, block sites)',
      'Keep your space clean — it reflects and affects your mind',
      'Limit passive scrolling — replace with active learning or rest',
      'Choose your five closest friends carefully — you become their average',
      'Build accountability — partner, coach, public commitment',
      'Track habits visually (streaks, checklists) — momentum is motivating'
    ]
  },
  {
    title: 'Long-Term Vision',
    icon: 'Compass',
    rules: [
      'Have a 10-year vision, then work backward',
      'Be patient — most "overnight successes" took 7-10 years',
      'Don\'t chase trends blindly — build depth in something real',
      'Reassess your definition of success every few years',
      'Build wealth AND health AND relationships — not just one',
      'Avoid burnout by pacing yourself, not sprinting forever',
      'Celebrate small wins — don\'t wait for the "big one" to feel proud',
      'Stay humble even as you grow',
      'Never stop being useful to others — value creation is the real game'
    ]
  }
];

export const Vita: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredRule, setFeaturedRule] = useState<{ rule: string; cat: string } | null>(() => {
    const all = VITA_DATA.flatMap(cat => cat.rules.map(r => ({ rule: r, cat: cat.title })));
    if (all.length === 0) return null;
    return all[Math.floor(Math.random() * all.length)];
  });

  const getIconComponent = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Book;
    return <IconComponent className="h-5 w-5 text-indigo-505 fill-indigo-505/10 shrink-0 stroke-[2px]" />;
  };

  const filteredCategories = VITA_DATA.map(category => {
    const matchedRules = category.rules.filter(rule =>
      rule.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, rules: matchedRules };
  }).filter(cat => cat.rules.length > 0 || cat.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 font-sans selection:bg-text-primary selection:text-bg-primary transition-colors">
      {/* Title */}
      <div className="border-b border-border-primary pb-4 select-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-text-primary uppercase tracking-wider">Vita</h2>
          <p className="text-xs text-neutral-500 mt-1">The collection of personal life rules and compound principles</p>
        </div>
        
        {/* Search */}
        <div className="relative max-w-xs w-full sm:self-end">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-505" />
          <input
            type="text"
            placeholder="Search life rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card-bg border border-border-primary rounded-xl text-xs text-text-primary focus:outline-none focus:border-border-hover transition-colors font-semibold"
          />
        </div>
      </div>

      {/* Featured Daily Principle */}
      {featuredRule && !searchQuery && (
        <div className="p-5 rounded-2xl bg-indigo-505/5 border border-indigo-505/15 flex gap-4 items-start select-none animate-fadeIn">
          <Icons.Quote className="h-6 w-6 text-indigo-505 shrink-0 mt-0.5 fill-indigo-505/10" />
          <div className="space-y-1 flex-1">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-505 font-poppins">Focus Principle of the Day</h4>
            <p className="text-xs leading-relaxed font-bold text-text-primary">"{featuredRule.rule}"</p>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{featuredRule.cat}</p>
          </div>
          <button 
            onClick={() => {
              const all = VITA_DATA.flatMap(cat => cat.rules.map(r => ({ rule: r, cat: cat.title })));
              setFeaturedRule(all[Math.floor(Math.random() * all.length)]);
            }}
            className="p-1 rounded-lg hover:bg-indigo-550/10 text-indigo-505 transition-colors cursor-pointer"
            title="Next Rule"
          >
            <Icons.RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map(cat => (
          <div key={cat.title} className="cred-card p-5 rounded-xl border border-border-primary bg-card-bg space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border-primary/50 pb-3">
              <div className="p-2 rounded-lg bg-indigo-505/10 border border-indigo-550/15 flex items-center justify-center shrink-0">
                {getIconComponent(cat.icon)}
              </div>
              <h3 className="text-sm font-extrabold font-poppins text-text-primary uppercase tracking-wide">
                {cat.title}
              </h3>
            </div>

            {/* Rules List */}
            <ul className="space-y-3.5">
              {cat.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed animate-fadeIn">
                  <span className="h-4.5 w-4.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-border-primary flex items-center justify-center text-[9px] font-black text-neutral-500 shrink-0 select-none">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-sm text-neutral-500 font-medium md:col-span-2">
            No matching life rules found. Try searching for something else.
          </div>
        )}
      </div>
    </div>
  );
};
