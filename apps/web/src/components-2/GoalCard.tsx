import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit2, Eye, Link, MoreVertical, Plus, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { AddProgressModal } from '../components/modals/AddProgressModal';
import { BulkTaskModal } from '../components/modals/BulkTaskModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import LinkTasksModal from '../components/modals/LinkTasksModal';
import { Goal } from '../types';
import { GoalEditSheet } from './GoalEditSheet';
import { SquircleCard } from './SquircleCard';

interface GoalCardProps {
  goal: Goal;
  onUpdate: () => void;
}

const getGoalTypeIcon = (type: 'TOTAL_TARGET' | 'FREQUENCY'): string => {
  return type === 'TOTAL_TARGET' ? '🎯' : '🔄';
};

const getGoalTypeLabel = (type: 'TOTAL_TARGET' | 'FREQUENCY'): string => {
  return type === 'TOTAL_TARGET' ? 'Total Target' : 'Frequency';
};

const getScopeColor = (
  scope: string
): { bg: string; text: string; border: string; gradient: string } => {
  const colors = {
    YEARLY: {
      bg: 'rgba(147, 51, 234, 0.1)',
      text: '#9333ea',
      border: 'rgba(147, 51, 234, 0.3)',
      gradient: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
    },
    MONTHLY: {
      bg: 'rgba(59, 130, 246, 0.1)',
      text: '#3b82f6',
      border: 'rgba(59, 130, 246, 0.3)',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.1) 100%)',
    },
    WEEKLY: {
      bg: 'rgba(34, 197, 94, 0.1)',
      text: '#22c55e',
      border: 'rgba(34, 197, 94, 0.3)',
      gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%)',
    },
    STANDALONE: {
      bg: 'rgba(255, 140, 66, 0.1)',
      text: '#ff8c42',
      border: 'rgba(255, 140, 66, 0.3)',
      gradient: 'linear-gradient(135deg, rgba(255, 140, 66, 0.1) 0%, rgba(255, 62, 131, 0.1) 100%)',
    },
  };

  return colors[scope as keyof typeof colors] || colors.STANDALONE;
};

export const GoalCard = ({ goal, onUpdate }: GoalCardProps) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [isLinkingTasks, setIsLinkingTasks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await api.deleteGoal(goal.id);
    onUpdate();
  };

  const percent = goal.targetValue
    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    : 0;

  const scopeColor = getScopeColor(goal.scope);
  const typeIcon = getGoalTypeIcon(goal.type);
  const typeLabel = getGoalTypeLabel(goal.type);

  // Count linked tasks and children
  const linkedTasksCount = goal.goalTasks?.length || 0;
  const childrenCount = goal.children?.length || 0;

  return (
    <>
      <SquircleCard
        className="p-5 hover:shadow-xl transition-all cursor-pointer group"
        style={{
          background: scopeColor.gradient,
          borderColor: scopeColor.border,
        }}
        onClick={() => navigate(`/goals/${goal.id}`)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center text-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              }}
            >
              {typeIcon}
            </div>

            {/* Title and Metadata */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-bold text-lg mb-1 truncate"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {goal.title}
              </h3>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: scopeColor.bg,
                    color: scopeColor.text,
                    border: `1px solid ${scopeColor.border}`,
                  }}
                >
                  {goal.scope}
                </span>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(255, 140, 66, 0.1)',
                    color: 'var(--energizing-orange)',
                    border: '1px solid rgba(255, 140, 66, 0.2)',
                  }}
                >
                  {typeLabel}
                </span>
                {goal.parent && (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(107, 107, 107, 0.1)',
                      color: 'var(--warm-gray)',
                      border: '1px solid rgba(107, 107, 107, 0.2)',
                    }}
                  >
                    ↑ {goal.parent.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors outline-none"
              style={{ color: 'var(--warm-gray)' }}
            >
              <MoreVertical size={18} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/goals/${goal.id}`);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {goal.description && (
          <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--warm-gray)' }}>
            {goal.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--deep-charcoal)' }}>
              {goal.currentValue} {goal.targetValue ? `/ ${goal.targetValue}` : ''}
            </span>
            <span
              className="text-sm font-bold"
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {percent.toFixed(0)}%
            </span>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ background: 'rgba(255, 255, 255, 0.6)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${percent}%`,
                background: 'var(--gradient-primary)',
                boxShadow: percent > 0 ? '0 2px 8px rgba(255, 140, 66, 0.3)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        {(linkedTasksCount > 0 || childrenCount > 0) && (
          <div className="flex items-center gap-4 mb-4">
            {linkedTasksCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Target size={14} style={{ color: 'var(--energizing-orange)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--warm-gray)' }}>
                  {linkedTasksCount} {linkedTasksCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            )}
            {childrenCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm" style={{ color: 'var(--energizing-orange)' }}>
                  🎯
                </span>
                <span className="text-xs font-medium" style={{ color: 'var(--warm-gray)' }}>
                  {childrenCount} sub-{childrenCount === 1 ? 'goal' : 'goals'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLogging(true);
            }}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 transition-all hover:shadow-lg"
            style={{
              background: 'var(--gradient-primary)',
            }}
          >
            <Plus size={16} />
            Log Progress
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLinkingTasks(true);
            }}
            className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-white/70"
            style={{
              background: 'rgba(255, 255, 255, 0.5)',
              color: 'var(--energizing-orange)',
              border: '1px solid rgba(255, 140, 66, 0.2)',
            }}
          >
            <Link size={16} />
            Link
          </button>
          {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCreatingTasks(true);
              }}
              className="px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all hover:bg-white/70"
              style={{
                background: 'rgba(255, 255, 255, 0.5)',
                color: 'var(--energizing-orange)',
                border: '1px solid rgba(255, 140, 66, 0.2)',
              }}
            >
              <Plus size={16} />
              Tasks
            </button>
          )}
        </div>
      </SquircleCard>

      {/* Modals */}
      <GoalEditSheet
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        goal={goal}
        onSave={() => {
          onUpdate();
          setIsEditing(false);
        }}
      />

      {isLogging && (
        <AddProgressModal goal={goal} onClose={() => setIsLogging(false)} onUpdated={onUpdate} />
      )}

      {isCreatingTasks && (
        <BulkTaskModal
          parentGoal={goal}
          onClose={() => setIsCreatingTasks(false)}
          onCreated={onUpdate}
        />
      )}

      {isLinkingTasks && (
        <LinkTasksModal
          isOpen={isLinkingTasks}
          onClose={() => setIsLinkingTasks(false)}
          goal={goal}
          onTasksLinked={onUpdate}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};
