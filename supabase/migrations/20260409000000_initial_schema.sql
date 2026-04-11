-- ═══════════════════════════════════════════════════════════
--  NYXIS — Initial Database Schema
--  Run this migration against a fresh Supabase project.
--
--  Tables:   profiles, paths, quests, quest_logs,
--            quest_dependencies, behavior_profiles,
--            memory_events, reward_drops, external_signals
--
--  RPCs:     complete_quest_with_proof, fail_quest,
--            process_time_penalties, log_memory_event,
--            log_external_signal
--
--  Trigger:  Auto-create profile + behavior_profile on signup
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  level         integer not null default 1,
  rank          text    not null default 'E-Rank',
  total_xp      integer not null default 0,
  str           integer not null default 1,
  int           integer not null default 1,
  dex           integer not null default 1,
  vit           integer not null default 1,
  wis           integer not null default 1,
  pressure_level integer not null default 0,
  system_state  text    not null default 'NORMAL',
  current_streak integer not null default 0,
  last_active_date date,
  immunity_until timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);


-- ─────────────────────────────────────────────────────────
-- 2. PATHS (goal → quest group)
-- ─────────────────────────────────────────────────────────
create table if not exists public.paths (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  goal       text not null,
  created_at timestamptz not null default now()
);

alter table public.paths enable row level security;
create policy "Users can read own paths"  on public.paths for select using (auth.uid() = user_id);
create policy "Users can insert own paths" on public.paths for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 3. QUESTS
-- ─────────────────────────────────────────────────────────
create table if not exists public.quests (
  id                    uuid primary key default gen_random_uuid(),
  path_id               uuid not null references public.paths(id) on delete cascade,
  user_id               uuid not null references auth.users(id) on delete cascade,
  title                 text not null,
  description           text not null default '',
  type                  text not null default 'DAILY',      -- DAILY | SIDE | RANK_UP | EMERGENCY
  xp_reward             integer not null default 50,
  stat_focus            text not null default 'STR',        -- STR | INT | DEX | VIT | WIS | NONE
  difficulty_rating     integer not null default 1,
  verification_required boolean not null default false,
  verification_type     text,                               -- github | fitbit | photo | text | url | none
  status                text not null default 'PENDING',    -- PENDING | COMPLETED | FAILED
  created_at            timestamptz not null default now()
);

alter table public.quests enable row level security;
create policy "Users can read own quests"   on public.quests for select using (auth.uid() = user_id);
create policy "Users can insert own quests" on public.quests for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on public.quests for update using (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 4. QUEST LOGS (completion/failure records)
-- ─────────────────────────────────────────────────────────
create table if not exists public.quest_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  quest_id         uuid not null references public.quests(id) on delete cascade,
  completed        boolean not null default false,
  completion_score integer not null default 0,
  proof_submitted  text,
  timestamp        timestamptz not null default now()
);

alter table public.quest_logs enable row level security;
create policy "Users can read own logs"   on public.quest_logs for select using (auth.uid() = user_id);
create policy "Users can insert own logs" on public.quest_logs for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 5. QUEST DEPENDENCIES (prerequisite chains)
-- ─────────────────────────────────────────────────────────
create table if not exists public.quest_dependencies (
  quest_id            uuid not null references public.quests(id) on delete cascade,
  depends_on_quest_id uuid not null references public.quests(id) on delete cascade,
  primary key (quest_id, depends_on_quest_id)
);

alter table public.quest_dependencies enable row level security;
-- Allow read/insert via the owning quest's user_id (join-based)
create policy "Users can read own deps" on public.quest_dependencies for select
  using (exists (select 1 from public.quests where quests.id = quest_id and quests.user_id = auth.uid()));
create policy "Users can insert own deps" on public.quest_dependencies for insert
  with check (exists (select 1 from public.quests where quests.id = quest_id and quests.user_id = auth.uid()));


-- ─────────────────────────────────────────────────────────
-- 6. BEHAVIOR PROFILES (EMA-tracked behavioral vectors)
-- ─────────────────────────────────────────────────────────
create table if not exists public.behavior_profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  consistency_score  integer not null default 50,
  avoidance_score    integer not null default 50,
  intensity_score    integer not null default 50,
  active_enforcement text not null default 'NONE',   -- NONE | EMERGENCY_DISCOMFORT | RANK_UP_TRIAL
  difficulty_cap     integer not null default 10
);

