// ─────────────────────────────────────────────
//  XPBar — animated neon progress bar
// ─────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { xpProgress, xpWithinLevel, xpForNextLevel } from '../lib/gameLogic';

interface XPBarProps {
  totalXp: number;
  level: number;
}

export function XPBar({ totalXp, level }: XPBarProps) {
  const animatedWidth = useRef(new Animated.Value(0)).current;
  const progress = xpProgress(totalXp);
  const current = xpWithinLevel(totalXp);
  const needed = xpForNextLevel();

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthPercent = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>EXP</Text>
        <Text style={styles.label}>
          {current.toLocaleString()} / {needed.toLocaleString()}
        </Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        {/* Glow shadow layer */}
        <Animated.View style={[styles.glowFill, { width: widthPercent }]} />
        {/* Main fill */}
        <Animated.View style={[styles.fill, { width: widthPercent }]} />
      </View>

      <Text style={styles.levelHint}>Level {level} → {level + 1}</Text>
    </View>
  );
}

const NEON = '#00E5FF';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: NEON,
    fontSize: 11,
    fontFamily: 'SpaceMono',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  track: {
    height: 8,
    backgroundColor: '#0D2A2E',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#00E5FF22',
    position: 'relative',
  },
  glowFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#00E5FF44',
    borderRadius: 4,
    transform: [{ scaleY: 3 }],
  },
  fill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: NEON,
    borderRadius: 4,
    shadowColor: NEON,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  levelHint: {
    color: '#555',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: 'right',
    fontFamily: 'SpaceMono',
  },
});
