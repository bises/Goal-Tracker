import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";

export default function SettingsScreen() {
  const { isAuthenticated, user, login, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </Text>

        <View className="mt-8 rounded-2xl bg-gray-100 p-4 dark:bg-gray-800">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Account
          </Text>
          {isAuthenticated ? (
            <View className="mt-3">
              <Text className="text-gray-600 dark:text-gray-300">
                {user?.name ?? "User"}
              </Text>
              <Text className="text-sm text-gray-400">{user?.email}</Text>
              <TouchableOpacity
                onPress={logout}
                className="mt-4 rounded-2xl bg-red-500 px-4 py-3"
              >
                <Text className="text-center font-semibold text-white">
                  Sign Out
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={login}
              className="mt-4 rounded-2xl bg-orange-500 px-4 py-3"
            >
              <Text className="text-center font-semibold text-white">
                Sign In
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
