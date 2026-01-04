import React, { useState } from 'react';
import { api } from '../api';
import { X } from 'lucide-react';

interface AddGoalModalProps {
    onClose: () => void;
    onAdded: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ onClose, onAdded }) => {
    const [title, setTitle] = useState('');
    const [target, setTarget] = useState('');
    const [type, setType] = useState('TOTAL_TARGET');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.createGoal({
            title,
            type: type as any,
            targetValue: parseFloat(target),
            currentValue: 0
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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Type</label>
                        <select value={type} onChange={e => setType(e.target.value)}>
                            <option value="TOTAL_TARGET">Total Target (e.g. 12 Books)</option>
                            <option value="FREQUENCY">Frequency (e.g. 2 times/week)</option>
                        </select>
                    </div>

                    {type === 'FREQUENCY' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Times</label>
                                <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="2" required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Per</label>
                                <select style={{ height: '42px' }} onChange={e => { /* Simplified for demo, ideally add state for this */ }}>
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

                    <button type="submit" className="primary-btn" style={{ marginTop: '16px' }}>Create Goal</button>
                </form>
            </div>
        </div>
    );
};
