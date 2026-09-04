import React from 'react';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { SimpleCard } from '@/components/system-shell';

interface ArchitectModalProps {
  message: string;
  onAcknowledge: () => void;
}

export const ArchitectModal: React.FC<ArchitectModalProps> = ({ message, onAcknowledge }) => {
  return (
    <SimpleCard className="gap-3 border-destructive/30">
      <Text className="text-sm font-medium text-foreground">{message}</Text>
      <Button variant="outline" onPress={onAcknowledge} className="rounded-lg">
        <Text>Got it</Text>
      </Button>
    </SimpleCard>
  );
};
