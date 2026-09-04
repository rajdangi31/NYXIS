import React from 'react';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface HudLabelProps {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}

export function HudLabel({ children, className, accent }: HudLabelProps) {
  return (
    <Text
      className={cn(
        'font-mono text-hud uppercase tracking-widest',
        accent ? 'text-primary' : 'text-muted-foreground',
        className
      )}
    >
      {children}
    </Text>
  );
}
