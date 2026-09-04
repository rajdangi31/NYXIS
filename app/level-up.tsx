import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/design-tokens';
import { GridBackdrop, LiquidGlass } from '@/components/liquid-glass';

export default function LevelUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const oldLevel = params.oldLevel ? Number(params.oldLevel) : 4;
  const newLevel = params.newLevel ? Number(params.newLevel) : 5;

  const bgOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.2);
  const textOpacity = useSharedValue(0);
  const detailsOpacity = useSharedValue(0);
  const detailsTranslateY = useSharedValue(50);

  const triggerHapticSequence = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 400);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 700);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 800);
    setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 1200);
  };

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 500 });
    textScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    detailsOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    detailsTranslateY.value = withDelay(1200, withTiming(0, { duration: 800, easing: Easing.out(Easing.exp) }));
    triggerHapticSequence();
  }, [bgOpacity, textScale, textOpacity, detailsOpacity, detailsTranslateY]);

  const animatedBg = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const animatedTitle = useAnimatedStyle(() => ({ opacity: textOpacity.value, transform: [{ scale: textScale.value }] }));
  const animatedDetails = useAnimatedStyle(() => ({ opacity: detailsOpacity.value, transform: [{ translateY: detailsTranslateY.value }] }));

  return (
    <Animated.View style={[styles.container, animatedBg]}>
      <GridBackdrop />

      <View style={styles.content}>
        <Animated.View style={animatedTitle}>
          <Text style={styles.glitchText}>SYSTEM UPGRADE</Text>
          <Text style={styles.mainTitle}>LEVEL UP</Text>
        </Animated.View>

        <Animated.View style={animatedDetails}>
          <LiquidGlass variant="strong" tint="cyan" radius={RADIUS.XXL} style={styles.detailsShell} contentStyle={styles.detailsBox}>
          <View style={styles.levelTransition}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelLabel}>LVL</Text>
              <Text style={styles.levelVal}>{oldLevel}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={[styles.levelBadge, styles.levelBadgeActive]}>
              <Text style={[styles.levelLabel, { color: COLORS.NEON_CYAN }]}>LVL</Text>
              <Text style={[styles.levelVal, { color: COLORS.NEON_GREEN }]}>{newLevel}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <Text style={styles.statsHeader}>{`// ATTRIBUTES AWAKENED`}</Text>

          <View style={styles.statRow}>
            <Text style={styles.statName}>ALL BASE STATS</Text>
            <Text style={styles.statBuff}>+1</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statName}>FULL RESTORE</Text>
            <Text style={styles.statBuff}>100%</Text>
          </View>

          <TouchableOpacity
            style={styles.btnAcknowledge}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>ACCEPT POWER</Text>
          </TouchableOpacity>
          </LiquidGlass>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_VOID, justifyContent: 'center', alignItems: 'center' },

  content: { alignItems: 'center', width: '100%', paddingHorizontal: SPACING.XL, zIndex: 10 },

  glitchText: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.HEADING, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.MEGA, textAlign: 'center', marginBottom: 10, textShadowColor: COLORS.NEON_CYAN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  mainTitle: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEGA, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, textAlign: 'center', textShadowColor: 'rgba(255, 255, 255, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },

  detailsShell: {
    width: '100%',
    marginTop: SPACING.HEADER_TOP,
    borderColor: COLORS.alpha(COLORS.NEON_CYAN, 0.3),
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 0.22,
  },
  detailsBox: {
    width: '100%',
    padding: SPACING.XXL,
  },

  levelTransition: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.XL },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.alpha(COLORS.TEXT_PRIMARY, 0.05),
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.XS,
    borderRadius: RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SUBTLE,
  },
  levelBadgeActive: {
    backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, 0.08),
    borderColor: COLORS.alpha(COLORS.NEON_CYAN, 0.3),
  },
  levelLabel: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    marginRight: 4,
  },
  levelVal: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.DISPLAY,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    fontFamily: TYPOGRAPHY.MONO,
  },
  arrow: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.HEADING, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, marginHorizontal: SPACING.XL },

  separator: { height: 1, backgroundColor: COLORS.BORDER_DEFAULT, width: '100%', marginVertical: SPACING.XL },

  statsHeader: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.WIDE, marginBottom: 15 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statName: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.BOLD },
  statBuff: { color: COLORS.NEON_GREEN, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, fontFamily: TYPOGRAPHY.MONO },

  btnAcknowledge: {
    marginTop: SPACING.XXXL,
    backgroundColor: COLORS.NEON_CYAN,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: RADIUS.XL,
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    shadowOpacity: 0.3,
  },
  btnText: { color: COLORS.BG_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE },
});
