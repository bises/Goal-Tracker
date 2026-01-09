import React from 'react';
import { Task } from '../types';

interface UnscheduledTasksContainerProps {
    tasks: Task[];
    isVisible: boolean;
    onClose: () => void;
    onTaskDragStart: (taskId: string) => void;
    onTaskClick?: (task: Task) => void;
    onUnscheduleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function UnscheduledTasksContainer({
    tasks,
    isVisible,
    onClose,
    onTaskDragStart,
    onTaskClick,
    onUnscheduleDrop
}: UnscheduledTasksContainerProps) {
    if (!isVisible) return null;

    return (
        <div className="w-full bg-white/5 border-b border-white/10 overflow-hidden">
            <div className="px-4 py-3">
                <h3 className="text-sm font-semibold mb-3 text-slate-300">Unscheduled Tasks</h3>
                {tasks.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">No unscheduled tasks</div>
                ) : (
                    <div 
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onUnscheduleDrop}
                    >
                        {tasks.map(task => (
                            <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('taskId', task.id);
                                    onTaskDragStart(task.id);
                                }}
                                onClick={() => onTaskClick?.(task)}
                                className="flex-shrink-0 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-full cursor-grab active:cursor-grabbing transition whitespace-nowrap text-sm font-medium text-cyan-300 shadow-sm"
                                title={task.title}
                            >
                                {task.title}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
