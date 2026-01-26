import React from 'react';
import { useTouchHandlers } from '../../hooks/useTouchHandlers';
import { Task } from '../../types';

interface CalendarDayProps {
  date: Date;
  isToday: boolean;
  isEmpty?: boolean;
  incompleteTasks: Task[];
  isMobile: boolean;
  onDayClick: (date: Date) => void;
  onDayLongPress: (date: Date) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (date: Date, e: React.DragEvent<HTMLDivElement>) => void;
}

export function CalendarDay({
  date,
  isToday,
  isEmpty,
  incompleteTasks,
  isMobile,
  onDayClick,
  onDayLongPress,
  onDragOver,
  onDragLeave,
  onDrop,
}: CalendarDayProps) {
  const touchHandlers = useTouchHandlers({
    onTap: () => onDayClick(date),
    onLongPress: () => onDayLongPress(date),
    disabled: !isMobile,
  });

  if (isEmpty) {
    return <div className="calendar-day empty" />;
  }

  return (
    <div
      className={`calendar-day ${isToday ? 'today' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(date, e)}
      onClick={() => !isMobile && onDayClick(date)}
      {...touchHandlers}
    >
      <div className="day-header">{date.getDate()}</div>
      {/* Mobile: show incomplete count only */}
      {incompleteTasks.length > 0 && (
        <div className="md:hidden mt-1">
          <span className="inline-flex items-center justify-center text-[11px] font-bold bg-cyan-500/90 text-black rounded-full px-1.5 py-0.5 shadow-[0_1px_4px_rgba(6,182,212,0.4)]">
            {incompleteTasks.length}
          </span>
        </div>
      )}
      {/* Desktop: show first incomplete pill + hidden count badge */}
      <div className="day-tasks hidden md:flex md:flex-col md:gap-1">
        {incompleteTasks.slice(0, 1).map((task) => (
          <div key={task.id} className="task-pill-wrapper">
            <div
              className={`task-pill ${task.isCompleted ? 'completed' : ''}`}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('taskId', task.id);
              }}
            >
              {task.title}
            </div>
            <div className="task-tooltip">{task.title}</div>
          </div>
        ))}
        {incompleteTasks.length > 1 && (
          <div className="hidden-tasks-badge">+{incompleteTasks.length - 1}</div>
        )}
      </div>
    </div>
  );
}
