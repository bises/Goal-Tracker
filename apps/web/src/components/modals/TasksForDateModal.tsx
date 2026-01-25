import React from 'react';
import { Task, TaskEvent } from '../../types';
import { TaskListComponent } from '../Tasks/TaskListComponent';
import { Modal } from './Modal';

interface TasksForDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  onTaskEvent: (taskId: string, event: TaskEvent) => void;
  onAddTask: () => void;
}

export const TasksForDateModal: React.FC<TasksForDateModalProps> = ({
  isOpen,
  onClose,
  date,
  tasks,
  onTaskEvent,
  onAddTask,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        date
          ? `Tasks for ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
          : 'Tasks'
      }
      maxWidth="520px"
    >
      <div className="mt-4">
        <TaskListComponent
          tasks={tasks}
          onTaskEvent={onTaskEvent}
          emptyMessage="No tasks for this date"
          showLinkedGoals={false}
          showBadges={false}
        />
        <div className="flex justify-end mt-3">
          <button className="primary-btn" onClick={onAddTask}>
            Add Task
            {date
              ? ` — ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
};
