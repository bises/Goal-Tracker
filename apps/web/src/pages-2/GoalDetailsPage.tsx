import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit2,
  Link,
  MoreVertical,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { GoalCard } from '../components-2/GoalCard';
import { GoalEditSheet } from '../components-2/GoalEditSheet';
import { SquircleCard } from '../components-2/SquircleCard';
import { TaskCard } from '../components-2/TaskCard';
import { ActivitiesListComponent } from '../components/Goals/ActivitiesListComponent';
import { AddProgressModal } from '../components/modals/AddProgressModal';
import { BulkTaskModal } from '../components/modals/BulkTaskModal';
import { ConfirmDialog } from '../components/modals/ConfirmDialog';
import LinkTasksModal from '../components/modals/LinkTasksModal';
import { Spinner } from '../components/ui/spinner';
import { Goal, GoalTasksResponse, Task } from '../types';

const getScopeConfig = (scope: string) => {
  const configs = {
    YEARLY: { icon: '📅', label: 'Yearly', color: '#9333ea' },
    MONTHLY: { icon: '🗓️', label: 'Monthly', color: '#3b82f6' },
    WEEKLY: { icon: '📆', label: 'Weekly', color: '#22c55e' },
    STANDALONE: { icon: '🎯', label: 'Standalone', color: '#ff8c42' },
  };
  return configs[scope as keyof typeof configs] || configs.STANDALONE;
};

const getTypeConfig = (type: string) => {
  const configs = {
    TOTAL_TARGET: { icon: '🎯', label: 'Total Target' },
    FREQUENCY: { icon: '🔄', label: 'Frequency' },
  };
  return configs[type as keyof typeof configs] || configs.TOTAL_TARGET;
};

