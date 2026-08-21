-- Create custom schema called habitpro
create schema if not exists habitpro;

-- Grant usage on the custom schema to Supabase API roles
grant usage on schema habitpro to anon, authenticated, service_role;

-- Create Profiles table (extends auth.users) in habitpro
create table if not exists habitpro.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  xp integer not null default 0,
  level integer not null default 1,
  streak_shields integer not null default 3,
  day_offset_hours integer not null default 5, -- Day boundary at 5:00 AM
  salah_tracker_enabled boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table habitpro.profiles enable row level security;

drop policy if exists "Users can view their own profile" on habitpro.profiles;
create policy "Users can view their own profile" on habitpro.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on habitpro.profiles;
create policy "Users can update their own profile" on habitpro.profiles
  for update using (auth.uid() = id);

-- Trigger to automatically create profile on sign up
create or replace function habitpro.handle_new_user()
returns trigger as $$
begin
  insert into habitpro.profiles (id, display_name, xp, level, streak_shields, day_offset_hours, salah_tracker_enabled)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    0,
    1,
    3,
    5,
    false
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger pointing to the function in the new schema
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure habitpro.handle_new_user();

-- Create Categories table in habitpro
create table if not exists habitpro.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade,
  name text not null,
  icon text not null default 'Folder',
  color text not null default '#ffffff',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.categories enable row level security;

drop policy if exists "Users can perform all actions on their own categories" on habitpro.categories;
create policy "Users can perform all actions on their own categories" on habitpro.categories
  for all using (auth.uid() = user_id);

-- Create Habits table in habitpro
create table if not exists habitpro.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  identity text not null, -- "Who are you becoming?"
  name text not null,     -- "What is the habit?"
  category_id uuid references habitpro.categories(id) on delete set null,
  icon text not null default 'Check',
  type text not null check (type in ('single_tick', 'frequency')),
  target_count integer not null default 1,
  frequency_unit text not null default 'daily',
  cue_phase text not null, -- 'phase_1', 'phase_2', 'phase_3', 'phase_4'
  min_version_enabled boolean not null default false,
  min_version_description text,
  min_version_count integer not null default 1,
  xp_reward integer not null default 10,
  streak_count integer not null default 0,
  best_streak integer not null default 0,
  is_archived boolean not null default false,
  is_salah boolean not null default false,
  repeat_days integer[] default array[0,1,2,3,4,5,6],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.habits enable row level security;

drop policy if exists "Users can perform all actions on their own habits" on habitpro.habits;
create policy "Users can perform all actions on their own habits" on habitpro.habits
  for all using (auth.uid() = user_id);

-- Create Habit Logs table in habitpro
create table if not exists habitpro.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habitpro.habits(id) on delete cascade not null,
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  logical_date date not null, -- format YYYY-MM-DD
  count_completed numeric not null default 0,
  is_minimum_version boolean not null default false,
  is_skipped boolean not null default false,
  is_justified boolean not null default false,
  xp_earned integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_habit_date unique (habit_id, logical_date)
);

alter table habitpro.habit_logs enable row level security;

drop policy if exists "Users can perform all actions on their own habit logs" on habitpro.habit_logs;
create policy "Users can perform all actions on their own habit logs" on habitpro.habit_logs
  for all using (auth.uid() = user_id);

-- Create Streak Freezes table in habitpro
create table if not exists habitpro.streak_freezes_used (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  habit_id uuid references habitpro.habits(id) on delete cascade not null,
  logical_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_habit_freeze_date unique (user_id, habit_id, logical_date)
);

alter table habitpro.streak_freezes_used enable row level security;

drop policy if exists "Users can perform all actions on their own streak freezes" on habitpro.streak_freezes_used;
drop policy if exists "Users can view their own streak freezes" on habitpro.streak_freezes_used;
drop policy if exists "Users can insert their own streak freezes" on habitpro.streak_freezes_used;
drop policy if exists "Users can delete their own streak freezes" on habitpro.streak_freezes_used;

