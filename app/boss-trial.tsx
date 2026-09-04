import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/design-tokens';
import { GridBackdrop, LiquidGlass } from '@/components/liquid-glass';

export default function BossTrialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rankTarget = params.rankTarget || 'D-CLASS';

  const bgOpacity = useSharedValue(0);
  const dangerPulse = useSharedValue(0);
  const contentTranslateY = useSharedValue(100);
  const contentOpacity = useSharedValue(0);

  const [scrambledTitle, setScrambledTitle] = useState('');
  const chars = 'XYZ!#$%&*<>?01';

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 1000 });
    contentTranslateY.value = withDelay(800, withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) }));
    contentOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));

    dangerPulse.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.2, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    let isCancelled = false;

    const heartbeat = async () => {
      if (isCancelled) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (isCancelled) return;
      setTimeout(async () => {
        if (isCancelled) return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }, 200);
      if (!isCancelled) {
        setTimeout(heartbeat, 1600);
      }
    };
    setTimeout(heartbeat, 1000);

    const timeout = setTimeout(() => {
      let iteration = 0;
      const target = 'PENALTY ZONE ACTIVATED';
      const maxIterations = 15;

      const interval = setInterval(() => {
        if (isCancelled) {
          clearInterval(interval);
          return;
        }
        setScrambledTitle(
          target
            .split('')
            .map((char, index) => {
              if (index < iteration / (maxIterations / target.length)) return target[index];
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join('')
        );
        if (iteration >= maxIterations) {
          clearInterval(interval);
          setScrambledTitle(target);
        }
        iteration++;
      }, 40);
    }, 1200);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [bgOpacity, contentTranslateY, contentOpacity, dangerPulse, chars]);

  const animatedBg = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
    backgroundColor: interpolateColor(dangerPulse.value, [0, 1], [COLORS.BACKGROUND, COLORS.BG_DANGER]),
  }));
  const animatedContent = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));
  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(dangerPulse.value, [0, 1], ['rgba(255, 59, 48, 0.25)', 'rgba(255, 59, 48, 1)']),
  }));

  return (
    <Animated.View style={[styles.container, animatedBg]}>
      <GridBackdrop />

      <Animated.View style={[animatedContent, styles.contentWrap]}>
        <Animated.View style={animatedBorder}>
          <LiquidGlass
            variant="strong"
            tint="magenta"
            accent={COLORS.NEON_RED}
            radius={RADIUS.XXL}
            style={styles.contentShell}
            contentStyle={styles.contentBox}
          >
        <Text style={styles.warningText}>SYSTEM WARNING</Text>
        <Text style={styles.fatalTitle}>{scrambledTitle || '............'}</Text>
        <View style={styles.divider} />
        <Text style={styles.subText}>
          THE HUNTER HAS REACHED A CRITICAL POWER THRESHOLD. A BOSS INSTANCE HAS BEEN GENERATED.
        </Text>

        <View style={styles.objectiveBlock}>
          <Text style={styles.objectiveLabel}>{`// REQUIREMENT`}</Text>
          <Text style={styles.objectiveText}>ADVANCE TO {rankTarget}</Text>
        </View>

        <View style={styles.statContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PENALTY</Text>
            <Text style={styles.statValue}>PERMADEATH</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>REWARD</Text>
            <Text style={styles.statValue}>EVOLUTION</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.btnAccept}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.btnTextAccept}>ENTER THE GATE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnRefuse} disabled={true} activeOpacity={1}>
          <Text style={styles.btnTextRefuse}>ABORT MISSION (LOCKED)</Text>
        </TouchableOpacity>
          </LiquidGlass>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.XL },

  contentWrap: {
    width: '100%',
  },
  contentShell: {
    width: '100%',
    shadowColor: COLORS.NEON_RED,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.22,
  },
  contentBox: {
    width: '100%',
    padding: SPACING.XXL,
    alignItems: 'center',
  },

  warningText: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.DISPLAY, marginBottom: 10 },
  fatalTitle: { color: COLORS.TEXT_PRIMARY, fontSize: 24, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, textAlign: 'center', textShadowColor: COLORS.NEON_RED, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15, letterSpacing: TYPOGRAPHY.SPACING.WIDE, marginBottom: SPACING.XL },

  divider: { height: 1, backgroundColor: COLORS.NEON_RED, opacity: 0.2, width: '100%', marginBottom: 25 },

  subText: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.BODY, fontWeight: TYPOGRAPHY.WEIGHT.NORMAL, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.XXL },

  objectiveBlock: {
    width: '100%',
    backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.05),
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.alpha(COLORS.NEON_RED, 0.35),
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.NEON_RED,
    marginBottom: 24,
  },
  objectiveLabel: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: 6 },
  objectiveText: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.TIGHT },

  statContainer: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: SPACING.XXXL },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    borderRadius: 12,
  },
  statLabel: { color: COLORS.TEXT_MUTED, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: 4 },
  statValue: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.BODY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY },

  btnAccept: {
    width: '100%',
    backgroundColor: COLORS.NEON_RED,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: RADIUS.XL,
    shadowColor: COLORS.NEON_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
    marginBottom: 15,
  },
  btnTextAccept: { color: '#000000', fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE },

  btnRefuse: { width: '100%', paddingVertical: SPACING.MD, alignItems: 'center', opacity: 0.4 },
  btnTextRefuse: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, textDecorationLine: 'line-through' },
});
