import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { saveHunterContext } from '@/lib/system';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/design-tokens';
import { GridBackdrop, LiquidGlass } from '@/components/liquid-glass';
import type { HunterContextInput } from '@/lib/types';

const intensityOptions: HunterContextInput['preferred_intensity'][] = ['BALANCED', 'LOW', 'HIGH'];

const calibrationPresets = [
  {
    title: 'Cognitive Performance',
    icon: 'lightning-bolt-outline' as const,
    text: 'Optimize focus for deep work and high-stakes build sessions.',
  },
  {
    title: 'System Stamina',
    icon: 'timer-sand' as const,
    text: 'Sustain output across longer goals without burning out.',
  },
  {
    title: 'Routine Architecture',
    icon: 'vector-polyline' as const,
    text: 'Restructure daily protocols into repeatable execution loops.',
  },
  {
    title: 'Critical Recovery',
    icon: 'backup-restore' as const,
    text: 'Stabilize after pressure spikes, missed quests, or fatigue.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<HunterContextInput>({
    primary_aim: '',
    current_conditions: '',
    constraints: '',
    available_time: '',
    preferred_intensity: 'BALANCED',
    proof_preference: 'SYSTEM_ASSIGNED',
  });

  const progress = useMemo(() => {
    const filled = [
      form.primary_aim.trim().length >= 12,
      form.current_conditions.trim().length >= 6,
      form.constraints.trim().length >= 3,
      form.available_time.trim().length >= 3,
    ].filter(Boolean).length;
    return Math.round((filled / 4) * 100);
  }, [form]);

  const update = (key: keyof HunterContextInput, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (title: string) => {
    update('primary_aim', title);
  };

  const submit = async () => {
    if (form.primary_aim.trim().length < 12) {
      Alert.alert('Aim required', 'Give NYXIS a clear primary aim before continuing.');
      return;
    }

    setSaving(true);
    const result = await saveHunterContext({
      ...form,
      primary_aim: form.primary_aim.trim(),
      current_conditions: form.current_conditions.trim(),
      constraints: form.constraints.trim(),
      available_time: form.available_time.trim(),
    });
    setSaving(false);

    if (!result.success) {
      Alert.alert('Could not save', result.error || 'Unable to save hunter context.');
      return;
    }

    router.replace('/(tabs)/status');
  };

  return (
    <View style={styles.screen}>
      <GridBackdrop />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>NYXIS OS</Text>
            <Text style={styles.kicker}>Calibration Phase 01</Text>
          </View>
          <View style={styles.syncDot} />
        </View>

        <Text style={styles.title}>What is your primary objective?</Text>
        <Text style={styles.subtitle}>System is calibrating. Select a protocol, then refine the operating context.</Text>

        <View style={styles.presetsGrid}>
          {calibrationPresets.map(item => {
            const isActive = form.primary_aim === item.title;
            return (
              <TouchableOpacity key={item.title} onPress={() => applyPreset(item.title)} activeOpacity={0.88}>
                <LiquidGlass
                  variant={isActive ? 'default' : 'subtle'}
                  tint={isActive ? 'cyan' : 'none'}
                  accent={COLORS.NEON_CYAN}
                  radius={RADIUS.XL}
                  interactive={isActive}
                  style={[styles.presetCard, isActive && styles.presetCardActive]}
                  contentStyle={styles.presetCardContent}
                >
                  <View style={styles.presetCardHeader}>
                    <View style={[styles.presetIconWrapper, isActive && styles.presetIconWrapperActive]}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={isActive ? COLORS.NEON_CYAN : COLORS.TEXT_SECONDARY}
                      />
                    </View>
                    <Text style={[styles.presetCardTitle, isActive && { color: COLORS.NEON_CYAN }]}>{item.title}</Text>
                    <MaterialCommunityIcons
                      name={isActive ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={18}
                      color={isActive ? COLORS.NEON_CYAN : COLORS.TEXT_DIM}
                    />
                  </View>
                  <Text style={styles.presetCardText}>{item.text}</Text>
                </LiquidGlass>
              </TouchableOpacity>
            );
          })}
        </View>

        <LiquidGlass variant="default" tint="cyan" radius={RADIUS.XL} style={styles.panel} contentStyle={styles.panelContent}>
          <View style={styles.panelTitleRow}>
            <MaterialCommunityIcons name="console-line" size={16} color={COLORS.NEON_CYAN} />
            <Text style={styles.panelTitleText}>Manual objective channel</Text>
          </View>
          <TextInput
            style={styles.manualInput}
            value={form.primary_aim}
            onChangeText={value => update('primary_aim', value)}
            placeholder="Override with your actual mission..."
            placeholderTextColor={COLORS.TEXT_DIM}
            multiline
            selectionColor={COLORS.NEON_CYAN}
          />
        </LiquidGlass>

        <LiquidGlass variant="default" radius={RADIUS.XL} style={styles.panel} contentStyle={styles.panelContent}>
          <Field label="Current conditions">
            <TextInput
              style={[styles.input, styles.largeInput]}
              value={form.current_conditions}
              onChangeText={value => update('current_conditions', value)}
              placeholder="Schedule, energy, skill level, tools, health..."
              placeholderTextColor={COLORS.TEXT_DIM}
              multiline
              selectionColor={COLORS.NEON_CYAN}
            />
          </Field>

          <Field label="Constraints">
            <TextInput
              style={styles.input}
              value={form.constraints}
              onChangeText={value => update('constraints', value)}
              placeholder="Deadlines, budget, injuries, obligations..."
              placeholderTextColor={COLORS.TEXT_DIM}
              selectionColor={COLORS.NEON_CYAN}
            />
          </Field>

          <Field label="Available time">
            <TextInput
              style={styles.input}
              value={form.available_time}
              onChangeText={value => update('available_time', value)}
              placeholder="Example: 45 minutes weekdays"
              placeholderTextColor={COLORS.TEXT_DIM}
              selectionColor={COLORS.NEON_CYAN}
            />
          </Field>

          <Text style={styles.fieldLabel}>Intensity</Text>
          <View style={styles.segments}>
            {intensityOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={[styles.segment, form.preferred_intensity === option && styles.segmentActive]}
                onPress={() => setForm(prev => ({ ...prev, preferred_intensity: option }))}
              >
                <Text style={[styles.segmentText, form.preferred_intensity === option && styles.segmentTextActive]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LiquidGlass>

        <LiquidGlass variant="subtle" tint="cyan" radius={RADIUS.XL} style={styles.panel} contentStyle={styles.panelContent}>
          <View style={styles.syncTop}>
            <Text style={styles.syncLabel}>Sync status</Text>
            <Text style={styles.syncValue}>{progress}%</Text>
          </View>
          <View style={styles.syncBar}>
            <View style={[styles.syncFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.noteText}>Proof is system-assigned. NYXIS decides the evidence required for each directive.</Text>
        </LiquidGlass>

        <TouchableOpacity style={[styles.submit, saving && styles.disabled]} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#000000" /> : <Text style={styles.submitText}>Lock calibration</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.BG_VOID,
  },
  content: {
    padding: SPACING.LG,
    paddingTop: SPACING.HEADER_TOP - 10,
    paddingBottom: SPACING.XXXL,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  brand: {
    color: COLORS.NEON_CYAN,
    fontSize: 20,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: -0.5,
  },
  kicker: {
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.NEON_CYAN,
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 0.8,
    marginTop: 8,
  },
  title: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    textAlign: 'center',
    marginBottom: SPACING.SM,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  presetsGrid: {
    gap: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  presetCard: {
    marginBottom: 0,
  },
  presetCardActive: {
    borderColor: COLORS.alpha(COLORS.NEON_CYAN, 0.5),
  },
  presetCardContent: {
    padding: SPACING.LG,
  },
  presetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.MD,
    marginBottom: 8,
  },
  presetIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetIconWrapperActive: {
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
  },
  presetCardTitle: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.MEDIUM,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
  },
  presetCardText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 18,
    paddingLeft: 44,
  },
  panel: {
    marginBottom: SPACING.LG,
  },
  panelContent: {
    padding: SPACING.LG,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
  panelTitleText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    textTransform: 'uppercase',
  },
  manualInput: {
    minHeight: 70,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.MEDIUM,
    fontWeight: TYPOGRAPHY.WEIGHT.NORMAL,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
    paddingBottom: SPACING.SM,
  },
  field: {
    marginBottom: SPACING.LG,
  },
  fieldLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    marginBottom: SPACING.XS,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    backgroundColor: COLORS.mixVoid(0.35),
    color: COLORS.TEXT_PRIMARY,
    padding: SPACING.MD,
    fontSize: 15,
  },
  largeInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segments: {
    flexDirection: 'row',
    gap: SPACING.SM,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    backgroundColor: COLORS.mixGlass(0.12),
    paddingVertical: 12,
  },
  segmentActive: {
    borderColor: COLORS.NEON_CYAN,
    backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, 0.1),
  },
  segmentText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  segmentTextActive: {
    color: COLORS.NEON_CYAN,
  },
  syncBar: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.mixGlass(0.2),
    marginBottom: SPACING.MD,
  },
  syncFill: {
    height: '100%',
    backgroundColor: COLORS.NEON_CYAN,
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 0.6,
  },
  noteText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 18,
  },
  syncTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  syncLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
    textTransform: 'uppercase',
  },
  syncValue: {
    color: COLORS.NEON_CYAN,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BOLD,
  },
  submit: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: COLORS.NEON_CYAN,
    shadowColor: COLORS.NEON_CYAN,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    shadowOpacity: 0.35,
  },
  disabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#000000',
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    fontSize: TYPOGRAPHY.SIZE.MEDIUM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

