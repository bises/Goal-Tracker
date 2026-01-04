import React, { useState } from 'react';
import { api } from '../api';
import { Goal, GoalScope } from '../types';
import { X } from 'lucide-react';

interface EditGoalModalProps {
    goal: Goal;
    onClose: () => void;
    onUpdated: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onUpdated }) => {
    const [title, setTitle] = useState(goal.title);
    const [description, setDescription] = useState(goal.description || '');
    const [target, setTarget] = useState(goal.targetValue?.toString() || '');
    const [customEndDate, setCustomEndDate] = useState(goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '');
    const [customDataLabel, setCustomDataLabel] = useState(goal.customDataLabel || '');
    const [scope, setScope] = useState<GoalScope>(goal.scope || 'STANDALONE');
    const [scheduledDate, setScheduledDate] = useState(goal.scheduledDate ? new Date(goal.scheduledDate).toISOString().split('T')[0] : '');
    const [isCompleted, setIsCompleted] = useState(goal.isCompleted || false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await api.updateGoal(goal.id, {
            title,
            description,
            targetValue: parseFloat(target),
            endDate: customEndDate ? new Date(customEndDate).toISOString() : undefined,
            customDataLabel,
            scope,
            scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
            isCompleted
        });
        onUpdated();
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '32px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '24px' }}>Edit Goal</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Goal Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} required />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Add more details about this goal..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Custom Log Label</label>
                        <input value={customDataLabel} onChange={e => setCustomDataLabel(e.target.value)} placeholder="e.g. Book Name" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scope</label>
                        <select value={scope} onChange={e => setScope(e.target.value as GoalScope)}>
                            <option value="STANDALONE">Standalone</option>
                            <option value="YEARLY">Yearly Goal</option>
                            <option value="MONTHLY">Monthly Goal</option>
                            <option value="WEEKLY">Weekly Goal</option>
                            <option value="DAILY">Daily Task</option>
                        </select>
                    </div>

                    {(scope === 'DAILY' || scope === 'WEEKLY') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scheduled Date</label>
                            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" id="isCompleted" checked={isCompleted} onChange={e => setIsCompleted(e.target.checked)} style={{ width: 'auto' }} />
                        <label htmlFor="isCompleted" style={{ fontSize: '0.9rem' }}>Mark as Completed</label>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>End Date (Optional)</label>
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Target Value</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} required />
                    </div>

                    <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>Save Changes</button>
                </form>
            </div>
        </div>
    );
};
