// ─────────────────────────────────────────────
//  QuestScreen — Active Quest Log (Sectioned)
//  Sections: DAILY → EMERGENCY → BOSS BATTLE → SIDE
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  SectionList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollText, Plus, BrainCircuit, RefreshCw } from 'lucide-react-native';
import { useQuests }  from '../../hooks/useQuests';
import { useProfile } from '../../hooks/useProfile';
import { usePaths }   from '../../hooks/usePaths';
import { QuestCard }       from '../../components/QuestCard';
import { BossBattleCard }  from '../../components/BossBattleCard';
import { EmergencyAlert }  from '../../components/EmergencyAlert';
import { AddQuestModal }   from '../../components/AddQuestModal';
import { NewPathModal }    from '../../components/NewPathModal';
import { RecalibrationOverlay } from '../../components/RecalibrationOverlay';
import { SystemLinkedToast } from '../../components/SystemLinkedToast';
import { Quest } from '../../lib/database.types';

interface Section {
  title: string;
  data: Quest[];
  type: 'daily' | 'emergency' | 'boss' | 'side';
}

export default function QuestScreen() {
  const { quests, loading, addQuest, completeQuest, failQuest, refreshQuests, isRecalibrating, systemLinkedToastVisible } = useQuests();
  const { profile }  = useProfile();
  const { activePath, triggerDailyRefresh, refreshPaths } = usePaths();

  const [addModalOpen,  setAddModalOpen]  = useState(false);
  const [pathModalOpen, setPathModalOpen] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshQuests();
    setRefreshing(false);
  };

  const handleDailyRefresh = async () => {
    if (!activePath || !profile) return;
    setRefreshing(true);
    await triggerDailyRefresh(profile);
    await refreshQuests();
    await refreshPaths();
    setRefreshing(false);
  };

  // Build sections
  const sections: Section[] = useMemo(() => {
    const active = quests.filter(q => q.status === 'ACTIVE');
    const locked = quests.filter(q => q.status === 'LOCKED');
    const all    = [...active, ...locked];

    const daily     = all.filter(q => q.quest_type === 'DAILY');
    const emergency = all.filter(q => q.quest_type === 'EMERGENCY');
    const boss      = all.filter(q => q.quest_type === 'RANK_UP');
    const side      = all.filter(q => q.quest_type === 'SIDE');

    const result: Section[] = [];
    if (emergency.length) result.push({ title: '‼ EMERGENCY', data: emergency, type: 'emergency' });
    if (daily.length)     result.push({ title: '☀ DAILY',     data: daily,     type: 'daily' });
    if (boss.length)      result.push({ title: '⚔ BOSS BATTLE', data: boss,   type: 'boss' });
    if (side.length)      result.push({ title: '◈ SIDE QUESTS', data: side,   type: 'side' });
    return result;
  }, [quests]);

  const activeCount = quests.filter(q => q.status === 'ACTIVE').length;

  const renderItem = ({ item, section }: { item: Quest; section: Section }) => {
    if (section.type === 'boss') {
      return <BossBattleCard quest={item} isLocked={item.status === 'LOCKED'} />;
    }
    if (section.type === 'emergency') {
      return <EmergencyAlert quest={item} onComplete={handleCompleteQuest} />;
    }
    return <QuestCard quest={item} onComplete={handleCompleteQuest} onFail={failQuest} />;
  };

  const handleCompleteQuest = async (questId: string) => {
    await completeQuest(questId);
  };

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={[
        styles.sectionTitle,
        section.type === 'emergency' && { color: '#FF4444' },
        section.type === 'boss'      && { color: '#FFD700' },
      ]}>
        {section.title}
      </Text>
      <Text style={styles.sectionCount}>{section.data.length}</Text>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>NO ACTIVE QUESTS</Text>
      <Text style={styles.emptyBody}>
        Tap <Text style={{ color: '#00E5FF' }}>⊕</Text> to forge a quest manually,{'\n'}
        or <Text style={{ color: '#00E5FF' }}>✦ ARCHITECT</Text> to generate a full AI quest path.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <ScrollText size={16} color="#00E5FF" />
          <Text style={styles.headerTitle}>QUEST LOG</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.countChip}>
            <Text style={styles.countText}>{activeCount} ACTIVE</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
            <RefreshCw size={14} color="#555" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Architect / Daily Refresh banner ── */}
      <View style={styles.bannerRow}>
        <TouchableOpacity style={styles.bannerBtn} onPress={() => setPathModalOpen(true)} activeOpacity={0.8}>
          <BrainCircuit size={12} color="#00E5FF" />
          <Text style={styles.bannerText}>✦ NEW PATH</Text>
        </TouchableOpacity>
        {activePath && (
          <TouchableOpacity style={styles.bannerBtn} onPress={handleDailyRefresh} activeOpacity={0.8} disabled={refreshing}>
            {refreshing
              ? <ActivityIndicator size="small" color="#00E5FF" />
              : <>
                  <Text style={styles.bannerText}>↻ DAILY REFRESH</Text>
                </>
            }
          </TouchableOpacity>
        )}
      </View>

      {loading && !quests.length ? (
        <ActivityIndicator color="#00E5FF" style={{ marginTop: 60 }} />
      ) : (
        <>
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={ListEmpty}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            stickySectionHeadersEnabled={false}
            SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </>
      )}

      {/* ── FAB ── */}
      <TouchableOpacity style={styles.fab} onPress={() => setAddModalOpen(true)} activeOpacity={0.85}>
        <Plus size={24} color="#000" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* ── Modals & Overlays ── */}
      <AddQuestModal visible={addModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={addQuest} />
      {profile && (
        <NewPathModal
          visible={pathModalOpen}
          profile={profile}
          onClose={() => setPathModalOpen(false)}
          onGenerated={refreshQuests}
        />
      )}

      <RecalibrationOverlay visible={isRecalibrating} />
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
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countChip: {
    backgroundColor: '#0D2A2E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#00E5FF33',
  },
  countText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },
  iconBtn: { padding: 4 },

  bannerRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: '#00E5FF0A',
    borderWidth: 1,
    borderColor: '#00E5FF22',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  bannerText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1.5,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingTop: 14,
  },
  sectionTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2.5,
  },
  sectionCount: {
    color: '#333',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 13,
    letterSpacing: 3,
    marginTop: 8,
  },
  emptyBody: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00E5FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.7,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  recalibratingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF11',
    borderWidth: 1,
    borderColor: '#00E5FF44',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  recalibratingText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1.5,
  },
});
