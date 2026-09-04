import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LiquidGlass } from '@/components/liquid-glass';
import { COLORS, RADIUS } from '@/constants/design-tokens';

function TabBarBackground() {
  return (
    <LiquidGlass
      variant="bar"
      radius={RADIUS.XL}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 80 : 64,
          paddingBottom: Platform.OS === 'ios' ? 22 : 8,
          paddingTop: 8,
          marginHorizontal: 16,
          marginBottom: Platform.OS === 'ios' ? 14 : 10,
          borderRadius: RADIUS.XL,
          borderWidth: 1,
          borderColor: COLORS.BORDER_DEFAULT,
          overflow: 'hidden',
        },
        tabBarActiveTintColor: COLORS.NEON_CYAN,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="status"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              {focused && <View className="absolute h-9 w-9 rounded-full bg-primary/10" />}
              <MaterialCommunityIcons name="account-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              {focused && <View className="absolute h-9 w-9 rounded-full bg-primary/10" />}
              <MaterialCommunityIcons name="checkbox-marked-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
