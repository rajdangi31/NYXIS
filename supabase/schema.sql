-- ============================================================
--  The System — Supabase / PostgreSQL Schema
--  Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
--  PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  player_name   text not null default 'Unknown Hunter',
  player_title  text not null default 'The Weakest',
  level         integer not null default 1,
  rank          text not null default 'E'
                  check (rank in ('E','D','C','B','A','S')),
  total_xp      integer not null default 0,
  stats_str     integer not null default 0,
  stats_int     integer not null default 0,
  stats_vit     integer not null default 0,
  stats_dex     integer not null default 0,
  stats_wis     integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
--  PATHS  (long-term goals)
-- ─────────────────────────────────────────────
create table if not exists paths (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references profiles(id) on delete cascade,
  title      text not null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
--  QUESTS
-- ─────────────────────────────────────────────
create table if not exists quests (
  id          uuid primary key default gen_random_uuid(),
  path_id     uuid references paths(id) on delete set null,
  player_id   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  description text not null default '',
  quest_type  text not null default 'SIDE'
                check (quest_type in ('DAILY','SIDE','EMERGENCY','RANK_UP')),
  xp_gain     integer not null default 100,
  stat_focus  text not null default 'stats_str'
                check (stat_focus in ('stats_str','stats_int','stats_vit','stats_dex','stats_wis')),
  stat_gain   integer not null default 1,
  status      text not null default 'ACTIVE'
                check (status in ('ACTIVE','COMPLETED','FAILED')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger quests_updated_at
  before update on quests
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
--  ROW-LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table profiles enable row level security;
alter table paths    enable row level security;
alter table quests   enable row level security;

-- Profiles: users can read all (for leaderboard) but only update their own
create policy "Public read profiles"  on profiles for select using (true);
create policy "Own profile update"    on profiles for update using (auth.uid() = id);
create policy "Own profile insert"    on profiles for insert with check (auth.uid() = id);

-- Paths: owned by player
create policy "Own paths"   on paths for all using (auth.uid() = player_id);

-- Quests: owned by player
create policy "Own quests"  on quests for all using (auth.uid() = player_id);

-- ─────────────────────────────────────────────
--  SAMPLE SEED DATA  (optional — remove in prod)
-- ─────────────────────────────────────────────
-- insert into profiles (id, player_name, player_title)
-- values ('00000000-0000-0000-0000-000000000001', 'Sung Jin-Woo', 'Shadow Monarch');