alter table public.behavior_profiles enable row level security;
create policy "Users can read own behavior"  on public.behavior_profiles for select using (auth.uid() = user_id);
create policy "Users can update own behavior" on public.behavior_profiles for update using (auth.uid() = user_id);
create policy "Users can insert own behavior" on public.behavior_profiles for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 7. MEMORY EVENTS (long-term behavioral memory)
-- ─────────────────────────────────────────────────────────
create table if not exists public.memory_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,  -- success_pattern | failure_pattern | avoidance_pattern
  description text not null,
  created_at  timestamptz not null default now()
);

alter table public.memory_events enable row level security;
create policy "Users can read own memories"  on public.memory_events for select using (auth.uid() = user_id);
create policy "Users can insert own memories" on public.memory_events for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 8. REWARD DROPS (rare anomaly rewards)
-- ─────────────────────────────────────────────────────────
create table if not exists public.reward_drops (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  reward_type text not null,  -- XP_BOOST | STAT_AWAKENING | CATHARSIS | AEGIS_PROTOCOL
  description text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.reward_drops enable row level security;
create policy "Users can read own rewards"  on public.reward_drops for select using (auth.uid() = user_id);
create policy "Users can insert own rewards" on public.reward_drops for insert with check (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────
-- 9. EXTERNAL SIGNALS (Reality Anchor data)
-- ─────────────────────────────────────────────────────────
create table if not exists public.external_signals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  source      text not null,       -- github | fitbit | strava | manual
  signal_type text not null,       -- commit | steps | workout | custom
  value       jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.external_signals enable row level security;
create policy "Users can read own signals"  on public.external_signals for select using (auth.uid() = user_id);
create policy "Users can insert own signals" on public.external_signals for insert with check (auth.uid() = user_id);


-- ═══════════════════════════════════════════════════════════
-- RPC FUNCTIONS
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- RPC: complete_quest_with_proof
-- Called from: lib/system.ts → completeQuestWithProof()
-- Returns: QuestCompletionResult (JSON)
-- ─────────────────────────────────────────────────────────
create or replace function public.complete_quest_with_proof(
  p_quest_id         uuid,
  p_proof_submitted  text default null,
  p_completion_score integer default 100,
  p_ai_adjustment    integer default 0
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id        uuid;
  v_quest          record;
  v_profile        record;
  v_xp_awarded     integer;
  v_stat_col       text;
  v_stat_gained    integer := 0;
  v_pressure_relief integer;
  v_new_xp         integer;
  v_new_level      integer;
  v_new_rank       text;
  v_old_level      integer;
  v_old_rank       text;
  v_new_pressure   integer;
  v_new_state      text;
  v_rare_reward    jsonb := null;
  v_roll           float;
begin
  -- Get caller identity
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Unauthorized';
  end if;

  -- Fetch the quest
  select * into v_quest from public.quests
    where id = p_quest_id and user_id = v_user_id and status = 'PENDING';
  if not found then
    raise exception 'Quest not found or already processed';
  end if;

  -- Fetch the profile
  select * into v_profile from public.profiles where id = v_user_id;

  -- Mark quest completed
  update public.quests set status = 'COMPLETED' where id = p_quest_id;

  -- Create log entry
  insert into public.quest_logs (user_id, quest_id, completed, completion_score, proof_submitted)
    values (v_user_id, p_quest_id, true, p_completion_score, p_proof_submitted);

  -- Calculate XP (base + AI adjustment, minimum 0)
  v_xp_awarded := greatest(0, v_quest.xp_reward + p_ai_adjustment);

  -- If system is in COLLAPSE state, XP is frozen
  if v_profile.system_state = 'SYSTEM_COLLAPSE' then
    v_xp_awarded := 0;
  end if;

  -- Calculate pressure relief (based on difficulty)
  v_pressure_relief := greatest(5, v_quest.difficulty_rating * 3);

  -- Award stat point if stat_focus is valid (not NONE)
  if v_quest.stat_focus in ('STR', 'INT', 'DEX', 'VIT', 'WIS') then
    v_stat_col := lower(v_quest.stat_focus);
    v_stat_gained := 1;
    execute format('update public.profiles set %I = %I + 1 where id = $1', v_stat_col, v_stat_col)
      using v_user_id;
  end if;

  -- Update XP, pressure, streak, activity date
  v_new_xp := v_profile.total_xp + v_xp_awarded;
  v_new_pressure := greatest(0, v_profile.pressure_level - v_pressure_relief);

  -- Calculate new level (threshold = level² × 100)
  v_old_level := v_profile.level;
  v_new_level := v_old_level;
  while v_new_xp >= (v_new_level * v_new_level * 100) loop
    v_new_level := v_new_level + 1;
  end loop;

  -- Calculate rank based on level
  v_old_rank := v_profile.rank;
  v_new_rank := case
    when v_new_level >= 50 then 'S-Rank'
    when v_new_level >= 40 then 'A-Rank'
    when v_new_level >= 30 then 'B-Rank'
    when v_new_level >= 20 then 'C-Rank'
    when v_new_level >= 10 then 'D-Rank'
    else 'E-Rank'
  end;

  -- Update system state based on new pressure
  v_new_state := case
    when v_new_pressure >= 100 then 'SYSTEM_COLLAPSE'
    when v_new_pressure >= 80  then 'PENALTY'
    when v_new_pressure >= 40  then 'PRESSURED'
    when v_new_pressure = 0    then 'FOCUSED'
    else 'NORMAL'
  end;

  -- Apply profile updates
  update public.profiles set
    total_xp       = v_new_xp,
    level          = v_new_level,
    rank           = v_new_rank,
    pressure_level = v_new_pressure,
    system_state   = v_new_state,
    current_streak = current_streak + 1,
    last_active_date = current_date
  where id = v_user_id;

  -- Update behavior profile: 80/20 EMA
  -- Completion boosts consistency, reduces avoidance, adjusts intensity by difficulty
  update public.behavior_profiles set
    consistency_score = least(100, (consistency_score * 80 + 100 * 20) / 100),
    avoidance_score   = greatest(0, (avoidance_score * 80 + 0 * 20) / 100),
    intensity_score   = least(100, (intensity_score * 80 + (v_quest.difficulty_rating * 10) * 20) / 100)
  where user_id = v_user_id;

  -- ─── RARE REWARD ROLL ───────────────────────────────
  -- 8% chance on completion, weighted by difficulty
  v_roll := random();
  if v_roll < 0.02 then
    -- AEGIS PROTOCOL (2%) — Grant 24h penalty immunity
    update public.profiles set immunity_until = now() + interval '24 hours' where id = v_user_id;
    v_rare_reward := jsonb_build_object('type', 'AEGIS_PROTOCOL', 'desc', 'AEGIS PROTOCOL ACTIVATED. 24-hour penalty immunity granted.');
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'AEGIS_PROTOCOL', 'Granted 24h immunity from all penalties.');

  elsif v_roll < 0.04 then
    -- CATHARSIS (2%) — Drain 30% pressure
    update public.profiles set pressure_level = greatest(0, pressure_level - 30) where id = v_user_id;
    v_rare_reward := jsonb_build_object('type', 'CATHARSIS', 'desc', 'CATHARSIS EVENT. -30% Shadow Pressure purged from system.');
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'CATHARSIS', 'Purged 30% Shadow Pressure.');

  elsif v_roll < 0.06 then
    -- STAT AWAKENING (2%) — +2 to a random stat
    declare v_random_stat text;
    begin
      v_random_stat := (array['str','int','dex','vit','wis'])[floor(random()*5+1)::int];
      execute format('update public.profiles set %I = %I + 2 where id = $1', v_random_stat, v_random_stat)
        using v_user_id;
      v_rare_reward := jsonb_build_object('type', 'STAT_AWAKENING', 'desc', format('STAT AWAKENING. +2 %s permanently gained.', upper(v_random_stat)));
      insert into public.reward_drops (user_id, reward_type, description)
        values (v_user_id, 'STAT_AWAKENING', format('+2 %s awakened', upper(v_random_stat)));
    end;

  elsif v_roll < 0.08 then
    -- XP BOOST (2%) — 2x XP on this completion
    v_xp_awarded := v_xp_awarded * 2;
    update public.profiles set total_xp = total_xp + v_quest.xp_reward where id = v_user_id;  -- add the extra portion
    v_rare_reward := jsonb_build_object('type', 'XP_BOOST', 'desc', format('XP BOOST ANOMALY. Double XP applied: +%s total.', v_xp_awarded));
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'XP_BOOST', format('2x XP boost: +%s', v_xp_awarded));
  end if;

  -- Return result
  return jsonb_build_object(
    'xp_awarded',       v_xp_awarded,
    'stat_changes',     jsonb_build_object('stat', coalesce(v_quest.stat_focus, 'NONE'), 'gained', v_stat_gained),
    'completion_score', p_completion_score,
    'pressure_relieved', v_pressure_relief,
    'system_state',     v_new_state,
    'rare_reward',      v_rare_reward
  );
