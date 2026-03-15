import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

interface SystemLinkedToastProps {
  visible: boolean;
}

export function SystemLinkedToast({ visible }: SystemLinkedToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 50, // slide down to 50px from top
        useNativeDriver: true,
        damping: 14,
        stiffness: 100,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.toastBox}>
        <ShieldCheck size={20} color="#00E5FF" />
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>SYSTEM LINKED</Text>
          <Text style={styles.subText}>100% Success Ratio. Difficulty Increased.</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    bottom: undefined,
    height: 80,
    zIndex: 99999, // Ensure it's above all Recalibration overlays and headers
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2A2E',
    borderWidth: 1,
    borderColor: '#00E5FF55',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.6,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    gap: 12,
  },
  textContainer: {
    flexDirection: 'column',
  },
  titleText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subText: {
    color: '#00E5FF',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1,
    opacity: 0.8,
    marginTop: 2,
  },
});
