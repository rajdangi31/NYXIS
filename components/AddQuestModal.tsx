// ─────────────────────────────────────────────
//  AddQuestModal — Create a new quest
// ─────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Swords, Zap, Target, ChevronRight } from 'lucide-react-native';
import { QuestType, StatFocus } from '../lib/database.types';
import { QUEST_TYPE_CONFIG, STAT_LABELS } from '../lib/gameLogic';

interface AddQuestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (quest: {
    title: string;
    description: string;
    quest_type: QuestType;
    xp_gain: number;
    stat_focus: StatFocus;
    stat_gain: number;
  }) => Promise<void>;
}

const QUEST_TYPES: QuestType[]   = ['DAILY', 'SIDE', 'EMERGENCY', 'RANK_UP'];
const STAT_FOCUSES: StatFocus[]  = ['stats_str', 'stats_int', 'stats_vit', 'stats_dex', 'stats_wis'];
const XP_PRESETS                 = [50, 100, 200, 300, 500];
const STAT_GAIN_OPTIONS          = [1, 2, 3];

export function AddQuestModal({ visible, onClose, onSubmit }: AddQuestModalProps) {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [questType, setQuestType]     = useState<QuestType>('DAILY');
  const [statFocus, setStatFocus]     = useState<StatFocus>('stats_str');
  const [xpGain, setXpGain]           = useState(100);
  const [statGain, setStatGain]       = useState(1);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const reset = () => {
    setTitle('');
    setDescription('');
    setQuestType('DAILY');
    setStatFocus('stats_str');
    setXpGain(100);
    setStatGain(1);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Quest title is required.');
      shake();
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), quest_type: questType, xp_gain: xpGain, stat_focus: statFocus, stat_gain: statGain });
      reset();
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to create quest.');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const typeColor = QUEST_TYPE_CONFIG[questType]?.color ?? '#00E5FF';

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Tap-outside to close */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateX: shakeAnim }] }]}>
          {/* ── Header ── */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <Swords size={16} color="#00E5FF" />
              <Text style={styles.sheetTitle}>FORGE QUEST</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <X size={16} color="#555" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

            {/* ── Title ── */}
            <Text style={styles.label}>QUEST TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="Name your quest..."
              placeholderTextColor="#333"
              value={title}
              onChangeText={setTitle}
              maxLength={60}
              returnKeyType="next"
            />

            {/* ── Description ── */}
            <Text style={styles.label}>DESCRIPTION  <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="What must be done?"
              placeholderTextColor="#333"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
              textAlignVertical="top"
            />

            {/* ── Quest Type ── */}
            <Text style={styles.label}>TYPE</Text>
            <View style={styles.chipRow}>
              {QUEST_TYPES.map((t) => {
                const cfg   = QUEST_TYPE_CONFIG[t];
                const active = t === questType;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, active && { borderColor: cfg.color, backgroundColor: cfg.color + '18' }]}
                    onPress={() => setQuestType(t)}
                  >
                    <Text style={[styles.chipText, active && { color: cfg.color }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── XP Gain ── */}
            <View style={styles.rowLabel}>
              <Zap size={12} color="#FFD700" />
              <Text style={styles.label}>XP REWARD</Text>
            </View>
            <View style={styles.chipRow}>
              {XP_PRESETS.map((xp) => (
                <TouchableOpacity
                  key={xp}
                  style={[styles.chip, xpGain === xp && styles.chipActiveYellow]}
                  onPress={() => setXpGain(xp)}
                >
                  <Text style={[styles.chipText, xpGain === xp && { color: '#FFD700' }]}>+{xp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Stat Focus ── */}
            <View style={styles.rowLabel}>
              <Target size={12} color="#00E5FF" />
              <Text style={styles.label}>STAT FOCUS</Text>
            </View>
            <View style={styles.chipRow}>
              {STAT_FOCUSES.map((sf) => {
                const active = sf === statFocus;
                return (
                  <TouchableOpacity
                    key={sf}
                    style={[styles.chip, active && styles.chipActiveNeon]}
                    onPress={() => setStatFocus(sf)}
                  >
                    <Text style={[styles.chipText, active && { color: '#00E5FF' }]}>
                      {STAT_LABELS[sf]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Stat Gain ── */}
            <Text style={styles.label}>STAT GAIN</Text>
            <View style={styles.chipRow}>
              {STAT_GAIN_OPTIONS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, statGain === n && styles.chipActiveNeon]}
                  onPress={() => setStatGain(n)}
                >
                  <Text style={[styles.chipText, statGain === n && { color: '#00E5FF' }]}>+{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Error ── */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, { shadowColor: typeColor, borderColor: typeColor + '44' }]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.submitText}>FORGE QUEST</Text>
                  <ChevronRight size={16} color="#000" />
                </>
              )}
            </TouchableOpacity>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000AA',
  },
  sheet: {
    backgroundColor: '#080808',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#00E5FF22',
    maxHeight: '90%',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#111',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    letterSpacing: 3,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 8,
  },
  label: {
    color: '#555',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2,
    marginBottom: 6,
    marginTop: 10,
  },
  optional: {
    color: '#333',
    fontSize: 8,
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  inputMultiline: {
    minHeight: 72,
    paddingTop: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#222',
    backgroundColor: '#0A0A0A',
  },
  chipText: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  chipActiveNeon: {
    borderColor: '#00E5FF',
    backgroundColor: '#00E5FF11',
  },
  chipActiveYellow: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD70011',
  },
  errorBox: {
    backgroundColor: '#FF444411',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF444444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 11,
    fontFamily: 'SpaceMono',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 16,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    borderWidth: 1,
  },
  submitText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 2.5,
  },
});
