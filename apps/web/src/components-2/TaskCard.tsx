import { parseLocalDate } from '@goal-tracker/shared';
import { Calendar, Check } from 'lucide-react';
import { Task, TaskCategory } from '../types';
import { SquircleCard } from './SquircleCard';

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onReschedule?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
}

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
  } else {
    return `${minutes} min`;
  }
};

export const TaskCard = ({ task, onToggle, onReschedule, onEdit }: TaskCardProps) => {
  if (!task) {
    console.error('TaskCard received undefined task');
    return null;
  }

  const isCompleted = task.isCompleted;
  const categoryIcon = getCategoryIcon(task.category);

  return (
    <SquircleCard
      style={{
        background: isCompleted
          ? 'linear-gradient(135deg, rgba(240, 249, 244, 1) 0%, rgba(240, 249, 244, 1) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 1) 100%)',
        border: isCompleted
          ? '2px solid rgba(34, 197, 94, 0.1)'
          : '2px solid rgba(255, 140, 66, 0.05)',
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

        {/* Content - Clickable */}
        <button
          onClick={() => onEdit?.(task.id)}
          className="flex-1 min-w-0 text-left transition-opacity hover:opacity-70"
          disabled={!onEdit}
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
            <div
              className="text-xs mt-0.5"
              style={{
                color: 'var(--warm-gray)',
              }}
            >
              {task.category && getCategoryLabel(task.category)}
              {task.category &&
                (task.estimatedDurationMinutes || (task.goalTasks && task.goalTasks.length > 0)) &&
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
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22C55E',
                }}
              >
                ✓{' '}
                {parseLocalDate(task.completedAt.split('T')[0]).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
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
                  📅{' '}
                  {parseLocalDate(task.scheduledDate.split('T')[0]).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              )
            )}
          </div>
        </button>
      </div>

      {/* Calendar Button */}
      {onReschedule && !isCompleted && (
        <button
          onClick={() => onReschedule(task.id)}
          className="flex-shrink-0 flex items-center justify-center transition-all hover:scale-110 mr-2"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 140, 66, 0.1)',
            color: 'var(--energizing-orange)',
          }}
        >
          <Calendar size={22} />
        </button>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => onToggle(task.id)}
        className="flex-shrink-0 flex items-center justify-center transition-all hover:scale-110"
        style={{
          width: isCompleted ? '44px' : '44px',
          height: isCompleted ? '44px' : '44px',
          borderRadius: '50%',
          background: isCompleted ? '#22C55E' : 'transparent',
          border: isCompleted ? 'none' : '2px solid var(--card-border)',
        }}
      >
        {isCompleted ? <Check size={24} color="white" strokeWidth={3} /> : null}
      </button>
    </SquircleCard>
  );
};
