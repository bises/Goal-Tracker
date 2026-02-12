import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Goal, GoalScope } from '../../types';
import { Modal } from './Modal';

interface AddGoalModalProps {
  onClose: () => void;
  onAdded: () => void;
  parentGoal?: Goal; // Optional pre-selected parent
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAdded, parentGoal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [type, setType] = useState<'TOTAL_TARGET' | 'FREQUENCY'>('TOTAL_TARGET');
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
    <Modal isOpen={true} onClose={onClose} title="New Goal" maxWidth="400px">
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

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
            Goal Type
          </label>
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="TOTAL_TARGET">Total Target (Task-based)</option>
            <option value="FREQUENCY">Frequency (Recurring)</option>
          </select>
        </div>

        {type === 'TOTAL_TARGET' && (
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
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Leave blank for open-ended totals.
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scope</label>
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
    </Modal>
  );
};
