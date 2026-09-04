import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/design-tokens';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PARTICLE_COUNT = 24;

function seeded(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Particle({ index }: { index: number }) {
  const baseX = seeded(index * 3.1) * SCREEN_W;
  const baseY = seeded(index * 5.7) * SCREEN_H;
  const size = 2 + seeded(index * 8.3) * 2.5;
  const colors = [COLORS.NEON_CYAN, COLORS.NEON_PURPLE, COLORS.NEON_MAGENTA];
  const color = colors[index % colors.length];
  const baseOpacity = 0.12 + seeded(index * 11.1) * 0.28;
  const travelX = (seeded(index * 13.7) - 0.5) * 48;
  const travelY = -24 - seeded(index * 17.3) * 64;
  const duration = 9000 + seeded(index * 19.9) * 14000;
  const delay = seeded(index * 23.5) * 5000;

  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [t, duration, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: baseX + travelX * t.value },
      { translateY: baseY + travelY * t.value },
    ],
    opacity: baseOpacity * (0.35 + 0.65 * t.value),
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowRadius: size * 3,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ParticleField() {
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i), []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: COLORS.BACKGROUND }]} />
      {particles.map((i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
  },
});