end;
$$;


-- ─────────────────────────────────────────────────────────
-- RPC: fail_quest
-- Called from: lib/system.ts → failQuest()
-- Returns: QuestFailResult (JSON)
-- ─────────────────────────────────────────────────────────
create or replace function public.fail_quest(
  p_quest_id uuid
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id      uuid;
  v_quest        record;
  v_profile      record;
  v_new_pressure integer;
  v_atrophy_stat text := 'NONE';
  v_collapse     jsonb := null;
  v_is_immune    boolean := false;
  v_weakest_stat text;
  v_weakest_val  integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;

  -- Fetch quest
  select * into v_quest from public.quests
    where id = p_quest_id and user_id = v_user_id and status = 'PENDING';
  if not found then raise exception 'Quest not found or already processed'; end if;

  -- Fetch profile
  select * into v_profile from public.profiles where id = v_user_id;

  -- Mark quest failed
  update public.quests set status = 'FAILED' where id = p_quest_id;

  -- Create log
  insert into public.quest_logs (user_id, quest_id, completed, completion_score)
    values (v_user_id, p_quest_id, false, 0);

  -- Check immunity
  if v_profile.immunity_until is not null and v_profile.immunity_until > now() then
    v_is_immune := true;
    -- Immune: no pressure, no penalties
    return jsonb_build_object(
      'atrophy_stat', 'NONE',
      'collapse_data', null,
      'immune', true
    );
  end if;

  -- Apply +20 pressure
  v_new_pressure := least(100, v_profile.pressure_level + 20);

  -- Reset streak
  update public.profiles set
    pressure_level = v_new_pressure,
    current_streak = 0
  where id = v_user_id;

  -- Update behavior: failure bumps avoidance, drops consistency
  update public.behavior_profiles set
    consistency_score = greatest(0, (consistency_score * 80 + 0 * 20) / 100),
    avoidance_score   = least(100, (avoidance_score * 80 + 100 * 20) / 100)
  where user_id = v_user_id;

  -- Check for SYSTEM_COLLAPSE (pressure hit 100)
  if v_new_pressure >= 100 then
    -- Find weakest stat for hemorrhage
    select stat_name, stat_value into v_weakest_stat, v_weakest_val from (
      select 'str' as stat_name, v_profile.str as stat_value union all
      select 'int', v_profile.int union all
      select 'dex', v_profile.dex union all
      select 'vit', v_profile.vit union all
      select 'wis', v_profile.wis
    ) stats order by stat_value asc limit 1;

    -- Apply hemorrhage: lose 2 points from weakest stat
    execute format('update public.profiles set %I = greatest(0, %I - 2) where id = $1', v_weakest_stat, v_weakest_stat)
      using v_user_id;

    -- Purge all pending quests
    update public.quests set status = 'FAILED'
      where user_id = v_user_id and status = 'PENDING';

    -- Set collapse state
    update public.profiles set system_state = 'SYSTEM_COLLAPSE' where id = v_user_id;

    v_collapse := jsonb_build_object('stat', upper(v_weakest_stat), 'loss', 2);

    return jsonb_build_object(
      'atrophy_stat', upper(v_weakest_stat),
      'collapse_data', v_collapse,
      'immune', false
    );
  end if;

  -- Check for stat atrophy at high pressure (>=80)
  if v_new_pressure >= 80 then
    select stat_name into v_weakest_stat from (
      select 'str' as stat_name, v_profile.str as stat_value union all
      select 'int', v_profile.int union all
      select 'dex', v_profile.dex union all
      select 'vit', v_profile.vit union all
      select 'wis', v_profile.wis
    ) stats order by stat_value asc limit 1;

    execute format('update public.profiles set %I = greatest(0, %I - 1) where id = $1', v_weakest_stat, v_weakest_stat)
      using v_user_id;

    v_atrophy_stat := upper(v_weakest_stat);

    update public.profiles set system_state = 'PENALTY' where id = v_user_id;
  end if;

  return jsonb_build_object(
    'atrophy_stat', v_atrophy_stat,
    'collapse_data', null,
    'immune', false
  );
end;
$$;


-- ─────────────────────────────────────────────────────────
-- RPC: process_time_penalties
-- Called from: lib/system.ts → processTimePenalties()
-- Returns: PenaltyResult (JSON)
-- ─────────────────────────────────────────────────────────
create or replace function public.process_time_penalties()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user_id        uuid;
  v_profile        record;
  v_days_inactive  integer := 0;
  v_missed_dailies integer := 0;
  v_pressure_added integer := 0;
  v_atrophy_stat   text := 'NONE';
  v_new_pressure   integer;
  v_weakest_stat   text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;

  select * into v_profile from public.profiles where id = v_user_id;
  if not found then raise exception 'Profile not found'; end if;

  -- Check immunity
  if v_profile.immunity_until is not null and v_profile.immunity_until > now() then
    return jsonb_build_object(
      'missed_dailies', 0, 'days_inactive', 0,
      'pressure_added', 0, 'atrophy_stat', 'NONE'
    );
  end if;

  -- Calculate inactivity
  if v_profile.last_active_date is not null then
    v_days_inactive := (current_date - v_profile.last_active_date)::integer;
  end if;

  -- No penalty if active today or yesterday
  if v_days_inactive <= 1 then
    return jsonb_build_object(
      'missed_dailies', 0, 'days_inactive', v_days_inactive,
      'pressure_added', 0, 'atrophy_stat', 'NONE'
    );
  end if;

  -- Count missed DAILY quests still PENDING
  select count(*) into v_missed_dailies from public.quests
    where user_id = v_user_id and status = 'PENDING' and type = 'DAILY';

  -- Pressure scales with inactivity: 5 per day + 3 per missed daily
  v_pressure_added := least(40, (v_days_inactive - 1) * 5 + v_missed_dailies * 3);
  v_new_pressure := least(100, v_profile.pressure_level + v_pressure_added);

  -- Apply pressure
  update public.profiles set
    pressure_level = v_new_pressure,
    current_streak = 0
  where id = v_user_id;

  -- Stat atrophy at max pressure
  if v_new_pressure >= 100 then
    select stat_name into v_weakest_stat from (
      select 'str' as stat_name, v_profile.str as stat_value union all
      select 'int', v_profile.int union all
      select 'dex', v_profile.dex union all
      select 'vit', v_profile.vit union all
      select 'wis', v_profile.wis
    ) stats order by stat_value asc limit 1;

    execute format('update public.profiles set %I = greatest(0, %I - 1) where id = $1', v_weakest_stat, v_weakest_stat)
      using v_user_id;

    v_atrophy_stat := upper(v_weakest_stat);

    update public.profiles set system_state = 'SYSTEM_COLLAPSE' where id = v_user_id;
  elsif v_new_pressure >= 80 then
    update public.profiles set system_state = 'PENALTY' where id = v_user_id;
  end if;

  return jsonb_build_object(
    'missed_dailies', v_missed_dailies,
    'days_inactive',  v_days_inactive,
    'pressure_added', v_pressure_added,
    'atrophy_stat',   v_atrophy_stat
  );
end;
$$;


-- ─────────────────────────────────────────────────────────
-- RPC: log_memory_event
-- Called from: evaluate-hunter Edge Function
-- ─────────────────────────────────────────────────────────
create or replace function public.log_memory_event(
  p_user_id     uuid,
  p_event_type  text,
  p_description text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.memory_events (user_id, event_type, description)
    values (p_user_id, p_event_type, p_description);

  -- Keep only the most recent 20 memories per user to avoid bloat
  delete from public.memory_events
    where id in (
      select id from public.memory_events
        where user_id = p_user_id
        order by created_at desc
        offset 20
    );
end;
$$;


-- ─────────────────────────────────────────────────────────
-- RPC: log_external_signal
-- Called from: lib/system.ts → logExternalSignal()
-- ─────────────────────────────────────────────────────────
create or replace function public.log_external_signal(
  p_source      text,
  p_signal_type text,
  p_value       jsonb default '{}'
)
returns void
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then raise exception 'Unauthorized'; end if;

  insert into public.external_signals (user_id, source, signal_type, value)
    values (v_user_id, p_source, p_signal_type, p_value);
end;
$$;


-- ═══════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile + behavior_profile on signup
-- ═══════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create the Hunter profile with default stats
  insert into public.profiles (id)
    values (new.id);

  -- Create the behavioral tracking profile
  insert into public.behavior_profiles (user_id)
    values (new.id);

  return new;
end;
$$;

-- Attach to Supabase Auth
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ═══════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════
create index if not exists idx_quests_user_status    on public.quests (user_id, status);
create index if not exists idx_quests_path           on public.quests (path_id);
create index if not exists idx_quest_logs_user       on public.quest_logs (user_id, timestamp desc);
create index if not exists idx_memory_events_user    on public.memory_events (user_id, created_at desc);
create index if not exists idx_external_signals_user on public.external_signals (user_id, created_at desc);
create index if not exists idx_reward_drops_user     on public.reward_drops (user_id, created_at desc);
