-- ─────────────────────────────────────────────────────────
-- Migration: Fix XP Boost and Streak Progression Sync
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
  v_random_stat    text;
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

  -- ─── RARE REWARD ROLL ───────────────────────────────
  -- 8% chance on completion, weighted by difficulty
  v_roll := random();
  if v_roll < 0.02 then
    -- AEGIS PROTOCOL (2%) — Grant 24h penalty immunity
    v_rare_reward := jsonb_build_object('type', 'AEGIS_PROTOCOL', 'desc', 'AEGIS PROTOCOL ACTIVATED. 24-hour penalty immunity granted.');
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'AEGIS_PROTOCOL', 'Granted 24h immunity from all penalties.');

  elsif v_roll < 0.04 then
    -- CATHARSIS (2%) — Drain 30% pressure
    v_rare_reward := jsonb_build_object('type', 'CATHARSIS', 'desc', 'CATHARSIS EVENT. -30% Shadow Pressure purged from system.');
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'CATHARSIS', 'Purged 30% Shadow Pressure.');

  elsif v_roll < 0.06 then
    -- STAT AWAKENING (2%) — +2 to a random stat
    v_random_stat := (array['str','int','dex','vit','wis'])[floor(random()*5+1)::int];
    v_rare_reward := jsonb_build_object('type', 'STAT_AWAKENING', 'desc', format('STAT AWAKENING. +2 %s permanently gained.', upper(v_random_stat)));
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'STAT_AWAKENING', format('+2 %s awakened', upper(v_random_stat)));

  elsif v_roll < 0.08 then
    -- XP BOOST (2%) — 2x XP on this completion
    v_xp_awarded := v_xp_awarded * 2;
    v_rare_reward := jsonb_build_object('type', 'XP_BOOST', 'desc', format('XP BOOST ANOMALY. Double XP applied: +%s total.', v_xp_awarded));
    insert into public.reward_drops (user_id, reward_type, description)
      values (v_user_id, 'XP_BOOST', format('2x XP boost: +%s', v_xp_awarded));
  end if;

  -- Update XP, pressure, streak, activity date
  v_new_xp := v_profile.total_xp + v_xp_awarded;
  v_new_pressure := greatest(0, v_profile.pressure_level - v_pressure_relief);
  if v_roll >= 0.02 and v_roll < 0.04 then
    v_new_pressure := greatest(0, v_new_pressure - 30);
  end if;

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
    last_active_date = current_date,
    immunity_until = case when v_roll < 0.02 then now() + interval '24 hours' else immunity_until end
  where id = v_user_id;

  -- Award stat point if stat_focus is valid (not NONE)
  if v_quest.stat_focus in ('STR', 'INT', 'DEX', 'VIT', 'WIS') then
    v_stat_col := lower(v_quest.stat_focus);
    v_stat_gained := 1;
    execute format('update public.profiles set %I = %I + 1 where id = $1', v_stat_col, v_stat_col)
      using v_user_id;
  end if;

  -- Award stat points if Stat Awakening was triggered
  if v_roll >= 0.04 and v_roll < 0.06 and v_random_stat is not null then
    execute format('update public.profiles set %I = %I + 2 where id = $1', v_random_stat, v_random_stat)
      using v_user_id;
  end if;

  -- Update behavior profile: 80/20 EMA
  update public.behavior_profiles set
    consistency_score = least(100, (consistency_score * 80 + 100 * 20) / 100),
    avoidance_score   = greatest(0, (avoidance_score * 80 + 0 * 20) / 100),
    intensity_score   = least(100, (intensity_score * 80 + (v_quest.difficulty_rating * 10) * 20) / 100)
  where user_id = v_user_id;

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
