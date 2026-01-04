import React, { useState } from 'react';
import { Goal } from '../types';
import { Slider } from './Slider';
import { api } from '../api';
// Add Edit icon
import { Trash2, TrendingUp, Calendar, Edit2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { EditGoalModal } from './EditGoalModal';
import { AddProgressModal } from './AddProgressModal';
import { BulkTaskModal } from './BulkTaskModal';
import { Plus } from 'lucide-react';

interface GoalCardProps {
    goal: Goal;
    onUpdate: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate }) => {
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isLogging, setIsLogging] = useState(false);
    const [isCreatingTasks, setIsCreatingTasks] = useState(false);

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

    const handleToggleComplete = async () => {
        await api.updateGoal(goal.id, {
            isCompleted: !goal.isCompleted
        });
        onUpdate();
    };

    const chartData = goal.progress.slice().reverse().map(p => ({
        date: new Date(p.date).toLocaleDateString(),
        value: p.value,
        customData: p.customData // Ensure this is mapped if we want to show it in tooltip
    }));

    if (chartData.length === 0) {
        chartData.push({ date: 'Start', value: 0, customData: undefined });
    }

    const target = goal.targetValue || 100;
    const percentage = Math.min((goal.currentValue / target) * 100, 100);

    return (
        <>
            <div className="glass-panel" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        {goal.type === 'COMPLETION' && (
                            <input
                                type="checkbox"
                                checked={goal.isCompleted}
                                onChange={handleToggleComplete}
                                style={{ width: '24px', height: '24px', cursor: 'pointer', marginTop: '4px', flexShrink: 0 }}
                            />
                        )}
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', textDecoration: goal.isCompleted ? 'line-through' : 'none', opacity: goal.isCompleted ? 0.6 : 1 }}>{goal.title}</h3>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{goal.description || 'No description'}</p>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                                {goal.customDataLabel && <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Tracking: {goal.customDataLabel}</span>}
                                {goal.parent && <span style={{ fontSize: '0.75rem', background: 'rgba(100,150,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>↑ {goal.parent.title}</span>}
                                <span style={{ fontSize: '0.75rem', background: 'rgba(100,150,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{goal.scope}</span>
                                {goal.children && goal.children.length > 0 && (
                                    <span style={{ fontSize: '0.75rem', background: 'rgba(150,255,100,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {goal.children.filter(c => c.isCompleted).length}/{goal.children.length} subtasks
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY') && (
                            <button
                                onClick={() => setIsCreatingTasks(true)}
                                style={{
                                    background: 'rgba(100,200,100,0.2)',
                                    border: '1px solid rgba(100,200,100,0.3)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    padding: '4px 12px',
                                    fontSize: '0.85rem'
                                }}
                                title="Create Tasks"
                            >
                                + Tasks
                            </button>
                        )}
                        <button onClick={() => setIsLogging(true)} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Log Activity">
                            <Plus size={16} />
                        </button>
                        <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <Edit2 size={18} />
                        </button>
                        <button onClick={handleDelete} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {goal.type !== 'COMPLETION' && (
                    <>
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
                                        <Tooltip contentStyle={{ background: '#333', border: 'none' }} itemStyle={{ color: 'white' }} formatter={(val: any, name: any, props: any) => [val, props.payload.customData || 'Value']} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <Slider
                            value={goal.currentValue}
                            max={target}
                            step={goal.stepSize || 1}
                            onChange={() => { }}
                            onCommit={handleProgress}
                            label="Drag to update progress"
                        />
                    </>
                )}

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

                {/* Recent Activity Mini List */}
                {goal.progress && goal.progress.length > 0 && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Recent Activity</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {goal.progress.slice(0, 3).map(p => (
                                <div key={p.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{p.customData || (p.value > 0 ? `+${p.value}` : p.value)}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{new Date(p.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {isEditing && (
                <EditGoalModal
                    goal={goal}
                    onClose={() => setIsEditing(false)}
                    onUpdated={onUpdate}
                />
            )}

            {isLogging && (
                <AddProgressModal
                    goal={goal}
                    onClose={() => setIsLogging(false)}
                    onUpdated={onUpdate}
                />
            )}
            {isCreatingTasks && (
                <BulkTaskModal
                    parentGoal={goal}
                    onClose={() => setIsCreatingTasks(false)}
                    onCreated={onUpdate}
                />
            )}
        </>
    );
};
