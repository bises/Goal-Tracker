import { extractDateOnly, formatLocalDate, getTodayString } from '@goal-tracker/shared';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { taskApi } from '../api';
import { Task } from '../types';

interface TaskContextType {
  /** Today's tasks only — used by dashboard widgets (TodayProgressCard, DailyFocusList). */
  tasks: Task[];
  loading: boolean;
  error: string | null;
  /** Lazy fetch of today's tasks — skips if already loaded. */
  fetchTasks: () => Promise<void>;
  /** Force re-fetch of today's tasks. */
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
    hasFetchedRef.current = true;
    try {
      const today = getTodayString();
      const data = await taskApi.fetchTasks({ date: today });
      setTasks(Array.isArray(data) ? data.filter((task) => task && task.id) : []);
    } catch (err) {
      hasFetchedRef.current = false;
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
    const today = getTodayString();
    const taskDate = task.scheduledDate ? extractDateOnly(task.scheduledDate) : undefined;
    const isForToday = taskDate === today;

    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      // Task moved away from today — remove it
      if (!isForToday) return prev.filter((t) => t.id !== task.id);
      // Task is for today — upsert
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
      const today = getTodayString();
      const isForToday = dateStr === today;
      // Optimistic: update if moving to today, remove if moving away
      setTasks((prev) =>
        isForToday
          ? prev.map((t) => (t.id === taskId ? { ...t, scheduledDate: dateStr ?? undefined } : t))
          : prev.filter((t) => t.id !== taskId)
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
      // Only add to dashboard list if it's scheduled for today
      const today = getTodayString();
      const taskDate = created.scheduledDate ? extractDateOnly(created.scheduledDate) : undefined;
      if (taskDate === today) {
        setTasks((prev) => [...prev, created]);
      }
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
