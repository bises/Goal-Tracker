import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#FF8C42",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
        headerStyle: {
          backgroundColor: "#1a1a2e",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabBarIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => <TabBarIcon name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color }) => <TabBarIcon name="check" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}

import { Text } from "react-native";

const ICONS: Record<string, string> = {
  grid: "▦",
  target: "◎",
  check: "✓",
  cog: "⚙",
};

const TabBarIcon = ({ name, color }: { name: string; color: string }) => (
  <Text style={{ color, fontSize: 20 }}>{ICONS[name] ?? "?"}</Text>
);
