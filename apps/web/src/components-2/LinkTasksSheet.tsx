import { Check, Link2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { taskApi } from '../api';
import { Button } from '../components/ui/button';
import { Goal, Task } from '../types';

interface LinkTasksSheetProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  onTasksLinked: () => void;
}

export const LinkTasksSheet = ({ isOpen, onClose, goal, onTasksLinked }: LinkTasksSheetProps) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [initialLinkedIds, setInitialLinkedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      const linkedIds = new Set(
        goal.goalTasks?.filter((gt) => gt.goalId === goal.id).map((gt) => gt.taskId) || []
      );
      setSelectedTaskIds(linkedIds);
      setInitialLinkedIds(linkedIds);
      setSearchQuery('');
    }
  }, [isOpen, goal]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskApi.fetchTasks();
      setAllTasks(Array.isArray(tasks) ? tasks : []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return allTasks;
    const q = searchQuery.toLowerCase();
    return allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [allTasks, searchQuery]);

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    if (selectedTaskIds.size !== initialLinkedIds.size) return true;
    for (const id of selectedTaskIds) {
      if (!initialLinkedIds.has(id)) return true;
    }
    return false;
  }, [selectedTaskIds, initialLinkedIds]);

  const handleSave = async () => {
    try {
      setSubmitting(true);

      // Link newly selected tasks using dedicated endpoint
      for (const taskId of selectedTaskIds) {
        if (!initialLinkedIds.has(taskId)) {
          await taskApi.linkGoal(taskId, goal.id);
        }
      }

      // Unlink tasks that were removed using dedicated endpoint
      for (const linkedId of initialLinkedIds) {
        if (!selectedTaskIds.has(linkedId)) {
          await taskApi.unlinkGoal(linkedId, goal.id);
        }
      }

      onTasksLinked();
      onClose();
    } catch (error) {
      console.error('Failed to link tasks:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60" style={{ zIndex: 1300 }} />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[24px] max-h-[85vh] overflow-hidden"
          style={{ background: 'var(--peach-cream)', zIndex: 1400 }}
          aria-describedby="link-tasks-description"
        >
          {/* Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mt-4 mb-4" />

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'var(--card-border)' }}
          >
            <Drawer.Title asChild>
              <h2
                className="text-xl font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                Link Tasks
              </h2>
            </Drawer.Title>
            <Button variant="ghost" size="icon" onClick={onClose} className="w-10 h-10 rounded-xl">
              <X size={24} />
            </Button>
          </div>

          {/* Hidden description */}
          <Drawer.Description
            id="link-tasks-description"
            className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0"
            style={{ clip: 'rect(0, 0, 0, 0)' }}
          >
            Select tasks to link to your goal.
          </Drawer.Description>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            {/* Goal info */}
            <div
              className="p-4 rounded-2xl mb-4"
              style={{
                background: 'rgba(255, 140, 66, 0.08)',
                border: '1px solid rgba(255, 140, 66, 0.15)',
              }}
            >
              <p
                className="text-sm font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {goal.title}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--warm-gray)' }}>
                A task can be linked to multiple goals
              </p>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-4 py-3 rounded-xl border text-sm"
                style={{
                  borderColor: 'var(--card-border)',
                  color: 'var(--deep-charcoal)',
                  background: 'white',
                }}
              />
            </div>

            {/* Task list */}
            {loading ? (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--warm-gray)' }}>
                Loading tasks...
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--warm-gray)' }}>
                {searchQuery ? 'No tasks match your search' : 'No tasks available'}
              </div>
            ) : (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ borderColor: 'var(--card-border)', background: 'white' }}
              >
                {filteredTasks.map((task, idx) => {
                  const isSelected = selectedTaskIds.has(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors active:bg-gray-50"
                      style={{
                        borderBottom:
                          idx < filteredTasks.length - 1 ? '1px solid var(--card-border)' : 'none',
                        background: isSelected ? 'rgba(255, 140, 66, 0.06)' : 'transparent',
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isSelected ? 'var(--energizing-orange)' : 'transparent',
                          border: isSelected
                            ? '2px solid var(--energizing-orange)'
                            : '2px solid var(--card-border)',
                        }}
                      >
                        {isSelected && <Check size={12} color="white" strokeWidth={3} />}
                      </div>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{
                            color: 'var(--deep-charcoal)',
                            textDecoration: task.isCompleted ? 'line-through' : 'none',
                            opacity: task.isCompleted ? 0.6 : 1,
                          }}
                        >
                          {task.title}
                        </p>
                        <div
                          className="flex items-center gap-2 mt-0.5 text-xs"
                          style={{ color: 'var(--warm-gray)' }}
                        >
                          {task.isCompleted && (
                            <span className="flex items-center gap-0.5">
                              <Check size={10} /> Done
                            </span>
                          )}
                          {(task.goalTasks?.length || 0) > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Link2 size={10} /> {task.goalTasks?.length} goal
                              {(task.goalTasks?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Spacer */}
            <div className="h-6" />
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 pb-20 border-t flex items-center gap-3 flex-shrink-0"
            style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}
          >
            {/* Selected count */}
            <div
              className="text-sm font-medium flex-shrink-0"
              style={{ color: 'var(--warm-gray)' }}
            >
              {selectedTaskIds.size} selected
            </div>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={submitting || !hasChanges}>
              <Link2 size={16} className="mr-1" />
              {submitting ? 'Saving...' : 'Save Links'}
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
