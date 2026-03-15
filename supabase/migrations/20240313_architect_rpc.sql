-- Migration: Architect Data Integrity & Penalty System

-- 1. Add xp_frozen to profiles if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp_frozen BOOLEAN DEFAULT false;

-- 2. Create the unified transaction RPC for completing quests
CREATE OR REPLACE FUNCTION public.complete_quest_transaction(p_quest_id UUID, p_player_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest RECORD;
  v_profile RECORD;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_new_rank TEXT;
  v_stat_col TEXT;
  v_current_stat INTEGER;
BEGIN
  -- 1. Fetch Quest & Ensure it is ACTIVE
  SELECT * INTO v_quest 
  FROM public.quests 
  WHERE id = p_quest_id AND player_id = p_player_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found or does not belong to player';
  END IF;

  IF v_quest.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Quest is not ACTIVE';
  END IF;

  -- 2. Fetch Profile (Lock it for update to prevent concurrent race conditions)
  SELECT * INTO v_profile 
  FROM public.profiles 
  WHERE id = p_player_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- 3. Check Penalty State (xp_frozen)
  -- If XP is frozen AND this is NOT an EMERGENCY quest, they get zero XP.
  -- (If it IS an emergency quest, they defeat it and unfreeze it).
  IF v_profile.xp_frozen = true AND v_quest.quest_type != 'EMERGENCY' THEN
    -- Penalty applies: No XP or Stat gain. Just complete the task.
    UPDATE public.quests SET status = 'COMPLETED' WHERE id = p_quest_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'xp_gained', 0,
      'stat_gained', 0,
      'penalty_active', true,
      'message', 'Quest completed, but XP is frozen due to pending penalties.'
    );
  END IF;

  -- 4. Calculate Gains
  v_new_xp := v_profile.total_xp + v_quest.xp_gain;
  v_new_level := floor(v_new_xp / 1000) + 1;
  
  -- Calculate Rank
  IF v_new_level >= 100 THEN v_new_rank := 'S';
  ELSIF v_new_level >= 75 THEN v_new_rank := 'A';
  ELSIF v_new_level >= 50 THEN v_new_rank := 'B';
  ELSIF v_new_level >= 25 THEN v_new_rank := 'C';
  ELSIF v_new_level >= 10 THEN v_new_rank := 'D';
  ELSE v_new_rank := 'E';
  END IF;

  -- Calculate Stats
  v_stat_col := v_quest.stat_focus;
  
  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_stat_col)
  INTO v_current_stat
  USING p_player_id;

  v_current_stat := COALESCE(v_current_stat, 0) + v_quest.stat_gain;

  -- 5. Execute Updates
  -- Complete Quest
  UPDATE public.quests SET status = 'COMPLETED' WHERE id = p_quest_id;
  
  -- Update Profile
  EXECUTE format('
    UPDATE public.profiles 
    SET total_xp = $1, level = $2, rank = $3, %I = $4, xp_frozen = false
    WHERE id = $5
  ', v_stat_col)
  USING v_new_xp, v_new_level, v_new_rank, v_current_stat, p_player_id;

  -- 6. Return standard success payload
  RETURN jsonb_build_object(
    'success', true,
    'xp_gained', v_quest.xp_gain,
    'stat_gained', v_quest.stat_gain,
    'new_level', v_new_level,
    'unfrozen', (v_profile.xp_frozen = true AND v_quest.quest_type = 'EMERGENCY')
  );

END;
$$;
