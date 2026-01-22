import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { taskApi } from '../api';
import { useTaskContext } from '../contexts/TaskContext';
import { Goal, Task } from '../types';
import { Toast } from './Toast';

interface LinkTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onTasksLinked: () => void;
}

export default function LinkTasksModal({
  isOpen,
  onClose,
  goal,
  onTasksLinked,
}: LinkTasksModalProps) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const { updateTaskFields } = useTaskContext();

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      // Initialize selected with already-linked tasks for this goal
      const linkedIds = new Set(
        goal.goalTasks?.filter((gt) => gt.goalId === goal.id).map((gt) => gt.taskId) || []
      );
      setSelectedTaskIds(linkedIds);
    }
  }, [isOpen, goal]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskApi.fetchTasks();
      setAllTasks(tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const handleLinkTasks = async () => {
    try {
      setLoading(true);

      // Get currently linked task IDs for this goal
      const currentlyLinked = new Set(
        goal.goalTasks?.filter((gt) => gt.goalId === goal.id).map((gt) => gt.taskId) || []
      );

      // Link newly selected tasks
      for (const taskId of selectedTaskIds) {
        if (!currentlyLinked.has(taskId)) {
          const task = allTasks.find((t) => t.id === taskId);
          if (task) {
            // Get existing goal IDs and add this one
            const existingGoalIds = (task.goalTasks || []).map((gt) => gt.goalId);
            const updatedGoalIds = Array.from(new Set([...existingGoalIds, goal.id]));
            await updateTaskFields(taskId, { goalIds: updatedGoalIds } as any);
          }
        }
      }

      // Unlink tasks that were previously linked but not selected
      for (const linkedId of currentlyLinked) {
        if (!selectedTaskIds.has(linkedId)) {
          const task = allTasks.find((t) => t.id === linkedId);
          if (task) {
            // Remove this goal from the task's goal IDs
            const existingGoalIds = (task.goalTasks || [])
              .map((gt) => gt.goalId)
              .filter((gId) => gId !== goal.id);
            await updateTaskFields(linkedId, { goalIds: existingGoalIds } as any);
          }
        }
      }

      onTasksLinked();
      onClose();
    } catch (error) {
      console.error('Failed to link tasks:', error);
      setErrorToast('Failed to link tasks');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {errorToast && (
        <Toast message={errorToast} level="error" onClose={() => setErrorToast(null)} />
      )}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(5px)',
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '500px',
            maxHeight: '80vh',
            padding: '32px',
            position: 'relative',
            overflow: 'auto',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <X size={24} />
          </button>

          <h2 style={{ marginBottom: '8px' }}>Link Tasks to "{goal.title}"</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            A task can be linked to multiple goals. Select tasks to track progress toward this goal.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              Loading tasks...
            </div>
          ) : (
            <>
              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  marginBottom: '24px',
                }}
              >
                {allTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    No tasks available
                  </div>
                ) : (
                  allTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        background: selectedTaskIds.has(task.id)
                          ? 'rgba(100,200,100,0.1)'
                          : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onClick={() => toggleTaskSelection(task.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          marginRight: '12px',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {task.description}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--color-text-muted)',
                            marginTop: '4px',
                          }}
                        >
                          {task.size > 1 ? `${task.size} days` : '1 day'}
                          {task.isCompleted && ' • ✓ Completed'}
                          {(task.goalTasks?.length || 0) > 0 &&
                            ` • Linked to ${task.goalTasks?.length} goal${(task.goalTasks?.length || 0) !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  marginBottom: '24px',
                  padding: '12px',
                  background: 'rgba(100,200,100,0.1)',
                  borderRadius: '6px',
                }}
              >
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected for
                  this goal
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLinkTasks}
                  disabled={loading}
                  className="primary-btn"
                  style={{ flex: 1, opacity: loading ? 0.6 : 1 }}
                >
                  Link {selectedTaskIds.size} Task{selectedTaskIds.size !== 1 ? 's' : ''}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
