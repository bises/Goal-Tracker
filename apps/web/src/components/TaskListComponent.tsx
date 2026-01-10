import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useTaskContext } from '../contexts/TaskContext';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

interface TaskListComponentProps {
    goalId: string;
    onTasksUpdated: () => void;
}

interface TaskItem {
    task: {
        id: string;
        title: string;
        description?: string;
        size: number;
        isCompleted: boolean;
        scheduledDate?: string;
        completedAt?: string;
    };
}

interface Child {
    id: string;
    title: string;
    description?: string;
    scope: string;
    progressMode: string;
    targetValue: number;
    currentValue: number;
    parentId: string | null;
    isMarkedComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

interface TasksData {
    goalTasks: TaskItem[];
    children: Child[];
}

export const TaskListComponent: React.FC<TaskListComponentProps> = ({ goalId, onTasksUpdated }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tasksData, setTasksData] = useState<TasksData | null>(null);
    const { toggleComplete, updateTaskFields, deleteTask } = useTaskContext();

    const loadTasks = async () => {
        if (isExpanded || isLoading) return;
        try {
            setIsLoading(true);
            const data = await api.getGoalTasks(goalId);
            setTasksData(data);
            setIsExpanded(true);
        } catch (e) {
            console.error("Failed to load tasks", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleTask = async (taskId: string) => {
        try {
            await toggleComplete(taskId);
            // Reload tasks to get updated data
            const data = await api.getGoalTasks(goalId);
            setTasksData(data);
            onTasksUpdated();
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const handleUnlinkTask = async (taskId: string) => {
        if (confirm('Unlink this task from the goal? (Task will not be deleted)')) {
            try {
                // Update the task's goalIds via context (server returns canonical state)
                await updateTaskFields(taskId, { goalIds: [] });
                
                // Reload tasks
                const data = await api.getGoalTasks(goalId);
                setTasksData(data);
                onTasksUpdated();
            } catch (e) {
                console.error("Failed to unlink task", e);
            }
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Delete this task permanently?')) {
            try {
                await deleteTask(taskId);
                // Reload tasks
                const data = await api.getGoalTasks(goalId);
                setTasksData(data);
                onTasksUpdated();
            } catch (e) {
                console.error("Failed to delete task", e);
            }
        }
    };

    if (!isExpanded) {
        return (
            <div className="glass-panel p-6 mb-8">
                <button
                    onClick={loadTasks}
                    disabled={isLoading}
                    className="text-white font-medium text-lg hover:text-blue-400 transition-colors"
                >
                    {isLoading ? '↻ Loading tasks...' : '⊕ Load Tasks'}
                </button>
            </div>
        );
    }

    if (!tasksData) {
        return null;
    }

    const { goalTasks, children } = tasksData;
    const hasSubgoals = children && children.length > 0;
    const hasLinkedTasks = goalTasks && goalTasks.length > 0;

    return (
        <div className="glass-panel p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Tasks</h2>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Collapse"
                >
                    ⊖
                </button>
            </div>

            {/* Linked Tasks */}
            {hasLinkedTasks && (
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Linked Tasks</h3>
                    <div className="space-y-3">
                        {goalTasks.map((gt) => (
                            <div
                                key={gt.task.id}
                                className={`rounded-lg p-4 hover:bg-white/10 transition-colors ${
                                    gt.task.isCompleted
                                        ? 'bg-white/5 border-l-4 border-green-500/50 opacity-70'
                                        : 'bg-white/5'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <button
                                        onClick={() => handleToggleTask(gt.task.id)}
                                        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors mt-1"
                                        title={gt.task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                    >
                                        {gt.task.isCompleted ? (
                                            <CheckCircle2 size={20} className="text-green-400" />
                                        ) : (
                                            <Circle size={20} />
                                        )}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-base text-white">
                                            {gt.task.title}
                                        </p>
                                        {gt.task.description && (
                                            <p className="text-sm text-slate-400 mt-1">{gt.task.description}</p>
                                        )}
                                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                            <span className="px-2 py-1 bg-slate-700/50 text-slate-300 rounded">
                                                Size: {gt.task.size}
                                            </span>
                                            {gt.task.scheduledDate && (
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                                    📅 {new Date(gt.task.scheduledDate).toLocaleDateString()}
                                                </span>
                                            )}
                                            {gt.task.isCompleted && gt.task.completedAt && (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded">
                                                    ✓ {new Date(gt.task.completedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 flex gap-2">
                                        <button
                                            onClick={() => handleUnlinkTask(gt.task.id)}
                                            className="text-slate-400 hover:text-yellow-400 transition-colors"
                                            title="Unlink from goal"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"></path>
                                                <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"></path>
                                                <line x1="8" y1="2" x2="8" y2="5"></line>
                                                <line x1="2" y1="8" x2="5" y2="8"></line>
                                                <line x1="16" y1="19" x2="16" y2="22"></line>
                                                <line x1="19" y1="16" x2="22" y2="16"></line>
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTask(gt.task.id)}
                                            className="text-slate-400 hover:text-red-400 transition-colors"
                                            title="Delete task permanently"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Subgoals */}
            {hasSubgoals && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Subgoals</h3>
                    <div className="space-y-2">
                        {children.map((child) => (
                            <div
                                key={child.id}
                                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors"
                            >
                                <p className="font-medium text-white">{child.title}</p>
                                {child.description && (
                                    <p className="text-xs text-slate-400 mt-1">{child.description}</p>
                                )}
                                <div className="flex gap-2 mt-2 text-xs">
                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                        {child.scope}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                        {child.progressMode.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!hasLinkedTasks && !hasSubgoals && (
                <p className="text-slate-400 text-center py-4">No tasks or subgoals yet</p>
            )}
        </div>
    );
};
