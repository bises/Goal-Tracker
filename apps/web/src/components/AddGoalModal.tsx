import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Goal, GoalScope } from '../types';
import { X } from 'lucide-react';

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
    const [customEndDate, setCustomEndDate] = useState('');
    const [customDataLabel, setCustomDataLabel] = useState('');

    // Hierarchy fields
    const [scope, setScope] = useState<GoalScope>(parentGoal ? 'STANDALONE' : 'STANDALONE');
    const [parentId, setParentId] = useState(parentGoal?.id || '');
    const [scheduledDate, setScheduledDate] = useState('');
    const [availableParents, setAvailableParents] = useState<Goal[]>([]);


    useEffect(() => {
        // Load potential parent goals based on scope
        const loadParents = async () => {
            if (scope !== 'STANDALONE') {
                const goals = await api.fetchGoals();
                // Filter to show only valid parents (one level up)
                const scopeHierarchy = ['YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'];
                const currentIndex = scopeHierarchy.indexOf(scope);
                const parentScope = currentIndex > 0 ? scopeHierarchy[currentIndex - 1] : null;

                if (parentScope) {
                    setAvailableParents(goals.filter(g => g.scope === parentScope));
                } else {
                    setAvailableParents([]);
                }
            }
        };
        loadParents();
    }, [scope]);

    // Auto-set type to COMPLETION for daily tasks
    useEffect(() => {
        if (scope === 'DAILY') {
            setType('COMPLETION');
        }
    }, [scope]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const allowDecimals = (document.getElementById('allowDecimals') as HTMLInputElement).checked;

        await api.createGoal({
            title,
            description,
            type: type as any,
            targetValue: parseFloat(target),
            currentValue: 0,
            stepSize: allowDecimals ? 0.1 : 1,
            endDate: customEndDate || undefined,
            customDataLabel: customDataLabel || undefined,
            scope,
            parentId: parentId || undefined,
            scheduledDate: scheduledDate || undefined,
            isCompleted: false
        });
        onAdded();
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

                <h2 style={{ marginBottom: '24px' }}>New Goal</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Goal Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Read 12 Books" required />
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                            <select value={type} onChange={e => setType(e.target.value)} disabled={scope === 'DAILY'}>
                                <option value="COMPLETION">Completion</option>
                                <option value="TOTAL_TARGET">Total Target</option>
                                <option value="FREQUENCY">Frequency</option>
                            </select>
                        </div>
                    </div>

                    {type === 'FREQUENCY' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Times</label>
                                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="2" required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Per</label>
                                <select style={{ height: '42px' }} onChange={e => { /* Simplified */ }}>
                                    <option value="WEEKLY">Week</option>
                                    <option value="MONTHLY">Month</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {type === 'TOTAL_TARGET' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Target Value</label>
                            <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="12" required />
                        </div>
                    )}

                    {type === 'COMPLETION' && (
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            This is a simple completion task. Mark it as done when finished.
                        </div>
                    )}

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

                    {scope !== 'STANDALONE' && scope !== 'YEARLY' && availableParents.length > 0 && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Parent Goal (Optional)</label>
                            <select value={parentId} onChange={e => setParentId(e.target.value)}>
                                <option value="">None</option>
                                {availableParents.map(g => (
                                    <option key={g.id} value={g.id}>{g.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {(scope === 'DAILY' || scope === 'WEEKLY') && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scheduled Date (Optional)</label>
                            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Custom Log Label (Optional)</label>
                        <input value={customDataLabel} onChange={e => setCustomDataLabel(e.target.value)} placeholder="e.g. Book Name, Location" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" id="allowDecimals" style={{ width: 'auto' }} onChange={e => {
                            (e.target as any).checkedValue = e.target.checked;
                        }} />
                        <label htmlFor="allowDecimals" style={{ fontSize: '0.9rem' }}>Allow Decimals</label>
                    </div>

                    <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>Create Goal</button>
                </form>
            </div>
        </div>
    );
};
