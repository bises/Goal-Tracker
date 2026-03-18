import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 px-6 pt-8">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Settings</Text>

        {/* Account Card */}
        <View className="mt-8 rounded-2xl bg-gray-50 p-5 dark:bg-gray-800">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">Account</Text>
          {isLoading ? (
            <ActivityIndicator className="mt-4" color="#FF8C42" />
          ) : isAuthenticated ? (
            <View className="mt-3">
              <View className="mb-3 flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Text className="text-xl font-bold text-orange-500">
                    {(user?.name ?? 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">
                    {user?.name ?? 'User'}
                  </Text>
                  <Text className="text-sm text-gray-400">{user?.email}</Text>
                </View>
              </View>
              <Pressable onPress={logout} className="mt-2 rounded-2xl bg-red-500 px-4 py-3">
                <Text className="text-center font-semibold text-white">Sign Out</Text>
              </Pressable>
            </View>
          ) : (
            <View className="mt-3">
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to sync your goals and tasks
              </Text>
              <Pressable onPress={login} className="mt-4 rounded-2xl bg-orange-500 px-4 py-3">
                <Text className="text-center font-semibold text-white">Sign In</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* App Info */}
        <View className="mt-4 rounded-2xl bg-gray-50 p-5 dark:bg-gray-800">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">About</Text>
          <View className="mt-3">
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500 dark:text-gray-400">Version</Text>
              <Text className="text-gray-900 dark:text-white">1.0.0</Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500 dark:text-gray-400">Platform</Text>
              <Text className="text-gray-900 dark:text-white">Expo SDK 55</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
