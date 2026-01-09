import { useState, useEffect } from 'react';
import { Task, Goal } from '../types';
import { taskApi, api } from '../api';
import { Modal } from './Modal';

interface AddTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskAdded: () => void;
    editTask?: Task | null;
}

export default function AddTaskModal({ isOpen, onClose, onTaskAdded, editTask }: AddTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [size, setSize] = useState(1);
    const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([]);
    const [scheduledDate, setScheduledDate] = useState('');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [showGoals, setShowGoals] = useState(false);
    const [goalsLoaded, setGoalsLoaded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editTask) {
                setTitle(editTask.title);
                setDescription(editTask.description || '');
                setSize(editTask.size);
                setSelectedGoalIds(editTask.goalTasks?.map(gt => gt.goalId) || []);
                setScheduledDate(editTask.scheduledDate ? editTask.scheduledDate.split('T')[0] : '');
                // Auto-expand goals if task has linked goals
                if (editTask.goalTasks && editTask.goalTasks.length > 0) {
                    setShowGoals(true);
                    loadGoals();
                }
            } else {
                resetForm();
            }
        }
    }, [isOpen, editTask]);

    const loadGoals = async () => {
        if (goalsLoaded) return; // Don't reload if already loaded
        try {
            const fetchedGoals = await api.fetchGoals();
            setGoals(fetchedGoals);
            setGoalsLoaded(true);
        } catch (error) {
            console.error('Failed to fetch goals:', error);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setSize(1);
        setSelectedGoalIds([]);
        setScheduledDate('');
        setShowGoals(false);
        setGoalsLoaded(false);
        setGoals([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const taskData: Partial<Task> & { goalIds?: string[] } = {
                title,
                description: description || undefined,
                size,
                goalIds: selectedGoalIds,
                scheduledDate: scheduledDate || undefined,
            };

            if (editTask) {
                await taskApi.updateTask(editTask.id, taskData);
            } else {
                await taskApi.createTask(taskData);
            }
            
            onTaskAdded();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Failed to save task:', error);
            alert('Failed to save task');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editTask ? 'Edit Task' : 'New Task'}
            width="90%"
            maxWidth="500px"
            maxHeight="85vh"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Task Title</label>
                        <input 
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="e.g., Read chapter 1 of Atomic Habits"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this task..."
                            rows={3}
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Size (in days)</label>
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={size}
                            onChange={(e) => setSize(parseInt(e.target.value))}
                            required
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Estimated days to complete this task
                        </div>
                    </div>

                    <div>
                        <div 
                            onClick={() => {
                                if (!showGoals) {
                                    setShowGoals(true);
                                    loadGoals();
                                } else {
                                    setShowGoals(false);
                                }
                            }}
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                padding: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '6px',
                                marginBottom: showGoals ? '8px' : '0'
                            }}
                        >
                            <label style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                                Link to Goals (Optional)
                            </label>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                {showGoals ? '▼' : '▶'}
                            </span>
                        </div>
                        
                        {showGoals && (
                            <div style={{ 
                                maxHeight: '150px', 
                                overflowY: 'auto', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '6px', 
                                padding: '4px',
                                background: 'rgba(255,255,255,0.02)'
                            }}>
                                {!goalsLoaded ? (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '12px' }}>
                                        Loading goals...
                                    </div>
                                ) : goals.length === 0 ? (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', padding: '12px' }}>
                                        No goals available
                                    </div>
                                ) : (
                                    goals.map((goal) => (
                                        <label 
                                            key={goal.id} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '10px', 
                                                padding: '8px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                borderRadius: '4px',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedGoalIds.includes(goal.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedGoalIds([...selectedGoalIds, goal.id]);
                                                    } else {
                                                        setSelectedGoalIds(selectedGoalIds.filter(id => id !== goal.id));
                                                    }
                                                }}
                                                style={{ 
                                                    cursor: 'pointer',
                                                    width: '16px',
                                                    height: '16px',
                                                    marginTop: '0',
                                                    flexShrink: 0
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flex: 1 }}>
                                                <span style={{ lineHeight: '1.4' }}>{goal.title}</span>
                                                <span style={{ 
                                                    fontSize: '0.75rem', 
                                                    color: 'var(--color-text-muted)',
                                                    flexShrink: 0
                                                }}>
                                                    ({goal.scope})
                                                </span>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Scheduled Date (Optional)</label>
                        <input
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px', borderRadius: '6px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                        <button type="submit" className="primary-btn" style={{ flex: 1 }}>
                            {editTask ? 'Update Task' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </Modal>
        );
}
