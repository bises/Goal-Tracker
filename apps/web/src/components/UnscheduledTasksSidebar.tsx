import React from 'react';
import { Task } from '../types';
import { X } from 'lucide-react';

interface UnscheduledTasksSidebarProps {
    tasks: Task[];
    isVisible: boolean;
    onClose: () => void;
    onTaskDragStart: (taskId: string) => void;
    onTaskClick?: (task: Task) => void;
    onUnscheduleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function UnscheduledTasksSidebar({
    tasks,
    isVisible,
    onClose,
    onTaskDragStart,
    onTaskClick,
    onUnscheduleDrop
}: UnscheduledTasksSidebarProps) {
    if (!isVisible) return null;

    return (
        <div
            style={{
                width: '300px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '12px',
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onUnscheduleDrop}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Unscheduled Tasks</h3>
                <button
                    className="icon-btn"
                    onClick={onClose}
                >
                    <X size={16} />
                </button>
            </div>

            {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                    No unscheduled tasks
                </div>
            ) : (
                tasks.map(task => (
                    <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                            e.dataTransfer.setData('taskId', task.id);
                            onTaskDragStart(task.id);
                        }}
                        onClick={() => onTaskClick?.(task)}
                        style={{
                            padding: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            cursor: 'grab',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{task.title}</div>
                        {task.description && (
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: 'var(--color-text-muted)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {task.description}
                            </div>
                        )}
                        {task.goalTasks && task.goalTasks.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '4px' }}>
                                {task.goalTasks.map((gt, idx) => (
                                    <React.Fragment key={gt.id}>
                                        {gt.goal?.title}
                                        {idx < task.goalTasks!.length - 1 && ', '}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
