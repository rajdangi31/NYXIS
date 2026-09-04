import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import type { AuthError, Session } from '@supabase/supabase-js';

// Expo Router web SSR runs in Node; `localStorage` may exist but not behave like real Storage (e.g. Node 25).
const webAuthMemory = new Map<string, string>();
const AUTH_STORAGE_KEY = 'nyxis-auth-v1';

function getBrowserLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const ls = window.localStorage;
    if (
      !ls ||
      typeof ls.getItem !== 'function' ||
      typeof ls.setItem !== 'function' ||
      typeof ls.removeItem !== 'function'
    ) {
      return null;
    }
    const probe = '__nyxis_ls_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

// Platform-aware storage adapter
const SystemStorageAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      const ls = getBrowserLocalStorage();
      if (ls) return ls.getItem(key);
      return webAuthMemory.get(key) ?? null;
    }

    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      const ls = getBrowserLocalStorage();
      if (ls) ls.setItem(key, value);
      else webAuthMemory.set(key, value);
      return;
    }

    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      const ls = getBrowserLocalStorage();
      if (ls) ls.removeItem(key);
      else webAuthMemory.delete(key);
      return;
    }

    await AsyncStorage.removeItem(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SystemStorageAdapter,
    storageKey: AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function getAuthStorageKeys(): string[] {
  const keys = [AUTH_STORAGE_KEY];
  const projectRef = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1];
  if (projectRef) keys.push(`sb-${projectRef}-auth-token`);
  return Array.from(new Set(keys));
}

export function isInvalidRefreshTokenError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /invalid refresh token|refresh token not found/i.test(message);
}

export async function clearStoredAuthSession(): Promise<void> {
  await Promise.all(getAuthStorageKeys().map((key) => SystemStorageAdapter.removeItem(key)));
  supabase.auth.stopAutoRefresh();
}

export async function getSafeSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    if (isInvalidRefreshTokenError(error)) {
      await clearStoredAuthSession();
    }
    return { session: null, error };
  }

  return { session: data.session, error: null };
}
