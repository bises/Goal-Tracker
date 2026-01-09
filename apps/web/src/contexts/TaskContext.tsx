import React, { createContext, useContext, useState, useCallback } from 'react';
import { Task } from '../types';
import { taskApi } from '../api';

interface TaskContextType {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    fetchTasks: () => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (taskId: string) => Promise<void>;
    scheduleTask: (taskId: string, date: Date | null) => Promise<void>;
    addTask: (task: Task) => void;
    refreshTasks: () => Promise<void>;
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
            setTasks(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
            console.error('Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const addTask = useCallback((task: Task) => {
        setTasks(prev => [...prev, task]);
    }, []);

    const updateTask = useCallback(async (updatedTask: Task) => {
        // Optimistically update local cache
        setTasks(prev =>
            prev.map(t => t.id === updatedTask.id ? updatedTask : t)
        );
        
        // Sync with API
        try {
            await taskApi.updateTask(updatedTask.id, updatedTask);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update task');
            // Revert cache on error
            await fetchTasks();
            throw err;
        }
    }, [fetchTasks]);

    const deleteTask = useCallback(async (taskId: string) => {
        // Optimistically remove from cache
        setTasks(prev => prev.filter(t => t.id !== taskId));
        
        try {
            await taskApi.deleteTask(taskId);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete task');
            // Revert on error
            await fetchTasks();
            throw err;
        }
    }, [fetchTasks]);

    const scheduleTask = useCallback(async (taskId: string, date: Date | null) => {
        // Optimistically update cache
        setTasks(prev =>
            prev.map(t =>
                t.id === taskId
                    ? { ...t, scheduledDate: date ? date.toISOString() : null }
                    : t
            )
        );

        try {
            await taskApi.scheduleTask(taskId, date);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to schedule task');
            // Revert on error
            await fetchTasks();
            throw err;
        }
    }, [fetchTasks]);

    const refreshTasks = useCallback(async () => {
        // Force refresh from API
        await fetchTasks();
    }, [fetchTasks]);

    const value: TaskContextType = {
        tasks,
        loading,
        error,
        fetchTasks,
        updateTask,
        deleteTask,
        scheduleTask,
        addTask,
        refreshTasks,
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTaskContext() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
}
