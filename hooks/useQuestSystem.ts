import { useState, useEffect, useCallback } from 'react';
import { getSafeSession, supabase } from '@/lib/supabase';
import {
  generateQuestPath,
  completeQuestWithProof,
  failQuest,
  evaluateHunter,
  processTimePenalties,
} from '@/lib/system';
import type {
  Quest,
  BehaviorProfile,
  EvalData,
  SystemState,
} from '@/lib/types';

interface QuestSystemState {
  goal: string;
  loading: boolean;
  quests: Quest[];
  logsCount: number;
  pressure: number;
  systemState: SystemState;
  fetching: boolean;
  processingId: string | null;
  proofInputs: Record<string, string>;
  evalData: EvalData | null;
  architectMessage: string | null;
  behavior: BehaviorProfile | null;
  // NEW: Progression Tracking
  level: number;
  rank: string;
  hasLeveledUp: boolean;
  hasRankedUp: boolean;
  currentStreak: number;
  lockedQuestIds: Set<string>;
}

const DEFAULT_BEHAVIOR: BehaviorProfile = {
  user_id: '',
  consistency_score: 50,
  avoidance_score: 50,
  intensity_score: 50,
  active_enforcement: 'NONE',
  difficulty_cap: 10,
};

export function useQuestSystem() {
  const [state, setState] = useState<QuestSystemState>({
    goal: '',
    loading: false,
    quests: [],
    logsCount: 0,
    pressure: 0,
    systemState: 'NORMAL',
    fetching: true,
    processingId: null,
    proofInputs: {},
    evalData: null,
    architectMessage: null,
    behavior: null,
    // NEW: Initial Progression State
    level: 1,
    rank: 'E-Rank',
    hasLeveledUp: false,
    hasRankedUp: false,
    currentStreak: 0,
    lockedQuestIds: new Set<string>(),
  });

  const update = useCallback((partial: Partial<QuestSystemState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  // ─── Fetch System State ───────────────────────────────────
  const fetchSystemState = useCallback(async (silent = false) => {
    if (!silent) update({ fetching: true });

    const { session } = await getSafeSession();
    if (!session?.user) return;

    const penaltyCheck = await processTimePenalties();
    const penaltyData = penaltyCheck.data;
    if (penaltyCheck.success && penaltyData && penaltyData.pressure_added > 0) {
      let msg = `[ SYSTEM PENALTY APPLIED ]\n\nInactivity detected.\nMissed Dailies: ${penaltyData.missed_dailies}\nPressure Added: +${penaltyData.pressure_added}%`;

      if (penaltyData.atrophy_stat && penaltyData.atrophy_stat !== 'NONE') {
        msg += `\n\n[ FATAL CONSEQUENCE ]\nMAXIMUM PRESSURE REACHED.\nSTAT ATROPHY INITIATED: -1 ${penaltyData.atrophy_stat} PERMANENTLY LOST.`;
      }
      update({ architectMessage: msg });
    }

    const { data: qData } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    const { count } = await supabase
      .from('quest_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    // NEW: Fetching level, rank, and streak from profiles
    const { data: pData } = await supabase
      .from('profiles')
      .select('pressure_level, system_state, level, rank, current_streak')
      .eq('id', session.user.id)
      .single();

    const { data: bData } = await supabase
      .from('behavior_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    // Fetch quest dependencies to determine locked status
    const { data: depData } = await supabase
      .from('quest_dependencies')
      .select('quest_id, depends_on_quest_id');

    const pendingIds = new Set(qData?.map(q => q.id) || []);
    const lockedIds = new Set<string>();
    depData?.forEach(dep => {
      if (pendingIds.has(dep.depends_on_quest_id)) {
        lockedIds.add(dep.quest_id);
      }
    });

    update({
      quests: (qData as Quest[]) || [],
      logsCount: count || 0,
      pressure: pData?.pressure_level || 0,
      systemState: (pData?.system_state as SystemState) || 'NORMAL',
      level: pData?.level || 1,
      rank: pData?.rank || 'E-Rank',
      currentStreak: pData?.current_streak || 0,
      lockedQuestIds: lockedIds,
      behavior: bData || DEFAULT_BEHAVIOR,
      fetching: false,
    });
  }, [update]);

  // ─── Initialize ───────────────────────────────────────────
  useEffect(() => {
    fetchSystemState();
  }, [fetchSystemState]);

  // ─── Trigger Evaluation ───────────────────────────────────
  const triggerEvaluation = useCallback(async () => {
    update({ loading: true, evalData: null });
    const result = await evaluateHunter();

    if (result.success && !result.pending) {
      update({ evalData: result.data ?? null });
      await fetchSystemState(true);
    } else if (!result.success) {
      update({ architectMessage: `[ FATAL SYSTEM ERROR ]\n\n${result.error || 'Evaluation engine failed.'}` });
    } else if (result.pending) {
      update({ architectMessage: `[ SYSTEM NOTICE ]\n\n${result.message}` });
    }
    update({ loading: false });
  }, [update, fetchSystemState]);

  // ─── Complete Quest ───────────────────────────────────────
  const handleCompleteQuest = useCallback(async (
    questId: string,
    isProofRequired: boolean,
    questTitle: string,
    questType: string,
    verificationType: string | null = 'text',
    proofOverride?: string
  ) => {
    const submittedProof = proofOverride ?? state.proofInputs[questId] ?? '';

    if (isProofRequired && !submittedProof.trim()) {
      update({ architectMessage: '[ SYSTEM OVERRIDE ]\n\nPROOF OF COMPLETION IS STRICTLY REQUIRED FOR THIS DIRECTIVE.' });
      return false;
    }

    // NEW: Capture current progression state before processing
    const previousLevel = state.level;
    const previousRank = state.rank;

    update({ processingId: questId });
    try {
      const result = await completeQuestWithProof(
        questId,
        submittedProof,
        questTitle,
        questType,
        100,
        verificationType || 'text'
      );

      if (result.success && result.data) {
      const { xp_awarded, stat_changes, pressure_relieved, ai_adjustment, rare_reward, proof_audit } = result.data;

      // NEW: Fetch fresh profile data to check for deltas after the RPC completes
      const { session } = await getSafeSession();
      let newProfile = null;
      if (session?.user?.id) {
        const res = await supabase.from('profiles').select('level, rank').eq('id', session.user.id).single();
        newProfile = res.data;
      }

      // NEW: Calculate Deltas
      const didLevelUp = newProfile && previousLevel > 0 && newProfile.level > previousLevel;
      const didRankUp = newProfile && previousRank !== '' && newProfile.rank !== previousRank;

      const statMsg = stat_changes.gained > 0 ? `\n[ +1 ${stat_changes.stat} GAINED ]` : '';
      const adjMsg = ai_adjustment !== 0 ? `\n[ AI AUDIT: ${ai_adjustment > 0 ? '+' : ''}${ai_adjustment} SCORE MODIFIER ]` : '';
      const proofMsg = proof_audit
        ? `\n[ PROOF SCORE: ${proof_audit.score}/100 ]\n${proof_audit.reason}`
        : '';

      // PHASE 20: RARE REWARD NOTIFICATION
      let rewardMsg = "";
      if (rare_reward) {
        rewardMsg = `\n\n⭐ [ ANOMALY DETECTED ] ⭐\n${rare_reward.desc}`;
      }

      update({
        architectMessage: `[ QUEST VALIDATED ]\n\n[ +${xp_awarded} XP AWARDED ]\n[ -${pressure_relieved}% SHADOW PRESSURE ]${adjMsg}${statMsg}${proofMsg}${rewardMsg}`,
        proofInputs: { ...state.proofInputs, [questId]: '' },
        // NEW: Update state and trigger animation flags
        level: newProfile?.level || previousLevel,
        rank: newProfile?.rank || previousRank,
        hasLeveledUp: !!didLevelUp,
        hasRankedUp: !!didRankUp,
      });
      await fetchSystemState(true);

      if ((state.logsCount + 1) > 0 && (state.logsCount + 1) % 7 === 0) {
        triggerEvaluation();
      }
        return true;
      } else {
      const audit = result.data?.proof_audit;
      if (audit) {
        const missing = audit.missing.length > 0 ? `\n\nMISSING:\n- ${audit.missing.join('\n- ')}` : '';
        update({
          architectMessage: `[ PROOF REJECTED ]\n\nScore: ${audit.score}/100\n${audit.reason}${missing}\n\nRevise the proof and submit again. The quest remains active.`,
        });
      } else {
        update({ architectMessage: `[ SYSTEM ERROR ]\n\n${result.error || 'Failed to complete quest.'}` });
      }
        return false;
      }
    } finally {
      update({ processingId: null });
    }
  }, [state.proofInputs, state.logsCount, state.level, state.rank, update, fetchSystemState, triggerEvaluation]);

  // ─── Fail Quest ───────────────────────────────────────────
  const handleFailQuest = useCallback(async (questId: string) => {
    update({ processingId: questId });
    const result = await failQuest(questId);

    if (result.success) {
      let msg = '[ PENALTY APPLIED ]\n\n+20% SHADOW PRESSURE INCURRED.\nDIRECTIVE ABORTED.';

      // PHASE 20: IMMUNITY CHECK
      if (result.data?.immune) {
        msg = '[ AEGIS PROTOCOL ACTIVE ]\n\nDIRECTIVE ABORTED.\nIMMUNITY SHIELD ABSORBED ALL PENALTY DAMAGE.\n0% SHADOW PRESSURE INCURRED.';
      } else if (result.data?.collapse_data) {
        // PHASE 14: SYSTEM COLLAPSE DETECTION
        const { stat, loss } = result.data.collapse_data;
        msg = `[ FATAL SYSTEM COLLAPSE ]\n\nCRITICAL FAILURE THRESHOLD EXCEEDED.\nALL PENDING DIRECTIVES PURGED.\nSTAT HEMORRHAGE: -${loss} ${stat} PERMANENTLY LOST.\nXP GAIN LOCKED UNTIL RECOVERY.`;
      } else if (result.data?.atrophy_stat && result.data.atrophy_stat !== 'NONE') {
        msg += `\n\n[ FATAL CONSEQUENCE ]\nMAXIMUM PRESSURE REACHED.\nSTAT ATROPHY INITIATED: -1 ${result.data.atrophy_stat} PERMANENTLY LOST.`;
      }

      update({ architectMessage: msg });
      await fetchSystemState(true);

      if ((state.logsCount + 1) > 0 && (state.logsCount + 1) % 7 === 0) {
        triggerEvaluation();
      }
    } else {
      update({ architectMessage: `[ SYSTEM ERROR ]\n\n${result.error || 'Failed to abandon quest.'}` });
    }
    update({ processingId: null });
  }, [state.logsCount, update, fetchSystemState, triggerEvaluation]);

  // ─── Generate Path ────────────────────────────────────────
  const handleGeneratePath = useCallback(async () => {
    if (!state.goal.trim()) {
      update({ architectMessage: '[ SYSTEM NOTICE ]\n\nAN OBJECTIVE IS REQUIRED.' });
      return;
    }
    update({ loading: true });
    const result = await generateQuestPath(state.goal);
    if (result.success) {
      update({ goal: '' });
      await fetchSystemState(true);
    } else {
      update({ architectMessage: `[ SYSTEM ERROR ]\n\n${result.error || 'Failed to generate Path.'}` });
    }
    update({ loading: false });
  }, [state.goal, update, fetchSystemState]);

  // ─── Survival / recovery protocol (pressure 100 / collapse / no quests) ───
  const handleSurvivalProtocol = useCallback(async () => {
    update({ loading: true });

    const recoveryPrompt =
      'SURVIVAL PROTOCOL INITIATED. Generate immediate recovery directives to restore discipline and reduce Shadow Pressure.';

    const result = await generateQuestPath(recoveryPrompt);
    if (result.success) {
      update({
        architectMessage:
          '[ SURVIVAL PROTOCOL ACTIVE ]\n\nRecovery directives deployed. Complete them to lower pressure and restore normal system functions.',
      });
      await fetchSystemState(true);
    } else {
      update({
        architectMessage: `[ SYSTEM ERROR ]\n\n${result.error || 'Failed to initiate Survival Protocol.'}`,
      });
    }
    update({ loading: false });
  }, [update, fetchSystemState]);

  // ─── Computed State ───────────────────────────────────────
  // PHASE 14 UPDATE: Include SYSTEM_COLLAPSE in penalty logic
  const isPenaltyState =
    state.systemState === 'PENALTY' ||
    state.systemState === 'SYSTEM_COLLAPSE' ||
    state.pressure >= 80;
  const isCollapsed =
    state.systemState === 'SYSTEM_COLLAPSE' || state.pressure >= 100;
  const isSoftLocked = isPenaltyState && state.quests.length === 0;
  const needsRecovery = isCollapsed || isSoftLocked;

  return {
    ...state,
    isPenaltyState,
    isCollapsed,
    isSoftLocked,
    needsRecovery,
    setGoal: (goal: string) => update({ goal }),
    setProofInput: (questId: string, text: string) =>
      update({ proofInputs: { ...state.proofInputs, [questId]: text } }),
    setArchitectMessage: (msg: string | null) => update({ architectMessage: msg }),
    setEvalData: (data: EvalData | null) => update({ evalData: data }),
    // NEW: Clear triggers exported for the UI to acknowledge the animations
    clearLevelUp: () => update({ hasLeveledUp: false }),
    clearRankUp: () => update({ hasRankedUp: false }),
    fetchSystemState,
    triggerEvaluation,
    handleCompleteQuest,
    handleFailQuest,
    handleGeneratePath,
    handleSurvivalProtocol,
  };
}
