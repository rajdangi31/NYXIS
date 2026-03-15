// ─────────────────────────────────────────────
//  Supabase Client — platform-aware session storage
// ─────────────────────────────────────────────
//
//  On native (iOS/Android): use AsyncStorage so sessions survive restarts.
//  On web: leave storage undefined so Supabase falls back to localStorage,
//  which avoids the "window is not defined" SSR crash from AsyncStorage.

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Lazily import AsyncStorage only on native to avoid web SSR issues
const getStorage = () => {
  if (Platform.OS === 'web') return undefined;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@react-native-async-storage/async-storage').default;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:           getStorage(),
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
