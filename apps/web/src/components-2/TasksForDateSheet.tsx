import { Plus, X } from 'lucide-react';
import { Drawer } from 'vaul';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Task } from '../types';
import { TaskCard } from './TaskCard';

interface TasksForDateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleComplete: (taskId: string) => Promise<void>;
  onAddTask: () => void;
}

export const TasksForDateSheet = ({
  isOpen,
  onClose,
  date,
  tasks,
  onTaskClick,
  onToggleComplete,
  onAddTask,
}: TasksForDateSheetProps) => {
  const formattedDate = date
    ? date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay
          className="fixed inset-0 bg-black/40"
          style={{ zIndex: 'var(--z-modal-backdrop)' }}
        />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-3xl flex flex-col"
          style={{ background: 'var(--peach-cream)', zIndex: 'var(--z-modal)' }}
        >
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-2" />

          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <div className="flex-1">
              <h3
                className="text-xl font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {formattedDate || 'Tasks'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--warm-gray)' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Task List */}
          <ScrollArea className="flex-1 px-4 py-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📅</div>
                <p
                  className="text-base font-semibold mb-1"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  No tasks scheduled
                </p>
                <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  Add a task to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggleComplete}
                    onEdit={() => onTaskClick(task)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with Add Button */}
          <div className="p-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
            <Button
              onClick={onAddTask}
              className="w-full rounded-2xl font-semibold text-white py-6"
              style={{ background: 'var(--gradient-primary)' }}
            >
              <Plus size={20} className="mr-2" />
              Add Task for {date?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