create policy "Users can view their own streak freezes" on habitpro.streak_freezes_used for select using (auth.uid() = user_id);
create policy "Users can insert their own streak freezes" on habitpro.streak_freezes_used for insert with check (auth.uid() = user_id);
create policy "Users can delete their own streak freezes" on habitpro.streak_freezes_used for delete using (auth.uid() = user_id);

-- Create Achievements table in habitpro
create table if not exists habitpro.achievements (
  id text primary key,
  title text not null,
  description text not null,
  xp_reward integer not null default 50,
  icon text not null default 'Award'
);

-- Populate standard achievements
insert into habitpro.achievements (id, title, description, xp_reward, icon) values
  ('atomic_start', 'Atomic Start', 'Create your first identity-based habit', 50, 'Flame'),
  ('streak_3', 'Consistent Catalyst', 'Reach a 3-day streak on any habit', 100, 'Zap'),
  ('streak_7', 'Habit Loop Master', 'Reach a 7-day streak on any habit', 200, 'Crown'),
  ('consistency_king', 'Unstoppable Habit', 'Reach a 14-day streak on any habit', 300, 'Trophy'),
  ('streak_30', 'Identity Shifted', 'Reach a 30-day streak on any habit', 500, 'ShieldAlert'),
  ('min_saviour', 'Show Up Anyway', 'Complete a habit via its Minimum Version to save a streak', 75, 'Heart'),
  ('shield_block', 'Streak Freeze', 'Use a Streak Freeze shield to prevent a reset', 75, 'Shield'),
  ('level_5', 'Self-Actualizer', 'Reach Level 5 in XP progress', 300, 'TrendingUp'),
  ('cue_master', 'Master of Routine', 'Complete at least one habit in all 4 circadian phases', 150, 'Clock'),
  ('skipped_wisdom', 'Strategic Rest', 'Use your first Skip to take an intentional recovery day', 50, 'Smile'),
  ('xp_hoarder', 'XP Titan', 'Accumulate 1,000 total XP points', 250, 'Award'),
  ('identity_champion', 'Identity Champion', 'Cast 50 total completions (votes) for a single identity', 250, 'Sparkles')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  icon = excluded.icon;

-- Create User Achievements junction table in habitpro
create table if not exists habitpro.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  achievement_id text references habitpro.achievements(id) on delete cascade not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_achievement unique (user_id, achievement_id)
);

alter table habitpro.user_achievements enable row level security;

drop policy if exists "Users can view their own unlocked achievements" on habitpro.user_achievements;
create policy "Users can view their own unlocked achievements" on habitpro.user_achievements
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own unlocked achievements" on habitpro.user_achievements;
create policy "Users can insert their own unlocked achievements" on habitpro.user_achievements
  for insert with check (auth.uid() = user_id);

-- Create Sleep Logs table in habitpro
create table if not exists habitpro.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  logical_date date not null,
  start_time text not null,
  end_time text not null,
  duration_hours numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_sleep_date unique (user_id, logical_date)
);

alter table habitpro.sleep_logs enable row level security;

drop policy if exists "Users can perform all actions on their own sleep logs" on habitpro.sleep_logs;
create policy "Users can perform all actions on their own sleep logs" on habitpro.sleep_logs
  for all using (auth.uid() = user_id);

-- Create Mood Logs table in habitpro
create table if not exists habitpro.mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  logical_date date not null,
  phase text not null check (phase in ('phase_1', 'phase_2', 'phase_3', 'phase_4')),
  mood text not null check (mood in ('hyperactive', 'happy', 'okay', 'sad', 'depressed')),
  energy text not null check (energy in ('high', 'medium', 'low')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_mood_date_phase unique (user_id, logical_date, phase)
);

alter table habitpro.mood_logs enable row level security;

drop policy if exists "Users can perform all actions on their own mood logs" on habitpro.mood_logs;
create policy "Users can perform all actions on their own mood logs" on habitpro.mood_logs
  for all using (auth.uid() = user_id);

