// ─────────────────────────────────────────────
//  Root Layout — Session gating + System theme
// ─────────────────────────────────────────────

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useAuth } from '../hooks/useAuth';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// True OLED black system theme
const SystemTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background:   '#000000',
    card:         '#000000',
    border:       '#1E1E1E',
    primary:      '#00E5FF',
    text:         '#FFFFFF',
    notification: '#00E5FF',
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => { if (error) throw error; }, [error]);
  useEffect(() => { if (loaded) SplashScreen.hideAsync(); }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={SystemTheme}>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { session, loading } = useAuth();

  // Wait for session to be determined before redirecting
  useEffect(() => {
    if (loading) return;

    if (session) {
      // Authenticated — go to the main tabs
      router.replace('/(tabs)/status');
    } else {
      // Not authenticated — go to login
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
      <Stack.Screen name="(auth)"   options={{ headerShown: false }} />
      <Stack.Screen name="modal"    options={{ presentation: 'modal' }} />
    </Stack>
  );
}
