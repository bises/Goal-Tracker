import React, { useState, useEffect, useMemo } from 'react';
import { CalendarView } from '../components/Calendar/CalendarView';
import { Task } from '../types';
import { taskApi } from '../api';
import AddTaskModal from '../components/AddTaskModal';
import { UnscheduledTasksSidebar } from '../components/UnscheduledTasksSidebar';
import { Toast } from '../components/Toast';
import { useTaskContext } from '../contexts/TaskContext';

export function PlannerPage() {
    const { tasks, scheduleTask } = useTaskContext();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [toast, setToast] = useState<{ level: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);

    // Compute unscheduled tasks from cached tasks
    const unscheduledTasks = useMemo(() => {
        return tasks.filter(t => !t.scheduledDate && !t.isCompleted);
    }, [tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const handleDateClick = (date: Date) => {
        console.log('Date clicked:', date);
        // Future: could open quick add task modal for this date
    };

    const handleTaskUpdate = () => {
        // No need to reload - cache is automatically updated via context
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setSelectedTask(null);
    };

    const handleUnscheduleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;
        try {
            await scheduleTask(taskId, null);
            setToast({ level: 'success', message: 'Task unscheduled' });
        } catch (error) {
            console.error('Failed to unschedule task:', error);
            setToast({ level: 'error', message: 'Failed to unschedule task' });
        }
    };

    return (
        <>
        <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 200px)' }}>
            {/* Left Sidebar - Unscheduled Tasks */}
            <UnscheduledTasksSidebar
                tasks={unscheduledTasks}
                isVisible={showSidebar}
                onClose={() => setShowSidebar(false)}
                onTaskDragStart={() => {}}
                onTaskClick={handleTaskClick}
                onUnscheduleDrop={handleUnscheduleDrop}
            />

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
                        setToast({ level: 'success', message: 'Task scheduled' });
                    }}
                />
            </div>
        </div>

        {/* Task Edit Modal */}
        <AddTaskModal
            isOpen={isEditModalOpen}
            onClose={handleCloseModal}
            onTaskAdded={handleTaskUpdate}
            editTask={selectedTask}
        />

        {/* Toast Notification */}
        {toast && (
            <Toast
                message={toast.message}
                level={toast.level}
                onClose={() => setToast(null)}
                autoClose={toast.level === 'error' ? 4000 : 2000}
            />
        )}
        </>
    );
}
