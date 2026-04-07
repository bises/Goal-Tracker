import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { taskApi } from '../../api';
import { TaskProvider, useTaskContext } from '../../contexts/TaskContext';
import { Task } from '../../types';

// Mock shared utilities so upsertTask treats the mock task's date as today
vi.mock('@goal-tracker/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@goal-tracker/shared')>();
  return {
    ...actual,
    getTodayString: vi.fn(() => '2024-01-15'),
  };
});

// Mock the API
vi.mock('../../api', () => ({
  taskApi: {
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    scheduleTask: vi.fn(),
    toggleComplete: vi.fn(),
  },
}));

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  size: 1,
  isCompleted: false,
  scheduledDate: '2024-01-15',
  priority: 'MEDIUM',
  category: 'WORK',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('TaskContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide task context', () => {
    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    expect(result.current).toBeDefined();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('should fetch tasks on first fetchTasks call (lazy)', async () => {
    vi.mocked(taskApi.fetchTasks).mockResolvedValue([mockTask]);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    expect(taskApi.fetchTasks).toHaveBeenCalledTimes(1);
    expect(result.current.tasks[0].title).toBe('Test Task');
  });

  it('should skip fetchTasks if tasks already loaded (lazy guard)', async () => {
    vi.mocked(taskApi.fetchTasks).mockResolvedValue([mockTask]);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    // First call - should fetch
    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Second call - should skip (lazy)
    await act(async () => {
      await result.current.fetchTasks();
    });

    // Should still only be called once
    expect(taskApi.fetchTasks).toHaveBeenCalledTimes(1);
  });

  it('should force fetch on refreshTasks regardless of cache', async () => {
    vi.mocked(taskApi.fetchTasks)
      .mockResolvedValueOnce([mockTask])
      .mockResolvedValueOnce([mockTask, { ...mockTask, id: '2', title: 'Task 2' }]);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    // Initial fetch
    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Force refresh - should always hit API
    await act(async () => {
      await result.current.refreshTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });

    expect(taskApi.fetchTasks).toHaveBeenCalledTimes(2);
  });

  it('should create a new task', async () => {
    const newTask = { ...mockTask, id: '2', title: 'New Task' };
    vi.mocked(taskApi.createTask).mockResolvedValue(newTask);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    await act(async () => {
      const created = await result.current.createTask({
        title: 'New Task',
        description: 'New Description',
      });
      expect(created.id).toBe('2');
    });
  });

  it('should update an existing task', async () => {
    const updatedTask = { ...mockTask, title: 'Updated Task' };
    vi.mocked(taskApi.fetchTasks).mockResolvedValue([mockTask]);
    vi.mocked(taskApi.updateTask).mockResolvedValue(updatedTask);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    // Load initial tasks
    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Update task
    await act(async () => {
      await result.current.updateTaskFields('1', { title: 'Updated Task' });
    });

    await waitFor(() => {
      expect(result.current.tasks[0].title).toBe('Updated Task');
    });
  });

  it('should delete a task', async () => {
    vi.mocked(taskApi.fetchTasks).mockResolvedValue([mockTask]);
    vi.mocked(taskApi.deleteTask).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    // Load initial tasks
    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(1);
    });

    // Delete task
    await act(async () => {
      await result.current.deleteTask('1');
    });

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(0);
    });
  });

  it('should toggle task completion', async () => {
    const completedTask = { ...mockTask, isCompleted: true };
    vi.mocked(taskApi.fetchTasks).mockResolvedValue([mockTask]);
    vi.mocked(taskApi.toggleComplete).mockResolvedValue(completedTask);

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    // Load initial tasks
    await act(async () => {
      await result.current.fetchTasks();
    });

    // Toggle completion
    await act(async () => {
      await result.current.toggleComplete('1');
    });

    await waitFor(() => {
      expect(result.current.tasks[0].isCompleted).toBe(true);
    });
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(taskApi.fetchTasks).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });

    await act(async () => {
      await result.current.fetchTasks();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });
  });
});
