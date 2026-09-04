import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppScreen } from '@/components/layout/app-screen';
import { SimpleCard } from '@/components/system-shell';
import { cn } from '@/lib/utils';
import { COLORS } from '@/constants/design-tokens';

export default function Auth() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  async function signInWithEmail() {
    if (!email || !password) return Alert.alert('Missing details', 'Email and password are required.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Sign in failed', error.message);
  }

  async function signUpWithEmail() {
    if (!email || !password) return Alert.alert('Missing details', 'Email and password are required.');
    setLoading(true);
    const { data: { session }, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) Alert.alert('Registration failed', error.message);
    else if (!session) Alert.alert('Check your inbox', 'Verification was sent to your email.');
  }

  return (
    <AppScreen scroll={false} contentClassName="flex-1 justify-center">
      <KeyboardAvoidingView
        className="flex-1 justify-center"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <Text className="mb-6 text-2xl font-semibold text-foreground">NYXIS</Text>

          <SimpleCard className="gap-4">
            <View className="flex-row rounded-lg bg-secondary p-1">
              {(['signin', 'register'] as const).map((item) => (
                <TouchableOpacity
                  key={item}
                  className={cn('flex-1 items-center rounded-md py-2', mode === item && 'bg-primary')}
                  onPress={() => setMode(item)}
                  disabled={loading}
                >
                  <Text className={cn('text-sm font-medium', mode === item ? 'text-primary-foreground' : 'text-muted-foreground')}>
                    {item === 'signin' ? 'Sign in' : 'Register'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholderTextColor={COLORS.TEXT_DIM}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm text-muted-foreground">Password</Text>
              <Input
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                editable={!loading}
                onSubmitEditing={signInWithEmail}
                placeholderTextColor={COLORS.TEXT_DIM}
              />
            </View>

            <Button onPress={mode === 'signin' ? signInWithEmail : signUpWithEmail} disabled={loading} className="rounded-lg">
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="font-medium text-primary-foreground">
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </Button>
          </SimpleCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
