import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';
import type { EvalData } from '@/lib/types';

interface EvalReportProps {
  data: EvalData;
  onAcknowledge: () => void;
}

export const EvalReport: React.FC<EvalReportProps> = ({ data, onAcknowledge }) => {
  return (
    <View style={styles.container}>
      <View style={styles.glowBar} />
      <Text style={styles.title}>SYSTEM EVALUATION DATA</Text>

      <View style={styles.grid}>
        <View style={styles.row}>
          <Text style={styles.key}>SUCCESS RATE:</Text>
          <Text style={[styles.val, { color: data.success_rate >= 80 ? COLORS.NEON_GREEN : data.success_rate <= 40 ? COLORS.NEON_RED : COLORS.NEON_CYAN }]}>
            {data.success_rate}%
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>DIFFICULTY MULTIPLIER:</Text>
          <Text style={styles.val}>{data.difficulty_multiplier}x</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>PRESSURE ADJUSTMENT:</Text>
          <Text style={[styles.val, { color: data.pressure_delta > 0 ? COLORS.NEON_RED : COLORS.NEON_GREEN }]}>
            {data.pressure_delta > 0 ? `+${data.pressure_delta}` : data.pressure_delta}%
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.key}>RECOMMENDED FOCUS:</Text>
          <Text style={[styles.val, { color: COLORS.NEON_PURPLE }]}>{data.recommended_focus}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0, marginBottom: 15 }]}>
          <Text style={styles.key}>ASSIGNED STATE:</Text>
          <Text style={[styles.val, { color: COLORS.NEON_GOLD }]}>{data.next_state}</Text>
        </View>
      </View>

      <Text style={styles.message}>&quot;{data.message}&quot;</Text>

      <TouchableOpacity style={styles.btn} onPress={onAcknowledge}>
        <Text style={styles.btnText}>[ ACKNOWLEDGE ]</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.BG_SURFACE,
    padding: SPACING.XL,
    borderWidth: 1,
    borderColor: COLORS.NEON_RED,
    marginBottom: SPACING.XL,
    position: 'relative',
  },
  glowBar: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 2,
    backgroundColor: COLORS.NEON_RED,
    shadowColor: COLORS.NEON_RED,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    shadowOpacity: 1,
  },
  title: {
    color: COLORS.NEON_RED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.ULTRA,
    marginBottom: 15,
  },
  grid: {
    backgroundColor: COLORS.BG_PRIMARY,
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_DEFAULT,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_DEFAULT,
    paddingVertical: 6,
    marginBottom: 6,
  },
  key: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE.TINY,
    fontWeight: TYPOGRAPHY.WEIGHT.HEAVY,
    letterSpacing: TYPOGRAPHY.SPACING.TIGHT,
  },
  val: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    fontFamily: TYPOGRAPHY.MONO,
  },
  message: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE.BODY,
    lineHeight: 20,
    fontFamily: TYPOGRAPHY.MONO,
    marginBottom: SPACING.XL,
    fontStyle: 'italic',
  },
  btn: {
    backgroundColor: COLORS.alpha(COLORS.NEON_RED, 0.1),
    borderWidth: 1,
    borderColor: COLORS.NEON_RED,
    paddingVertical: SPACING.MD,
    alignItems: 'center',
  },
  btnText: {
    color: COLORS.NEON_RED,
    fontSize: TYPOGRAPHY.SIZE.SMALL,
    fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
    letterSpacing: TYPOGRAPHY.SPACING.NORMAL,
  },
});
