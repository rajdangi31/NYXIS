// ─────────────────────────────────────────────
//  The System — useQuests hook
//  • real-time subscription on quests table
//  • addQuest(), completeQuest(), failQuest()
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { Quest, QuestType, StatFocus } from '../lib/database.types';
import { calculateLevel, calculateRank } from '../lib/gameLogic';
import { unlockNextQuest, recalibrateRemainingQuests } from '../lib/architect';
import { useRecalibration } from './useRecalibration';

interface NewQuestPayload {
  title: string;
  description: string;
  quest_type: QuestType;
  xp_gain: number;
  stat_focus: StatFocus;
  stat_gain: number;
}

interface UseQuestsReturn {
  quests: Quest[];
  loading: boolean;
  error: string | null;
  addQuest: (q: NewQuestPayload) => Promise<void>;
  completeQuest: (questId: string) => Promise<void>;
  failQuest: (questId: string) => Promise<void>;
  refreshQuests: () => Promise<void>;
  recalibrateRoadmap: (pathId: string) => Promise<void>;
  checkDailyPenalties: () => Promise<void>;
  isRecalibrating: boolean;
  systemLinkedToastVisible: boolean;
}

export function useQuests(): UseQuestsReturn {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { evaluatePathForRecalibration, isRecalibrating, systemLinkedToastVisible } = useRecalibration();

  // ── Fetch all ACTIVE quests for the current user ─────────────────────────
  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setQuests(getDemoQuests());
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('quests')
        .select('*')
        .eq('player_id', user.id)
        .in('status', ['ACTIVE', 'LOCKED'])
        .order('status',     { ascending: true })  // ACTIVE before LOCKED
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setQuests((data ?? []) as Quest[]);
    } catch (err: any) {
      console.warn('[useQuests] fetch error:', err.message);
      setError(err.message);
      setQuests(getDemoQuests());
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Penalty System ────────────────────────────────────────────────────────
  const checkDailyPenalties = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find ACTIVE DAILY quests older than 24h
      const { data: staleQuests, error: staleError } = await supabase
        .from('quests')
        .select('*')
        .eq('player_id', user.id)
        .eq('status', 'ACTIVE')
        .eq('quest_type', 'DAILY')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (staleError) throw staleError;
      if (!staleQuests?.length) return;

      // Mark them FAILED
      const staleIds = staleQuests.map((q) => q.id);
      await supabase
        .from('quests')
        .update({ status: 'FAILED' })
        .in('id', staleIds);

      // Freeze XP Growth on player profile
      await supabase
        .from('profiles')
        .update({ xp_frozen: true })
        .eq('id', user.id);

      // Trigger an EMERGENCY quest for each failure
      const emergencyQuests = staleQuests.map((q) => ({
        player_id: user.id,
        path_id: q.path_id,
        title: '‼️ Penalty: ' + q.title,
        description: 'You failed to complete your daily training. The System demands a penalty.',
        quest_type: 'EMERGENCY' as QuestType,
        xp_gain: 0,
        stat_focus: 'stats_vit' as StatFocus,
        stat_gain: 0,
        status: 'ACTIVE',
      }));

      await supabase.from('quests').insert(emergencyQuests);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
    } catch (err: any) {
      console.error('[useQuests] checkDailyPenalties error:', err.message);
    }
  }, []);

  // ── Real-time subscription ───────────────────────────────────────────────
  useEffect(() => {
    fetchQuests();

    const channel = supabase
      .channel('quests_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'quests' },
        (payload) => {
          const newQuest = payload.new as Quest;
          if (newQuest.status === 'ACTIVE') {
            setQuests((prev) => [newQuest, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quests' },
        (payload) => {
          const updated = payload.new as Quest;
          // If no longer ACTIVE, remove it from the list
          if (updated.status !== 'ACTIVE') {
            setQuests((prev) => prev.filter((q) => q.id !== updated.id));
          } else {
            setQuests((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'quests' },
        (payload) => {
          setQuests((prev) => prev.filter((q) => q.id !== (payload.old as Quest).id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchQuests]);

  // ── Add a new quest ──────────────────────────────────────────────────────
  const addQuest = useCallback(async (payload: NewQuestPayload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error: insertError } = await supabase.from('quests').insert({
      player_id:   user.id,
      path_id:     null,
      status:      'ACTIVE',
      ...payload,
    });

    if (insertError) throw insertError;
    // Real-time subscription picks up the INSERT automatically — no local state manip needed
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  // ── Complete a quest: award XP + stat (via atomic RPC transaction) ──────
  const completeQuest = useCallback(async (questId: string) => {
    try {
      const quest = quests.find((q) => q.id === questId);
      if (!quest) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Demo mode — remove optimistically
        setQuests((prev) => prev.filter((q) => q.id !== questId));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return;
      }

      // 1. Call the Postgres RPC to handle XP, leveling, stat gains, and `xp_frozen` safely
      const { data, error: rpcError } = await supabase.rpc('complete_quest_transaction', {
        p_quest_id: questId,
        p_player_id: user.id
      });

      if (rpcError) throw rpcError;

      // Real-time UPDATE subscription handles removing the quest from the list
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // If XP was frozen, the RPC returns `penalty_active: true`
      if (data?.penalty_active) {
        // We could theoretically toast the user here: "XP FROZEN. Defeat emergency quest to unlock."
        console.log("XP FROZEN: Completed quest but received no rewards.");
      }

      // Unlock the next LOCKED quest in this path
      if (quest.path_id) {
        await unlockNextQuest(quest.path_id, user.id);
      }

      // If SIDE quest, recalibrate the remaining roadmap (Legacy explicit click)
      if (quest.quest_type === 'SIDE' && quest.path_id) {
        recalibrateRoadmap(quest.path_id).catch(console.error);
      }

      // ── NEW: Automated Weekly Audit & UI Recalibration ──
      if (quest.path_id) {
        // Will asynchronously pause and audit their history if they hit a multiple of 7
        evaluatePathForRecalibration(quest.path_id).catch(console.error);
      }

    } catch (err: any) {
      console.error('[useQuests] completeQuest error:', err.message);
    }
  }, [quests, evaluatePathForRecalibration]);

  // ── Recalibrate remaining LOCKED quests in a path ────────────────────────
  const recalibrateRoadmap = useCallback(async (pathId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const { data: pathData } = await supabase
        .from('paths')
        .select('goal_text')
        .eq('id', pathId)
        .single();

      if (!profile || !pathData) return;

      // Get recent performance (last 5 quests)
      const { data: recent } = await supabase
        .from('quests')
        .select('quest_type, stat_focus, status')
        .eq('path_id', pathId)
        .in('status', ['COMPLETED', 'FAILED'])
        .order('updated_at', { ascending: false })
        .limit(5);

      const completed = recent?.filter(q => q.status === 'COMPLETED').length || 0;
      const failed = recent?.filter(q => q.status === 'FAILED').length || 0;
      const perfContext = `Player has recently completed ${completed} quests and failed ${failed} quests on this path.`;

      await recalibrateRemainingQuests(pathData.goal_text, profile, pathId, perfContext);
      await fetchQuests(); // Refresh locally after generating new ones
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[useQuests] recalibrateRoadmap error:', err.message);
    }
  }, [fetchQuests]);

  // ── Fail a quest (no XP) ─────────────────────────────────────────────────
  const failQuest = useCallback(async (questId: string) => {
    try {
      const quest = quests.find(q => q.id === questId);
      const { error: questError } = await supabase
        .from('quests')
        .update({ status: 'FAILED' })
        .eq('id', questId);

      if (questError) throw questError;
      // Real-time subscription removes it
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      if (quest?.path_id) {
        evaluatePathForRecalibration(quest.path_id, true).catch(console.error);
      }
    } catch (err: any) {
      console.error('[useQuests] failQuest error:', err.message);
    }
  }, [quests, evaluatePathForRecalibration]);

  return { quests, loading, error, addQuest, completeQuest, failQuest, refreshQuests: fetchQuests, recalibrateRoadmap, checkDailyPenalties, isRecalibrating, systemLinkedToastVisible };
}

// ── Demo quests ──────────────────────────────────────────────────────────────
function getDemoQuests(): Quest[] {
  return [
    {
      id: 'demo-q-1',
      path_id: null,
      player_id: 'demo-player-001',
      title: 'Morning Push-Up Challenge',
      description: 'Complete 100 push-ups before 9 AM. Rise, hunter.',
      quest_type: 'DAILY',
      xp_gain: 150,
      stat_focus: 'stats_str',
      stat_gain: 1,
      status: 'ACTIVE',
    },
    {
      id: 'demo-q-2',
      path_id: null,
      player_id: 'demo-player-001',
      title: 'Read for 1 Hour',
      description: 'Feed your mind. Knowledge is the true weapon of an S-rank hunter.',
      quest_type: 'DAILY',
      xp_gain: 200,
      stat_focus: 'stats_int',
      stat_gain: 1,
      status: 'ACTIVE',
    },
    {
      id: 'demo-q-3',
      path_id: null,
      player_id: 'demo-player-001',
      title: 'Dungeon Sprint',
      description: 'A 5 km run. Every step makes you harder to kill.',
      quest_type: 'SIDE',
      xp_gain: 300,
      stat_focus: 'stats_vit',
      stat_gain: 2,
      status: 'ACTIVE',
    },
    {
      id: 'demo-q-4',
      path_id: null,
      player_id: 'demo-player-001',
      title: '‼️ Emergency: Cold Shower',
      description: 'You are weak. Prove otherwise. 3-minute cold shower. Now.',
      quest_type: 'EMERGENCY',
      xp_gain: 500,
      stat_focus: 'stats_wis',
      stat_gain: 2,
      status: 'ACTIVE',
    },
  ];
}
