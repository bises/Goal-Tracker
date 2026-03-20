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
        setTasks(result.tasks);
        setHasFetched(true);
      } catch (e: unknown) {
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
      const result = await tasksApi.fetchTasks({ status: 'pending' });
      setTasks(result.tasks);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTodayTasks = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await tasksApi.getScheduledTasks(today);
      setTodayTasks(result);
    } catch (e: unknown) {
      console.error('Failed to fetch today tasks:', e);
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
