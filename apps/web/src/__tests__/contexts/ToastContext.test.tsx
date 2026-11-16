import { act, renderHook, screen, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from '../../contexts/ToastContext';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders and auto-dismisses toast messages', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Action succeeded!', 'success', 2000)}>
          Trigger Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.queryByText('Action succeeded!')).not.toBeInTheDocument();

    act(() => {
      screen.getByText('Trigger Toast').click();
    });

    expect(screen.getByText('Action succeeded!')).toBeInTheDocument();

    // Advance time past auto-close duration
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByText('Action succeeded!')).not.toBeInTheDocument();
  });

  it('manually dismisses toast when close button clicked', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return (
        <button onClick={() => showToast('Error occurred!', 'error', 0)}>
          Trigger Error Toast
        </button>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Trigger Error Toast').click();
    });

    expect(screen.getByText('Error occurred!')).toBeInTheDocument();

    act(() => {
      screen.getByLabelText('Dismiss').click();
    });

    expect(screen.queryByText('Error occurred!')).not.toBeInTheDocument();
  });
});
