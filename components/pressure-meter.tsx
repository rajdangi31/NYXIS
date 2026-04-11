import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { AnimatedBar } from '@/components/ui/animated-bar';
import { ScrambleText } from '@/components/ui/scramble-text';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';

interface PressureMeterProps {
  pressure: number;
  stateColor: string;
  isPenaltyState: boolean;
  isSoftLocked: boolean;
  pulseOpacity: SharedValue<number>;
}

export const PressureMeter: React.FC<PressureMeterProps> = ({
  pressure,
  stateColor,
  isPenaltyState,
  isSoftLocked,
  pulseOpacity,
}) => {
  const animatedPulse = useAnimatedStyle(() => ({ opacity: pulseOpacity.value }));

  return (
    <View style={[styles.container, { borderColor: isPenaltyState ? COLORS.NEON_RED : COLORS.BORDER_DEFAULT }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: stateColor }]}>
          <ScrambleText text="SHADOW PRESSURE" delay={100} />
        </Text>
        <Text style={[styles.value, { color: stateColor }]}>{pressure}%</Text>
      </View>
      <AnimatedBar percentage={pressure} color={stateColor} />
      {isPenaltyState && !isSoftLocked && (
        <Animated.Text style={[styles.penaltyText, animatedPulse]}>
          ⚠ PENALTY STATE: PATH GENERATION LOCKED ⚠
        </Animated.Text>
      )}
      {isSoftLocked && (
        <Animated.Text style={[styles.fatalText, animatedPulse]}>
          {'[ FATAL ERROR: NO QUESTS REMAINING ]'}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BG_ELEVATED,
    borderWidth: 1,
    padding: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
  value: {
    fontSize: 11,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    fontFamily: TYPOGRAPHY.MONO,
  },
  penaltyText: {
    color: COLORS.NEON_RED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
  fatalText: {
    color: COLORS.NEON_RED,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.WIDE,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
});
