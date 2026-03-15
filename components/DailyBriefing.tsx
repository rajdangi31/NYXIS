// ─────────────────────────────────────────────
//  DailyBriefing — Compact daily quest list for Home
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, Sun } from 'lucide-react-native';
import { Quest } from '../lib/database.types';

interface DailyBriefingProps {
  quests: Quest[];
  onComplete: (id: string) => void;
}

const STAT_LABELS: Record<string, string> = {
  stats_str: 'STR',
  stats_int: 'INT',
  stats_vit: 'VIT',
  stats_dex: 'DEX',
  stats_wis: 'WIS',
};

export function DailyBriefing({ quests, onComplete }: DailyBriefingProps) {
  if (!quests.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sun size={13} color="#FFD700" />
        <Text style={styles.headerText}>TODAY'S BRIEFING</Text>
        <Text style={styles.countText}>{quests.length} QUESTS</Text>
      </View>

      {quests.map((quest) => (
        <View key={quest.id} style={styles.row}>
          <TouchableOpacity
            onPress={() => onComplete(quest.id)}
            style={styles.checkBtn}
            activeOpacity={0.7}
          >
            <Circle size={20} color="#00E5FF33" />
          </TouchableOpacity>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{quest.title}</Text>
            <View style={styles.meta}>
              <Text style={styles.statBadge}>{STAT_LABELS[quest.stat_focus] ?? quest.stat_focus}</Text>
              <Text style={styles.xp}>+{quest.xp_gain} XP</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#080808',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD70022',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111',
  },
  headerText: {
    flex: 1,
    color: '#FFD700',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2.5,
  },
  countText: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#0D0D0D',
    gap: 12,
  },
  checkBtn: {
    padding: 2,
  },
  info: { flex: 1, gap: 4 },
  title: {
    color: '#DDD',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statBadge: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
    backgroundColor: '#00E5FF11',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  xp: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1,
  },
});
