import React, { useState } from 'react';
import { api } from '../../api';
import { Goal, GoalScope } from '../../types';
import { Modal } from './Modal';

interface EditGoalModalProps {
  goal: Goal;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onUpdated }) => {
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || '');
  const [target, setTarget] = useState(goal.targetValue?.toString() || '');
  const [progressMode, setProgressMode] = useState<'TASK_BASED' | 'MANUAL_TOTAL' | 'HABIT'>(
    goal.progressMode || 'TASK_BASED'
  );
  const [customEndDate, setCustomEndDate] = useState(
    goal.endDate ? new Date(goal.endDate).toLocaleDateString('en-CA') : ''
  );
  const [customDataLabel, setCustomDataLabel] = useState(goal.customDataLabel || '');
  const [scope, setScope] = useState<GoalScope>(goal.scope || 'STANDALONE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await api.updateGoal(goal.id, {
      title,
      description,
      progressMode,
      targetValue: target ? parseFloat(target) : undefined,
      endDate: customEndDate ? new Date(customEndDate + 'T00:00:00').toISOString() : undefined,
      customDataLabel,
      scope,
    });
    onUpdated();
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Edit Goal" maxWidth="400px">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            Goal Title
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details about this goal..."
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            Custom Log Label
          </label>
          <input
            value={customDataLabel}
            onChange={(e) => setCustomDataLabel(e.target.value)}
            placeholder="e.g. Book Name"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scope</label>
          <select value={scope} onChange={(e) => setScope(e.target.value as GoalScope)}>
            <option value="STANDALONE">Standalone</option>
            <option value="YEARLY">Yearly Goal</option>
            <option value="MONTHLY">Monthly Goal</option>
            <option value="WEEKLY">Weekly Goal</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            End Date (Optional)
          </label>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            Progress Mode
          </label>
          <select value={progressMode} onChange={(e) => setProgressMode(e.target.value as any)}>
            <option value="TASK_BASED">Task-based</option>
            <option value="MANUAL_TOTAL">Manual total</option>
            <option value="HABIT">Habit</option>
          </select>
        </div>

        {progressMode === 'MANUAL_TOTAL' && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Target Value (optional)
            </label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          </div>
        )}

        <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>
          Save Changes
        </button>
      </form>
    </Modal>
  );
};
