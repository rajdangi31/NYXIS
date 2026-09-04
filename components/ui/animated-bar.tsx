import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { COLORS } from '@/constants/design-tokens';

interface AnimatedBarProps {
  percentage: number;
  color: string;
  duration?: number;
}

export const AnimatedBar: React.FC<AnimatedBarProps> = ({
  percentage,
  color,
  duration = 1200,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(percentage, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  }, [percentage, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={styles.barBackground}>
      <Animated.View style={[styles.barFill, { backgroundColor: color }, animatedStyle]}>
        <View style={[styles.barGlow, { shadowColor: color }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  barBackground: {
    width: '100%',
    height: 4,
    backgroundColor: COLORS.BG_PRIMARY,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
  },
  barFill: {
    height: '100%',
    position: 'relative',
  },
  barGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: '100%',
    opacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
  },
});
