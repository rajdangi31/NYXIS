// ─────────────────────────────────────────────
//  NewPathModal — "Awaken" your goal with the Architect
// ─────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BrainCircuit, X, Sparkles, ChevronRight } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { generatePathQuests } from '../lib/architect';
import { Profile } from '../lib/database.types';

interface NewPathModalProps {
  visible: boolean;
  profile: Profile;
  onClose: () => void;
  onGenerated: () => void; // called after successful generation
}

type GenPhase = 'idle' | 'creating_path' | 'consulting_architect' | 'sealing_destiny' | 'done';

const PHASE_LABELS: Record<GenPhase, string> = {
  idle:                '',
  creating_path:       'OPENING A NEW PATH...',
  consulting_architect:'CONSULTING THE ARCHITECT...',
  sealing_destiny:     'SEALING YOUR DESTINY...',
  done:                'QUEST LINE FORGED.',
};

export function NewPathModal({ visible, profile, onClose, onGenerated }: NewPathModalProps) {
  const [goal, setGoal]       = useState('');
  const [phase, setPhase]     = useState<GenPhase>('idle');
  const [error, setError]     = useState<string | null>(null);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isGenerating = phase !== 'idle' && phase !== 'done';

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleGenerate = async () => {
    if (!goal.trim()) {
      setError('State your goal, Hunter.');
      shake();
      return;
    }
    setError(null);
    startPulse();

    try {
      // Phase 1: create the Path row
      setPhase('creating_path');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');

      const { data: pathData, error: pathError } = await supabase
        .from('paths')
        .insert({ player_id: user.id, title: goal.trim(), is_active: true })
        .select()
        .single();

      if (pathError) throw pathError;

      // Phase 2: call the Architect (Gemini)
      setPhase('consulting_architect');
      await generatePathQuests(goal.trim(), profile, pathData.id);

      // Phase 3: seal
      setPhase('sealing_destiny');
      await new Promise((r) => setTimeout(r, 600)); // dramatic pause

      setPhase('done');
      stopPulse();

      // Heavy haptic on success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 900));

      onGenerated();
      handleClose();
    } catch (err: any) {
      stopPulse();
      setPhase('idle');
      setError(err.message ?? 'The Architect is unavailable. Try again.');
      shake();
    }
  };

  const handleClose = () => {
    if (isGenerating) return;
    setGoal('');
    setPhase('idle');
    setError(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View style={[styles.sheet, { transform: [{ translateX: shakeAnim }] }]}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BrainCircuit size={16} color="#00E5FF" />
              <Text style={styles.headerTitle}>THE ARCHITECT</Text>
            </View>
            {!isGenerating && (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={16} color="#555" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.body}>
            {/* ── Flavour text ── */}
            <Text style={styles.flavorText}>
              "State your ambition. The System will forge the path to your Awakening."
            </Text>

            {/* ── Goal input ── */}
            <Text style={styles.label}>YOUR GOAL</Text>
            <TextInput
              style={[styles.input, isGenerating && styles.inputDisabled]}
              placeholder='e.g. "Become a software engineer"'
              placeholderTextColor="#2A2A2A"
              value={goal}
              onChangeText={setGoal}
              editable={!isGenerating}
              maxLength={120}
              returnKeyType="done"
              onSubmitEditing={handleGenerate}
            />

            {/* ── Loading state ── */}
            {isGenerating && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#00E5FF" size="small" />
                <Animated.Text
                  style={[styles.loadingText, { transform: [{ scale: pulseAnim }] }]}
                >
                  {PHASE_LABELS[phase]}
                </Animated.Text>
              </View>
            )}

            {/* ── Error ── */}
            {error && !isGenerating && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* ── Quest count badge ── */}
            {!isGenerating && (
              <View style={styles.infoBadge}>
                <Sparkles size={12} color="#FFD700" />
                <Text style={styles.infoText}>
                  10 quests generated · 3 ACTIVE · 7 LOCKED
                </Text>
              </View>
            )}

            {/* ── Submit ── */}
            <TouchableOpacity
              style={[styles.submitBtn, isGenerating && styles.submitBtnDisabled]}
              onPress={handleGenerate}
              activeOpacity={0.8}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#00000088" />
              ) : (
                <>
                  <Text style={styles.submitText}>AWAKEN</Text>
                  <ChevronRight size={16} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#000000BB',
  },
  sheet: {
    backgroundColor: '#060606',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#00E5FF33',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: -4 },
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#111',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
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
    paddingTop: 20,
    paddingBottom: 44,
    gap: 12,
  },
  flavorText: {
    color: '#333',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 16,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  label: {
    color: '#555',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  inputDisabled: {
    opacity: 0.4,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#00E5FF0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E5FF22',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  loadingText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 2,
  },
  errorBox: {
    backgroundColor: '#FF444411',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF444444',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#FF4444',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    lineHeight: 17,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#444',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00E5FF',
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  submitBtnDisabled: {
    backgroundColor: '#00E5FF44',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#000',
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 3,
  },
});
