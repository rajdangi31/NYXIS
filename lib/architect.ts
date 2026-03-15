// ─────────────────────────────────────────────
//  The Architect — Dynamic Quest Generation Client
// ─────────────────────────────────────────────
import { supabase } from './supabase';
import { Profile, QuestType, StatFocus } from './database.types';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ArchitectQuest {
  title: string;
  description: string;
  quest_type: QuestType;
  xp_gain: number;
  stat_focus: StatFocus;
  stat_gain: number;
}

// ── Main Functions ────────────────────────────────────────────────────────────

/**
 * Replaces the existing aiPlaceholder logic. Generates 10 new quests for a path.
 */
export async function generatePathQuests(
  goalText: string,
  profile: Profile,
  pathId: string
): Promise<ArchitectQuest[]> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quests', {
      body: { action: 'generate_path', goalText, profile, pathId }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return data.quests;
  } catch (error: any) {
    console.error('[Architect] failed to generate quests:', error.message);
    throw error;
  }
}

/**
 * Triggers re-optimization of remaining LOCKED quests based on recent performance.
 * Called automatically after completing a SIDE quest.
 */
export async function recalibrateRemainingQuests(
  goalText: string,
  profile: Profile,
  pathId: string,
  recentPerformanceContext: string
): Promise<void> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quests', {
      body: { action: 'recalibrate_path', goalText, profile, pathId, recentPerformanceContext }
    });
    
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    
  } catch (error: any) {
    console.error('[Architect] Recalibration failed:', error.message);
  }
}

/**
 * Unlock the next LOCKED quest after an ACTIVE one is completed.
 */
export async function unlockNextQuest(
  pathId: string,
  playerId: string
): Promise<void> {
  const { data, error } = await supabase
    .from('quests')
    .select('id')
    .eq('path_id', pathId)
    .eq('player_id', playerId)
    .eq('status', 'LOCKED')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return; // no locked quests remaining

  await supabase
    .from('quests')
    .update({ status: 'ACTIVE' })
    .eq('id', data.id);
}
