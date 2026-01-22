import React from 'react';
import { Task, TaskEvent } from '../types';
import TaskCard from './Tasks/TaskCard';

interface TaskListComponentProps {
  tasks: Task[];
  onTaskEvent?: (taskId: string, event: TaskEvent) => void;
  onUnlink?: (taskId: string) => void;
  showUnlink?: boolean;
  showLinkedGoals?: boolean;
  /**
   * Whether to display task badges such as size and date badges.
   */
  showBadges?: boolean;
  emptyMessage?: string;
  title?: string;
}

export const TaskListComponent: React.FC<TaskListComponentProps> = ({
  tasks,
  onTaskEvent,
  onUnlink,
  showUnlink = false,
  showLinkedGoals = true,
  showBadges = true,
  emptyMessage = 'No tasks yet. Create one to get started!',
  title,
}) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-400">
        <p className="text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onTaskEvent={onTaskEvent}
            onUnlink={onUnlink}
            showEdit={true}
            showUnlink={showUnlink}
            showDelete={true}
            showLinkedGoals={showLinkedGoals}
            showCompletedBadge={true}
            showBadges={showBadges}
          />
        ))}
      </div>
    </div>
  );
};
