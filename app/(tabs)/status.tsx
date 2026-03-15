// ─────────────────────────────────────────────
//  StatusScreen — Player's System Window
// ─────────────────────────────────────────────

import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, LogOut, Target } from 'lucide-react-native';
import { useProfile } from '../../hooks/useProfile';
import { useAuth } from '../../hooks/useAuth';
import { usePaths } from '../../hooks/usePaths';
import { XPBar } from '../../components/XPBar';
import { RankBadge } from '../../components/RankBadge';
import { StatRadar } from '../../components/StatRadar';
import { GoalCard } from '../../components/GoalCard';
import { useQuests } from '../../hooks/useQuests';

export default function StatusScreen() {
  const { profile, loading, refreshProfile } = useProfile();
  const { signOut } = useAuth();
  const { activePath } = usePaths();
  const { quests } = useQuests();
  const questsRemaining = quests.filter(q => q.status === 'ACTIVE' || q.status === 'LOCKED').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshProfile}
            tintColor="#00E5FF"
            colors={['#00E5FF']}
          />
        }
      >
        {/* ── Header bar ── */}
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Shield size={16} color="#00E5FF" />
            <Text style={styles.headerTitle}>STATUS WINDOW</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <LogOut size={14} color="#444" />
          </TouchableOpacity>
        </View>

        {loading && !profile ? (
          <ActivityIndicator color="#00E5FF" style={{ marginTop: 60 }} />
        ) : profile ? (
          <>
            {/* ── Player Identity Panel ── */}
            <View style={styles.identityPanel}>
              {/* Rank badge — large */}
              <View style={styles.rankWrapper}>
                <RankBadge rank={profile.rank} size="lg" />
              </View>

              {/* Name & Title */}
              <View style={styles.nameBlock}>
                <Text style={styles.playerName}>{profile.player_name}</Text>
                <Text style={styles.playerTitle}>[{profile.player_title}]</Text>
              </View>

              {/* Level */}
              <View style={styles.levelChip}>
                <Text style={styles.levelLabel}>LV.</Text>
                <Text style={styles.levelValue}>{profile.level}</Text>
              </View>
            </View>

            {/* ── XP Bar ── */}
            <View style={styles.section}>
              <XPBar totalXp={profile.total_xp} level={profile.level} />
            </View>

            {/* ── Active Path ── */}
            {activePath ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>▸ ACTIVE PATH</Text>
                <GoalCard path={activePath} questsRemaining={questsRemaining} />
              </View>
            ) : (
              <View style={styles.emptyPathBox}>
                <Target size={14} color="#00E5FF44" />
                <Text style={styles.emptyPathText}>No active goal — consult The Architect in the Quest tab.</Text>
              </View>
            )}

            {/* ── Divider ── */}
            <View style={styles.divider} />

            {/* ── Stat Radar ── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>▸ CORE STATS</Text>
              <StatRadar profile={profile} />
            </View>

            {/* ── Total XP stat ── */}
            <View style={styles.totalXpRow}>
              <Text style={styles.totalXpLabel}>TOTAL XP ACCUMULATED</Text>
              <Text style={styles.totalXpValue}>
                {profile.total_xp.toLocaleString()}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signOutBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  headerTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 3,
  },
  identityPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#00E5FF22',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    gap: 16,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  rankWrapper: {
    // nothing extra needed
  },
  nameBlock: {
    flex: 1,
  },
  playerName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  playerTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 3,
  },
  levelChip: {
    alignItems: 'center',
    backgroundColor: '#0D2A2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#00E5FF44',
  },
  levelLabel: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  levelValue: {
    color: '#FFF',
    fontFamily: 'SpaceMono',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#111',
    marginBottom: 24,
  },
  emptyPathBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00E5FF06',
    borderWidth: 1,
    borderColor: '#00E5FF11',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  emptyPathText: {
    color: '#00E5FF44',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
    flex: 1,
    lineHeight: 14,
  },
  totalXpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  totalXpLabel: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  totalXpValue: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '700',
  },
});
