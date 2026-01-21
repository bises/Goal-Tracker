import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Goal, GoalScope } from '../types';

interface AddGoalModalProps {
  onClose: () => void;
  onAdded: () => void;
  parentGoal?: Goal; // Optional pre-selected parent
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAdded, parentGoal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState('TOTAL_TARGET');
  const [progressMode, setProgressMode] = useState<'TASK_BASED' | 'MANUAL_TOTAL' | 'HABIT'>(
    'TASK_BASED'
  );
  const [customEndDate, setCustomEndDate] = useState('');
  const [customDataLabel, setCustomDataLabel] = useState('');

  // Hierarchy fields
  const [scope, setScope] = useState<GoalScope>('STANDALONE');
  const [parentId, setParentId] = useState(parentGoal?.id || '');
  const [availableParents, setAvailableParents] = useState<Goal[]>([]);

  useEffect(() => {
    // Load potential parent goals based on scope
    const loadParents = async () => {
      if (scope !== 'STANDALONE') {
        const goals = await api.fetchGoals();
        // Filter to show only valid parents (one level up)
        const scopeHierarchy = ['YEARLY', 'MONTHLY', 'WEEKLY'];
        const currentIndex = scopeHierarchy.indexOf(scope);
        const parentScope = currentIndex > 0 ? scopeHierarchy[currentIndex - 1] : null;

        if (parentScope) {
          setAvailableParents(goals.filter((g) => g.scope === parentScope));
        } else {
          setAvailableParents([]);
        }
      }
    };
    loadParents();
  }, [scope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allowDecimals = (document.getElementById('allowDecimals') as HTMLInputElement).checked;

    await api.createGoal({
      title,
      description,
      type: type as any,
      progressMode,
      targetValue: target ? parseFloat(target) : undefined,
      currentValue: 0,
      stepSize: allowDecimals ? 0.1 : 1,
      endDate: customEndDate || undefined,
      customDataLabel: customDataLabel || undefined,
      scope,
      parentId: parentId || undefined,
    });
    onAdded();
    onClose();
  };

  return (
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
        style={{ width: '400px', padding: '32px', position: 'relative' }}
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

        <h2 style={{ marginBottom: '24px' }}>New Goal</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Goal Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 12 Books"
              required
            />
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Type
              </label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="TOTAL_TARGET">Total Target</option>
                <option value="FREQUENCY">Frequency</option>
                <option value="HABIT">Habit</option>
              </select>
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
          </div>

          {type === 'FREQUENCY' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Times
                </label>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="2"
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                  Per
                </label>
                <select style={{ height: '42px' }}>
                  <option value="WEEKLY">Week</option>
                  <option value="MONTHLY">Month</option>
                </select>
              </div>
            </div>
          )}

          {progressMode === 'MANUAL_TOTAL' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Target Value (optional)
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g., 25000"
              />
              <div
                style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}
              >
                Leave blank for open-ended totals.
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Scope
            </label>
            <select value={scope} onChange={(e) => setScope(e.target.value as GoalScope)}>
              <option value="STANDALONE">Standalone</option>
              <option value="YEARLY">Yearly Goal</option>
              <option value="MONTHLY">Monthly Goal</option>
              <option value="WEEKLY">Weekly Goal</option>
            </select>
          </div>

          {scope !== 'STANDALONE' && scope !== 'YEARLY' && availableParents.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Parent Goal (Optional)
              </label>
              <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">None</option>
                {availableParents.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Custom Log Label (Optional)
            </label>
            <input
              value={customDataLabel}
              onChange={(e) => setCustomDataLabel(e.target.value)}
              placeholder="e.g. Book Name, Location"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" id="allowDecimals" style={{ width: 'auto' }} />
            <label htmlFor="allowDecimals" style={{ fontSize: '0.9rem' }}>
              Allow Decimals
            </label>
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>
            Create Goal
          </button>
        </form>
      </div>
    </div>
  );
};
