import React, { useState, useCallback } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useHunterStatus } from '@/hooks/useHunterStatus';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { MeterBar, SimpleCard, SystemShell } from '@/components/system-shell';
import { PressureMeter } from '@/components/pressure-meter';
import { COLORS } from '@/constants/design-tokens';

export default function StatusScreen() {
  const router = useRouter();
  const { profile, loading, refreshProfile } = useHunterStatus();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={COLORS.NEON_CYAN} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-8 gap-4">
        <Text className="text-center text-muted-foreground">Could not load profile.</Text>
        <Button onPress={refreshProfile}><Text className="text-primary-foreground">Retry</Text></Button>
        <Button variant="ghost" onPress={() => supabase.auth.signOut()}><Text>Sign out</Text></Button>
      </View>
    );
  }

  const currentLevelXP = Math.pow(profile.level, 2) * 100;
  const nextLevelXP = Math.pow(profile.level + 1, 2) * 100;
  const xpProgress = Math.min(100, Math.max(0, ((profile.total_xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));
  const pressure = profile.pressure_level || 0;
  const pressureColor = pressure >= 80 ? COLORS.NEON_RED : pressure >= 45 ? COLORS.NEON_GOLD : COLORS.NEON_CYAN;

  return (
    <SystemShell
      title="Profile"
      stateLabel={pressure >= 80 ? 'CRITICAL' : 'ONLINE'}
      stateColor={pressureColor}
      onSync={refreshProfile}
      onExit={() => supabase.auth.signOut()}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <SimpleCard>
        <View className="flex-row items-baseline justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Level {profile.level}</Text>
            <Text className="mt-1 text-sm text-muted-foreground">{profile.rank} · {profile.current_streak}d streak</Text>
          </View>
          <Text className="text-sm tabular-nums text-muted-foreground">
            {profile.total_xp.toLocaleString()} XP
          </Text>
        </View>
        <View className="mt-4 gap-1.5">
          <MeterBar value={Number.isNaN(xpProgress) ? 0 : xpProgress} color={COLORS.NEON_CYAN} />
          <Text className="text-xs text-muted-foreground">
            {Math.max(0, nextLevelXP - profile.total_xp).toLocaleString()} XP to level {profile.level + 1}
          </Text>
        </View>
      </SimpleCard>

      <SimpleCard>
        <PressureMeter pressure={pressure} stateColor={pressureColor} compact />
      </SimpleCard>

      <SimpleCard>
        <Text className="mb-3 text-sm text-muted-foreground">Stats</Text>
        <View className="flex-row justify-between">
          {[
            ['STR', profile.str],
            ['INT', profile.int],
            ['DEX', profile.dex],
            ['VIT', profile.vit],
            ['WIS', profile.wis],
          ].map(([label, value]) => (
            <View key={label} className="items-center">
              <Text className="text-xs text-muted-foreground">{label}</Text>
              <Text className="mt-1 text-base font-semibold tabular-nums text-foreground">{value}</Text>
            </View>
          ))}
        </View>
      </SimpleCard>

      <TouchableOpacity onPress={() => router.push('/(tabs)/quests')} activeOpacity={0.7}>
        <SimpleCard className="items-center py-3">
          <Text className="text-sm font-medium text-primary">Go to quests →</Text>
        </SimpleCard>
      </TouchableOpacity>
    </SystemShell>
  );
}
