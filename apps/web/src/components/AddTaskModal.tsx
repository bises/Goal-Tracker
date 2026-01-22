import { useEffect, useState } from 'react';
import { useGoalContext } from '../contexts/GoalContext';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';
import { Modal } from './Modal';
import { Toast } from './Toast';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
  editTask?: Task | null;
  defaultScheduledDate?: string;
}

export default function AddTaskModal({
  isOpen,
  onClose,
  onTaskAdded,
  editTask,
  defaultScheduledDate,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState(1);
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [showGoals, setShowGoals] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const { goals, fetchGoals, loading: goalsLoading } = useGoalContext();
  const { createTask, updateTaskFields, toggleComplete } = useTaskContext();

  useEffect(() => {
    if (!isOpen) return;

    // Always ensure goals are available when opening the modal
    fetchGoals();

    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setSize(editTask.size);
      // Be defensive: some API payloads may include only goal object without goalId
      const preselectedIds = (editTask.goalTasks || [])
        .map((gt) => gt.goalId || gt.goal?.id)
        .filter((id): id is string => Boolean(id));
      setSelectedGoalIds(preselectedIds);
      setScheduledDate(editTask.scheduledDate ? editTask.scheduledDate.split('T')[0] : '');
      setIsCompleted(editTask.isCompleted || false);
      // Auto-expand goals if task has linked goals
      setShowGoals((editTask.goalTasks?.length || 0) > 0);
    } else {
      resetForm();
      setScheduledDate(defaultScheduledDate || '');
    }
  }, [isOpen, editTask, fetchGoals, defaultScheduledDate]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSize(1);
    setSelectedGoalIds([]);
    setScheduledDate('');
    setShowGoals(false);
    setIsCompleted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const taskData: Partial<Task> & { goalIds?: string[] } = {
        title,
        description: description || undefined,
        size,
        goalIds: selectedGoalIds,
        scheduledDate: scheduledDate || undefined,
      };

      if (editTask) {
        await updateTaskFields(editTask.id, taskData);
        // If completion state changed, toggle it
        if (isCompleted !== editTask.isCompleted) {
          await toggleComplete(editTask.id);
        }
      } else {
        await createTask(taskData);
      }

      onTaskAdded();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to save task:', error);
      setErrorToast('Failed to save task');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {errorToast && (
        <Toast message={errorToast} level="error" onClose={() => setErrorToast(null)} />
      )}

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={editTask ? 'Edit Task' : 'New Task'}
        width="90%"
        maxWidth="500px"
        maxHeight="85vh"
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Read chapter 1 of Atomic Habits"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Size (in days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              required
            />
            <div
              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}
            >
              Estimated days to complete this task
            </div>
          </div>

          <div>
            <div
              onClick={() => {
                if (!showGoals) {
                  setShowGoals(true);
                  fetchGoals();
                } else {
                  setShowGoals(false);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '8px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                marginBottom: showGoals ? '8px' : '0',
              }}
            >
              <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                Link to Goals (Optional)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {showGoals ? '▼' : '▶'}
              </span>
            </div>

            {showGoals && (
              <div
                style={{
                  maxHeight: '150px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  padding: '4px',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {goalsLoading ? (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      padding: '12px',
                    }}
                  >
                    Loading goals...
                  </div>
                ) : goals.length === 0 ? (
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-text-muted)',
                      padding: '12px',
                    }}
                  >
                    No goals available
                  </div>
                ) : (
                  goals.map((goal) => (
                    <label
                      key={goal.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        borderRadius: '4px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={selectedGoalIds.includes(goal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGoalIds([...selectedGoalIds, goal.id]);
                          } else {
                            setSelectedGoalIds(selectedGoalIds.filter((id) => id !== goal.id));
                          }
                        }}
                        style={{
                          cursor: 'pointer',
                          width: '16px',
                          height: '16px',
                          marginTop: '0',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flex: 1 }}>
                        <span style={{ lineHeight: '1.4' }}>{goal.title}</span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--color-text-muted)',
                            flexShrink: 0,
                          }}
                        >
                          ({goal.scope})
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Scheduled Date (Optional)
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          {editTask && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              onClick={() => setIsCompleted(!isCompleted)}
            >
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => setIsCompleted(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  cursor: 'pointer',
                  width: '18px',
                  height: '18px',
                  marginTop: '0',
                  flexShrink: 0,
                }}
              />
              <label style={{ fontSize: '0.9rem', cursor: 'pointer', flex: 1 }}>
                Mark as {isCompleted ? 'Incomplete' : 'Complete'}
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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
            <button type="submit" className="primary-btn" style={{ flex: 1 }}>
              {editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
