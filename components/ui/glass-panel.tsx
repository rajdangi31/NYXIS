import React from 'react';
import { View, type ViewProps } from 'react-native';
import { LiquidGlass, type GlassTint, type GlassVariant } from '@/components/liquid-glass';
import { cn } from '@/lib/utils';
import { RADIUS } from '@/constants/design-tokens';

interface GlassPanelProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  variant?: GlassVariant;
  tint?: GlassTint;
  interactive?: boolean;
  accent?: string;
  radius?: number;
  glassStyle?: ViewProps['style'];
}

export function GlassPanel({
  children,
  className,
  contentClassName,
  variant = 'default',
  tint = 'none',
  interactive = false,
  accent,
  radius = RADIUS.XL,
  glassStyle,
  style,
  ...props
}: GlassPanelProps) {
  return (
    <View className={cn('w-full', className)} style={style} {...props}>
      <LiquidGlass
        variant={variant}
        tint={tint}
        interactive={interactive}
        accent={accent}
        radius={radius}
        style={glassStyle}
        contentStyle={{ padding: 0 }}
      >
        <View className={cn('p-4', contentClassName)}>{children}</View>
      </LiquidGlass>
    </View>
  );
}
