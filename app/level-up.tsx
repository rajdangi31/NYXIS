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
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';

export default function LevelUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const oldLevel = Number(params.oldLevel) || 4;
  const newLevel = Number(params.newLevel) || 5;

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
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowBottom} />

      <View style={styles.content}>
        <Animated.View style={animatedTitle}>
          <Text style={styles.glitchText}>SYSTEM UPGRADE</Text>
          <Text style={styles.mainTitle}>LEVEL UP</Text>
        </Animated.View>

        <Animated.View style={[styles.detailsBox, animatedDetails]}>
          <View style={styles.levelTransition}>
            <Text style={styles.oldLevel}>LVL {oldLevel}</Text>
            <Text style={styles.arrow}>{'>>'}</Text>
            <Text style={styles.newLevel}>LVL {newLevel}</Text>
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
            activeOpacity={0.7}
          >
            <Text style={styles.btnText}>[ ACCEPT POWER ]</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_VOID, justifyContent: 'center', alignItems: 'center' },
  ambientGlowTop: { position: 'absolute', top: -100, width: 400, height: 400, backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, 0.1), borderRadius: 200 },
  ambientGlowBottom: { position: 'absolute', bottom: -100, right: -50, width: 300, height: 300, backgroundColor: COLORS.alpha(COLORS.NEON_PURPLE, 0.15), borderRadius: 150 },

  content: { alignItems: 'center', width: '100%', paddingHorizontal: SPACING.XL, zIndex: 10 },

  glitchText: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.HEADING, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.MEGA, textAlign: 'center', marginBottom: 10, textShadowColor: COLORS.NEON_CYAN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  mainTitle: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEGA, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, textAlign: 'center', textShadowColor: 'rgba(255, 255, 255, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },

  detailsBox: { width: '100%', backgroundColor: 'rgba(6, 6, 12, 0.8)', borderWidth: 1, borderColor: COLORS.NEON_CYAN, padding: SPACING.XXL, marginTop: SPACING.HEADER_TOP, shadowColor: COLORS.NEON_CYAN, shadowOffset: { width: 0, height: 0 }, shadowRadius: 20, shadowOpacity: 0.2 },

  levelTransition: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.XL },
  oldLevel: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.DISPLAY, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, fontFamily: TYPOGRAPHY.MONO },
  arrow: { color: COLORS.NEON_CYAN, fontSize: SPACING.XL, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, marginHorizontal: SPACING.XL, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
  newLevel: { color: COLORS.NEON_GREEN, fontSize: TYPOGRAPHY.SIZE.HERO, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, fontFamily: TYPOGRAPHY.MONO, textShadowColor: 'rgba(0, 255, 163, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },

  separator: { height: 1, backgroundColor: COLORS.BORDER_DEFAULT, width: '100%', marginVertical: SPACING.XL },

  statsHeader: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.WIDE, marginBottom: 15 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statName: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.TIGHT },
  statBuff: { color: COLORS.NEON_GREEN, fontSize: TYPOGRAPHY.SIZE.HEADING, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, fontFamily: TYPOGRAPHY.MONO },

  btnAcknowledge: { marginTop: SPACING.XXXL, backgroundColor: COLORS.NEON_CYAN, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.NEON_CYAN, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, shadowOpacity: 0.6 },
  btnText: { color: COLORS.BG_PRIMARY, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE },
});
