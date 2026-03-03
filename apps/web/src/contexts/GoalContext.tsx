import React, { createContext, useCallback, useContext, useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  /** Lazy fetch — skips if goals are already loaded. Use on page mount. */
  fetchGoals: () => Promise<void>;
  /** Force fetch — always hits the API. Use after mutations. */
  refreshGoals: () => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addGoal: (goal: Goal) => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Lazy — only fetches when the goals array is empty (page mount guard). */
  const fetchGoals = useCallback(async () => {
    setGoals((current) => {
      if (current.length === 0) {
        doFetch();
      }
      return current;
    });
  }, [doFetch]);

  /** Force — always hits the API. Call after any mutation or on retry. */
  const refreshGoals = useCallback(async () => {
    await doFetch();
  }, [doFetch]);

  const addGoal = useCallback((goal: Goal) => {
    setGoals((prev) => [...prev, goal]);
  }, []);

  const updateGoal = useCallback(
    async (updatedGoal: Goal) => {
      // Optimistically update local cache
      setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));

      try {
        await api.updateGoal(updatedGoal.id, updatedGoal);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update goal');
        // Revert cache on error with a force refresh
        await doFetch();
        throw err;
      }
    },
    [doFetch]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      // Optimistically remove from cache
      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      try {
        await api.deleteGoal(goalId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete goal');
        // Revert on error with a force refresh
        await doFetch();
        throw err;
      }
    },
    [doFetch]
  );

  const value: GoalContextType = {
    goals,
    loading,
    error,
    fetchGoals,
    refreshGoals,
    updateGoal,
    deleteGoal,
    addGoal,
  };

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoalContext() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoalContext must be used within a GoalProvider');
  }
  return context;
}
