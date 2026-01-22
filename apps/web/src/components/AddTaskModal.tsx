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
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const { goals, fetchGoals, loading: goalsLoading } = useGoalContext();
  const { createTask, updateTaskFields } = useTaskContext();

  useEffect(() => {
    if (!isOpen) return;

    fetchGoals();

    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || '');
      setSize(editTask.size);
      const preselectedIds = (editTask.goalTasks || [])
        .map((gt) => gt.goalId || gt.goal?.id)
        .filter((id): id is string => Boolean(id));
      setSelectedGoalIds(preselectedIds);
      setScheduledDate(editTask.scheduledDate ? editTask.scheduledDate.split('T')[0] : '');
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Task Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Read chapter 1 of Atomic Habits"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details about this task..."
              rows={3}
              className="form-textarea"
            />
          </div>

          <div>
            <label className="form-label">Size (in days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value))}
              required
              className="form-input"
            />
            <p className="text-xs text-slate-400 mt-1">
              Estimated days to complete this task
            </p>
          </div>

          <div>
            <div
              onClick={() => {
                setShowGoals(!showGoals);
                if (!showGoals) fetchGoals();
              }}
              className="flex items-center justify-between cursor-pointer p-2 bg-white/5 rounded-md mb-2"
            >
              <label className="text-sm cursor-pointer">Link to Goals (Optional)</label>
              <span className="text-xs text-slate-400">{showGoals ? '▼' : '▶'}</span>
            </div>

            {showGoals && (
              <div className="max-h-36 overflow-y-auto border border-white/10 rounded-md p-1 bg-white/[0.02]">
                {goalsLoading ? (
                  <p className="text-sm text-slate-400 p-3">Loading goals...</p>
                ) : goals.length === 0 ? (
                  <p className="text-sm text-slate-400 p-3">No goals available</p>
                ) : (
                  goals.map((goal) => (
                    <label
                      key={goal.id}
                      className="flex items-center gap-2.5 p-2 cursor-pointer text-sm rounded-sm hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGoalIds.includes(goal.id)}
                        onChange={(e) => {
                          const { checked } = e.target;
                          setSelectedGoalIds((prev) =>
                            checked ? [...prev, goal.id] : prev.filter((id) => id !== goal.id)
                          );
                        }}
                        className="cursor-pointer w-4 h-4 mt-0 shrink-0"
                      />
                      <div className="flex items-baseline gap-1.5 flex-1">
                        <span>{goal.title}</span>
                        <span className="text-xs text-slate-400 shrink-0">({goal.scope})</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="form-label">Scheduled Date (Optional)</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="secondary-btn flex-1">
              Cancel
            </button>
            <button type="submit" className="primary-btn flex-1">
              {editTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
