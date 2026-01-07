import React, { useState, useEffect } from 'react';
import { CalendarView } from '../components/Calendar/CalendarView';
import { Task } from '../types';
import { calendarApi, taskApi } from '../api';
import { X } from 'lucide-react';
import TaskCard from '../components/TaskCard';

export function PlannerPage() {
    const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        loadUnscheduledTasks();
    }, []);

    const loadUnscheduledTasks = async () => {
        try {
            const tasks = await taskApi.fetchTasks();
            const unscheduled = tasks.filter(t => !t.scheduledDate && !t.isCompleted);
            setUnscheduledTasks(unscheduled);
        } catch (error) {
            console.error('Error loading unscheduled tasks:', error);
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    const handleDateClick = (date: Date) => {
        console.log('Date clicked:', date);
        // Future: could open quick add task modal for this date
    };

    const handleTaskUpdate = () => {
        loadUnscheduledTasks();
        setSelectedTask(null);
    };

    const handleUnscheduleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;
        try {
            await taskApi.scheduleTask(taskId, null);
            await loadUnscheduledTasks();
            setToast({ type: 'success', message: 'Task unscheduled' });
            setTimeout(() => setToast(null), 2000);
        } catch (error) {
            console.error('Failed to unschedule task:', error);
            setToast({ type: 'error', message: 'Failed to unschedule task' });
            setTimeout(() => setToast(null), 3000);
        }
    };

    return (
        <>
        <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 200px)' }}>
            {/* Left Sidebar - Unscheduled Tasks */}
            {showSidebar && (
                <div style={{
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
                onDrop={handleUnscheduleDrop}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>Unscheduled Tasks</h3>
                        <button
                            className="icon-btn"
                            onClick={() => setShowSidebar(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    
                    {unscheduledTasks.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                            No unscheduled tasks
                        </div>
                    ) : (
                        unscheduledTasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                }}
                                style={{
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '8px',
                                    cursor: 'grab',
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{task.title}</div>
                                {task.description && (
                                    <div style={{
                                        fontSize: '12px',
                                        color: 'var(--color-text-muted)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {task.description}
                                    </div>
                                )}
                                {task.goalTasks && task.goalTasks.length > 0 && (
                                    <div style={{ fontSize: '11px', color: 'var(--color-accent)', marginTop: '4px' }}>
                                        {task.goalTasks.map(gt => gt.goal?.title).join(', ')}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Main Calendar */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {!showSidebar && (
                    <button
                        className="secondary-btn"
                        onClick={() => setShowSidebar(true)}
                        style={{ marginBottom: '16px' }}
                    >
                        Show Unscheduled Tasks
                    </button>
                )}
                <CalendarView
                    onTaskClick={handleTaskClick}
                    onDateClick={handleDateClick}
                    onScheduled={async () => {
                        await loadUnscheduledTasks();
                        setToast({ type: 'success', message: 'Task scheduled' });
                        setTimeout(() => setToast(null), 2000);
                    }}
                />
            </div>

            {/* Right Panel - Task Details */}
            {selectedTask && (
                <div style={{
                    width: '350px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '16px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>Task Details</h3>
                        <button
                            className="icon-btn"
                            onClick={() => setSelectedTask(null)}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <TaskCard
                        task={selectedTask}
                        onUpdate={handleTaskUpdate}
                        onEdit={() => {}}
                    />
                </div>
            )}
        </div>
        {toast && (
            <div style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: toast!.type === 'success' ? 'rgba(0, 200, 120, 0.2)' : 'rgba(200, 0, 80, 0.2)',
                border: `1px solid ${toast!.type === 'success' ? 'rgba(0, 200, 120, 0.6)' : 'rgba(200, 0, 80, 0.6)'}`,
                backdropFilter: 'blur(6px)'
            }}>
                {toast!.message}
            </div>
        )}
        </>
    );
}
