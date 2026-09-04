import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { SimpleCard } from '@/components/system-shell';
import type { EvalData } from '@/lib/types';

interface EvalReportProps {
  data: EvalData;
  onAcknowledge: () => void;
}

export const EvalReport: React.FC<EvalReportProps> = ({ data, onAcknowledge }) => {
  return (
    <SimpleCard className="gap-3">
      <Text className="text-sm font-medium text-foreground">Weekly evaluation</Text>
      <View className="gap-2">
        <Row label="Success rate" value={`${data.success_rate}%`} />
        <Row label="Pressure change" value={data.pressure_delta > 0 ? `+${data.pressure_delta}%` : `${data.pressure_delta}%`} />
        <Row label="Focus" value={data.recommended_focus} />
      </View>
      {data.message ? <Text className="text-sm text-muted-foreground">{data.message}</Text> : null}
      <Button variant="outline" onPress={onAcknowledge} className="rounded-lg">
        <Text>Continue</Text>
      </Button>
    </SimpleCard>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
