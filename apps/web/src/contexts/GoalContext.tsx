import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  /** Lazy fetch — skips if goals are already loaded. Use on page mount. */
  fetchGoals: () => Promise<void>;
  /** Force fetch — always hits the API. Use after mutations or retry. */
  refreshGoals: () => Promise<void>;
  /** Create a goal via API and add to local state. */
  createGoal: (data: Partial<Goal>) => Promise<Goal>;
  /** Update a goal via API with optimistic local update. */
  updateGoal: (goalId: string, data: Partial<Goal>) => Promise<Goal>;
  /** Delete a goal via API with optimistic local removal. */
  deleteGoal: (goalId: string) => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export function GoalProvider({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const refreshGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    hasFetchedRef.current = true;
    try {
      const data = await api.fetchGoals();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      hasFetchedRef.current = false;
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGoals = useCallback(async () => {
    if (hasFetchedRef.current) return;
    await refreshGoals();
  }, [refreshGoals]);

  const createGoal = useCallback(async (data: Partial<Goal>): Promise<Goal> => {
    const created = await api.createGoal(data);
    setGoals((prev) => [...prev, created]);
    return created;
  }, []);

  const updateGoal = useCallback(
    async (goalId: string, data: Partial<Goal>): Promise<Goal> => {
      // Snapshot for rollback
      const snapshot = goals;
      // Optimistic update
      setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...data } : g)));
      try {
        const updated = await api.updateGoal(goalId, data);
        // Replace with server response
        setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
        return updated;
      } catch (err) {
        // Revert on failure
        setGoals(snapshot);
        throw err;
      }
    },
    [goals]
  );

  const deleteGoal = useCallback(
    async (goalId: string): Promise<void> => {
      const snapshot = goals;
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      try {
        await api.deleteGoal(goalId);
      } catch (err) {
        setGoals(snapshot);
        throw err;
      }
    },
    [goals]
  );

  const value = useMemo<GoalContextType>(
    () => ({ goals, loading, error, fetchGoals, refreshGoals, createGoal, updateGoal, deleteGoal }),
    [goals, loading, error, fetchGoals, refreshGoals, createGoal, updateGoal, deleteGoal]
  );

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoalContext() {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error('useGoalContext must be used within a GoalProvider');
  }
  return context;
}
