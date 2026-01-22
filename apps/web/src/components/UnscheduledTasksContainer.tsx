import { CalendarPlus, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';
import { Task } from '../types';

interface UnscheduledTasksContainerProps {
  tasks: Task[];
  isVisible: boolean;
  onClose: () => void;
  onTaskDragStart: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
  onScheduleClick?: (task: Task) => void;
  onUnscheduleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function UnscheduledTasksContainer({
  tasks,
  isVisible,
  onClose,
  onTaskDragStart,
  onTaskClick,
  onScheduleClick,
  onUnscheduleDrop,
}: UnscheduledTasksContainerProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  if (!isVisible || tasks.length === 0) return null;

  return (
    <div className="w-full overflow-hidden border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      {/* Mobile Header and Expander */}
      <div
        className="md:hidden flex justify-between items-center px-4 py-3 cursor-pointer"
        onClick={() => setIsMobileExpanded(!isMobileExpanded)}
      >
        <h2 className="font-semibold text-cyan-300">Unscheduled ({tasks.length})</h2>
        <ChevronDown
          size={20}
          className={`text-cyan-300 transition-transform ${isMobileExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Desktop View - Horizontal Scroll */}
      <div className="hidden md:block px-4 py-3">
        <div
          className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onUnscheduleDrop}
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300 pr-2 whitespace-nowrap">
            Unscheduled ({tasks.length})
          </div>
          {tasks.map((task) => (
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
      </div>

      {/* Mobile View - Vertical List (conditionally rendered) */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileExpanded ? 'max-h-60' : 'max-h-0'
        }`}
      >
        <div
          className="p-4 pt-0 space-y-2"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onUnscheduleDrop}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg"
              draggable // Still allow dragging from this list on mobile
              onDragStart={(e) => {
                e.dataTransfer.setData('taskId', task.id);
                onTaskDragStart(task.id);
              }}
            >
              <div
                className="flex-1 cursor-pointer truncate pr-2"
                onClick={() => onTaskClick?.(task)}
              >
                <span className="font-medium text-white ">{task.title}</span>
              </div>
              <button
                onClick={() => onScheduleClick?.(task)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Schedule Task"
              >
                <CalendarPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
