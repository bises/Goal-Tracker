import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addGoal: (goal: Goal) => void;
  refreshGoals: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
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

  // Auto-fetch goals on mount
  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // Revert cache on error
        await fetchGoals();
        throw err;
      }
    },
    [fetchGoals]
  );

  const deleteGoal = useCallback(
    async (goalId: string) => {
      // Optimistically remove from cache
      setGoals((prev) => prev.filter((g) => g.id !== goalId));

      try {
        await api.deleteGoal(goalId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete goal');
        // Revert on error
        await fetchGoals();
        throw err;
      }
    },
    [fetchGoals]
  );

  const refreshGoals = useCallback(async () => {
    // Force refresh from API
    await fetchGoals();
  }, [fetchGoals]);

  const value: GoalContextType = {
    goals,
    loading,
    error,
    fetchGoals,
    updateGoal,
    deleteGoal,
    addGoal,
    refreshGoals,
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
