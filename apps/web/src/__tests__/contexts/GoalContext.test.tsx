import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiModule from '../../api';
import { GoalProvider, useGoalContext } from '../../contexts/GoalContext';
import { Goal } from '../../types';

// Mock the API module
vi.mock('../../api', () => ({
  api: {
    fetchGoals: vi.fn(),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
  },
}));

const mockGoal: Goal = {
  id: '1',
  title: 'Test Goal',
  description: 'Test Goal Description',
  type: 'TOTAL_TARGET',
  targetValue: 100,
  currentValue: 0,
  scope: 'YEARLY',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  progress: [],
};

describe('GoalContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide goal context', () => {
    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    expect(result.current).toBeDefined();
    expect(result.current.goals).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch goals on first fetchGoals call (lazy)', async () => {
    vi.mocked(apiModule.api.fetchGoals).mockResolvedValue([mockGoal]);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    expect(apiModule.api.fetchGoals).toHaveBeenCalledTimes(1);
    expect(result.current.goals[0].title).toBe('Test Goal');
  });

  it('should skip fetchGoals if goals already loaded (lazy guard)', async () => {
    vi.mocked(apiModule.api.fetchGoals).mockResolvedValue([mockGoal]);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    // First call - should fetch
    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    // Second call - should skip (lazy)
    await act(async () => {
      await result.current.fetchGoals();
    });

    // Should still only be called once
    expect(apiModule.api.fetchGoals).toHaveBeenCalledTimes(1);
  });

  it('should force fetch on refreshGoals regardless of cache', async () => {
    vi.mocked(apiModule.api.fetchGoals)
      .mockResolvedValueOnce([mockGoal])
      .mockResolvedValueOnce([mockGoal, { ...mockGoal, id: '2', title: 'Goal 2' }]);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    // Initial fetch
    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    // Force refresh - should always hit API
    await act(async () => {
      await result.current.refreshGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(2);
    });

    expect(apiModule.api.fetchGoals).toHaveBeenCalledTimes(2);
  });

  it('should create a goal and add to local state', async () => {
    const newGoal = { ...mockGoal, id: '2', title: 'New Goal' };
    vi.mocked(apiModule.api.createGoal).mockResolvedValue(newGoal);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    await act(async () => {
      await result.current.createGoal({ title: 'New Goal', type: 'TOTAL_TARGET', scope: 'YEARLY' });
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
      expect(result.current.goals[0].title).toBe('New Goal');
    });

    expect(apiModule.api.createGoal).toHaveBeenCalledTimes(1);
  });

  it('should update a goal with optimistic update', async () => {
    const updatedGoal = { ...mockGoal, title: 'Updated Goal' };
    vi.mocked(apiModule.api.fetchGoals).mockResolvedValue([mockGoal]);
    vi.mocked(apiModule.api.updateGoal).mockResolvedValue(updatedGoal);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    await act(async () => {
      await result.current.updateGoal('1', { title: 'Updated Goal' });
    });

    await waitFor(() => {
      expect(result.current.goals[0].title).toBe('Updated Goal');
    });

    expect(apiModule.api.updateGoal).toHaveBeenCalledWith('1', { title: 'Updated Goal' });
  });

  it('should delete a goal with optimistic removal', async () => {
    vi.mocked(apiModule.api.fetchGoals).mockResolvedValue([mockGoal]);
    vi.mocked(apiModule.api.deleteGoal).mockResolvedValue(undefined);

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteGoal('1');
    });

    await waitFor(() => {
      expect(result.current.goals).toHaveLength(0);
    });

    expect(apiModule.api.deleteGoal).toHaveBeenCalledWith('1');
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(apiModule.api.fetchGoals).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useGoalContext(), {
      wrapper: GoalProvider,
    });

    await act(async () => {
      await result.current.fetchGoals();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
