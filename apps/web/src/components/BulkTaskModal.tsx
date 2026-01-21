import React, { useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';
import { X } from 'lucide-react';

interface BulkTaskModalProps {
  parentGoal: Goal;
  onClose: () => void;
  onCreated: () => void;
}

export const BulkTaskModal: React.FC<BulkTaskModalProps> = ({ parentGoal, onClose, onCreated }) => {
  const [pattern, setPattern] = useState('');
  const [count, setCount] = useState(10);
  const [preview, setPreview] = useState<string[]>([]);

  const generatePreview = () => {
    const tasks: string[] = [];
    for (let i = 1; i <= count; i++) {
      const taskName = pattern.replace(/{n}/g, i.toString());
      tasks.push(taskName);
    }
    setPreview(tasks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate tasks from pattern if preview hasn't been generated
    const taskNames =
      preview.length > 0
        ? preview
        : Array.from({ length: count }, (_, i) => {
            return pattern.replace(/{n}/g, (i + 1).toString());
          });

    const tasks = taskNames.map((title) => ({ title }));
    await api.bulkCreateTasks(parentGoal.id, tasks);

    onCreated();
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
        style={{
          width: '600px',
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

        <h2 style={{ marginBottom: '8px' }}>Create Tasks for "{parentGoal.title}"</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Use {'{n}'} as a placeholder for numbers
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Task Name Pattern
            </label>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="e.g., Read chapter {n} of Atomic Habits"
              required
            />
            <div
              style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}
            >
              Example: "Read chapter {'{n}'} of Atomic Habits" → "Read chapter 1 of Atomic Habits"
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
              Number of Tasks
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              min="1"
              max="100"
              required
            />
          </div>

          <button
            type="button"
            onClick={generatePreview}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Preview Tasks
          </button>

          {preview.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Preview ({preview.length} tasks)
              </label>
              <div
                style={{
                  maxHeight: '200px',
                  overflow: 'auto',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                {preview.map((task, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '4px 0',
                      borderBottom:
                        idx < preview.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    }}
                  >
                    {idx + 1}. {task}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="primary-btn"
            style={{ marginTop: '16px' }}
            disabled={preview.length === 0}
          >
            Create {preview.length} Tasks
          </button>
        </form>
      </div>
    </div>
  );
};
