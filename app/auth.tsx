import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, AppState, TextInput, TouchableOpacity, Text, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ScrambleText } from '@/components/ui/scramble-text';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';

const { height } = Dimensions.get('window');

AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formOpacity = useSharedValue(0);
  const splashTranslateY = useSharedValue(height / 2.5);

  useEffect(() => {
    splashTranslateY.value = withDelay(1500, withTiming(50, { duration: 800 }));
    formOpacity.value = withDelay(2000, withTiming(1, { duration: 800 }));
  }, [formOpacity, splashTranslateY]);

  const animatedForm = useAnimatedStyle(() => ({ opacity: formOpacity.value }));
  const animatedSplash = useAnimatedStyle(() => ({ transform: [{ translateY: splashTranslateY.value }] }));

  async function signInWithEmail() {
    if (!email || !password) return Alert.alert('SYSTEM ERROR', 'Credentials required.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('UPLINK FAILED', error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    if (!email || !password) return Alert.alert('SYSTEM ERROR', 'Credentials required for Registration.');
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('REGISTRATION FAILED', error.message);
    else if (!session) Alert.alert('SYSTEM MESSAGE', 'Verification protocols dispatched to your inbox.');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlow} />

      <Animated.View style={[styles.headerContainer, animatedSplash]}>
        <Text style={styles.systemTag}>{'NYXIS://OS_v2.0'}</Text>
        <Text style={styles.mainTitle}>
          <ScrambleText text="SYSTEM UPLINK" delay={200} speed={40} />
        </Text>
      </Animated.View>

      <Animated.View style={[styles.formContainer, animatedForm]}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{`// HUNTER_ID (EMAIL)`}</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.promptArrow}>{'>'}</Text>
            <TextInput
              style={styles.input}
              onChangeText={setEmail}
              value={email}
              placeholder="Awaiting input..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              selectionColor={COLORS.NEON_CYAN}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{`// AUTHORIZATION_KEY (PASSWORD)`}</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.promptArrow}>{'>'}</Text>
            <TextInput
              style={styles.input}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={true}
              placeholder="Awaiting input..."
              placeholderTextColor={COLORS.TEXT_MUTED}
              autoCapitalize="none"
              editable={!loading}
              selectionColor={COLORS.NEON_CYAN}
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}><ScrambleText text="AUTHENTICATING..." delay={0} speed={20} /></Text>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnAwaken} onPress={signInWithEmail}>
              <Text style={styles.btnTextAwaken}>[ AWAKEN ]</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnRegister} onPress={signUpWithEmail}>
              <Text style={styles.btnTextRegister}>[ REGISTER ]</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BG_VOID, padding: SPACING.XL },
  ambientGlow: { position: 'absolute', top: '30%', left: -50, width: 300, height: 300, backgroundColor: COLORS.alpha(COLORS.NEON_CYAN, 0.05), borderRadius: 150 },

  headerContainer: { alignItems: 'center', zIndex: 10 },
  systemTag: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.ULTRA, marginBottom: 10 },
  mainTitle: { color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.HERO, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE, textShadowColor: COLORS.NEON_CYAN, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15, textAlign: 'center' },

  formContainer: { marginTop: 60, width: '100%', zIndex: 10 },

  inputGroup: { marginBottom: 25 },
  label: { color: COLORS.TEXT_SECONDARY, fontSize: TYPOGRAPHY.SIZE.SMALL, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL, marginBottom: 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.BG_PRIMARY, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT, paddingHorizontal: 15 },
  promptArrow: { color: COLORS.NEON_CYAN, fontSize: TYPOGRAPHY.SIZE.HEADING, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, marginRight: 10 },
  input: { flex: 1, color: COLORS.TEXT_PRIMARY, fontSize: TYPOGRAPHY.SIZE.LARGE, fontFamily: TYPOGRAPHY.MONO, paddingVertical: 15 },

  actionRow: { marginTop: SPACING.XL, gap: 15 },

  btnAwaken: { backgroundColor: COLORS.NEON_CYAN, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.NEON_CYAN, shadowOffset: { width: 0, height: 0 }, shadowRadius: 15, shadowOpacity: 0.4 },
  btnTextAwaken: { color: COLORS.BG_PRIMARY, fontSize: TYPOGRAPHY.SIZE.MEDIUM, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.WIDE },

  btnRegister: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.alpha(COLORS.NEON_CYAN, 0.3), paddingVertical: 18, alignItems: 'center' },
  btnTextRegister: { color: COLORS.NEON_CYAN, fontSize: 11, fontWeight: TYPOGRAPHY.WEIGHT.HEAVY, letterSpacing: TYPOGRAPHY.SPACING.NORMAL },

  loadingBox: { marginTop: SPACING.XL, paddingVertical: 18, alignItems: 'center', backgroundColor: COLORS.BG_PRIMARY, borderWidth: 1, borderColor: COLORS.BORDER_DEFAULT },
  loadingText: { color: COLORS.NEON_GREEN, fontSize: TYPOGRAPHY.SIZE.BODY, fontWeight: TYPOGRAPHY.WEIGHT.BLACK, letterSpacing: TYPOGRAPHY.SPACING.ULTRA, fontFamily: TYPOGRAPHY.MONO },
});