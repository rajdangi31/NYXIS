// ─────────────────────────────────────────────
//  QuestCard — individual quest item
//  Supports ACTIVE and LOCKED status rendering
// ─────────────────────────────────────────────

import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Zap, Target, ChevronRight, X, Lock } from 'lucide-react-native';
import { Quest } from '../lib/database.types';
import { QUEST_TYPE_CONFIG, STAT_LABELS } from '../lib/gameLogic';

interface QuestCardProps {
  quest: Quest;
  onComplete: (id: string) => void;
  onFail?: (id: string) => void;
}

export function QuestCard({ quest, onComplete, onFail }: QuestCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isLocked  = quest.status === 'LOCKED';
  const typeConfig = QUEST_TYPE_CONFIG[quest.quest_type] ?? { label: quest.quest_type, color: '#555' };
  const typeColor  = isLocked ? '#333' : typeConfig.color;

  const handlePressIn = () => {
    if (isLocked) return;
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (isLocked) return;
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleComplete = () => {
    if (isLocked) return;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.04, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0,    duration: 200, useNativeDriver: true }),
    ]).start(() => onComplete(quest.id));
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isLocked && styles.cardLocked,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      {/* Quest type badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.typeBadge, { borderColor: typeColor }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>
            {typeConfig.label}
          </Text>
        </View>
        {isLocked && (
          <View style={styles.lockedBadge}>
            <Lock size={10} color="#444" />
            <Text style={styles.lockedText}>LOCKED</Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={[styles.title, isLocked && styles.titleLocked]}>
        {quest.title}
      </Text>

      {/* Description */}
      <Text style={[styles.description, isLocked && styles.descriptionLocked]} numberOfLines={2}>
        {isLocked ? 'Complete previous quests to unlock this challenge.' : quest.description}
      </Text>

      {/* Rewards row */}
      <View style={styles.rewardsRow}>
        <View style={[styles.rewardChip, isLocked && styles.rewardChipLocked]}>
          <Zap size={12} color={isLocked ? '#333' : '#FFD700'} />
          <Text style={[styles.rewardText, isLocked && styles.rewardTextLocked]}>
            +{quest.xp_gain} XP
          </Text>
        </View>
        <View style={[styles.rewardChip, isLocked && styles.rewardChipLocked]}>
          <Target size={12} color={isLocked ? '#333' : '#00E5FF'} />
          <Text style={[styles.rewardText, isLocked && styles.rewardTextLocked]}>
            +{quest.stat_gain} {STAT_LABELS[quest.stat_focus]}
          </Text>
        </View>
      </View>

      {/* Action buttons — hidden when locked */}
      {!isLocked && (
        <View style={styles.actionRow}>
          {onFail && (
            <TouchableOpacity
              style={styles.failBtn}
              onPress={() => onFail(quest.id)}
              activeOpacity={0.7}
            >
              <X size={14} color="#FF4444" />
              <Text style={styles.failText}>FAIL</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.completeBtn}
            onPress={handleComplete}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
          >
            <Text style={styles.completeBtnText}>COMPLETE</Text>
            <ChevronRight size={14} color="#000" />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLocked: {
    backgroundColor: '#060606',
    borderColor: '#111',
    shadowOpacity: 0,
    opacity: 0.6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 9,
    letterSpacing: 2,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#0A0A0A',
  },
  lockedText: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  titleLocked: {
    color: '#333',
  },
  description: {
    color: '#666',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  descriptionLocked: {
    color: '#2A2A2A',
    fontStyle: 'italic',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  rewardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#111',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  rewardChipLocked: {
    backgroundColor: '#080808',
    borderColor: '#111',
  },
  rewardText: {
    color: '#CCC',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  rewardTextLocked: {
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
  },
  failBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF444466',
  },
  failText: {
    color: '#FF4444',
    fontSize: 10,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00E5FF',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  completeBtnText: {
    color: '#000',
    fontSize: 11,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
