import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="mb-1 gap-1">
      <Text className="text-2xl font-bold tracking-tight text-foreground">{title}</Text>
      {subtitle ? <Text className="text-sm leading-5 text-muted-foreground">{subtitle}</Text> : null}
    </View>
  );
}
