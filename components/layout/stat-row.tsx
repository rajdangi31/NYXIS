import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HudLabel } from '@/components/layout/hud-label';
import { cn } from '@/lib/utils';

interface StatRowProps {
  label: string;
  value: string | number;
  progress?: number;
  color?: string;
  highlight?: boolean;
}

export function StatRow({ label, value, progress, color = '#00DBE9', highlight }: StatRowProps) {
  const pct = progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <View className={cn('gap-1.5', highlight && 'rounded-lg bg-primary/5 px-2 py-1.5 -mx-2')}>
      <View className="flex-row items-end justify-between">
        <HudLabel className={highlight ? 'text-primary' : undefined}>{label}</HudLabel>
        <Text className="font-mono text-data tabular-nums" style={highlight ? { color } : undefined}>
          {value}
        </Text>
      </View>
      {pct !== undefined && (
        <View className="h-0.5 overflow-hidden rounded-full bg-surface-high">
          <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </View>
      )}
    </View>
  );
}
