import '../global.css';

import { StatusBar } from 'expo-status-bar';
import { useRouter, useSegments, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PortalHost } from '@rn-primitives/portal';
import { getSafeSession, supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { getHunterContext } from '@/lib/system';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [contextChecked, setContextChecked] = useState(false);
  const [hasHunterContext, setHasHunterContext] = useState(false);
  const segments = useSegments();
  const activeSegment = segments[0];
  const router = useRouter();

  useEffect(() => {
    getSafeSession().then(({ session: s }) => {
      setSession(s);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(s);
      setContextChecked(false);
      setHasHunterContext(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    let isMounted = true;

    async function checkContext() {
      if (!session) {
        if (isMounted) {
          setHasHunterContext(false);
          setContextChecked(true);
        }
        return;
      }

      const result = await getHunterContext();
      if (isMounted) {
        setHasHunterContext(!!result.data);
        setContextChecked(true);
      }
    }

    checkContext();
    return () => {
      isMounted = false;
    };
  }, [session, initialized]);

  useEffect(() => {
    if (!initialized || !contextChecked) return;

    const inAuthGroup = activeSegment === 'auth';
    const inOnboarding = activeSegment === 'onboarding';

    if (session && inAuthGroup) {
      router.replace(hasHunterContext ? '/(tabs)/status' : '/onboarding');
    } else if (session && !hasHunterContext && !inOnboarding) {
      router.replace('/onboarding');
    } else if (session && hasHunterContext && inOnboarding) {
      router.replace('/(tabs)/status');
    } else if (!session && activeSegment && !inAuthGroup) {
      router.replace('/auth');
    }
  }, [session, initialized, contextChecked, hasHunterContext, activeSegment, router]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#0D0D0D' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="level-up" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="boss-trial" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <PortalHost />
    </View>
  );
}
