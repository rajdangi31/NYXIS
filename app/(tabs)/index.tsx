// ─────────────────────────────────────────────
//  HomeScreen — The System Dashboard
//  • Active goal card
//  • Daily briefing (auto-refreshed daily via Architect)
//  • Emergency alert (if active)
//  • Next boss battle preview
//  • Architect CTA (if no goal set)
// ─────────────────────────────────────────────

import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrainCircuit, Zap, RefreshCw } from 'lucide-react-native';
import { useProfile }  from '../../hooks/useProfile';
import { usePaths }    from '../../hooks/usePaths';
import { useQuests }   from '../../hooks/useQuests';
import { GoalCard }    from '../../components/GoalCard';
import { DailyBriefing }  from '../../components/DailyBriefing';
import { BossBattleCard } from '../../components/BossBattleCard';
import { EmergencyAlert } from '../../components/EmergencyAlert';
import { NewPathModal }   from '../../components/NewPathModal';
import { RecalibrationOverlay } from '../../components/RecalibrationOverlay';
import { SystemLinkedToast } from '../../components/SystemLinkedToast';
import { Quest } from '../../lib/database.types';

export default function HomeScreen() {
  const { profile } = useProfile();
  const { activePath, loading: pathLoading, needsDailyRefresh, triggerDailyRefresh, refreshPaths } = usePaths();
  const { quests, loading: questLoading, completeQuest, refreshQuests, isRecalibrating, systemLinkedToastVisible } = useQuests();
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-trigger daily refresh when app opens if needed
  useEffect(() => {
    if (needsDailyRefresh && activePath && profile) {
      triggerDailyRefresh(profile).then(() => refreshQuests());
    }
  }, [needsDailyRefresh, activePath?.id]);

  // Categorise quests
  const dailyQuests      = useMemo(() => quests.filter(q => q.quest_type === 'DAILY' && q.status === 'ACTIVE'), [quests]);
  const emergencyQuests  = useMemo(() => quests.filter(q => q.quest_type === 'EMERGENCY' && q.status === 'ACTIVE'), [quests]);
  const bossQuest        = useMemo(() => quests.find(q => q.quest_type === 'RANK_UP'), [quests]);
  const questsRemaining  = useMemo(() => quests.filter(q => q.status === 'ACTIVE' || q.status === 'LOCKED').length, [quests]);

  const isLoading = pathLoading || questLoading;

  const handleManualRefresh = async () => {
    if (!activePath || !profile || refreshing) return;
    setRefreshing(true);
    await triggerDailyRefresh(profile);
    await refreshQuests();
    setRefreshing(false);
  };

  const handleCompleteQuest = async (id: string) => {
    await completeQuest(id);
    await refreshPaths();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Zap size={16} color="#00E5FF" />
          <Text style={styles.headerTitle}>THE SYSTEM</Text>
        </View>
        {activePath && (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleManualRefresh} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color="#00E5FF" />
              : <RefreshCw size={14} color="#444" />
            }
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !activePath ? (
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 80 }} />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── No active path — Architect CTA ── */}
          {!activePath && (
            <View style={styles.ctaBlock}>
              <BrainCircuit size={48} color="#00E5FF22" />
              <Text style={styles.ctaTitle}>NO ACTIVE PATH</Text>
              <Text style={styles.ctaBody}>
                {"Define your long-term goal and The System will forge a quest line to your Awakening."}
              </Text>
              <TouchableOpacity
                style={styles.ctaBtn}
                onPress={() => setPathModalOpen(true)}
                activeOpacity={0.85}
              >
                <BrainCircuit size={14} color="#000" />
                <Text style={styles.ctaBtnText}>CONSULT THE ARCHITECT</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Active Goal Card ── */}
          {activePath && (
            <View style={styles.section}>
              <GoalCard path={activePath} questsRemaining={questsRemaining} />
            </View>
          )}

          {/* ── Emergency Alerts (highest priority) ── */}
          {emergencyQuests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠ EMERGENCY</Text>
              {emergencyQuests.map(q => (
                <EmergencyAlert key={q.id} quest={q} onComplete={handleCompleteQuest} />
              ))}
            </View>
          )}

          {/* ── Today's Daily Briefing ── */}
          {activePath && (
            <View style={styles.section}>
              <DailyBriefing quests={dailyQuests} onComplete={handleCompleteQuest} />
              {dailyQuests.length === 0 && !needsDailyRefresh && (
                <View style={styles.allDoneBox}>
                  <Text style={styles.allDoneText}>✓ All daily tasks complete. The System is satisfied.</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Next Boss Battle ── */}
          {bossQuest && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚔ NEXT GATE</Text>
              <BossBattleCard quest={bossQuest} isLocked={bossQuest.status === 'LOCKED'} />
            </View>
          )}

          {/* ── Quick action: set new goal if no path ── */}
          {activePath && (
            <TouchableOpacity
              style={styles.newPathBtn}
              onPress={() => setPathModalOpen(true)}
              activeOpacity={0.7}
            >
              <BrainCircuit size={12} color="#00E5FF66" />
              <Text style={styles.newPathBtnText}>Set a new long-term goal</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {profile && (
        <NewPathModal
          visible={pathModalOpen}
          profile={profile}
          onClose={() => setPathModalOpen(false)}
          onGenerated={() => { refreshPaths(); refreshQuests(); }}
        />
      )}

      {/* ── Recalibration Overlay ── */}
      <RecalibrationOverlay visible={isRecalibrating} />
      {/* ── 100% Success Toast ── */}
      <SystemLinkedToast visible={systemLinkedToastVisible} />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 3,
  },
  refreshBtn: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 20,
  },

  // ── CTA ──
  ctaBlock: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    gap: 16,
  },
  ctaTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 13,
    letterSpacing: 3,
    marginTop: 8,
  },
  ctaBody: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginTop: 8,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaBtnText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2,
  },

  // ── Sections ──
  section: { gap: 10 },
  sectionTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2.5,
  },

  allDoneBox: {
    backgroundColor: '#00E5FF08',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00E5FF22',
    padding: 16,
    alignItems: 'center',
  },
  allDoneText: {
    color: '#00E5FF66',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1,
    textAlign: 'center',
  },

  newPathBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    opacity: 0.6,
  },
  newPathBtnText: {
    color: '#00E5FF66',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },
});
