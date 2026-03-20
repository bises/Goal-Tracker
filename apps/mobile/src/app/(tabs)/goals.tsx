import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useGoalContext } from '@/contexts/GoalContext';
import type { Goal, GoalScope } from '@goal-tracker/shared';

const SCOPES: Array<{ label: string; value: GoalScope | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Yearly', value: 'YEARLY' },
  { label: 'Monthly', value: 'MONTHLY' },
  { label: 'Weekly', value: 'WEEKLY' },
  { label: 'Standalone', value: 'STANDALONE' },
];

const ScopeIcon = ({ scope }: { scope: GoalScope }) => {
  const icons: Record<string, string> = {
    YEARLY: '🎯',
    MONTHLY: '📅',
    WEEKLY: '📆',
    STANDALONE: '⭐',
  };
  return <Text className="text-lg">{icons[scope] ?? '◎'}</Text>;
};

const GoalCard = ({ goal }: { goal: Goal }) => {
  const percent = goal.progressSummary?.percentComplete ?? 0;
  const taskTotals = goal.progressSummary?.taskTotals;

  return (
    <View className="mb-3 rounded-2xl bg-gray-50 p-4 dark:bg-gray-800">
      <View className="flex-row items-center">
        <ScopeIcon scope={goal.scope} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {goal.title}
          </Text>
          {goal.description && (
            <Text className="mt-0.5 text-xs text-gray-400" numberOfLines={1}>
              {goal.description}
            </Text>
          )}
        </View>
        <Text className="ml-2 text-sm font-bold text-orange-500">{Math.round(percent)}%</Text>
      </View>

      {/* Progress Bar */}
      <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </View>

      {/* Stats Row */}
      <View className="mt-2 flex-row justify-between">
        {taskTotals && (
          <Text className="text-xs text-gray-400">
            {taskTotals.completedCount}/{taskTotals.totalCount} tasks
          </Text>
        )}
        {goal.parent && <Text className="text-xs text-gray-400">↳ {goal.parent.title}</Text>}
        {goal.children && goal.children.length > 0 && (
          <Text className="text-xs text-gray-400">{goal.children.length} sub-goals</Text>
        )}
      </View>
    </View>
  );
};

export default function GoalsScreen() {
  const { isAuthenticated } = useAuth();
  const { goals, loading, error, fetchGoals, refreshGoals } = useGoalContext();
  const [scopeFilter, setScopeFilter] = useState<GoalScope | 'ALL'>('ALL');

  useEffect(() => {
    if (isAuthenticated) {
      fetchGoals();
    }
  }, [isAuthenticated, fetchGoals]);

  const filteredGoals = useMemo(() => {
    const active = goals.filter((g) => !g.isMarkedComplete);
    if (scopeFilter === 'ALL') return active;
    return active.filter((g) => g.scope === scopeFilter);
  }, [goals, scopeFilter]);

  const scopeCounts = useMemo(() => {
    const active = goals.filter((g) => !g.isMarkedComplete);
    const counts: Record<string, number> = { ALL: active.length };
    for (const g of active) {
      counts[g.scope] = (counts[g.scope] ?? 0) + 1;
    }
    return counts;
  }, [goals]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="text-gray-500">Sign in to view goals</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Goals</Text>

        {/* Scope Filter Chips */}
        <FlatList
          horizontal
          data={SCOPES}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          renderItem={({ item }) => {
            const isActive = scopeFilter === item.value;
            const count = scopeCounts[item.value] ?? 0;
            return (
              <Pressable
                onPress={() => setScopeFilter(item.value)}
                className={`mr-2 rounded-2xl px-4 py-2 ${
                  isActive ? 'bg-orange-500' : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {item.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {error && (
        <View className="mx-6 mt-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {loading && goals.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      ) : (
        <FlatList
          data={filteredGoals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshGoals} />}
          renderItem={({ item }) => <GoalCard goal={item} />}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-400">
              No {scopeFilter === 'ALL' ? '' : scopeFilter.toLowerCase()} goals
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
