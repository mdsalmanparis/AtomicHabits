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
  insert into habitpro.profiles (id, display_name, xp, level, streak_shields, day_offset_hours)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    0,
    1,
    3,
    5
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
  count_completed integer not null default 0,
  is_minimum_version boolean not null default false,
  is_skipped boolean not null default false,
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
  logical_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_freeze_date unique (user_id, logical_date)
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

-- Grant privileges on all tables & sequences inside the schema
grant all privileges on all tables in schema habitpro to anon, authenticated, service_role;
grant all privileges on all sequences in schema habitpro to anon, authenticated, service_role;

-- Ensure future tables inherit privileges automatically
alter default privileges in schema habitpro grant all privileges on tables to anon, authenticated, service_role;
alter default privileges in schema habitpro grant all privileges on sequences to anon, authenticated, service_role;
