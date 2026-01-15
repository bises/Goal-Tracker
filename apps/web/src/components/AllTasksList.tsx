import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';
import React from 'react';
import { useTaskContext } from '../contexts/TaskContext';
import { Task } from '../types';

// Helper: Parse YYYY-MM-DD string as local date (not UTC)
const parseLocalDate = (dateStr: string): Date => {
    // Handle both 'YYYY-MM-DD' and 'YYYY-MM-DDTHH:mm:ss.sssZ' formats
    const dateOnly = dateStr.split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    return new Date(year, month - 1, day);
};

interface AllTasksListProps {
    tasks: Task[];
    onUpdate: () => void;
    onEdit?: (task: Task) => void;
}

export const AllTasksList: React.FC<AllTasksListProps> = ({ tasks, onUpdate, onEdit }) => {
    const { toggleComplete, deleteTask } = useTaskContext();

    const handleToggleTask = async (taskId: string) => {
        try {
            await toggleComplete(taskId);
            onUpdate();
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('Delete this task permanently?')) {
            try {
                await deleteTask(taskId);
                onUpdate();
            } catch (e) {
                console.error("Failed to delete task", e);
            }
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 sm:py-16 text-gray-400">
                <p className="text-sm sm:text-base">No tasks yet. Create one to get started!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {tasks.map((task) => {
                const isOverdue = task.scheduledDate && !task.isCompleted && 
                    parseLocalDate(task.scheduledDate) < new Date();
                const statusColor = task.isCompleted 
                    ? 'border-green-500' 
                    : isOverdue 
                    ? 'border-red-500' 
                    : task.scheduledDate 
                    ? 'border-cyan-500' 
                    : 'border-slate-600';
                const linkedGoals = task.goalTasks || [];
                
                return (
                    <div
                        key={task.id}
                        className={`group relative rounded-xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-l-4 ${statusColor} shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5 ${task.isCompleted ? 'opacity-75' : ''}`}
                    >
                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <button
                                    onClick={() => handleToggleTask(task.id)}
                                    className="flex-shrink-0 text-slate-400 hover:text-white transition-all duration-200 mt-0.5 hover:scale-110"
                                    title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                                >
                                    {task.isCompleted ? (
                                        <CheckCircle2 size={22} className="text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                                    ) : (
                                        <Circle size={22} className="hover:text-cyan-400" />
                                    )}
                                </button>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-base text-white mb-1 ${task.isCompleted ? 'line-through' : ''}`}>
                                        {task.title}
                                    </h4>
                                    {task.description && (
                                        <p className="text-sm text-slate-400 mb-3 leading-relaxed">{task.description}</p>
                                    )}
                                    
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-700/60 text-slate-200 rounded-full font-medium border border-slate-600/50">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                            </svg>
                                            {task.size}d
                                        </span>
                                        {task.scheduledDate && (
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium border ${
                                                isOverdue 
                                                    ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                                                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                            }`}>
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {parseLocalDate(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        {task.isCompleted && task.completedAt && (
                                            <span className="inline-flex items-center px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full font-medium border border-green-500/40">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                        {linkedGoals.length > 0 && linkedGoals.map((gt, index) => (
                                            <span
                                                key={`${task.id}-goal-${gt.goal?.id || index}`}
                                                className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-medium border border-blue-500/40"
                                            >
                                                🎯 {gt.goal?.title || 'Unknown Goal'}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Action Buttons - visible on hover (desktop) or always (mobile) */}
                                <div className="flex-shrink-0 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                                    {onEdit && !task.isCompleted && (
                                        <button
                                            onClick={() => onEdit(task)}
                                            className="p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-200"
                                            title="Edit task"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                                        title="Delete task permanently"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Subtle glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                );
            })}
        </div>
    );
};
