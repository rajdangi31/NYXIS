// ─────────────────────────────────────────────
//  The System — usePaths hook
//  Manages active paths (long-term goals)
// ─────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Path, Profile } from '../lib/database.types';

export interface PathWithMeta extends Path {
  goal_text: string;
  progress_pct: number;
  last_daily_refresh: string | null;
}

interface UsePathsReturn {
  activePath: PathWithMeta | null;
  allPaths: PathWithMeta[];
  loading: boolean;
  refreshPaths: () => Promise<void>;
  needsDailyRefresh: boolean;
  triggerDailyRefresh: (profile: Profile) => Promise<void>;
}

export function usePaths(): UsePathsReturn {
  const [allPaths, setAllPaths] = useState<PathWithMeta[]>([]);
  const [loading, setLoading]   = useState(true);

  const fetchPaths = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAllPaths([]); return; }

      const { data, error } = await supabase
        .from('paths')
        .select('*')
        .eq('player_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllPaths((data ?? []) as PathWithMeta[]);
    } catch (err: any) {
      console.warn('[usePaths] fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaths();

    const channel = supabase
      .channel('paths_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'paths' }, fetchPaths)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPaths]);

  const activePath = allPaths[0] ?? null;

  // Check if we need fresh daily quests (last refresh wasn't today)
  const today = new Date().toISOString().slice(0, 10);
  const needsDailyRefresh =
    !!activePath && activePath.last_daily_refresh !== today;

  const triggerDailyRefresh = useCallback(async (profile: Profile) => {
    if (!activePath) return;
    try {
      const { error } = await supabase.functions.invoke('generate-quests', {
        body: { action: 'daily_refresh', profile, pathId: activePath.id },
      });
      if (error) throw new Error(error.message);
      await fetchPaths(); // refresh to update last_daily_refresh
    } catch (err: any) {
      console.warn('[usePaths] daily refresh error:', err.message);
    }
  }, [activePath, fetchPaths]);

  return {
    activePath,
    allPaths,
    loading,
    refreshPaths: fetchPaths,
    needsDailyRefresh,
    triggerDailyRefresh,
  };
}
