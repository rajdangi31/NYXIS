import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export function RecalibrationOverlay({ visible }: { visible: boolean }) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
    }
  }, [visible, pulseAnim]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.Text style={[styles.text, { opacity: pulseAnim }]}>
        CONSULTING THE ARCHITECT...
      </Animated.Text>
      <Text style={styles.subtext}>
        RECALIBRATING ROADMAP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtext: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    letterSpacing: 4,
    opacity: 0.6,
  },
});
