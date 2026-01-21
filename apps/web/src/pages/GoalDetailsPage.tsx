import { ChevronLeft, Clock, Edit2, Link, Plus, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { ActivitiesListComponent } from '../components/ActivitiesListComponent';
import { AddProgressModal } from '../components/AddProgressModal';
import { BulkTaskModal } from '../components/BulkTaskModal';
import { EditGoalModal } from '../components/EditGoalModal';
import LinkTasksModal from '../components/LinkTasksModal';
import { TaskListComponent } from '../components/TaskListComponent';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { Skeleton } from '../components/ui/skeleton';
import { useTaskContext } from '../contexts/TaskContext';
import { Goal, GoalTasksResponse, Task, TaskEvent } from '../types';

export const GoalDetailsPage: React.FC = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { updateTaskFields } = useTaskContext();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [tasksData, setTasksData] = useState<GoalTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>('tasks');
  const [isLogging, setIsLogging] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [isLinkingTasks, setIsLinkingTasks] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const fetchGoalData = useCallback(async () => {
    if (!goalId) return;
    try {
      setIsLoading(true);
      const [goalData, tasks] = await Promise.all([api.getGoal(goalId), api.getGoalTasks(goalId)]);
      setGoal(goalData);
      setTasksData(tasks);
    } catch (error) {
      console.error('Failed to fetch goal:', error);
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    fetchGoalData();
  }, [fetchGoalData]);

  if (isLoading) {
    return (
      <div>
        {/* Header Skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </div>

        {/* Tags Skeleton */}
        <div className="flex gap-2 flex-wrap mb-8">
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>

        {/* Progress Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 glass-panel p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-full rounded-full" />
              </div>
              <Skeleton className="h-12 w-24" />
            </div>
          </div>
          <div className="glass-panel p-6">
            <Skeleton className="h-6 w-20 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>

        {/* Tasks Section Skeleton */}
        <div className="glass-panel p-6 mb-8">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-400">Goal not found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm('Delete this goal?')) {
      await api.deleteGoal(goal.id);
      navigate('/');
    }
  };

  const handleCompleteGoal = async () => {
    try {
      setIsCompleting(true);
      await api.completeGoal(goal.id);
      setCompletionMessage('✓ Goal marked as completed! Parent goal progress updated.');
      await fetchGoalData(); // Refresh goal data
      // Clear message after 3 seconds
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
    try {
      setIsCompleting(true);
      await api.uncompleteGoal(goal!.id);
      setCompletionMessage('↺ Goal marked as incomplete. Parent goal progress updated.');
      await fetchGoalData(); // Refresh goal data
      setTimeout(() => setCompletionMessage(null), 3000);
    } catch (e) {
      console.error('Failed to mark goal incomplete', e);
      setCompletionMessage('✗ Failed to mark goal as incomplete');
      setTimeout(() => setCompletionMessage(null), 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  const summary = goal.progressSummary;
  const percent =
    summary?.percentComplete ??
    (goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0);

  // Check if goal is 100% complete
  const isGoalComplete = summary?.percentComplete === 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{goal.title}</h1>
          {goal.description && <p className="text-slate-400 mt-2">{goal.description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={20} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Metadata Tags */}
      <div className="flex gap-2 flex-wrap mb-8">
        <span className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-md border border-blue-500/30">
          {goal.scope}
        </span>
        {goal.progressSummary?.mode && (
          <span className="inline-flex items-center px-3 py-1.5 bg-purple-500/20 text-purple-300 text-sm rounded-md border border-purple-500/30">
            {goal.progressSummary.mode.replace(/_/g, ' ')}
          </span>
        )}
        {goal.customDataLabel && (
          <span className="inline-flex items-center px-3 py-1.5 bg-slate-700/50 text-slate-300 text-sm rounded-md">
            Tracking: {goal.customDataLabel}
          </span>
        )}
        {goal.parent && (
          <span className="inline-flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-md border border-blue-500/30">
            ↑ {goal.parent.title}
          </span>
        )}
        {goal.children && goal.children.length > 0 && (
          <span className="inline-flex items-center px-3 py-1.5 bg-green-500/20 text-green-300 text-sm rounded-md border border-green-500/30">
            {goal.children.length} subgoals
          </span>
        )}
        {goal.endDate && (
          <span className="inline-flex items-center px-3 py-1.5 bg-amber-500/20 text-amber-300 text-sm rounded-md border border-amber-500/30">
            Due: {new Date(goal.endDate).toLocaleDateString()}
          </span>
        )}
        {isGoalComplete && (
          <span className="inline-flex items-center px-3 py-1.5 bg-green-500/20 text-green-300 text-sm rounded-md border border-green-500/30 font-medium">
            ✓ 100% Complete
          </span>
        )}
      </div>

      {/* Completion Banner */}
      {isGoalComplete && (
        <div className="mb-8 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-300 mb-3">✓ This goal is marked as completed.</p>
          {completionMessage && (
            <div className="mb-3 text-green-200 text-sm font-medium">{completionMessage}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleUncompleteGoal}
              disabled={isCompleting}
              className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg font-medium hover:bg-slate-700/70 transition-colors flex items-center gap-2"
            >
              Mark Incomplete
            </button>
            {goal.endDate && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg font-medium hover:bg-slate-700/70 transition-colors flex items-center gap-2"
              >
                <Clock size={18} />
                Extend Deadline
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Display */}
        <div className="lg:col-span-2 glass-panel p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Progress</h2>
          {summary?.mode === 'TASK_BASED' ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>
                    Tasks: {summary.taskTotals.completedCount}/{summary.taskTotals.totalCount}
                  </span>
                  <span>
                    Effort: {summary.taskTotals.completedSize}/{summary.taskTotals.totalSize}
                  </span>
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${summary.percentComplete}%` }}
                  />
                </div>
              </div>
              <div className="text-4xl font-bold text-white">
                {summary.percentComplete.toFixed(0)}%
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">
                  {goal.currentValue} {goal.targetValue ? `/ ${goal.targetValue}` : 'tracked'}
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="text-4xl font-bold text-white">{percent.toFixed(0)}%</div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
          <div className="space-y-2">
            {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY') && (
              <button
                onClick={() => setIsCreatingTasks(true)}
                className="w-full px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-white rounded-lg text-sm hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                title="Create Tasks"
              >
                + Create Tasks
              </button>
            )}
            <button
              onClick={() => setIsLinkingTasks(true)}
              className="w-full px-4 py-2.5 bg-blue-500/20 border border-blue-500/30 text-white rounded-lg text-sm hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
              title="Link existing tasks"
            >
              <Link size={16} />
              Link Tasks
            </button>
            <button
              onClick={() => setIsLogging(true)}
              className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              title="Log Progress"
            >
              <Plus size={16} />
              Log Progress
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      {tasksData && (
        <div className="glass-panel mb-8">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            value={accordionValue}
            onValueChange={setAccordionValue}
          >
            <AccordionItem value="tasks" className="border-none">
              <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-white hover:no-underline hover:text-blue-400">
                Tasks {tasksData.goalTasks.length > 0 ? `(${tasksData.goalTasks.length})` : ''}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                {/* Linked Tasks */}
                {tasksData.goalTasks.length > 0 && (
                  <div className="mb-6">
                    <TaskListComponent
                      title="Linked Tasks"
                      tasks={tasksData.goalTasks.map((gt) => gt.task as Task)}
                      onTaskEvent={async (taskId: string, event: TaskEvent) => {
                        fetchGoalData();
                      }}
                      onUnlink={async (taskId: string) => {
                        if (confirm('Unlink this task from the goal? (Task will not be deleted)')) {
                          try {
                            await updateTaskFields(taskId, { goalIds: [] });
                            fetchGoalData();
                          } catch (e) {
                            console.error('Failed to unlink task', e);
                          }
                        }
                      }}
                      showUnlink={true}
                      showLinkedGoals={false}
                      emptyMessage="No linked tasks"
                    />
                  </div>
                )}

                {/* Subgoals */}
                {tasksData.children.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                      Subgoals
                    </h3>
                    <div className="space-y-2.5">
                      {tasksData.children.map((child) => {
                        const progress =
                          child.targetValue > 0
                            ? Math.round((child.currentValue / child.targetValue) * 100)
                            : 0;

                        return (
                          <div
                            key={child.id}
                            className="group relative rounded-xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-l-4 border-purple-500 p-4 shadow-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-0.5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white mb-1">{child.title}</h4>
                                {child.description && (
                                  <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                                    {child.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full font-medium border border-blue-500/40">
                                    {child.scope}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full font-medium border border-purple-500/40">
                                    {child.progressMode.replace(/_/g, ' ')}
                                  </span>
                                  <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-medium border border-emerald-500/40">
                                    {progress}% ({child.currentValue}/{child.targetValue})
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tasksData.goalTasks.length === 0 && tasksData.children.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No tasks or subgoals yet</p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}

      {/* Activities Section */}
      <ActivitiesListComponent goalId={goal.id} />

      {/* Modals */}
      {isEditing && (
        <EditGoalModal
          goal={goal}
          onClose={() => setIsEditing(false)}
          onUpdated={() => {
            fetchGoalData();
          }}
        />
      )}

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
    </div>
  );
};
