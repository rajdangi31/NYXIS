import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HunterProfile } from '@/lib/types';

export function useHunterStatus() {
  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      console.error("Auth session missing or error:", sessionError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error("Error fetching Hunter profile:", error);
    } else if (data) {
      setProfile(data as HunterProfile);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refreshProfile: fetchProfile };
}