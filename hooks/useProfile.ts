// ─────────────────────────────────────────────
//  The System — useProfile hook
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/database.types';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

/**
 * Fetches the authenticated user's profile row.
 * Subscribes to real-time changes so XP/level updates appear instantly.
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setProfile(getDemoProfile());
        return;
      }

      // Try to fetch the existing profile
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // PGRST116 = "no rows returned" — profile was never created (e.g. email
      // confirmation was enabled during sign-up). Create it now.
      if (fetchError && fetchError.code === 'PGRST116') {
        const emailPrefix = user.email?.split('@')[0] ?? 'Hunter';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id:           user.id,
            player_name:  emailPrefix,
            player_title: 'The Weakest',
            level:        1,
            rank:         'E',
            total_xp:     0,
            stats_str:    0,
            stats_int:    0,
            stats_vit:    0,
            stats_dex:    0,
            stats_wis:    0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setProfile(newProfile as Profile);
        return;
      }

      if (fetchError) throw fetchError;
      setProfile(data as Profile);
    } catch (err: any) {
      console.warn('[useProfile] Error fetching profile:', err.message);
      setError(err.message);
      setProfile(getDemoProfile());
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchProfile();

    // Real-time subscription on profiles table
    const channel = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfile]);

  return { profile, loading, error, refreshProfile: fetchProfile };
}

// ── Demo profile (used when Supabase is not yet configured) ──────────────────
function getDemoProfile(): Profile {
  return {
    id: 'demo-player-001',
    player_name: 'Hunter',
    player_title: 'The Weakest',
    level: 1,
    rank: 'E',
    total_xp: 0,
    stats_str: 0,
    stats_int: 0,
    stats_vit: 0,
    stats_dex: 0,
    stats_wis: 0,
  };
}
