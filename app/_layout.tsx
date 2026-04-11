import { StatusBar } from 'expo-status-bar';
import { useRouter, useSegments, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === 'auth';

    if (session && inAuthGroup) {
      router.replace('/(tabs)/status');
    } else if (!session && !inAuthGroup) {
      router.replace('/auth');
    }
  }, [session, initialized, segments, router]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="level-up" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="boss-trial" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
    </>
  );
}