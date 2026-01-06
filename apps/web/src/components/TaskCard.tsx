import { Task } from '../types';
import { taskApi } from '../api';

interface TaskCardProps {
    task: Task;
    onUpdate: () => void;
    onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onUpdate, onEdit }: TaskCardProps) {
    const handleToggleComplete = async () => {
        try {
            await taskApi.toggleComplete(task.id);
            onUpdate();
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Delete task "${task.title}"?`)) {
            try {
                await taskApi.deleteTask(task.id);
                onUpdate();
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const linkedGoals = task.goalTasks || [];

    return (
        <div className={`card ${task.isCompleted ? 'completed' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ 
                            margin: '0',
                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                            opacity: task.isCompleted ? 0.6 : 1
                        }}>
                            {task.title}
                        </h3>
                        {task.isCompleted && (
                            <span style={{ 
                                fontSize: '1.25rem',
                                color: '#4ade80'
                            }}>
                                ✓
                            </span>
                        )}
                    </div>
                    
                    {task.description && (
                        <p style={{ 
                            margin: '0 0 0.5rem 0',
                            opacity: task.isCompleted ? 0.5 : 0.8,
                            fontSize: '0.9rem'
                        }}>
                            {task.description}
                        </p>
                    )}
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        flexWrap: 'wrap',
                        fontSize: '0.85rem',
                        opacity: 0.7,
                        marginBottom: linkedGoals.length > 0 ? '0.75rem' : '0'
                    }}>
                        {task.size > 1 && (
                            <span>
                                📏 Size: {task.size} {task.size === 1 ? 'day' : 'days'}
                            </span>
                        )}
                        
                        {task.scheduledDate && (
                            <span>
                                📅 {new Date(task.scheduledDate).toLocaleDateString()}
                            </span>
                        )}
                        
                        {task.completedAt && (
                            <span>
                                ✅ {new Date(task.completedAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {linkedGoals.length > 0 && (
                        <div style={{ 
                            display: 'flex', 
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                        }}>
                            {linkedGoals.map(goalTask => (
                                <span
                                    key={goalTask.id}
                                    style={{
                                        display: 'inline-block',
                                        background: 'rgba(100, 150, 255, 0.2)',
                                        border: '1px solid rgba(100, 150, 255, 0.4)',
                                        color: 'rgb(150, 180, 255)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    🎯 {goalTask.goal?.title || 'Unknown Goal'}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleToggleComplete}
                        className={task.isCompleted ? 'btn-secondary' : 'primary-btn'}
                        style={{ 
                            padding: '0.5rem 1rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {task.isCompleted ? 'Mark Incomplete' : 'Complete Task'}
                    </button>
                    {onEdit && !task.isCompleted && (
                        <button
                            onClick={() => onEdit(task)}
                            className="btn-secondary"
                            style={{ padding: '0.5rem 1rem' }}
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="btn-danger"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
