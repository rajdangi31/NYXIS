// ─────────────────────────────────────────────
//  RankBadge — styled rank pill with glow
// ─────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rank } from '../lib/database.types';
import { RANK_COLORS } from '../lib/gameLogic';

interface RankBadgeProps {
  rank: Rank;
  size?: 'sm' | 'md' | 'lg';
}

export function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const color = RANK_COLORS[rank] ?? '#9E9E9E';
  const fontSize = size === 'lg' ? 26 : size === 'md' ? 18 : 13;
  const padding = size === 'lg' ? { paddingHorizontal: 20, paddingVertical: 10 }
                : size === 'md' ? { paddingHorizontal: 14, paddingVertical: 6 }
                :                 { paddingHorizontal: 8,  paddingVertical: 3  };

  return (
    <View
      style={[
        styles.badge,
        padding,
        {
          borderColor: color,
          shadowColor: color,
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize }]}>{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  text: {
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    letterSpacing: 3,
  },
});
