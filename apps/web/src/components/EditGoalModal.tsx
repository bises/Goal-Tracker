import React, { useState } from 'react';
import { api } from '../api';
import { Goal } from '../types';
import { X } from 'lucide-react';

interface EditGoalModalProps {
    goal: Goal;
    onClose: () => void;
    onUpdated: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onUpdated }) => {
    const [title, setTitle] = useState(goal.title);
    const [target, setTarget] = useState(goal.targetValue?.toString() || '');
    const [period, setPeriod] = useState(goal.period || 'CUSTOM');
    const [customEndDate, setCustomEndDate] = useState(goal.endDate ? new Date(goal.endDate).toISOString().split('T')[0] : '');
    const [customDataLabel, setCustomDataLabel] = useState(goal.customDataLabel || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        await api.updateGoal(goal.id, {
            title,
            targetValue: parseFloat(target),
            period: period as any,
            endDate: period === 'CUSTOM' && customEndDate ? new Date(customEndDate).toISOString() : undefined,
            customDataLabel
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Custom Log Label</label>
                        <input value={customDataLabel} onChange={e => setCustomDataLabel(e.target.value)} placeholder="e.g. Book Name" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Period</label>
                            <select value={period} onChange={e => setPeriod(e.target.value as any)}>
                                <option value="YEAR">Yearly</option>
                                <option value="MONTH">Monthly</option>
                                <option value="WEEK">Weekly</option>
                                <option value="CUSTOM">Custom Date</option>
                            </select>
                        </div>
                    </div>

                    {period === 'CUSTOM' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>End Date</label>
                            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                        </div>
                    )}

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
