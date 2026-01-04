import { Goal } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

    updateProgress: async (goalId: string, value: number, note?: string) => {
        const res = await fetch(`${API_URL}/goals/${goalId}/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, note, date: new Date().toISOString() }),
        });
        return res.json();
    },

    deleteGoal: async (goalId: string) => {
        await fetch(`${API_URL}/goals/${goalId}`, {
            method: 'DELETE',
        });
    }
};
