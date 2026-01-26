import React from 'react';
import { useTouchHandlers } from '../../hooks/useTouchHandlers';
import { Task } from '../../types';

interface WeekDayProps {
  date: Date;
  isToday: boolean;
  tasks: Task[];
  isMobile: boolean;
  onDayClick: (date: Date) => void;
  onDayLongPress: (date: Date) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (date: Date, e: React.DragEvent<HTMLDivElement>) => void;
}

export function WeekDay({
  date,
  isToday,
  tasks,
  isMobile,
  onDayClick,
  onDayLongPress,
  onDragOver,
  onDragLeave,
  onDrop,
}: WeekDayProps) {
  const touchHandlers = useTouchHandlers({
    onTap: () => onDayClick(date),
    onLongPress: () => onDayLongPress(date),
    disabled: !isMobile,
  });

  return (
    <div
      className={`week-day ${isToday ? 'today' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(date, e)}
      onClick={() => !isMobile && onDayClick(date)}
      {...touchHandlers}
    >
      <div className="day-header">
        <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
        <div className="day-number">{date.getDate()}</div>
      </div>
      <div className="day-tasks-list">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`task-card ${task.isCompleted ? 'completed' : ''}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('taskId', task.id);
            }}
          >
            <div className="task-title">{task.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
