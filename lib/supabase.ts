import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Platform-aware storage adapter
const SystemStorageAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem(key);
    }
    
    return SecureStore.isAvailableAsync().then((isAvailable) => {
      if (isAvailable) {
        return SecureStore.getItemAsync(key);
      }
      return null;
    });
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
      return;
    }
    
    SecureStore.isAvailableAsync().then((isAvailable) => {
      if (isAvailable) {
        return SecureStore.setItemAsync(key, value);
      }
    });
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      return;
    }
    
    SecureStore.isAvailableAsync().then((isAvailable) => {
      if (isAvailable) {
        return SecureStore.deleteItemAsync(key);
      }
    });
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SystemStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});