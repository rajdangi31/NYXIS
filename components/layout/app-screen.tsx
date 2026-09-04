import React from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParticleField } from '@/components/particle-field';
import { cn } from '@/lib/utils';

interface AppScreenProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  className?: string;
  contentClassName?: string;
}

export function AppScreen({
  children,
  header,
  scroll = true,
  refreshing,
  onRefresh,
  className,
  contentClassName,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const refreshControl =
    onRefresh !== undefined ? (
      <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#00DBE9" colors={['#00DBE9']} />
    ) : undefined;

  const content = (
    <View
      className={cn('mx-auto w-full max-w-[480px] gap-5 px-4 pb-24 pt-3', contentClassName)}
      style={!header ? { paddingTop: Math.max(insets.top, 12) } : undefined}
    >
      {children}
    </View>
  );

  return (
    <View className={cn('flex-1 bg-background', className)}>
      <ParticleField />
      {header}
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl} contentContainerStyle={{ flexGrow: 1 }}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}
