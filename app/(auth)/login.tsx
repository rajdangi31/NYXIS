// ─────────────────────────────────────────────
//  Login Screen — Sign In / Sign Up
// ─────────────────────────────────────────────

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ChevronRight, Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

const NEON = '#00E5FF';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode]           = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [playerName, setPlayerName] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Gentle shake animation for errors
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      shake();
      return;
    }
    if (mode === 'signup' && !playerName.trim()) {
      setErrorMsg('Enter your Hunter name.');
      shake();
      return;
    }

    setLoading(true);

    if (mode === 'signup') {
      const { error } = await signUp(email.trim(), password, playerName.trim());
      setLoading(false);
      if (error) {
        setErrorMsg(error);
        shake();
      } else {
        setSuccessMsg(
          'Account created! Check your email to confirm, then sign in.'
        );
      }
    } else {
      const { error } = await signIn(email.trim(), password);
      setLoading(false);
      if (error) {
        setErrorMsg('Invalid credentials. Try again.');
        shake();
      }
      // Navigation is handled automatically by the root layout session gate
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / Branding ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoRing}>
              <Shield size={40} color={NEON} />
            </View>
            <Text style={styles.appName}>NYXIS</Text>
            <Text style={styles.appSubtitle}>THE SYSTEM AWAITS</Text>
          </View>

          {/* ── Card ── */}
          <Animated.View
            style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}
          >
            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signin' && styles.modeBtnActive]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.modeBtnText, mode === 'signin' && styles.modeBtnTextActive]}>
                  SIGN IN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'signup' && styles.modeBtnActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.modeBtnText, mode === 'signup' && styles.modeBtnTextActive]}>
                  REGISTER
                </Text>
              </TouchableOpacity>
            </View>

            {/* Player name — signup only */}
            {mode === 'signup' && (
              <View style={styles.field}>
                <User size={14} color="#444" style={styles.fieldIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Hunter Name"
                  placeholderTextColor="#333"
                  value={playerName}
                  onChangeText={setPlayerName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Mail size={14} color="#444" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#333"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Lock size={14} color="#444" style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#333"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity onPress={() => setShowPass((s) => !s)} style={styles.eyeBtn}>
                {showPass
                  ? <EyeOff size={16} color="#444" />
                  : <Eye size={16} color="#444" />}
              </TouchableOpacity>
            </View>

            {/* Error / Success messages */}
            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {successMsg && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'ENTER THE SYSTEM' : 'AWAKEN'}
                  </Text>
                  <ChevronRight size={16} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Flavor text ── */}
          <Text style={styles.flavorText}>
            "I alone level up."
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 10,
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#00E5FF44',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5FF08',
    shadowColor: '#00E5FF',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  appName: {
    color: '#FFF',
    fontSize: 32,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    letterSpacing: 8,
  },
  appSubtitle: {
    color: '#00E5FF',
    fontSize: 10,
    fontFamily: 'SpaceMono',
    letterSpacing: 4,
  },
  card: {
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    gap: 14,
    shadowColor: '#00E5FF',
    shadowOpacity: 0.05,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    overflow: 'hidden',
    marginBottom: 4,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#00E5FF11',
    borderBottomWidth: 2,
    borderBottomColor: '#00E5FF',
  },
  modeBtnText: {
    color: '#333',
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 2,
  },
  modeBtnTextActive: {
    color: '#00E5FF',
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  fieldIcon: {
    // Positioned by gap
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  eyeBtn: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#FF444411',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF444444',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.5,
  },
  successBox: {
    backgroundColor: '#00E5FF11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00E5FF44',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  successText: {
    color: '#00E5FF',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
    lineHeight: 18,
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
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  submitBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'SpaceMono',
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  flavorText: {
    color: '#222',
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 32,
    fontStyle: 'italic',
  },
});
