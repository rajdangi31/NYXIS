// ─────────────────────────────────────────────
//  BossBattleCard — Dramatic RANK_UP quest preview
// ─────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Sword, Lock } from 'lucide-react-native';
import { Quest } from '../lib/database.types';

interface BossBattleCardProps {
  quest: Quest;
  isLocked?: boolean;
}

export function BossBattleCard({ quest, isLocked = false }: BossBattleCardProps) {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.card, isLocked && styles.cardLocked]}>
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <Sword size={10} color="#FFD700" />
          <Text style={styles.typeText}>BOSS BATTLE</Text>
        </View>
        {isLocked && (
          <View style={styles.lockBadge}>
            <Lock size={10} color="#FF444488" />
            <Text style={styles.lockText}>LOCKED</Text>
          </View>
        )}
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{quest.xp_gain} XP</Text>
        </View>
      </View>

      <Animated.View style={[styles.borderGlow, { opacity: isLocked ? 0 : glowAnim }]} />

      <Text style={[styles.title, isLocked && styles.titleLocked]}>{quest.title}</Text>
      <Text style={[styles.description, isLocked && styles.descLocked]} numberOfLines={2}>
        {quest.description}
      </Text>

      {isLocked && (
        <Text style={styles.unlockHint}>▸  Complete all previous quests to unlock</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0600',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFD70044',
    padding: 18,
    gap: 10,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  cardLocked: {
    borderColor: '#FF444422',
    shadowColor: '#FF4444',
    shadowOpacity: 0.08,
  },
  borderGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 2,
    backgroundColor: '#FFD700',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFD70011',
    borderWidth: 1,
    borderColor: '#FFD70033',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    color: '#FFD700',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF444411',
    borderWidth: 1,
    borderColor: '#FF444433',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockText: {
    color: '#FF444488',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  xpBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: '#FFD70011',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  xpText: {
    color: '#FFD700',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleLocked: { color: '#555' },
  description: {
    color: '#888',
    fontSize: 13,
    lineHeight: 18,
  },
  descLocked: { color: '#333' },
  unlockHint: {
    color: '#FF444466',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
});
