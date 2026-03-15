// ─────────────────────────────────────────────
//  The System — useRecalibration hook
//  • Automated Weekly Audits (runs every 7 completions)
// ─────────────────────────────────────────────

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { recalibrateRemainingQuests } from '../lib/architect';
import * as Haptics from 'expo-haptics';

export function useRecalibration() {
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [systemLinkedToastVisible, setSystemLinkedToastVisible] = useState(false);

  /**
   * Evaluates if a Path is eligible for Recalibration.
   * Logic: If a path has a multiple of 7 completed quests, or forceTrigger is true, run recalibration.
   */
  const evaluatePathForRecalibration = useCallback(async (pathId: string, forceTrigger: boolean = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // 1. Count completed quests
      const { count, error: countError } = await supabase
        .from('quests')
        .select('*', { count: 'exact', head: true })
        .eq('path_id', pathId)
        .eq('status', 'COMPLETED');

      if (countError) throw countError;
      
      const totalCompleted = count || 0;
      
      // If we haven't hit a multiple of 7 (and aren't forcing the audit), skip.
      if (!forceTrigger && (totalCompleted === 0 || totalCompleted % 7 !== 0)) {
        return false;
      }

      // 2. We hit the threshold! Trigger Recalibration UI.
      setIsRecalibrating(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      // Fetch required data
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: pathData } = await supabase.from('paths').select('goal_text').eq('id', pathId).single();
      
      if (!profile || !pathData) {
        setIsRecalibrating(false);
        return false;
      }

      // Fetch recent history
      const { data: recent } = await supabase
        .from('quests')
        .select('quest_type, stat_focus, status')
        .eq('path_id', pathId)
        .in('status', ['COMPLETED', 'FAILED'])
        .order('updated_at', { ascending: false })
        .limit(7);

      const completed = recent?.filter(q => q.status === 'COMPLETED').length || 0;
      const failed = recent?.filter(q => q.status === 'FAILED').length || 0;
      
      // Architect Prompt
      const perfContext = `User recently completed ${completed} quests but failed ${failed}. The player has triggered an Audit. Analyze their success ratio. If failures > 0, generate easy "Sub-quests" focused on their failing stats to rebuild momentum. If completions > 0 and failures = 0, ruthlessly increase xp_gain and task difficulty to punish their arrogance.`;

      // Trigger Edge Function
      await recalibrateRemainingQuests(pathData.goal_text, profile, pathId, perfContext);
      
      setIsRecalibrating(false);
      
      // If 100% success rate, trigger the "System Linked" toast matching the Neon Blue aesthetic
      if (completed > 0 && failed === 0) {
        setSystemLinkedToastVisible(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Auto-hide toast after 4 seconds
        setTimeout(() => {
          setSystemLinkedToastVisible(false);
        }, 4000);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return true;

    } catch (err: any) {
      console.error('[useRecalibration] Error during audit:', err.message);
      setIsRecalibrating(false);
      return false;
    }
  }, []);

  return { evaluatePathForRecalibration, isRecalibrating, systemLinkedToastVisible, setSystemLinkedToastVisible };
}
