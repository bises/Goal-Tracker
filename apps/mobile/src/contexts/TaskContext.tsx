import { tasksApi } from '@/lib/api';
import type { Task } from '@goal-tracker/shared';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (params?: Record<string, string>) => Promise<void>;
  refreshTasks: () => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  todayTasks: Task[];
  fetchTodayTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchTasks = useCallback(
    async (params?: Record<string, string>) => {
      if (hasFetched && !params) return;
      setLoading(true);
      setError(null);
      try {
        const result = await tasksApi.fetchTasks(params);
        console.log('[TaskContext] fetchTasks result:', result);
        console.log('[TaskContext] tasks array:', result?.tasks);
        console.log('[TaskContext] tasks count:', result?.tasks?.length);
        setTasks(result.tasks || []);
        setHasFetched(true);
      } catch (e: unknown) {
        console.error('[TaskContext] fetchTasks error:', e);
        setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    },
    [hasFetched]
  );

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await tasksApi.fetchTasks({ status: 'pending', page: '1', limit: '50' });
      console.log('[TaskContext] refreshTasks result:', result);
      setTasks(result.tasks || []);
    } catch (e: unknown) {
      console.error('[TaskContext] refreshTasks error:', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayTasks = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('[TaskContext] Fetching tasks for date:', today);
      const result = await tasksApi.getScheduledTasks(today);
      console.log('[TaskContext] API response:', JSON.stringify(result, null, 2));
      console.log('[TaskContext] Result type:', typeof result, 'isArray:', Array.isArray(result));

      if (Array.isArray(result)) {
        console.log('[TaskContext] Fetched', result.length, 'tasks for today');
        setTodayTasks(result);
      } else {
        console.error('[TaskContext] Unexpected response format:', result);
        setTodayTasks([]);
      }
    } catch (e: unknown) {
      console.error('[TaskContext] Failed to fetch today tasks:', e);
      if (e instanceof Error) {
        console.error('[TaskContext] Error message:', e.message);
        console.error('[TaskContext] Error stack:', e.stack);
      }
    }
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    try {
      const updated = await tasksApi.toggleComplete(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setTodayTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to toggle task');
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        fetchTasks,
        refreshTasks,
        toggleComplete,
        todayTasks,
        fetchTodayTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTaskContext = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
