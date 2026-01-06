import { useState, useEffect } from 'react';
import { Task, Goal } from '../types';
import { taskApi, api } from '../api';
import { X } from 'lucide-react';

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

    useEffect(() => {
        if (isOpen) {
            loadGoals();
            if (editTask) {
                setTitle(editTask.title);
                setDescription(editTask.description || '');
                setSize(editTask.size);
                setSelectedGoalIds(editTask.goalTasks?.map(gt => gt.goalId) || []);
                setScheduledDate(editTask.scheduledDate ? editTask.scheduledDate.split('T')[0] : '');
            } else {
                resetForm();
            }
        }
    }, [isOpen, editTask]);

    const loadGoals = async () => {
        try {
            const fetchedGoals = await api.fetchGoals();
            setGoals(fetchedGoals);
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
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{ width: '400px', padding: '32px', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 style={{ marginBottom: '24px' }}>{editTask ? 'Edit Task' : 'New Task'}</h2>

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
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Link to Goals (Optional, multi-select)</label>
                        <select
                            multiple
                            value={selectedGoalIds}
                            onChange={(e) => setSelectedGoalIds(Array.from(e.target.selectedOptions).map(o => o.value))}
                            style={{ minHeight: '100px' }}
                        >
                            {goals.map((goal) => (
                                <option key={goal.id} value={goal.id}>
                                    {goal.title} ({goal.scope})
                                </option>
                            ))}
                        </select>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            Hold Ctrl/Cmd to select multiple goals.
                        </div>
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
            </div>
        </div>
    );
}
