import React, { useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSharedValue, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';
import { useQuestSystem } from '@/hooks/useQuestSystem';
import { QuestCard } from '@/components/quest-card';
import { ArchitectModal } from '@/components/architect-modal';
import { EvalReport } from '@/components/eval-report';
import { PressureMeter } from '@/components/pressure-meter';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';

export default function QuestsScreen() {
    const qs = useQuestSystem();
    const router = useRouter();

    // ─── Auto-Navigate on Level Up / Rank Up ─────────────────
    useEffect(() => {
        if (qs.hasLeveledUp) {
            qs.clearLevelUp();
            router.push({ pathname: '/level-up', params: { oldLevel: qs.level - 1, newLevel: qs.level } });
        }
    }, [qs.hasLeveledUp]);

    useEffect(() => {
        if (qs.hasRankedUp) {
            qs.clearRankUp();
            router.push({ pathname: '/boss-trial', params: { rankTarget: qs.rank } });
        }
    }, [qs.hasRankedUp]);

    const pulseOpacity = useSharedValue(0.3);
    useEffect(() => {
        pulseOpacity.value = withRepeat(
            withSequence(withTiming(1, { duration: 800 }), withTiming(0.3, { duration: 800 })),
            -1,
            true
        );
        return () => cancelAnimation(pulseOpacity);
    }, [pulseOpacity]);

    // PHASE 14 UPDATE: Added SYSTEM_COLLAPSE visual rendering (Dark Blood Red)
    const stateColor =
        qs.systemState === 'SYSTEM_COLLAPSE' ? COLORS.NEON_BLOOD :
            qs.systemState === 'PENALTY' ? COLORS.NEON_RED :
                qs.systemState === 'FOCUSED' ? COLORS.NEON_PURPLE :
                    qs.systemState === 'PRESSURED' ? COLORS.NEON_GOLD :
                        COLORS.NEON_CYAN;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>
                    {'NYXIS://'}
                    <Text style={[styles.textNeon, { color: stateColor, textShadowColor: stateColor }]}>QUEST_LOG</Text>
                    <Text style={[styles.cursor, { color: stateColor }]}>_</Text>
                </Text>
                <View style={styles.stateBadge}>
                    <Text style={[styles.stateText, { color: stateColor }]}>STATE: {qs.systemState}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Pressure Meter */}
                <PressureMeter
                    pressure={qs.pressure}
                    stateColor={stateColor}
                    isPenaltyState={qs.isPenaltyState}
                    isSoftLocked={qs.isSoftLocked}
                    pulseOpacity={pulseOpacity}
                />

                {/* Goal Input or Survival Protocol */}
                {qs.isSoftLocked ? (
                    <View style={styles.survivalBox}>
                        <Text style={styles.survivalTitle}>SURVIVAL PROTOCOL</Text>
                        <Text style={styles.survivalText}>The System requires immediate physical atonement.</Text>
                        <TouchableOpacity style={styles.btnSurvival} onPress={qs.handleSurvivalProtocol} disabled={qs.loading}>
                            {qs.loading ? <ActivityIndicator color={COLORS.BG_PRIMARY} /> : <Text style={styles.btnTextSurvival}>[ INITIATE PROTOCOL ]</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.inputSector, qs.isPenaltyState && styles.disabledInput]}>
                        <Text style={styles.inputLabel}>{`// DECLARE_OBJECTIVE`}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={qs.isPenaltyState ? 'SYSTEM LOCKED.' : 'Define your next evolution point...'}
                            placeholderTextColor={COLORS.TEXT_DIM}
                            value={qs.goal}
                            onChangeText={qs.setGoal}
                            editable={!qs.loading && !qs.isPenaltyState}
                            selectionColor={COLORS.NEON_CYAN}
                        />
                        <TouchableOpacity
                            style={[styles.btnCommune, (qs.loading || qs.isPenaltyState) && styles.disabledButton]}
                            onPress={qs.handleGeneratePath}
                            disabled={qs.isPenaltyState || qs.loading}
                        >
                            {qs.loading ? <ActivityIndicator color={COLORS.BG_PRIMARY} /> : <Text style={styles.btnTextCommune}>[ COMMUNE WITH ARCHITECT ]</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tracker */}
                <View style={styles.trackerContainer}>
                    <View style={styles.trackerBlock}>
                        <Text style={styles.trackerLabel}>CLEARED</Text>
                        <Text style={styles.trackerValue}>{qs.logsCount}</Text>
                    </View>
                    <View style={styles.trackerDivider} />
                    <View style={styles.trackerBlock}>
                        <Text style={styles.trackerLabel}>NEXT EVAL</Text>
                        <Text style={styles.trackerValue}>{Math.ceil((qs.logsCount + 1) / 7) * 7}</Text>
                    </View>
                    <TouchableOpacity style={styles.btnForceEval} onPress={qs.triggerEvaluation}>
                        <Text style={styles.btnTextForceEval}>FORCE_EVAL</Text>
                    </TouchableOpacity>
                </View>

                {/* Behavioral Profile */}
                {qs.behavior && (
                    <View style={styles.behaviorContainer}>
                        <Text style={styles.inputLabel}>{`// BEHAVIORAL_PROFILE`}</Text>
                        <View style={styles.behaviorGrid}>
                            <View style={styles.behaviorStat}>
                                <Text style={styles.trackerLabel}>CONSISTENCY</Text>
                                <Text style={[styles.behaviorValue, { color: qs.behavior.consistency_score >= 70 ? COLORS.NEON_GREEN : qs.behavior.consistency_score <= 40 ? COLORS.NEON_RED : COLORS.TEXT_SECONDARY }]}>
                                    {qs.behavior.consistency_score}
                                </Text>
                            </View>
                            <View style={styles.trackerDivider} />
                            <View style={styles.behaviorStat}>
                                <Text style={styles.trackerLabel}>AVOIDANCE</Text>
                                <Text style={[styles.behaviorValue, { color: qs.behavior.avoidance_score >= 70 ? COLORS.NEON_RED : COLORS.TEXT_SECONDARY }]}>
                                    {qs.behavior.avoidance_score}
                                </Text>
                            </View>
                            <View style={styles.trackerDivider} />
                            <View style={styles.behaviorStat}>
                                <Text style={styles.trackerLabel}>INTENSITY</Text>
                                <Text style={[styles.behaviorValue, { color: qs.behavior.intensity_score >= 70 ? COLORS.NEON_PURPLE : COLORS.TEXT_SECONDARY }]}>
                                    {qs.behavior.intensity_score}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Architect Message */}
                {qs.architectMessage && (
                    <ArchitectModal
                        message={qs.architectMessage}
                        onAcknowledge={() => qs.setArchitectMessage(null)}
                    />
                )}

                {/* Evaluation Data */}
                {qs.evalData && (
                    <EvalReport
                        data={qs.evalData}
                        onAcknowledge={() => qs.setEvalData(null)}
                    />
                )}

                {/* Active Directives */}
                <Text style={styles.sectionTitle}>{`// ACTIVE_DIRECTIVES`}</Text>

                {qs.fetching ? (
                    <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.NEON_CYAN} />
                ) : qs.quests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>{'[ ]'}</Text>
                        <Text style={styles.emptyText}>NO DIRECTIVES</Text>
                        <Text style={styles.emptySubtext}>The Path is clear. Define your next objective.</Text>
                    </View>
                ) : (
                    qs.quests.map((q, index) => (
                        <QuestCard
                            key={q.id}
                            quest={q}
                            index={index}
                            isProcessing={qs.processingId === q.id}
                            proofValue={qs.proofInputs[q.id] || ''}
                            onProofChange={(text: string) => qs.setProofInput(q.id, text)}
                            onComplete={() => qs.handleCompleteQuest(q.id, q.verification_required, q.title, q.type)}
                            onFail={() => qs.handleFailQuest(q.id)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.BG_PRIMARY },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.XL,
        paddingTop: SPACING.HEADER_TOP,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER_DEFAULT,
        backgroundColor: COLORS.BG_PRIMARY,
    },
    headerText: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontFamily: TYPOGRAPHY.MONO, letterSpacing: TYPOGRAPHY.SPACING.TIGHT, fontWeight: TYPOGRAPHY.WEIGHT.BOLD },
    textNeon: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
    cursor: { fontWeight: TYPOGRAPHY.WEIGHT.BOLD },
    stateBadge: { borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: COLORS.BG_ELEVATED },
    stateText: { fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },

    scrollContent: { padding: SPACING.XL, paddingBottom: 60 },
    sectionTitle: { color: COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BOLD, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginTop: 10, marginBottom: 15 },

    survivalBox: { backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.05), padding: SPACING.XL, borderWidth: 1, borderColor: COLORS.NEON_RED, marginBottom: SPACING.XL, alignItems: 'center' },
    survivalTitle: { color: COLORS.NEON_RED, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.ULTRA, marginBottom: 8, textShadowColor: COLORS.alpha(COLORS.NEON_RED, 0.5), textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
    survivalText: { color: COLORS.TEXT_SECONDARY, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.NORMAL, marginBottom: SPACING.XL, textAlign: 'center', lineHeight: 16 },
    btnSurvival: { backgroundColor: COLORS.NEON_RED, paddingVertical: 14, width: '100%', alignItems: 'center', shadowColor: COLORS.NEON_RED, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, shadowOpacity: 0.5 },
    btnTextSurvival: { color: COLORS.BG_PRIMARY, fontSize: TYPOGRAPHY.SIZE.BODY, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE },

    inputSector: { backgroundColor: COLORS.BG_ELEVATED, padding: SPACING.XL, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, marginBottom: SPACING.XL },
    disabledInput: { opacity: 0.5, borderColor: COLORS.NEON_RED },
    inputLabel: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: SPACING.MD },
    input: { backgroundColor: COLORS.BG_PRIMARY, borderWidth: 1, borderColor: COLORS.BORDER_SUBTLE, padding: 14, color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontFamily: TYPOGRAPHY.MONO },
    btnCommune: { backgroundColor: COLORS.NEON_CYAN, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
    btnTextCommune: { color: COLORS.BG_PRIMARY, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },
    disabledButton: { backgroundColor: COLORS.TEXT_MUTED },

    trackerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_ELEVATED, padding: SPACING.LG, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, marginBottom: SPACING.XL },
    trackerBlock: { flex: 1 },
    trackerLabel: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: 4 },
    trackerValue: { color: COLORS.TEXT_PRIMARY, fontSize: 18, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, fontFamily: TYPOGRAPHY.MONO },
    trackerDivider: { width: 1, height: 30, backgroundColor: COLORS.BORDER_SUBTLE, marginHorizontal: 15 },
    btnForceEval: { backgroundColor: COLORS.BG_PRIMARY, borderWidth: 1, borderColor: COLORS.alpha(COLORS.NEON_CYAN, 0.27), paddingVertical: 10, paddingHorizontal: 10 },
    btnTextForceEval: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.TINY, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.TIGHT },

    behaviorContainer: { backgroundColor: COLORS.BG_SURFACE, padding: SPACING.LG, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, marginBottom: SPACING.XL },
    behaviorGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    behaviorStat: { flex: 1, alignItems: 'center' },
    behaviorValue: { fontSize: 16, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, fontFamily: TYPOGRAPHY.MONO },

    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50 },
    emptyIcon: { color: COLORS.BORDER_DEFAULT, fontSize: 32, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.DISPLAY, marginBottom: 15 },
    emptyText: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.LARGE, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.WIDE, marginBottom: 8 },
    emptySubtext: { color: COLORS.TEXT_MUTED, fontSize: 11, fontFamily: TYPOGRAPHY.MONO },
});