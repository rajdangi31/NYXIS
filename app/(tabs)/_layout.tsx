import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '@/constants/design-tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.BG_PRIMARY,
          borderTopWidth: 1,
          borderTopColor: COLORS.BORDER_DEFAULT,
          height: 60,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.NEON_CYAN,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarLabelStyle: {
          fontFamily: TYPOGRAPHY.MONO,
          fontSize: TYPOGRAPHY.SIZE.SMALL,
          fontWeight: TYPOGRAPHY.WEIGHT.BLACK,
          letterSpacing: TYPOGRAPHY.SPACING.TIGHT,
        },
      }}
    >
      <Tabs.Screen
        name="status"
        options={{
          title: 'STATUS',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'DIRECTIVES',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-list-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}