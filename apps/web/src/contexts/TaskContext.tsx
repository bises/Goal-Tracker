import { formatLocalDate } from '@goal-tracker/shared';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { taskApi } from '../api';
import { Task } from '../types';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  updateTaskFields: (id: string, updates: Partial<Task> & { goalIds?: string[] }) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  scheduleTask: (taskId: string, date: Date | null) => Promise<void>;
  upsertTask: (task: Task) => void;
  createTask: (payload: Partial<Task> & { goalIds?: string[] }) => Promise<Task>;
  addTask: (task: Task) => void;
  refreshTasks: () => Promise<void>;
  toggleComplete: (id: string) => Promise<Task>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.fetchTasks();
      const validTasks = Array.isArray(data) ? data.filter((task) => task && task.id) : [];
      setTasks(validTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTask = useCallback((task: Task) => {
    if (!task || !task.id) {
      return;
    }
    setTasks((prev) => [...prev, task]);
  }, []);

  const upsertTask = useCallback((task: Task) => {
    if (!task || !task.id) {
      return;
    }
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t && t.id === task.id);
      if (idx === -1) return [...prev, task];
      const copy = [...prev];
      copy[idx] = task;
      return copy;
    });
  }, []);

  const updateTask = useCallback(
    async (updatedTask: Task) => {
      // Send to API and then upsert returned canonical task
      try {
        const saved = await taskApi.updateTask(updatedTask.id, updatedTask);
        upsertTask(saved);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update task');
        await fetchTasks();
        throw err;
      }
    },
    [fetchTasks, upsertTask]
  );

  const updateTaskFields = useCallback(
    async (id: string, updates: Partial<Task> & { goalIds?: string[] }) => {
      try {
        const saved = await taskApi.updateTask(id, updates);
        upsertTask(saved);
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update task');
        await fetchTasks();
        throw err;
      }
    },
    [fetchTasks, upsertTask]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      // Optimistically remove from cache
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        await taskApi.deleteTask(taskId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete task');
        // Revert on error
        await fetchTasks();
        throw err;
      }
    },
    [fetchTasks]
  );

  const scheduleTask = useCallback(
    async (taskId: string, date: Date | null) => {
      try {
        // Convert to YYYY-MM-DD string in local time
        const dateStr = date ? formatLocalDate(date) : null;
        const saved = await taskApi.scheduleTask(taskId, dateStr);
        upsertTask(saved);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to schedule task');
        await fetchTasks();
        throw err;
      }
    },
    [fetchTasks, upsertTask]
  );

  const refreshTasks = useCallback(async () => {
    // Force refresh from API
    await fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(
    async (payload: Partial<Task> & { goalIds?: string[] }) => {
      try {
        const created = await taskApi.createTask(payload);
        addTask(created);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create task');
        throw err;
      }
    },
    [addTask]
  );

  const toggleComplete = useCallback(
    async (id: string) => {
      try {
        const saved = await taskApi.toggleComplete(id);
        upsertTask(saved);
        return saved;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to toggle task');
        throw err;
      }
    },
    [upsertTask]
  );

  const value: TaskContextType = {
    tasks,
    loading,
    error,
    fetchTasks,
    updateTask,
    updateTaskFields,
    deleteTask,
    scheduleTask,
    upsertTask,
    createTask,
    addTask,
    refreshTasks,
    toggleComplete,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