-- Create Meditation Logs table in habitpro
create table if not exists habitpro.meditation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  logical_date date not null,
  duration_minutes integer not null default 0,
  target_minutes integer not null default 15,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_meditation_date unique (user_id, logical_date)
);

alter table habitpro.meditation_logs enable row level security;
drop policy if exists "Users can perform all actions on their own meditation logs" on habitpro.meditation_logs;
create policy "Users can perform all actions on their own meditation logs" on habitpro.meditation_logs
  for all using (auth.uid() = user_id);

-- Create Yearly Plans table
create table if not exists habitpro.yearly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.yearly_plans enable row level security;
drop policy if exists "Users can perform all actions on their own yearly plans" on habitpro.yearly_plans;
create policy "Users can perform all actions on their own yearly plans" on habitpro.yearly_plans
  for all using (auth.uid() = user_id);

-- Create Quarterly Goals table
create table if not exists habitpro.quarterly_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  yearly_plan_id uuid references habitpro.yearly_plans(id) on delete cascade not null,
  quarter text not null check (quarter in ('Q1', 'Q2', 'Q3', 'Q4')),
  title text not null,
  is_completed boolean not null default false,
  supporting_habit text,
  due_date date,
  current_progress integer not null default 0,
  total_target integer,
  status text not null default 'planned' check (status in ('planned', 'in-progress', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.quarterly_goals enable row level security;
drop policy if exists "Users can perform all actions on their own quarterly goals" on habitpro.quarterly_goals;
create policy "Users can perform all actions on their own quarterly goals" on habitpro.quarterly_goals
  for all using (auth.uid() = user_id);

-- Create Milestones table
create table if not exists habitpro.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  title text not null,
  target_date date not null,
  is_completed boolean not null default false,
  habit_id uuid references habitpro.habits(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.milestones enable row level security;
drop policy if exists "Users can perform all actions on their own milestones" on habitpro.milestones;
create policy "Users can perform all actions on their own milestones" on habitpro.milestones
  for all using (auth.uid() = user_id);

-- Create Weekly Reviews table
create table if not exists habitpro.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  week_start_date date not null,
  wins text not null default '',
  challenges text not null default '',
  next_steps text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_weekly_review unique (user_id, week_start_date)
);

alter table habitpro.weekly_reviews enable row level security;
drop policy if exists "Users can perform all actions on their own weekly reviews" on habitpro.weekly_reviews;
create policy "Users can perform all actions on their own weekly reviews" on habitpro.weekly_reviews
  for all using (auth.uid() = user_id);

-- Create Tomorrow Plans table
create table if not exists habitpro.tomorrow_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  logical_date date not null,
  priorities text[] not null,
  notes text not null default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_tomorrow_plan unique (user_id, logical_date)
);

alter table habitpro.tomorrow_plans enable row level security;
drop policy if exists "Users can perform all actions on their own tomorrow plans" on habitpro.tomorrow_plans;
create policy "Users can perform all actions on their own tomorrow plans" on habitpro.tomorrow_plans
  for all using (auth.uid() = user_id);

-- Create Planner Priorities table
create table if not exists habitpro.planner_priorities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references habitpro.profiles(id) on delete cascade not null,
  title text not null,
  due_date date not null,
  is_completed boolean not null default false,
  is_skipped boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habitpro.planner_priorities enable row level security;
drop policy if exists "Users can perform all actions on their own planner priorities" on habitpro.planner_priorities;
create policy "Users can perform all actions on their own planner priorities" on habitpro.planner_priorities
  for all using (auth.uid() = user_id);

-- Grant privileges on all tables & sequences inside the schema
grant all privileges on all tables in schema habitpro to anon, authenticated, service_role;
grant all privileges on all sequences in schema habitpro to anon, authenticated, service_role;

-- Ensure future tables inherit privileges automatically
alter default privileges in schema habitpro grant all privileges on tables to anon, authenticated, service_role;
alter default privileges in schema habitpro grant all privileges on sequences to anon, authenticated, service_role;
