import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';
import { GlassPanel } from '@/components/ui/glass-panel';
import { AppScreen } from '@/components/layout/app-screen';
import { cn } from '@/lib/utils';
import { COLORS, RADIUS } from '@/constants/design-tokens';

interface SystemShellProps {
  title: string;
  stateLabel?: string;
  stateColor?: string;
  onSync?: () => void;
  onExit?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  children: React.ReactNode;
}

export function SystemShell({
  title,
  stateLabel,
  stateColor = COLORS.NEON_CYAN,
  onSync,
  onExit,
  refreshing,
  onRefresh,
  children,
}: SystemShellProps) {
  const insets = useSafeAreaInsets();

  const header = (
    <View style={{ paddingTop: insets.top }}>
      <GlassPanel variant="bar" radius={0} className="border-0" contentClassName="flex-row items-center justify-between px-4 py-3">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <View className="flex-row items-center gap-2">
          {stateLabel ? (
            <View className="flex-row items-center gap-1.5 rounded-full border border-border/60 bg-secondary/30 px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stateColor }} />
              <Text className="text-xs text-muted-foreground">{readableState(stateLabel)}</Text>
            </View>
          ) : null}
          {onSync && <HeaderButton icon="refresh" onPress={onSync} label="Sync" />}
          {onExit && <HeaderButton icon="logout" onPress={onExit} label="Sign out" />}
        </View>
      </GlassPanel>
    </View>
  );

  return (
    <AppScreen header={header} refreshing={refreshing} onRefresh={onRefresh}>
      {children}
    </AppScreen>
  );
}

function HeaderButton({
  icon,
  onPress,
  label,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  label: string;
}) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityLabel={label} hitSlop={8} className="p-1">
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.TEXT_MUTED} />
    </TouchableOpacity>
  );
}

/** Essential content block — liquid glass, minimal chrome */
export function SimpleCard({
  children,
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <GlassPanel
      variant="subtle"
      radius={RADIUS.LG}
      className={className}
      contentClassName={cn('gap-0 p-4', contentClassName)}
    >
      {children}
    </GlassPanel>
  );
}

export function MeterBar({ value, color = COLORS.NEON_CYAN }: { value: number; color?: string }) {
  const safe = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return (
    <View className="h-1 overflow-hidden rounded-full bg-secondary/80">
      <View className="h-full rounded-full" style={{ width: `${safe}%`, backgroundColor: color }} />
    </View>
  );
}

function readableState(label: string) {
  const map: Record<string, string> = {
    NORMAL: 'Stable',
    ONLINE: 'Stable',
    FOCUSED: 'Focus',
    PRESSURED: 'Strain',
    PENALTY: 'Penalty',
    TRIAL: 'Trial',
    SYSTEM_COLLAPSE: 'Collapse',
    CRITICAL: 'Critical',
  };
  return map[label] || label;
}
