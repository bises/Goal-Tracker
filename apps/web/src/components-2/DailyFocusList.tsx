import { getTodayString } from '@goal-tracker/shared';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Badge } from '../components/ui/badge';

import { api } from '../api';
import { Spinner } from '../components/ui/spinner';
import { useTaskContext } from '../contexts/TaskContext';
import { Goal } from '../types';
import { SquircleCard } from './SquircleCard';
import { TaskCard } from './TaskCard';
import { TaskEditSheet } from './TaskEditSheet';

export const DailyFocusList = () => {
  const navigate = useNavigate();
  const { tasks, loading, toggleComplete, refreshTasks } = useTaskContext();
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const goalsData = await api.fetchGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const todayTasks = useMemo(() => {
    const today = getTodayString();

    const filtered = tasks
      .filter((task) => task && task.id) // Filter out undefined/invalid tasks
      .filter((task) => {
        if (!task.scheduledDate) return false;
        const taskDate = task.scheduledDate.split('T')[0];
        return taskDate === today;
      })
      .sort((a, b) => {
        // Sort: incomplete first, then by creation date
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    return filtered;
  }, [tasks]);

  const incompleteTasks = todayTasks.filter((task) => !task.isCompleted);
  const completedTasks = todayTasks.filter((task) => task.isCompleted);

  const handleToggle = async (taskId: string) => {
    try {
      await toggleComplete(taskId);
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    // TODO: Implement delete functionality
    // For now, just log - we'll implement the actual API call later
  };

  const handleReschedule = (taskId: string) => {
    // TODO: Open date picker modal
    // For now, just log - we'll implement the date picker modal later
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsEditSheetOpen(true);
    }
  };

  if (loading) {
    return (
      <SquircleCard className="p-8 text-center">
        <Spinner className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--energizing-orange)' }} />
        <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
          Loading tasks...
        </p>
      </SquircleCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completed Tasks Section - Collapsible */}
      {completedTasks.length > 0 && (
        <Accordion type="single" collapsible defaultValue="completed">
          <AccordionItem value="completed" className="border-none">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div
                    className="text-xl font-bold font-display"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Completed Today
                  </div>
                  <Badge
                    className="text-xs font-bold"
                    style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#22C55E',
                      border: 'none',
                    }}
                  >
                    {completedTasks.length}
                  </Badge>
                </div>
                {completedTasks.length > 2 && (
                  <span
                    className="text-sm font-semibold transition-colors hover:underline cursor-pointer"
                    style={{ color: 'var(--energizing-orange)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const today = getTodayString();
                      navigate(`/tasks?tab=completed&date=${today}`);
                    }}
                  >
                    See all
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="space-y-3">
                {completedTasks.slice(0, 2).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={handleToggle}
                    onReschedule={handleReschedule}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Incomplete Tasks Section - Daily Focus */}
      {incompleteTasks.length > 0 && (
        <section className="space-y-4">
          <div className="px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="text-xl font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  Daily Focus
                </div>
                <Badge
                  className="text-xs font-bold"
                  style={{
                    background: 'rgba(255, 140, 66, 0.15)',
                    color: 'var(--energizing-orange)',
                    border: 'none',
                  }}
                >
                  {incompleteTasks.length}
                </Badge>
              </div>
              {incompleteTasks.length > 3 && (
                <span
                  className="text-sm font-semibold transition-colors hover:underline cursor-pointer"
                  style={{ color: 'var(--energizing-orange)' }}
                  onClick={() => {
                    const today = getTodayString();
                    navigate(`/tasks?tab=pending&date=${today}`);
                  }}
                >
                  See all
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {incompleteTasks.slice(0, 3).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onReschedule={handleReschedule}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {todayTasks.length === 0 && (
        <SquircleCard className="p-8 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--deep-charcoal)' }}>
            No Tasks Scheduled
          </h3>
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            Schedule some tasks for today to get started!
          </p>
        </SquircleCard>
      )}

      {/* Task Edit Sheet */}
      <TaskEditSheet
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSave={refreshTasks}
        availableGoals={goals}
      />
    </div>
  );
};
