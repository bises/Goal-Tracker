import React from 'react';
import { Task, TaskEvent } from '../types';
import TaskCard from './Tasks/TaskCard';

interface AllTasksListProps {
  tasks: Task[];
  onTaskEvent?: (taskId: string, event: TaskEvent) => void;
}

export const AllTasksList: React.FC<AllTasksListProps> = ({ tasks, onTaskEvent }) => {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-400">
        <p className="text-sm sm:text-base">No tasks yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onTaskEvent={onTaskEvent}
          showEdit={true}
          showUnlink={false}
          showDelete={true}
          showLinkedGoals={true}
          showCompletedBadge={true}
        />
      ))}
    </div>
  );
};
