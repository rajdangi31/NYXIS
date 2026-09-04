import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HudLabel } from '@/components/layout/hud-label';
import { cn } from '@/lib/utils';

interface ScreenSectionProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function ScreenSection({ title, subtitle, action, children, className }: ScreenSectionProps) {
  return (
    <View className={cn('gap-3', className)}>
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1">
          <HudLabel>{title}</HudLabel>
          {subtitle ? (
            <Text className="mt-1 text-sm leading-5 text-secondary-foreground">{subtitle}</Text>
          ) : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
