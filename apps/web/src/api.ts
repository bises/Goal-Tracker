import { Goal, Task } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type TaskPayload = Partial<Task> & { goalIds?: string[] };

export const api = {
    fetchGoals: async (): Promise<Goal[]> => {
        const res = await fetch(`${API_URL}/goals`);
        return res.json();
    },

    createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
        const res = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal),
        });
        return res.json();
    },

    updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
        const res = await fetch(`${API_URL}/goals/${goalId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        return res.json();
    },

    updateProgress: async (goalId: string, value: number, note?: string, customData?: string) => {
        const res = await fetch(`${API_URL}/goals/${goalId}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, note, date: new Date().toISOString(), customData }),
        });
        return res.json();
    },

    deleteGoal: async (goalId: string) => {
        await fetch(`${API_URL}/goals/${goalId}`, {
            method: 'DELETE',
        });
    },

    // Hierarchy endpoints
    getGoalTree: async () => {
        const res = await fetch(`${API_URL}/goals/tree`);
        return res.json();
    },

    getGoalsByScope: async (scope: string) => {
        const res = await fetch(`${API_URL}/goals/scope/${scope}`);
        return res.json();
    },

    bulkCreateTasks: async (parentId: string, tasks: Array<{ title: string; scheduledDate?: string; size?: number }>) => {
        const res = await fetch(`${API_URL}/goals/${parentId}/bulk-tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tasks }),
        });
        return res.json();
    },

    completeGoal: async (goalId: string) => {
        const res = await fetch(`${API_URL}/goals/${goalId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    uncompleteGoal: async (goalId: string) => {
        const res = await fetch(`${API_URL}/goals/${goalId}/uncomplete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },
};

export const taskApi = {
    fetchTasks: async (): Promise<Task[]> => {
        const res = await fetch(`${API_URL}/tasks`);
        return res.json();
    },

    createTask: async (task: TaskPayload): Promise<Task> => {
        const res = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task),
        });
        return res.json();
    },

    updateTask: async (id: string, updates: TaskPayload): Promise<Task> => {
        const res = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        return res.json();
    },

    deleteTask: async (id: string) => {
        await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE',
        });
    },

    toggleComplete: async (id: string): Promise<Task> => {
        const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        return res.json();
    },

    getScheduledTasks: async (date: string): Promise<Task[]> => {
        const res = await fetch(`${API_URL}/tasks/scheduled/${date}`);
        return res.json();
    },

    getUnscheduledTasks: async (): Promise<Task[]> => {
        const res = await fetch(`${API_URL}/tasks/unscheduled/list`);
        return res.json();
    },
};
