import { Task } from '../types';
import { useTaskContext } from '../contexts/TaskContext';
import { CheckCircle2, Circle, Edit2, Trash2 } from 'lucide-react';

interface TaskCardProps {
    task: Task;
    onUpdate: () => void;
    onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onUpdate, onEdit }: TaskCardProps) {
    const { toggleComplete, deleteTask } = useTaskContext();
    const handleToggleComplete = async () => {
        try {
            await toggleComplete(task.id);
            onUpdate();
        } catch (error) {
            console.error('Failed to toggle task completion:', error);
        }
    };

    const handleDelete = async () => {
        if (confirm(`Delete task "${task.title}"?`)) {
            try {
                const goalIds = (task.goalTasks || [])
                    .map(gt => gt.goal?.id)
                    .filter((id): id is string => Boolean(id));
                await deleteTask(task.id);
                onUpdate();
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        }
    };

    const linkedGoals = task.goalTasks || [];
    
    // Determine status color
    const isOverdue = task.scheduledDate && !task.isCompleted && 
        new Date(task.scheduledDate) < new Date();
    const statusColor = task.isCompleted 
        ? 'border-green-500' 
        : isOverdue 
        ? 'border-red-500' 
        : task.scheduledDate 
        ? 'border-cyan-500' 
        : 'border-slate-600';

    return (
        <div className={`group relative rounded-xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-l-4 ${statusColor} shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5 ${task.isCompleted ? 'opacity-75' : ''}`}>
            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Checkbox */}
                    <button
                        onClick={handleToggleComplete}
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
                        <h3 className={`font-semibold text-lg text-white mb-1 ${task.isCompleted ? 'line-through' : ''}`}>
                            {task.title}
                        </h3>
                        
                        {task.description && (
                            <p className="text-sm text-slate-400 mb-3 leading-relaxed">{task.description}</p>
                        )}
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 text-xs mb-3">
                            <span className="inline-flex items-center px-2.5 py-1 bg-slate-700/60 text-slate-200 rounded-full font-medium border border-slate-600/50">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                {task.size} {task.size === 1 ? 'day' : 'days'}
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
                                    {new Date(task.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                            {task.completedAt && (
                                <span className="inline-flex items-center px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full font-medium border border-green-500/40">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                            )}
                        </div>

                        {/* Linked Goals */}
                        {linkedGoals.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {linkedGoals.map(goalTask => (
                                    <span
                                        key={goalTask.id}
                                        className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-medium border border-blue-500/40 text-xs"
                                    >
                                        🎯 {goalTask.goal?.title || 'Unknown Goal'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
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
                            onClick={handleDelete}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete task"
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
}
