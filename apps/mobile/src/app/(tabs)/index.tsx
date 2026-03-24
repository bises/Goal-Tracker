import { useEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useGoalContext } from '@/contexts/GoalContext';
import { useTaskContext } from '@/contexts/TaskContext';
import type { Goal, Task } from '@goal-tracker/shared';

const PriorityBadge = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  const colors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-green-100 text-green-700',
  };
  return (
    <Text className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[priority] ?? ''}`}>
      {priority}
    </Text>
  );
};

const TaskRow = ({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) => (
  <Pressable
    onPress={() => onToggle(task.id)}
    className="mb-2 flex-row items-center rounded-2xl bg-gray-50 p-3 dark:bg-gray-800"
  >
    <View
      className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
        task.isCompleted ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {task.isCompleted && <Text className="text-xs text-white">✓</Text>}
    </View>
    <View className="flex-1">
      <Text
        className={`text-base ${
          task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
        }`}
      >
        {task.title}
      </Text>
      {task.category && <Text className="text-xs text-gray-400">{task.category}</Text>}
    </View>
    <PriorityBadge priority={task.priority} />
  </Pressable>
);

const GoalCard = ({ goal }: { goal: Goal }) => {
  const percent = goal.progressSummary?.percentComplete ?? 0;
  return (
    <View className="mr-3 w-40 rounded-2xl bg-gray-50 p-3 dark:bg-gray-800">
      <Text className="text-xs font-medium text-orange-500">{goal.scope}</Text>
      <Text className="mt-1 text-sm font-semibold text-gray-900 dark:text-white" numberOfLines={2}>
        {goal.title}
      </Text>
      <View className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <View
          className="h-full rounded-full bg-orange-500"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </View>
      <Text className="mt-1 text-xs text-gray-400">{Math.round(percent)}%</Text>
    </View>
  );
};

export default function DashboardScreen() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  const { todayTasks, fetchTodayTasks } = useTaskContext();
  const { goals, fetchGoals } = useGoalContext();
  const { toggleComplete } = useTaskContext();

  useEffect(() => {
    if (isAuthenticated) {
      console.log('[Dashboard] Fetching data after login');
      fetchTodayTasks();
      fetchGoals();
    }
  }, [isAuthenticated, fetchTodayTasks, fetchGoals]);

  if (authLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#FF8C42" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6 dark:bg-gray-900">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Goal Tracker</Text>
        <Text className="mt-2 text-center text-gray-500 dark:text-gray-400">
          Sign in to see your dashboard
        </Text>
        <Pressable onPress={login} className="mt-6 rounded-2xl bg-orange-500 px-8 py-3">
          <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const completed = todayTasks.filter((t) => t.isCompleted).length;
  const total = todayTasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const activeGoals = goals.filter((g) => !g.isMarkedComplete);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchTodayTasks();
              fetchGoals();
            }}
          />
        }
        contentContainerStyle={{ padding: 24 }}
        ListHeaderComponent={
          <>
            <Text className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</Text>

            {/* Today's Progress */}
            <View className="mt-6 rounded-2xl bg-orange-50 p-4 dark:bg-orange-900/20">
              <Text className="text-sm font-medium text-orange-600 dark:text-orange-400">
                Today's Progress
              </Text>
              <View className="mt-2 flex-row items-end justify-between">
                <Text className="text-4xl font-bold text-gray-900 dark:text-white">{percent}%</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">
                  {completed}/{total} tasks
                </Text>
              </View>
              <View className="mt-3 h-3 overflow-hidden rounded-full bg-orange-200 dark:bg-orange-800">
                <View
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${percent}%` }}
                />
              </View>
            </View>

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <View className="mt-6">
                <Text className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                  Active Goals
                </Text>
                <FlatList
                  horizontal
                  data={activeGoals.slice(0, 5)}
                  keyExtractor={(item) => item.id}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => <GoalCard goal={item} />}
                />
              </View>
            )}

            {/* Today's Tasks Header */}
            <Text className="mb-3 mt-6 text-lg font-semibold text-gray-900 dark:text-white">
              Today's Tasks
            </Text>
            {total === 0 && (
              <Text className="text-center text-gray-400">No tasks scheduled for today</Text>
            )}
          </>
        }
        renderItem={({ item }) => <TaskRow task={item} onToggle={toggleComplete} />}
      />
    </SafeAreaView>
  );
}
