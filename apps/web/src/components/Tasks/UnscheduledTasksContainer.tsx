import React from 'react';
import { Task } from '../../types';

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
  onUnscheduleDrop,
}: UnscheduledTasksContainerProps) {
  if (!isVisible) return null;

  return (
    <div className="w-full overflow-hidden">
      <div className="px-3 py-2 md:px-4 md:py-3">
        <div
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent sm:gap-1.5 sm:pb-1"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onUnscheduleDrop}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id);
                onTaskDragStart(task.id);
              }}
              onClick={() => onTaskClick?.(task)}
              className="flex-shrink-0 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-full cursor-grab active:cursor-grabbing transition text-sm font-medium text-cyan-300 shadow-sm sm:px-2 sm:py-1 sm:text-xs max-w-[200px] truncate"
              title={task.title}
            >
              {task.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
