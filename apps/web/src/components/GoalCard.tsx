import React, { useState } from 'react';
import { Goal } from '../types';
import { Slider } from './Slider';
import { api } from '../api';
import { Trash2, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface GoalCardProps {
    goal: Goal;
    onUpdate: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate }) => {
    const [updating, setUpdating] = useState(false);

    const handleProgress = async (newTotal: number) => {
        setUpdating(true);
        const added = newTotal - goal.currentValue;
        if (added !== 0) {
            await api.updateProgress(goal.id, added);
            onUpdate();
        }
        setUpdating(false);
    };

    const handleDelete = async () => {
        if (confirm('Delete this goal?')) {
            await api.deleteGoal(goal.id);
            onUpdate();
        }
    }

    const chartData = goal.progress.slice().reverse().map(p => ({
        date: new Date(p.date).toLocaleDateString(),
        value: p.value
    }));

    // Add initial zero point if empty or just start
    if (chartData.length === 0) {
        chartData.push({ date: 'Start', value: 0 });
    }

    const target = goal.targetValue || 100; // Default for habit/freq might need logic
    const percentage = Math.min((goal.currentValue / target) * 100, 100);

    return (
        <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{goal.title}</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{goal.description || 'No description'}</p>
                </div>
                <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>
                        {goal.currentValue}
                        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>/ {target}</span>
                    </div>
                </div>
                {/* Mini Chart */}
                <div style={{ width: '120px', height: '60px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id={`gradient-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="value" stroke="var(--color-text-main)" fillOpacity={1} fill="url(#colorPv)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <Slider
                value={goal.currentValue}
                max={target}
                onChange={() => { }}
                onCommit={handleProgress}
                label="Drag to update progress"
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} />
                    <span>{percentage.toFixed(0)}% Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} />
                    <span>{goal.endDate ? new Date(goal.endDate).toLocaleDateString() : 'Ongoing'}</span>
                </div>
            </div>
        </div>
    );
};
