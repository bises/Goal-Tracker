import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTaskContext } from '@/contexts/TaskContext';
import type { Task } from '@goal-tracker/shared';

type StatusFilter = 'pending' | 'completed';

const PriorityDot = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  const color: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-yellow-500',
    LOW: 'bg-green-500',
  };
  return <View className={`mr-2 h-2.5 w-2.5 rounded-full ${color[priority] ?? 'bg-gray-400'}`} />;
};

const TaskItem = ({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) => (
  <Pressable
    onPress={() => onToggle(task.id)}
    className="mb-2 flex-row items-center rounded-2xl bg-gray-50 p-4 dark:bg-gray-800"
  >
    <View
      className={`mr-3 h-6 w-6 items-center justify-center rounded-full border-2 ${
        task.isCompleted ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'
      }`}
    >
      {task.isCompleted && <Text className="text-xs text-white">✓</Text>}
    </View>
    <View className="flex-1">
      <View className="flex-row items-center">
        <PriorityDot priority={task.priority} />
        <Text
          className={`flex-1 text-base ${
            task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'
          }`}
          numberOfLines={1}
        >
          {task.title}
        </Text>
      </View>
      <View className="mt-1 flex-row items-center">
        {task.category && <Text className="mr-2 text-xs text-gray-400">{task.category}</Text>}
        {task.scheduledDate && (
          <Text className="text-xs text-gray-400">
            {new Date(task.scheduledDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        )}
      </View>
      {task.goalTasks && task.goalTasks.length > 0 && (
        <View className="mt-1 flex-row flex-wrap">
          {task.goalTasks.map((gt) => (
            <Text
              key={gt.id}
              className="mr-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
            >
              {gt.goal?.title ?? 'Goal'}
            </Text>
          ))}
        </View>
      )}
    </View>
    <Text className="ml-2 text-xs text-gray-400">{task.size > 1 ? `×${task.size}` : ''}</Text>
  </Pressable>
);

export default function TasksScreen() {
  const { isAuthenticated } = useAuth();
  const { tasks, loading, error, fetchTasks, refreshTasks, toggleComplete } = useTaskContext();
  const [status, setStatus] = useState<StatusFilter>('pending');

  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks({ status, limit: '50' });
    }
  }, [isAuthenticated, status, fetchTasks]);

  const handleRefresh = useCallback(() => {
    refreshTasks();
  }, [refreshTasks]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
        <Text className="text-gray-500">Sign in to view tasks</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="px-6 pt-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</Text>

        {/* Status Filter */}
        <View className="mt-4 flex-row rounded-2xl bg-gray-100 p-1 dark:bg-gray-800">
          {(['pending', 'completed'] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              className={`flex-1 rounded-xl py-2 ${
                status === s ? 'bg-white shadow dark:bg-gray-700' : ''
              }`}
            >
              <Text
                className={`text-center text-sm font-medium capitalize ${
                  status === s ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                }`}
              >
                {s}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error && (
        <View className="mx-6 mt-2 rounded-xl bg-red-50 p-3 dark:bg-red-900/20">
          <Text className="text-sm text-red-600">{error}</Text>
        </View>
      )}

      {loading && tasks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF8C42" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} />}
          renderItem={({ item }) => <TaskItem task={item} onToggle={toggleComplete} />}
          ListEmptyComponent={
            <Text className="mt-8 text-center text-gray-400">No {status} tasks</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
