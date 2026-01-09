import React, { useState, useEffect, useMemo } from 'react';
import { CalendarView } from '../components/Calendar/CalendarView';
import { Task } from '../types';
import { taskApi } from '../api';
import AddTaskModal from '../components/AddTaskModal';
import { UnscheduledTasksContainer } from '../components/UnscheduledTasksSidebar';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { useTaskContext } from '../contexts/TaskContext';

export function PlannerPage() {
    const { tasks, scheduleTask } = useTaskContext();
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [toast, setToast] = useState<{ level: 'success' | 'error' | 'info' | 'warning'; message: string } | null>(null);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Compute unscheduled tasks from cached tasks
    const unscheduledTasks = useMemo(() => {
        return tasks.filter(t => !t.scheduledDate && !t.isCompleted);
    }, [tasks]);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setIsEditModalOpen(true);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setIsDateModalOpen(true);
    };

    const formatDateInput = (date: Date) => {
        const tzOff = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzOff).toISOString().split('T')[0];
    };

    const tasksForSelectedDate = useMemo(() => {
        if (!selectedDate) return [] as Task[];
        const target = selectedDate.toDateString();
        return tasks.filter(t => t.scheduledDate && new Date(t.scheduledDate).toDateString() === target);
    }, [tasks, selectedDate]);

    const handleTaskUpdate = () => {
        // No need to reload - cache is automatically updated via context
        setSelectedTask(null);
        setIsEditModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
        setSelectedTask(null);
    };

    const handleTaskDragStart = (taskId: string) => {
        // Store taskId for drag operations
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
            {/* Unscheduled Tasks Horizontal Bar - Always visible at top */}
            <UnscheduledTasksContainer
                tasks={unscheduledTasks}
                isVisible={true}
                onClose={() => {}}
                onTaskDragStart={handleTaskDragStart}
                onTaskClick={handleTaskClick}
                onUnscheduleDrop={handleUnscheduleDrop}
            />

            {/* Calendar */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <CalendarView
                    onTaskClick={handleTaskClick}
                    onDateClick={handleDateClick}
                    onScheduled={async () => {
                        setToast({ level: 'success', message: 'Task scheduled' });
                    }}
                />
            </div>

        {/* Date Tasks Modal */}
        <Modal
            isOpen={isDateModalOpen}
            onClose={() => setIsDateModalOpen(false)}
            title={selectedDate ? `Tasks for ${selectedDate.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}` : 'Tasks'}
            maxWidth="520px"
        >
            <div className="flex flex-col gap-2">
                {tasksForSelectedDate.length === 0 ? (
                    <div className="text-slate-400 p-2">No tasks for this date</div>
                ) : (
                    tasksForSelectedDate.map(task => (
                        <div
                            key={task.id}
                            onClick={() => { handleTaskClick(task); setIsDateModalOpen(false); }}
                            className="flex justify-between items-center p-2.5 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition"
                        >
                            <div className="flex-1">
                                <div className={`${task.isCompleted ? 'line-through opacity-70' : ''} font-semibold mb-1`}>{task.title}</div>
                                {task.description && <div className="text-xs text-slate-400 truncate">{task.description}</div>}
                            </div>
                            <div className="text-xs bg-cyan-500 px-2 py-1 rounded font-semibold whitespace-nowrap ml-3">{task.size}d</div>
                        </div>
                    ))
                )}
                <div className="flex justify-end mt-3">
                    <button
                        className="primary-btn"
                        onClick={() => {
                            setIsDateModalOpen(false);
                            setSelectedTask(null);
                            setIsEditModalOpen(true);
                        }}
                    >
                        Add Task{selectedDate ? ` — ${selectedDate.toLocaleDateString('en-US',{ month:'short', day:'numeric'})}` : ''}
                    </button>
                </div>
            </div>
        </Modal>

        {/* Task Edit Modal */}
        <AddTaskModal
            isOpen={isEditModalOpen}
            onClose={handleCloseModal}
            onTaskAdded={handleTaskUpdate}
            editTask={selectedTask}
            defaultScheduledDate={selectedDate && !selectedTask ? formatDateInput(selectedDate) : undefined}
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
