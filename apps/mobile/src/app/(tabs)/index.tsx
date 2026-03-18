import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </Text>
        <Text className="mt-2 text-center text-gray-500 dark:text-gray-400">
          Your goals and tasks at a glance
        </Text>
      </View>
    </SafeAreaView>
  );
}
