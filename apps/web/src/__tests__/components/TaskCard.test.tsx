import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { taskApi } from '../../api';
import { TaskCard } from '../../components/TaskCard';
import { ToastProvider } from '../../contexts/ToastContext';
import { Task } from '../../types';

vi.mock('../../api', () => ({
  taskApi: {
    toggleComplete: vi.fn(),
    scheduleTask: vi.fn(),
    updateTask: vi.fn(),
    unlinkGoal: vi.fn(),
    deleteTask: vi.fn(),
  },
}));

const mockTask: Task = {
  id: 'task-123',
  title: 'Test Task Resilience',
  description: 'Testing optimistic updates and button disabling',
  size: 1,
  isCompleted: false,
  scheduledDate: '2026-11-16',
  createdAt: '2026-11-16T00:00:00.000Z',
  updatedAt: '2026-11-16T00:00:00.000Z',
};

describe('TaskCard Component - Issue #4 Resilience & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('optimistically updates completion and disables button while request is in flight', async () => {
    let resolveApi: (val: any) => void = () => {};
    const apiPromise = new Promise((resolve) => {
      resolveApi = resolve;
    });
    vi.mocked(taskApi.toggleComplete).mockReturnValue(apiPromise as any);

    const onTaskUpdated = vi.fn();

    render(
      <ToastProvider>
        <TaskCard task={mockTask} onTaskUpdated={onTaskUpdated} />
      </ToastProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /mark complete/i });
    expect(toggleButton).not.toBeDisabled();

    // Click once
    fireEvent.click(toggleButton);

    // Optimistic update: aria-label changes to "Mark incomplete" immediately
    expect(screen.getByRole('button', { name: /mark incomplete/i })).toBeInTheDocument();

    // Button should now be disabled while in flight
    const pendingButton = screen.getByRole('button', { name: /mark incomplete/i });
    expect(pendingButton).toBeDisabled();

    // Rapid double-click attempt while disabled
    fireEvent.click(pendingButton);
    fireEvent.click(pendingButton);

    // Still only 1 API call made
    expect(taskApi.toggleComplete).toHaveBeenCalledTimes(1);
    expect(taskApi.toggleComplete).toHaveBeenCalledWith('task-123');

    // Resolve API
    await act(async () => {
      resolveApi({ ...mockTask, isCompleted: true });
    });

    await waitFor(() => {
      expect(onTaskUpdated).toHaveBeenCalled();
    });
  });

  it('rolls back optimistic update on API error and displays error toast', async () => {
    vi.mocked(taskApi.toggleComplete).mockRejectedValueOnce(new Error('Network failure'));

    render(
      <ToastProvider>
        <TaskCard task={mockTask} />
      </ToastProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /mark complete/i });
    expect(toggleButton).not.toBeDisabled();

    // Click toggle
    await act(async () => {
      fireEvent.click(toggleButton);
    });

    // Should rollback to original state: "Mark complete"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument();
      expect(screen.getByText(/Network failure/i)).toBeInTheDocument();
    });
  });
});
