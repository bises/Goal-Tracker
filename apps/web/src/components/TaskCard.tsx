import { formatScheduledDate, formatTimestamp } from '@goal-tracker/shared';
import { format } from 'date-fns';
import { Calendar, CalendarOff, Check, Edit2, LinkIcon, MoreVertical, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { taskApi } from '../api';
import { Goal, Task, TaskCategory } from '../types';
import { parseLocalDate } from '../utils/dateUtils';
import { SquircleCard } from './SquircleCard';
import { TaskEditSheet } from './TaskEditSheet';
import { Button } from './ui/button';
import { CustomCalendar } from './ui/custom-calendar';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

// ── Props ──────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  availableGoals?: Goal[];
  showActions?: boolean;
  onTaskUpdated?: () => void;
  /** When provided, shows an "Unlink" option in the menu (useful when goalTasks isn't populated on the task). */
  onUnlink?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────
const getCategoryIcon = (category?: TaskCategory): string => {
  if (!category) return '📝';
  const iconMap: Record<TaskCategory, string> = {
    WORK: '💼',
    PERSONAL: '👤',
    HEALTH: '🏃',
    LEARNING: '📚',
    FINANCE: '💰',
    SOCIAL: '👥',
    HOUSEHOLD: '🏠',
    OTHER: '📌',
  };
  return iconMap[category] || '📝';
};

const getCategoryLabel = (category?: TaskCategory): string => {
  if (!category) return '';
  const labelMap: Record<TaskCategory, string> = {
    WORK: 'Work',
    PERSONAL: 'Personal',
    HEALTH: 'Health',
    LEARNING: 'Learning',
    FINANCE: 'Finance',
    SOCIAL: 'Social',
    HOUSEHOLD: 'Household',
    OTHER: 'Other',
  };
  return labelMap[category] || '';
};

const formatDuration = (minutes?: number): string => {
  if (!minutes) return '';
  if (minutes >= 1440) {
    const days = minutes / 1440;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  } else if (minutes >= 60) {
    const hours = minutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  return `${minutes} min`;
};

// ── Component ──────────────────────────────────────────────────
export const TaskCard = ({
  task,
  availableGoals = [],
  showActions = true,
  onTaskUpdated,
  onUnlink,
}: TaskCardProps) => {
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!task) return null;

  const isCompleted = task.isCompleted;
  const categoryIcon = getCategoryIcon(task.category);
  const hasSchedule = !!task.scheduledDate;
  const linkedGoals = task.goalTasks?.filter((gt) => gt.goal) || [];

  // ── Actions ────────────────────────────────────────────────
  const notify = () => onTaskUpdated?.();

  const handleToggle = async () => {
    try {
      await taskApi.toggleComplete(task.id);
      notify();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleRescheduleDate = async (date: Date | undefined) => {
    if (!date) return;
    try {
      setIsLoading(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      await taskApi.scheduleTask(task.id, dateStr);
      setIsRescheduleOpen(false);
      notify();
    } catch (err) {
      console.error('Failed to reschedule task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnschedule = async () => {
    try {
      setIsLoading(true);
      await taskApi.updateTask(task.id, {
        scheduledDate: null as any,
        scheduledTime: null as any,
      });
      setIsRescheduleOpen(false);
      notify();
    } catch (err) {
      console.error('Failed to unschedule task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkGoal = async (goalId: string) => {
    try {
      setIsLoading(true);
      await taskApi.unlinkGoal(task.id, goalId);
      notify();
    } catch (err) {
      console.error('Failed to unlink goal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const goalIds = linkedGoals.map((gt) => gt.goal!.id!);
      await taskApi.deleteTask(task.id, goalIds);
      setIsDeleteConfirmOpen(false);
      notify();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSave = async () => {
    setIsEditSheetOpen(false);
    notify();
  };

  return (
    <>
      <SquircleCard
        style={{
          background: isCompleted
            ? 'linear-gradient(135deg, rgba(240, 249, 244, 1) 0%, rgba(240, 249, 244, 1) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)',
          border: isCompleted
            ? '2px solid rgba(34, 197, 94, 0.1)'
            : '2px solid rgba(255, 140, 66, 0.05)',
          opacity: isLoading ? 0.6 : 1,
          transition: 'opacity 0.2s',
        }}
        className="p-2 hover:shadow-lg flex items-center justify-between transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div
            className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: isCompleted ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 140, 66, 0.1)',
              color: isCompleted ? undefined : 'var(--energizing-orange)',
              opacity: isCompleted ? 0.6 : 1,
            }}
          >
            {categoryIcon}
          </div>

          {/* Content – tap to edit */}
          <button
            onClick={() => setIsEditSheetOpen(true)}
            className="flex-1 min-w-0 text-left transition-opacity hover:opacity-70"
          >
            <div
              className={`font-semibold text-sm truncate ${isCompleted ? 'line-through' : ''}`}
              style={{
                color: isCompleted ? 'var(--warm-gray)' : 'var(--deep-charcoal)',
                textDecorationColor: isCompleted ? '#22C55E' : undefined,
              }}
            >
              {task.title}
            </div>
            {(task.category ||
              task.estimatedDurationMinutes ||
              (task.goalTasks && task.goalTasks.length > 0)) && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--warm-gray)' }}>
                {task.category && getCategoryLabel(task.category)}
                {task.category &&
                  (task.estimatedDurationMinutes ||
                    (task.goalTasks && task.goalTasks.length > 0)) &&
                  ' · '}
                {task.estimatedDurationMinutes && formatDuration(task.estimatedDurationMinutes)}
                {task.estimatedDurationMinutes &&
                  task.goalTasks &&
                  task.goalTasks.length > 0 &&
                  ' · '}
                {task.goalTasks && task.goalTasks.length > 0 && '🎯'}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {isCompleted && task.completedAt ? (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}
                >
                  ✓ {formatTimestamp(task.completedAt)}
                </span>
              ) : (
                task.scheduledDate && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(255, 140, 66, 0.1)',
                      color: 'var(--energizing-orange)',
                    }}
                  >
                    📅 {formatScheduledDate(task.scheduledDate)}
                  </span>
                )
              )}
            </div>
          </button>
        </div>

        {/* ··· Menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 mr-2"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 140, 66, 0.08)',
                  color: 'var(--warm-gray)',
                }}
              >
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>
                <Edit2 size={14} />
                <span>Edit</span>
              </DropdownMenuItem>

              {!isCompleted && (
                <DropdownMenuItem onClick={() => setIsRescheduleOpen(true)}>
                  <Calendar size={14} />
                  <span>Reschedule</span>
                </DropdownMenuItem>
              )}

              {!isCompleted && hasSchedule && (
                <DropdownMenuItem onClick={handleUnschedule}>
                  <CalendarOff size={14} />
                  <span>Unschedule</span>
                </DropdownMenuItem>
              )}

              {linkedGoals.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {linkedGoals.length === 1 ? (
                    <DropdownMenuItem
                      onClick={() => handleUnlinkGoal(linkedGoals[0].goal!.id!)}
                      className="text-amber-600"
                    >
                      <LinkIcon size={14} />
                      <span className="truncate">Unlink from {linkedGoals[0].goal?.title}</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <LinkIcon size={14} />
                        <span>Unlink from goal</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {linkedGoals.map((gt) => (
                          <DropdownMenuItem
                            key={gt.goal!.id}
                            onClick={() => handleUnlinkGoal(gt.goal!.id!)}
                          >
                            🎯 {gt.goal?.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                </>
              )}

              {linkedGoals.length === 0 && onUnlink && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onUnlink} className="text-amber-600">
                    <LinkIcon size={14} />
                    <span>Unlink from goal</span>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteConfirmOpen(true)}
                style={{ color: '#ef4444' }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Toggle Complete */}
        <button
          onClick={handleToggle}
          className="flex-shrink-0 flex items-center justify-center transition-all hover:scale-110"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: isCompleted ? '#22C55E' : 'transparent',
            border: isCompleted ? 'none' : '2px solid var(--card-border)',
          }}
        >
          {isCompleted ? <Check size={24} color="white" strokeWidth={3} /> : null}
        </button>
      </SquircleCard>

      {/* ── Reschedule Calendar Dialog ── */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-md p-0 overflow-hidden"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <DialogTitle className="sr-only">Reschedule Task</DialogTitle>
          <CustomCalendar
            selected={hasSchedule ? parseLocalDate(task.scheduledDate!) : undefined}
            defaultMonth={hasSchedule ? parseLocalDate(task.scheduledDate!) : new Date()}
            fromYear={2020}
            toYear={2030}
            onSelect={handleRescheduleDate}
          />
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent
          className="w-[calc(100vw-2rem)] max-w-sm p-6"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <DialogTitle className="sr-only">Delete Task</DialogTitle>
          <div className="text-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(239, 68, 68, 0.1)' }}
            >
              <Trash2 size={24} style={{ color: '#ef4444' }} />
            </div>
            <h3
              className="text-lg font-bold font-display mb-1"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              Delete Task
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--warm-gray)' }}>
              Are you sure you want to delete &ldquo;{task.title}&rdquo;? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl text-white"
                style={{ background: '#ef4444' }}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Sheet ── */}
      <TaskEditSheet
        isOpen={isEditSheetOpen}
        onClose={() => setIsEditSheetOpen(false)}
        task={task}
        onSave={handleEditSave}
        availableGoals={availableGoals}
      />
    </>
  );
};
