import React from 'react';
import { View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { MeterBar } from '@/components/system-shell';
import { COLORS, pressureTone } from '@/constants/design-tokens';

interface PressureMeterProps {
  pressure: number;
  stateColor?: string;
  isPenaltyState?: boolean;
  isSoftLocked?: boolean;
  pulseOpacity?: SharedValue<number>;
  threshold?: number;
  compact?: boolean;
}

export const PressureMeter: React.FC<PressureMeterProps> = ({
  pressure,
  stateColor,
  isPenaltyState = false,
  isSoftLocked = false,
  pulseOpacity,
  threshold = 85,
  compact = false,
}) => {
  const safePressure = Math.min(100, Math.max(0, pressure));
  const tone = pressureTone(safePressure);
  const barColor = stateColor ?? tone.color;

  const animatedPulse = useAnimatedStyle(() => ({
    opacity: pulseOpacity?.value ?? 1,
  }));

  if (compact) {
    return (
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Pressure</Text>
          <Text className="text-sm font-medium tabular-nums" style={{ color: barColor }}>
            {safePressure}% · {tone.label}
          </Text>
        </View>
        <MeterBar value={safePressure} color={barColor} />
        {isPenaltyState && !isSoftLocked && pulseOpacity && (
          <Animated.Text className="text-xs text-destructive" style={animatedPulse}>
            Quest generation locked until pressure drops.
          </Animated.Text>
        )}
        {isSoftLocked && pulseOpacity && (
          <Animated.Text className="text-xs text-destructive" style={animatedPulse}>
            Start recovery protocol to continue.
          </Animated.Text>
        )}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-muted-foreground">Shadow pressure</Text>
        <Text className="text-lg font-semibold tabular-nums" style={{ color: barColor }}>
          {safePressure}%
        </Text>
      </View>
      <MeterBar value={safePressure} color={barColor} />
      {safePressure >= threshold && (
        <Text className="text-xs text-destructive">Near collapse threshold ({threshold}%)</Text>
      )}
      {isPenaltyState && !isSoftLocked && pulseOpacity && (
        <Animated.Text className="text-xs text-destructive" style={animatedPulse}>
          Quest generation locked until pressure drops.
        </Animated.Text>
      )}
      {isSoftLocked && pulseOpacity && (
        <Animated.Text className="text-xs text-destructive" style={animatedPulse}>
          Start recovery protocol to continue.
        </Animated.Text>
      )}
    </View>
  );
};
