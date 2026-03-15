// ─────────────────────────────────────────────
//  GoalCard — Active path / long-term goal display
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Target, Flame } from 'lucide-react-native';
import { PathWithMeta } from '../hooks/usePaths';

interface GoalCardProps {
  path: PathWithMeta;
  questsRemaining: number;
}

export function GoalCard({ path, questsRemaining }: GoalCardProps) {
  const daysActive = Math.floor(
    (Date.now() - new Date(path.created_at ?? Date.now()).getTime()) / 86_400_000
  );

  const pct = Math.max(0, Math.min(100, path.progress_pct ?? 0));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Target size={13} color="#00E5FF" />
          <Text style={styles.label}>ACTIVE PATH</Text>
        </View>
        <View style={styles.daysBadge}>
          <Flame size={10} color="#FF6B35" />
          <Text style={styles.daysText}>DAY {Math.max(1, daysActive)}</Text>
        </View>
      </View>

      <Text style={styles.goalText} numberOfLines={2}>{path.goal_text || path.title}</Text>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>{pct}% COMPLETE</Text>
        <Text style={styles.footerLabel}>{questsRemaining} QUESTS LEFT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#080808',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#00E5FF22',
    padding: 18,
    gap: 10,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2.5,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF6B3511',
    borderWidth: 1,
    borderColor: '#FF6B3533',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  daysText: {
    color: '#FF6B35',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  goalText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#111',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E5FF',
    borderRadius: 2,
    minWidth: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
});
