// ─────────────────────────────────────────────
//  useAuth — session state + helpers
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UseAuthReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, playerName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    playerName: string
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Create profile row immediately after sign-up
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        player_name: playerName,
        player_title: 'The Weakest',
        level: 1,
        rank: 'E',
        total_xp: 0,
        stats_str: 0,
        stats_int: 0,
        stats_vit: 0,
        stats_dex: 0,
        stats_wis: 0,
      });
      if (profileError) {
        console.warn('[useAuth] Profile insert failed:', profileError.message);
      }
    }
    return { error: null };
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return {
    session,
    user: session?.user ?? null,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
