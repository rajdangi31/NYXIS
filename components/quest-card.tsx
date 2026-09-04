import React from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { SimpleCard } from '@/components/system-shell';
import { COLORS, QUEST_TYPE_COLORS } from '@/constants/design-tokens';
import type { Quest } from '@/lib/types';

interface QuestCardProps {
  quest: Quest;
  isProcessing: boolean;
  isLocked?: boolean;
  onOpenProof: () => void;
  onFail: () => void;
}

const typeLabel: Record<string, string> = {
  DAILY: 'Daily',
  SIDE: 'Side',
  RANK_UP: 'Rank-up',
  EMERGENCY: 'Emergency',
};

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  isProcessing,
  isLocked = false,
  onOpenProof,
  onFail,
}) => {
  const accent = QUEST_TYPE_COLORS[quest.type] || COLORS.NEON_CYAN;
  const locked = quest.status === 'FAILED' || isLocked;

  return (
    <SimpleCard className={`gap-3 ${locked ? 'opacity-50' : ''}`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-xs font-medium uppercase tracking-wide" style={{ color: accent }}>
          {typeLabel[quest.type] || quest.type}
        </Text>
        <Text className="text-xs text-muted-foreground">+{quest.xp_reward} XP</Text>
      </View>

      <Text className="text-base font-medium text-foreground">{quest.title}</Text>
      {quest.description ? (
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>{quest.description}</Text>
      ) : null}

      {locked ? (
        <Text className="text-xs text-muted-foreground">Complete prerequisite first</Text>
      ) : isProcessing ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color={accent} />
          <Text className="text-sm text-muted-foreground">Checking proof…</Text>
        </View>
      ) : (
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="h-10 flex-1 items-center justify-center rounded-lg bg-primary active:bg-primary/90"
            onPress={onOpenProof}
            activeOpacity={0.85}
          >
            <Text className="text-sm font-medium text-primary-foreground">Submit proof</Text>
          </TouchableOpacity>
          <Button variant="outline" className="h-10 rounded-lg px-4" onPress={onFail}>
            <Text className="text-sm text-muted-foreground">Skip</Text>
          </Button>
        </View>
      )}
    </SimpleCard>
  );
};
