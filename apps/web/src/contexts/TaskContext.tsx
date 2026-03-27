import { formatLocalDate } from '@goal-tracker/shared';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { taskApi } from '../api';
import { Task } from '../types';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  /** Lazy fetch — skips if tasks are already loaded. Use on page mount. */
  fetchTasks: () => Promise<void>;
  /** Force fetch — always hits the API. Use after mutations. */
  refreshTasks: () => Promise<void>;
  updateTaskFields: (id: string, updates: Partial<Task> & { goalIds?: string[] }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  scheduleTask: (taskId: string, date: Date | null) => Promise<void>;
  createTask: (payload: Partial<Task> & { goalIds?: string[] }) => Promise<Task>;
  toggleComplete: (id: string) => Promise<Task>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const refreshTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.fetchTasks();
      setTasks(Array.isArray(data) ? data.filter((task) => task && task.id) : []);
      hasFetchedRef.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Lazy — only fetches when tasks haven't been loaded yet. */
  const fetchTasks = useCallback(async () => {
    if (hasFetchedRef.current) return;
    await refreshTasks();
  }, [refreshTasks]);

  const upsertTask = useCallback((task: Task) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx === -1) return [...prev, task];
      const copy = [...prev];
      copy[idx] = task;
      return copy;
    });
  }, []);

  const updateTaskFields = useCallback(
    async (id: string, updates: Partial<Task> & { goalIds?: string[] }) => {
      // Optimistic update
      const snapshot = tasks;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      try {
        const saved = await taskApi.updateTask(id, updates);
        upsertTask(saved);
        return saved;
      } catch (err) {
        setTasks(snapshot);
        setError(err instanceof Error ? err.message : 'Failed to update task');
        throw err;
      }
    },
    [tasks, upsertTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const snapshot = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      try {
        await taskApi.deleteTask(taskId);
      } catch (err) {
        setTasks(snapshot);
        setError(err instanceof Error ? err.message : 'Failed to delete task');
        throw err;
      }
    },
    [tasks]
  );

  const scheduleTask = useCallback(
    async (taskId: string, date: Date | null) => {
      const dateStr = date ? formatLocalDate(date) : null;
      const snapshot = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, scheduledDate: dateStr ?? undefined } : t))
      );
      try {
        const saved = await taskApi.scheduleTask(taskId, dateStr);
        upsertTask(saved);
      } catch (err) {
        setTasks(snapshot);
        setError(err instanceof Error ? err.message : 'Failed to schedule task');
        throw err;
      }
    },
    [tasks, upsertTask]
  );

  const createTask = useCallback(async (payload: Partial<Task> & { goalIds?: string[] }) => {
    try {
      const created = await taskApi.createTask(payload);
      setTasks((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  }, []);

  const toggleComplete = useCallback(
    async (id: string) => {
      // Optimistic toggle
      const snapshot = tasks;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t))
      );
      try {
        const saved = await taskApi.toggleComplete(id);
        upsertTask(saved);
        return saved;
      } catch (err) {
        setTasks(snapshot);
        setError(err instanceof Error ? err.message : 'Failed to toggle task');
        throw err;
      }
    },
    [tasks, upsertTask]
  );

  const value = useMemo<TaskContextType>(
    () => ({
      tasks,
      loading,
      error,
      fetchTasks,
      refreshTasks,
      updateTaskFields,
      deleteTask,
      scheduleTask,
      createTask,
      toggleComplete,
    }),
    [
      tasks,
      loading,
      error,
      fetchTasks,
      refreshTasks,
      updateTaskFields,
      deleteTask,
      scheduleTask,
      createTask,
      toggleComplete,
    ]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