export const GoalDetailsPage = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasksData, setTasksData] = useState<GoalTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isEditing, setIsEditing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [isLinkingTasks, setIsLinkingTasks] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const fetchGoalData = useCallback(async () => {
    if (!goalId) return;
    try {
      setLoading(true);
      const [goalData, tasks] = await Promise.all([api.getGoal(goalId), api.getGoalTasks(goalId)]);
      setGoal(goalData);
      setTasksData(tasks);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoalData();
  }, [fetchGoalData]);

  const handleDelete = async () => {
    if (!goal) return;
    await api.deleteGoal(goal.id);
    navigate('/goals');
  };

  const handleCompleteGoal = async () => {
    if (!goal) return;
    try {
      setIsCompleting(true);
      await api.completeGoal(goal.id);
      setCompletionMessage('✓ Goal marked as completed!');
      await fetchGoalData();
      setTimeout(() => setCompletionMessage(null), 3000);
    } catch (e) {
      console.error('Failed to complete goal', e);
      setCompletionMessage('✗ Failed to mark goal as completed');
      setTimeout(() => setCompletionMessage(null), 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUncompleteGoal = async () => {
    if (!goal) return;
    try {
      setIsCompleting(true);
      await api.uncompleteGoal(goal.id);
      setCompletionMessage('↺ Goal marked as incomplete');
      await fetchGoalData();
      setTimeout(() => setCompletionMessage(null), 3000);
    } catch (e) {
      console.error('Failed to mark goal incomplete', e);
      setCompletionMessage('✗ Failed to mark goal as incomplete');
      setTimeout(() => setCompletionMessage(null), 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-4">
        <SquircleCard className="p-8 text-center">
          <Spinner
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--energizing-orange)' }}
          />
          <p className="text-sm" style={{ color: 'var(--warm-gray)' }}>
            Loading goal details...
          </p>
        </SquircleCard>
      </div>
    );
  }

  // Not found state
  if (!goal) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-4">
        <SquircleCard className="p-10 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div
            className="text-xl font-bold font-display mb-2"
            style={{ color: 'var(--deep-charcoal)' }}
          >
            Goal not found
          </div>
          <p className="text-sm mb-6" style={{ color: 'var(--warm-gray)' }}>
            The goal you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/goals')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)',
            }}
          >
            <ArrowLeft size={18} />
            Back to Goals
          </button>
        </SquircleCard>
      </div>
    );
  }

  const scopeConfig = getScopeConfig(goal.scope);
  const typeConfig = getTypeConfig(goal.type);
  const summary = goal.progressSummary;
  const percent =
    summary?.percentComplete ??
    (goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0);
  const isGoalComplete = summary?.percentComplete === 100;
  const isTaskBased = summary && summary.taskTotals.totalCount > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-6 pb-4">
      {/* Header */}
      <div className="px-4">
        <div className="flex items-start gap-4 mb-4">
          <button
            onClick={() => navigate('/goals')}
            className="mt-1 p-2 rounded-xl transition-all hover:shadow-md active:scale-95"
            style={{
              background: 'rgba(255, 140, 66, 0.1)',
              color: 'var(--energizing-orange)',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-3xl">{scopeConfig.icon}</span>
              <div
                className="text-3xl font-bold font-display flex-1"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                {goal.title}
              </div>
            </div>
            {goal.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                {goal.description}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 rounded-xl transition-all hover:shadow-md active:scale-95"
                style={{
                  background: 'rgba(255, 140, 66, 0.1)',
                  color: 'var(--energizing-orange)',
                }}
              >
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 size={16} className="mr-2" />
                Edit Goal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Metadata Tags */}
        <div className="flex gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(255, 140, 66, 0.1)',
              color: scopeConfig.color,
              border: `2px solid ${scopeConfig.color}33`,
            }}
          >
            {scopeConfig.icon} {scopeConfig.label}
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(147, 51, 234, 0.1)',
              color: '#9333ea',
              border: '2px solid rgba(147, 51, 234, 0.3)',
            }}
          >
            {typeConfig.icon} {typeConfig.label}
          </span>
          {goal.customDataLabel && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(100, 116, 139, 0.1)',
                color: 'var(--warm-gray)',
                border: '2px solid rgba(100, 116, 139, 0.2)',
              }}
            >
              📊 {goal.customDataLabel}
            </span>
          )}
          {goal.parent && (
            <button
              onClick={() => navigate(`/goals/${goal.parent!.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:shadow-md"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '2px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              ↑ {goal.parent.title}
            </button>
          )}
          {goal.children && goal.children.length > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                color: '#22c55e',
                border: '2px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              📂 {goal.children.length} {goal.children.length === 1 ? 'subgoal' : 'subgoals'}
            </span>
          )}
          {goal.endDate && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                border: '2px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <Calendar size={14} />
              Due: {new Date(goal.endDate).toLocaleDateString()}
            </span>
          )}
          {isGoalComplete && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22c55e',
                border: '2px solid rgba(34, 197, 94, 0.4)',
              }}
            >
              <CheckCircle2 size={14} />
              100% Complete
            </span>
          )}
        </div>
      </div>

      {/* Completion Message Banner */}
      {completionMessage && (
        <div className="px-4">
          <SquircleCard
            className="p-4"
            style={{
              background: completionMessage.includes('✗')
                ? 'rgba(239, 68, 68, 0.1)'
                : 'rgba(34, 197, 94, 0.1)',
              borderColor: completionMessage.includes('✗')
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(34, 197, 94, 0.3)',
            }}
          >
            <p
              className="text-sm font-medium text-center"
              style={{
                color: completionMessage.includes('✗') ? '#ef4444' : '#22c55e',
              }}
            >
              {completionMessage}
            </p>
          </SquircleCard>
        </div>
      )}

      {/* Completion Actions Banner */}
      {isGoalComplete && (
        <div className="px-4">
          <SquircleCard
            className="p-5"
            style={{
              background: 'rgba(34, 197, 94, 0.1)',
              borderColor: 'rgba(34, 197, 94, 0.3)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
              <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>
                This goal is marked as completed!
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUncompleteGoal}
                disabled={isCompleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                style={{
                  background: 'rgba(100, 116, 139, 0.1)',
                  color: 'var(--warm-gray)',
                  border: '2px solid rgba(100, 116, 139, 0.2)',
                }}
              >
                <XCircle size={16} className="inline mr-1.5" />
                Mark Incomplete
              </button>
              {goal.endDate && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Calendar size={16} className="inline mr-1.5" />
                  Extend Deadline
                </button>
              )}
            </div>
          </SquircleCard>
        </div>
      )}

      {/* Progress & Actions Grid */}
      <div className="px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Progress Card */}
        <SquircleCard className="lg:col-span-2 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} style={{ color: 'var(--energizing-orange)' }} />
            <div
              className="text-lg font-bold font-display"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              Progress
            </div>
          </div>

          {isTaskBased ? (
            <>
              <div className="space-y-3 mb-4">
                {/* Tasks Progress */}
                <div>
                  <div
                    className="flex justify-between text-xs mb-1.5"
                    style={{ color: 'var(--warm-gray)' }}
                  >
                    <span className="font-medium">Tasks Completed</span>
                    <span className="font-semibold">
                      {summary.taskTotals.completedCount}/{summary.taskTotals.totalCount}
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255, 140, 66, 0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: 'var(--gradient-primary)',
                        width: `${summary.taskTotals.totalCount > 0 ? (summary.taskTotals.completedCount / summary.taskTotals.totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Effort Progress */}
                <div>
                  <div
                    className="flex justify-between text-xs mb-1.5"
                    style={{ color: 'var(--warm-gray)' }}
                  >
                    <span className="font-medium">Effort Points</span>
                    <span className="font-semibold">
                      {summary.taskTotals.completedSize}/{summary.taskTotals.totalSize}
                    </span>
                  </div>
                  <div
                    className="w-full h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(147, 51, 234, 0.1)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
                        width: `${summary.taskTotals.totalSize > 0 ? (summary.taskTotals.completedSize / summary.taskTotals.totalSize) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Overall Percentage */}
              <div className="flex items-baseline gap-2">
                <div
                  className="text-4xl font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {summary.percentComplete.toFixed(0)}%
                </div>
                <span className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  overall completion
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div
                  className="flex justify-between text-xs mb-2"
                  style={{ color: 'var(--warm-gray)' }}
                >
                  <span className="font-medium">Current Value</span>
                  <span className="font-semibold">
                    {goal.currentValue} {goal.targetValue ? `/ ${goal.targetValue}` : ''}
                  </span>
                </div>
                <div
                  className="w-full h-3 rounded-full overflow-hidden"
                  style={{ background: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #10b981 100%)',
                      width: `${percent}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div
                  className="text-4xl font-bold font-display"
                  style={{ color: 'var(--deep-charcoal)' }}
                >
                  {percent.toFixed(0)}%
                </div>
                <span className="text-sm" style={{ color: 'var(--warm-gray)' }}>
                  complete
                </span>
              </div>
            </>
          )}
        </SquircleCard>

        {/* Quick Actions Card */}
        <SquircleCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={20} style={{ color: 'var(--energizing-orange)' }} />
            <div
              className="text-lg font-bold font-display"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              Actions
            </div>
          </div>
          <div className="space-y-2">
            {!isGoalComplete && (
              <button
                onClick={() => setIsLogging(true)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
                style={{
                  background: 'var(--gradient-primary)',
                  boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)',
                }}
              >
                <Plus size={16} className="inline mr-1.5" />
                Log Progress
              </button>
            )}
            {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY' || goal.scope === 'WEEKLY') && (
              <button
                onClick={() => setIsCreatingTasks(true)}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  border: '2px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Plus size={16} className="inline mr-1.5" />
                Create Tasks
              </button>
            )}
            <button
              onClick={() => setIsLinkingTasks(true)}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#3b82f6',
                border: '2px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <Link size={16} className="inline mr-1.5" />
              Link Tasks
            </button>
            {!isGoalComplete && percent >= 100 && (
              <button
                onClick={handleCompleteGoal}
                disabled={isCompleting}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-95"
                style={{
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: '#22c55e',
                  border: '2px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <CheckCircle2 size={16} className="inline mr-1.5" />
                Mark Complete
              </button>
            )}
          </div>
        </SquircleCard>
      </div>

      {/* Tasks & Subgoals Section */}
      {tasksData && (tasksData.goalTasks.length > 0 || tasksData.children.length > 0) && (
        <div className="px-4">
          <SquircleCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📋</span>
              <div
                className="text-lg font-bold font-display"
                style={{ color: 'var(--deep-charcoal)' }}
              >
                Tasks & Subgoals
              </div>
              <span
                className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255, 140, 66, 0.1)',
                  color: 'var(--energizing-orange)',
                }}
              >
                {tasksData.goalTasks.length + tasksData.children.length}
              </span>
            </div>

            {/* Linked Tasks */}
            {tasksData.goalTasks.length > 0 && (
              <div className="mb-6">
                <div
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: 'var(--warm-gray)' }}
                >
                  Linked Tasks ({tasksData.goalTasks.length})
                </div>
                <div className="space-y-2">
                  {(() => {
                    const incompleteTasks = tasksData.goalTasks.filter(
                      (gt) => !(gt.task as Task).isCompleted
                    );
                    const completedTasks = tasksData.goalTasks.filter(
                      (gt) => (gt.task as Task).isCompleted
                    );
                    const displayTasks = showAllTasks
                      ? tasksData.goalTasks
                      : incompleteTasks.slice(0, 5);
                    const hasMore = !showAllTasks && incompleteTasks.length > 5;

                    return (
                      <>
                        {displayTasks.map((gt) => {
                          const task = gt.task as Task;
                          return (
                            <TaskCard key={task.id} task={task} onTaskUpdated={fetchGoalData} />
                          );
                        })}
                        <div className="flex gap-2">
                          {hasMore && (
                            <button
                              onClick={() => setShowAllTasks(true)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
                              style={{
                                background: 'rgba(255, 140, 66, 0.08)',
                                color: 'var(--energizing-orange)',
                                border: '1.5px dashed rgba(255, 140, 66, 0.3)',
                              }}
                            >
                              See all {incompleteTasks.length} incomplete tasks →
                            </button>
                          )}
                          {!showAllTasks && completedTasks.length > 0 && (
                            <button
                              onClick={() => setShowAllTasks(true)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
                              style={{
                                background: 'rgba(34, 197, 94, 0.08)',
                                color: '#22c55e',
                                border: '1.5px dashed rgba(34, 197, 94, 0.3)',
                              }}
                            >
                              Show {completedTasks.length} completed ✓
                            </button>
                          )}
                          {showAllTasks && (
                            <button
                              onClick={() => setShowAllTasks(false)}
                              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
                              style={{
                                background: 'rgba(100, 116, 139, 0.08)',
                                color: 'var(--warm-gray)',
                                border: '1.5px dashed rgba(100, 116, 139, 0.3)',
                              }}
                            >
                              Show less ↑
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Subgoals */}
            {tasksData.children.length > 0 && (
              <div>
                <div
                  className="text-sm font-semibold mb-3 uppercase tracking-wide"
                  style={{ color: 'var(--warm-gray)' }}
                >
                  Subgoals ({tasksData.children.length})
                </div>
                <div className="space-y-3">
                  {tasksData.children.map((child) => (
                    <GoalCard
                      key={child.id}
                      goal={{
                        id: child.id,
                        title: child.title,
                        description: child.description,
                        scope: child.scope as Goal['scope'],
                        type: 'TOTAL_TARGET',
                        targetValue: child.targetValue,
                        currentValue: child.currentValue,
                        startDate: child.createdAt,
                        parentId: child.parentId ?? undefined,
                        progress: [],
                      }}
                      onUpdate={fetchGoalData}
                    />
                  ))}
                </div>
              </div>
            )}
          </SquircleCard>
        </div>
      )}

      {/* Empty Tasks State */}
      {tasksData && tasksData.goalTasks.length === 0 && tasksData.children.length === 0 && (
        <div className="px-4">
          <SquircleCard className="p-8 text-center">
            <div className="text-5xl mb-3">📋</div>
            <div
              className="text-lg font-bold font-display mb-2"
              style={{ color: 'var(--deep-charcoal)' }}
            >
              No tasks or subgoals yet
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--warm-gray)' }}>
              Break down this goal into actionable tasks to track your progress
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setIsCreatingTasks(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
                style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#22c55e',
                  border: '2px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Plus size={16} />
                Create Tasks
              </button>
              <button
                onClick={() => setIsLinkingTasks(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:shadow-md"
                style={{
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  border: '2px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                <Link size={16} />
                Link Existing
              </button>
            </div>
          </SquircleCard>
        </div>
      )}

      {/* Activities Section */}
      <div className="px-4">
        <SquircleCard className="p-6">
          <Accordion
            type="single"
            collapsible
            onValueChange={(value) => {
              setActivitiesExpanded(value === 'activities');
            }}
          >
            <AccordionItem value="activities" className="border-none">
              <AccordionTrigger className="hover:no-underline py-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <div
                    className="text-lg font-bold font-display"
                    style={{ color: 'var(--deep-charcoal)' }}
                  >
                    Activity History
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <ActivitiesListComponent goalId={goal.id} isExpanded={activitiesExpanded} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </SquircleCard>
      </div>

      {/* Modals */}
      <GoalEditSheet
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        goal={goal}
        onSave={() => {
          fetchGoalData();
          setIsEditing(false);
        }}
      />

      {isLogging && (
        <AddProgressModal
          goal={goal}
          onClose={() => setIsLogging(false)}
          onUpdated={() => {
            fetchGoalData();
          }}
        />
      )}

      {isCreatingTasks && (
        <BulkTaskModal
          parentGoal={goal}
          onClose={() => setIsCreatingTasks(false)}
          onCreated={() => {
            fetchGoalData();
          }}
        />
      )}

      {isLinkingTasks && (
        <LinkTasksModal
          isOpen={isLinkingTasks}
          onClose={() => setIsLinkingTasks(false)}
          goal={goal}
          onTasksLinked={() => {
            fetchGoalData();
          }}
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
    </div>
  );
};
