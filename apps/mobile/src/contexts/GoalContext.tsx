import { goalsApi } from '@/lib/api';
import type { Goal } from '@goal-tracker/shared';
import React, { createContext, useCallback, useContext, useState } from 'react';

interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  refreshGoals: () => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider = ({ children }: { children: React.ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchGoals = useCallback(async () => {
    if (hasFetched) return;
    setLoading(true);
    setError(null);
    try {
      const data = await goalsApi.fetchGoals();
      setGoals(data);
      setHasFetched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  const refreshGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await goalsApi.fetchGoals();
      setGoals(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <GoalContext.Provider
      value={{
        goals,
        loading,
        error,
        fetchGoals,
        refreshGoals,
      }}
    >
      {children}
    </GoalContext.Provider>
  );
};

export const useGoalContext = (): GoalContextType => {
  const context = useContext(GoalContext);
  if (!context) {
    throw new Error('useGoalContext must be used within a GoalProvider');
  }
  return context;
};
