// ─────────────────────────────────────────────
//  EmergencyAlert — Pulsing red EMERGENCY quest card
// ─────────────────────────────────────────────

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Quest } from '../lib/database.types';

interface EmergencyAlertProps {
  quest: Quest;
  onComplete: (id: string) => void;
}

export function EmergencyAlert({ quest, onComplete }: EmergencyAlertProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim,  { toValue: 1.015, duration: 600, useNativeDriver: true }),
          Animated.timing(borderAnim, { toValue: 1,     duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim,  { toValue: 1,   duration: 600, useNativeDriver: true }),
          Animated.timing(borderAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
      <View style={styles.topRow}>
        <View style={styles.typeBadge}>
          <AlertTriangle size={10} color="#FF4444" />
          <Text style={styles.typeText}>‼ EMERGENCY</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>{quest.xp_gain} XP</Text>
        </View>
      </View>

      <Text style={styles.title}>{quest.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{quest.description}</Text>

      <TouchableOpacity style={styles.completeBtn} onPress={() => onComplete(quest.id)} activeOpacity={0.8}>
        <CheckCircle size={14} color="#FF4444" />
        <Text style={styles.completeBtnText}>MISSION COMPLETE</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0000',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF444455',
    padding: 18,
    gap: 10,
    shadowColor: '#FF4444',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF444411',
    borderWidth: 1,
    borderColor: '#FF444444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeText: {
    color: '#FF4444',
    fontFamily: 'SpaceMono',
    fontSize: 8,
    letterSpacing: 1.5,
  },
  xpBadge: {
    marginLeft: 'auto' as any,
    backgroundColor: '#FF444411',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  xpText: {
    color: '#FF4444',
    fontFamily: 'SpaceMono',
    fontSize: 9,
    letterSpacing: 1,
  },
  title: {
    color: '#FF6666',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  description: {
    color: '#884444',
    fontSize: 13,
    lineHeight: 18,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF444422',
    borderWidth: 1,
    borderColor: '#FF444444',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
  },
  completeBtnText: {
    color: '#FF4444',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 2,
  },
});
