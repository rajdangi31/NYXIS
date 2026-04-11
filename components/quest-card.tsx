import React from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ScrambleText } from '@/components/ui/scramble-text';
import { COLORS, TYPOGRAPHY, SPACING, QUEST_TYPE_COLORS } from '@/constants/design-tokens';
import type { Quest } from '@/lib/types';

interface QuestCardProps {
  quest: Quest;
  index: number;
  isProcessing: boolean;
  proofValue: string;
  onProofChange: (text: string) => void;
  onComplete: () => void;
  onFail: () => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({
  quest,
  index,
  isProcessing,
  proofValue,
  onProofChange,
  onComplete,
  onFail,
}) => {
  const qColor = QUEST_TYPE_COLORS[quest.type] || COLORS.TEXT_SECONDARY;

  return (
    <View style={[styles.card, { borderLeftColor: qColor }]}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          <ScrambleText text={quest.title} delay={index * 100} />
        </Text>
        <View style={[styles.typeBadge, { borderColor: COLORS.alpha(qColor, 0.33), backgroundColor: COLORS.alpha(qColor, 0.07) }]}>
          <Text style={[styles.typeText, { color: qColor }]}>{quest.type}</Text>
        </View>
      </View>

      <Text style={styles.desc}>{quest.description}</Text>

      <View style={styles.meta}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>REWARD</Text>
          <Text style={[styles.metaValue, { color: COLORS.NEON_CYAN }]}>+{quest.xp_reward} XP</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>FOCUS</Text>
          <Text style={[styles.metaValue, { color: COLORS.NEON_GREEN }]}>{quest.stat_focus}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>RATING</Text>
          <Text style={[styles.metaValue, { color: COLORS.NEON_GOLD }]}>{quest.difficulty_rating}/10</Text>
        </View>
      </View>

      {quest.verification_required && (
        <View style={styles.proofSector}>
          <Text style={styles.proofLabel}>{`// VERIFICATION_REQUIRED: ${String(quest.verification_type || 'TEXT').toUpperCase()}`}</Text>
          <TextInput
            style={styles.proofInput}
            placeholder="Enter link, value, or text evidence..."
            placeholderTextColor={COLORS.TEXT_DIM}
            value={proofValue}
            onChangeText={onProofChange}
            selectionColor={COLORS.NEON_GREEN}
          />
        </View>
      )}

      <View style={styles.actions}>
        {isProcessing ? (
          <View style={styles.processingWrapper}>
            <ActivityIndicator size="small" color={qColor} />
            <Text style={[styles.processingText, { color: qColor }]}> PROCESSING...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.btnAction, { borderColor: COLORS.alpha(COLORS.NEON_GREEN, 0.33), backgroundColor: COLORS.alpha(COLORS.NEON_GREEN, 0.04) }]}
              onPress={onComplete}
            >
              <Text style={[styles.btnTextAction, { color: COLORS.NEON_GREEN }]}>[ CLEAR ]</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAction, { borderColor: COLORS.alpha(COLORS.NEON_RED, 0.33), backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.04) }]}
              onPress={onFail}
            >
              <Text style={[styles.btnTextAction, { color: COLORS.NEON_RED }]}>[ ABORT ]</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.BG_ELEVATED,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderLeftWidth: 4,
    padding: 18,
    marginBottom: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.TIGHT,
    flex: 1,
    paddingRight: SPACING.SM + 2,
    lineHeight: 22,
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  typeText: {
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
  desc: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 18,
    marginBottom: SPACING.LG,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.BG_SURFACE,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    marginBottom: SPACING.LG,
  },
  metaBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metaLabel: {
    color: COLORS.TEXT_DIM,
    fontSize: TYPOGRAPHY.SIZE.MICRO,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    marginBottom: SPACING.XS,
  },
  metaValue: {
    fontSize: TYPOGRAPHY.SIZE.BODY,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    fontFamily: TYPOGRAPHY.MONO,
  },
  proofSector: {
    backgroundColor: COLORS.BG_SURFACE,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.alpha(COLORS.NEON_GREEN, 0.27),
    marginBottom: SPACING.LG,
  },
  proofLabel: {
    color: COLORS.NEON_GREEN,
    fontSize: TYPOGRAPHY.SIZE.MICRO,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    marginBottom: SPACING.SM,
  },
  proofInput: {
    backgroundColor: COLORS.BG_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    padding: SPACING.SM + 2,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 11,
    fontFamily: TYPOGRAPHY.MONO,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  btnAction: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  btnTextAction: {
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
  processingWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.BG_PRIMARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  processingText: {
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    marginLeft: SPACING.SM,
  },
});
