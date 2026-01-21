import React, { useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';
import { X } from 'lucide-react';

interface AddProgressModalProps {
  goal: Goal;
  onClose: () => void;
  onUpdated: () => void;
}

export const AddProgressModal: React.FC<AddProgressModalProps> = ({ goal, onClose, onUpdated }) => {
  const [value, setValue] = useState(goal.stepSize?.toString() || '1');
  const [customData, setCustomData] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await api.updateProgress(goal.id, parseFloat(value), note, customData || undefined);
    onUpdated();
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

        <h2 style={{ marginBottom: '24px' }}>Log Activity: {goal.title}</h2>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Amount
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              step={goal.stepSize || 1}
            />
          </div>

          {goal.customDataLabel && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                {goal.customDataLabel}
              </label>
              <input
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                placeholder={`Enter ${goal.customDataLabel}...`}
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                color: 'white',
              }}
            />
          </div>

          <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>
            Save Log
          </button>
        </form>
      </div>
    </div>
  );
};
