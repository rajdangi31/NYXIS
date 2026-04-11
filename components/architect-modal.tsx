import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';

interface ArchitectModalProps {
  message: string;
  onAcknowledge: () => void;
}

export const ArchitectModal: React.FC<ArchitectModalProps> = ({ message, onAcknowledge }) => {
  return (
    <View style={styles.container}>
      <View style={styles.glowBar} />
      <Text style={styles.title}>THE ARCHITECT SPEAKS</Text>
      <Text style={styles.message}>{message}</Text>
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
