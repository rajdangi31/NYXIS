import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { cancelAnimation, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useQuestSystem } from '@/hooks/useQuestSystem';
import { ArchitectModal } from '@/components/architect-modal';
import { EvalReport } from '@/components/eval-report';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { SimpleCard, SystemShell } from '@/components/system-shell';
import { PressureMeter } from '@/components/pressure-meter';
import { ProofSubmitModal } from '@/components/proof-submit-modal';
import { QuestCard } from '@/components/quest-card';
import { COLORS } from '@/constants/design-tokens';
import type { Quest } from '@/lib/types';

export default function QuestsScreen() {
  const qs = useQuestSystem();
  const router = useRouter();
  const [proofQuest, setProofQuest] = useState<Quest | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { hasLeveledUp, level, clearLevelUp, hasRankedUp, rank, clearRankUp } = qs;

  useEffect(() => {
    if (hasLeveledUp) {
      clearLevelUp();
      router.push({ pathname: '/level-up', params: { oldLevel: level - 1, newLevel: level } });
    }
  }, [hasLeveledUp, level, clearLevelUp, router]);

  useEffect(() => {
    if (hasRankedUp) {
      clearRankUp();
      router.push({ pathname: '/boss-trial', params: { rankTarget: rank } });
    }
  }, [hasRankedUp, rank, clearRankUp, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await qs.fetchSystemState();
    setRefreshing(false);
  }, [qs.fetchSystemState]);

  const pulseOpacity = useSharedValue(0.3);
  useEffect(() => {
    pulseOpacity.value = withRepeat(withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })), -1, true);
    return () => cancelAnimation(pulseOpacity);
  }, [pulseOpacity]);

  const stateColor =
    qs.systemState === 'SYSTEM_COLLAPSE' ? COLORS.NEON_BLOOD :
      qs.systemState === 'PENALTY' ? COLORS.NEON_RED :
        qs.systemState === 'FOCUSED' ? COLORS.NEON_PURPLE :
          qs.systemState === 'PRESSURED' ? COLORS.NEON_GOLD :
            COLORS.NEON_CYAN;

  const openProofModal = (quest: Quest) => {
    if (qs.architectMessage?.includes('[ PROOF REJECTED ]') || qs.architectMessage?.includes('[ SYSTEM ERROR ]')) {
      qs.setArchitectMessage(null);
    }
    setProofQuest(quest);
  };

  const submitProof = async (proof: string) => {
    if (!proofQuest) return false;
    if (qs.architectMessage?.includes('[ PROOF REJECTED ]') || qs.architectMessage?.includes('[ SYSTEM ERROR ]')) {
      qs.setArchitectMessage(null);
    }
    qs.setProofInput(proofQuest.id, proof);
    const completed = await qs.handleCompleteQuest(
      proofQuest.id,
      proofQuest.verification_required,
      proofQuest.title,
      proofQuest.type,
      proofQuest.verification_type,
      proof
    );
    if (completed) setProofQuest(null);
    return completed;
  };

  const quests = useMemo(() => qs.quests, [qs.quests]);
  const showRecovery = qs.needsRecovery && quests.length === 0 && !qs.fetching;

  return (
    <>
    <SystemShell
      title="Quests"
      stateLabel={qs.systemState}
      stateColor={stateColor}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <SimpleCard>
        <PressureMeter
          pressure={qs.pressure}
          stateColor={stateColor}
          isPenaltyState={qs.isPenaltyState}
          isSoftLocked={qs.isSoftLocked}
          pulseOpacity={pulseOpacity}
          compact
        />
      </SimpleCard>

      <SimpleCard className="gap-3">
        <Text className="text-sm text-muted-foreground">Your goal</Text>
        <TextInput
          className="min-h-[72px] text-sm leading-5 text-foreground"
          placeholder={qs.isPenaltyState ? 'Locked — lower pressure first.' : 'What are you working toward?'}
          placeholderTextColor={COLORS.TEXT_DIM}
          value={qs.goal}
          onChangeText={qs.setGoal}
          editable={!qs.loading && !qs.isPenaltyState}
          multiline
          selectionColor={COLORS.NEON_CYAN}
        />
        <Button onPress={qs.handleGeneratePath} disabled={qs.loading || qs.isPenaltyState} className="rounded-lg">
          {qs.loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="font-medium text-primary-foreground">Generate quests</Text>
          )}
        </Button>
      </SimpleCard>

      {qs.fetching ? (
        <ActivityIndicator className="py-8" color={COLORS.NEON_CYAN} />
      ) : quests.length > 0 ? (
        <View className="gap-3">
          {quests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              isProcessing={qs.processingId === quest.id}
              isLocked={qs.lockedQuestIds.has(quest.id)}
              onOpenProof={() => openProofModal(quest)}
              onFail={() => qs.handleFailQuest(quest.id)}
            />
          ))}
        </View>
      ) : showRecovery ? (
        <SimpleCard className="gap-3">
          <Text className="font-medium text-destructive">Recovery needed</Text>
          <Text className="text-sm text-muted-foreground">
            No active quests. Run survival protocol to get back on track.
          </Text>
          <Button onPress={qs.handleSurvivalProtocol} disabled={qs.loading} className="rounded-lg">
            {qs.loading ? <ActivityIndicator color="#000" /> : <Text className="text-primary-foreground">Start recovery</Text>}
          </Button>
        </SimpleCard>
      ) : (
        <SimpleCard>
          <Text className="text-center text-sm text-muted-foreground">No quests yet. Set a goal and generate.</Text>
        </SimpleCard>
      )}

      {qs.architectMessage && !proofQuest && (
        <ArchitectModal message={qs.architectMessage} onAcknowledge={() => qs.setArchitectMessage(null)} />
      )}
      {qs.evalData && <EvalReport data={qs.evalData} onAcknowledge={() => qs.setEvalData(null)} />}
    </SystemShell>

    <ProofSubmitModal
      visible={!!proofQuest}
      quest={proofQuest}
      isProcessing={!!proofQuest && qs.processingId === proofQuest.id}
      reviewMessage={qs.architectMessage}
      onClose={() => !qs.processingId && setProofQuest(null)}
      onSubmit={submitProof}
    />
    </>
  );
}
