// ─────────────────────────────────────────────
//  Tab Layout — The System navigation
// ─────────────────────────────────────────────

import React from 'react';
import { Tabs } from 'expo-router';
import { Shield, ScrollText, Trophy, Zap } from 'lucide-react-native';
import { Platform, View, StyleSheet } from 'react-native';

const NEON  = '#00E5FF';
const GREY  = '#333';
const BLACK = '#000';

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: typeof Shield;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Icon size={20} color={focused ? NEON : GREY} strokeWidth={focused ? 2 : 1.5} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#060606',
          borderTopColor: '#00E5FF22',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: NEON,
        tabBarInactiveTintColor: GREY,
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 8,
          letterSpacing: 1.5,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Zap} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="quests"
        options={{
          title: 'QUESTS',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ScrollText} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'STATUS',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Shield} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'RANKING',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Trophy} color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  iconWrapFocused: {
    backgroundColor: '#00E5FF11',
    shadowColor: NEON,
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});
