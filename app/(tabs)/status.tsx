import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useHunterStatus } from '@/hooks/useHunterStatus';
import { ScrambleText } from '@/components/ui/scramble-text';
import { AnimatedBar } from '@/components/ui/animated-bar';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, withRepeat, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function StatusScreen() {
  const { profile, loading, refreshProfile } = useHunterStatus();

  const breathOpacity = useSharedValue(0.2);

  useEffect(() => {
    breathOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [breathOpacity]);

  const animatedBorderPulse = useAnimatedStyle(() => ({
    borderColor: `rgba(157, 78, 221, ${breathOpacity.value})`,
  }));

  if (loading) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color={COLORS.NEON_CYAN} />
        <Text style={styles.bootText}>INITIALIZING SYSTEM DATA...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.bootScreen}>
        <Text style={styles.errorText}>FATAL ERROR: HUNTER ENTITY NOT FOUND.</Text>
        <TouchableOpacity style={styles.btnDanger} onPress={refreshProfile}>
          <Text style={styles.btnTextDanger}>RETRY CONNECTION</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnDanger, { marginTop: SPACING.XL }]} onPress={() => supabase.auth.signOut()}>
          <Text style={styles.btnTextDanger}>SEVER SYSTEM LINK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentLevelXP = Math.pow(profile.level, 2) * 100;
  const nextLevelXP = Math.pow(profile.level + 1, 2) * 100;
  const xpProgress = Math.min(100, Math.max(0, ((profile.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));

  const pressure = profile.pressure_level || 0;
  const pressureColor = pressure >= 80 ? COLORS.NEON_RED : pressure >= 40 ? COLORS.NEON_GOLD : COLORS.NEON_CYAN;

  const attributes = [
    { key: 'STR', label: 'STRENGTH', value: profile.str },
    { key: 'INT', label: 'INTELLIGENCE', value: profile.int },
    { key: 'DEX', label: 'DEXTERITY', value: profile.dex },
    { key: 'VIT', label: 'VITALITY', value: profile.vit },
    { key: 'WIS', label: 'WISDOM', value: profile.wis },
  ];

  return (
    <View style={styles.container}>
      {/* Global Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {'SYSTEM STATUS: '}
          <Text style={styles.textNeon}>ONLINE</Text>
          <Text style={styles.cursor}>_</Text>
        </Text>
        <Text style={styles.headerMuted}>{new Date().toLocaleTimeString('en-US', { hour12: false })}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Profile Section */}
        <View style={styles.heroSection}>
          <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
          <Text style={styles.levelCount}>
            <ScrambleText text={profile.level.toString().padStart(2, '0')} delay={200} />
          </Text>

          <Animated.View style={[styles.rankBadge, animatedBorderPulse]}>
            <Text style={styles.rankText}>
              {'CLASS: '}
              <ScrambleText text={profile.rank} delay={600} />
            </Text>
          </Animated.View>

          {/* XP System */}
          <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>EXPERIENCE</Text>
              <Text style={styles.xpValue}>
                <ScrambleText text={`${profile.total_xp} / ${nextLevelXP}`} delay={800} />
              </Text>
            </View>
            <AnimatedBar percentage={Number.isNaN(xpProgress) ? 0 : xpProgress} color={COLORS.NEON_CYAN} />
          </View>
        </View>

        {/* Attribute Matrix */}
        <Text style={styles.sectionTitle}>{`// ATTRIBUTE_MATRIX`}</Text>
        <View style={styles.attributeGrid}>
          {attributes.map((attr, idx) => (
            <View key={attr.key} style={styles.statBlock}>
              <Text style={styles.statLabel}>{attr.label}</Text>
              <Text style={styles.statValue}>
                <ScrambleText text={attr.value} delay={1000 + idx * 150} />
              </Text>
            </View>
          ))}
        </View>

        {/* Shadow Pressure Meter */}
        <Text style={styles.sectionTitle}>{`// SYSTEM_WARNINGS`}</Text>
        <View style={[styles.pressureContainer, { borderColor: pressureColor + '55' }]}>
          <View style={styles.xpHeader}>
            <Text style={[styles.pressureLabel, { color: pressureColor }]}>SHADOW PRESSURE</Text>
            <Text style={[styles.pressureValue, { color: pressureColor }]}>{pressure}%</Text>
          </View>
          <AnimatedBar percentage={pressure} color={pressureColor} />
          {pressure >= 80 && (
            <Text style={styles.criticalText}>CRITICAL LIMIT REACHED. COMPLETE QUESTS IMMEDIATELY.</Text>
          )}
        </View>

        {/* Footer Controls */}
        <View style={styles.footerControls}>
          <TouchableOpacity style={styles.btnSync} onPress={refreshProfile}>
            <Text style={styles.btnTextSync}>[ SYNC ]</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDisconnect} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.btnTextDisconnect}>[ EXIT ]</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_PRIMARY },
  bootScreen: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  bootText: { color: COLORS.NEON_CYAN, marginTop: SPACING.XL, fontFamily: TYPOGRAPHY.MONO, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, fontSize: TYPOGRAPHY.SIZE.BODY },
  errorText: { color: COLORS.NEON_RED, marginBottom: SPACING.XL, fontFamily: TYPOGRAPHY.MONO, letterSpacing: TYPOGRAPHY.SPACING.TIGHT, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BOLD },

  header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.XL, paddingTop: SPACING.HEADER_TOP, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER_DEFAULT, backgroundColor: COLORS.BG_PRIMARY },
  headerText: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontFamily: TYPOGRAPHY.MONO, letterSpacing: TYPOGRAPHY.SPACING.TIGHT, fontWeight: TYPOGRAPHY.WEIGHT.BOLD },
  textNeon: { color: COLORS.NEON_CYAN, textShadowColor: COLORS.NEON_CYAN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  cursor: { color: COLORS.NEON_CYAN, fontWeight: TYPOGRAPHY.WEIGHT.BOLD },
  headerMuted: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontFamily: TYPOGRAPHY.MONO, letterSpacing: TYPOGRAPHY.SPACING.TIGHT },

  scrollContent: { paddingBottom: SPACING.XXXL },

  heroSection: { alignItems: 'center', padding: SPACING.XXL, borderBottomWidth: 1, borderBottomColor: COLORS.alpha(COLORS.NEON_CYAN, 0.1), backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, 0.02) },
  levelLabel: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.ULTRA, marginBottom: -10, zIndex: 1 },
  levelCount: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.ULTRA, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, textShadowColor: 'rgba(255,255,255,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },

  rankBadge: { marginTop: 10, paddingHorizontal: SPACING.XL, paddingVertical: 6, backgroundColor: COLORS.alpha(COLORS.NEON_PURPLE, 0.1), borderWidth: 1 },
  rankText: { color: COLORS.NEON_PURPLE, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.WIDE, textShadowColor: 'rgba(157, 78, 221, 0.8)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },

  xpContainer: { width: '100%', marginTop: SPACING.XXL },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  xpLabel: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
  xpValue: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontFamily: TYPOGRAPHY.MONO },

  sectionTitle: { color: COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginTop: SPACING.XXL, marginBottom: 15, paddingHorizontal: SPACING.XL },

  attributeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: SPACING.XL },
  statBlock: { flexGrow: 1, minWidth: width * 0.28, backgroundColor: COLORS.BG_SURFACE, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, padding: 15, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: 5 },
  statValue: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.DISPLAY, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, fontFamily: TYPOGRAPHY.MONO },

  pressureContainer: { marginHorizontal: SPACING.XL, backgroundColor: COLORS.BG_ELEVATED, borderWidth: 1, padding: SPACING.XL },
  pressureLabel: { fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
  pressureValue: { fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, fontFamily: TYPOGRAPHY.MONO },
  criticalText: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.TIGHT, marginTop: 10, textAlign: 'center' },

  footerControls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.XXXL, paddingHorizontal: SPACING.XL },
  btnSync: { padding: 15 },
  btnTextSync: { color: COLORS.NEON_CYAN, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
  btnDisconnect: { padding: 15 },
  btnTextDisconnect: { color: COLORS.NEON_RED, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },

  btnDanger: { borderWidth: 1, borderColor: COLORS.NEON_RED, backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.1), paddingHorizontal: SPACING.XXL, paddingVertical: 15 },
  btnTextDanger: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.BODY, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
});