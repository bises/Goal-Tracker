import {
    ChevronLeft,
    Clock,
    Edit2,
    Link,
    Plus,
    Trash2
} from "lucide-react";
import React, { useState } from "react";
import { api } from "../api";
import { ActivitiesListComponent } from "../components/ActivitiesListComponent";
import { AddProgressModal } from "../components/AddProgressModal";
import { BulkTaskModal } from "../components/BulkTaskModal";
import { EditGoalModal } from "../components/EditGoalModal";
import LinkTasksModal from "../components/LinkTasksModal";
import { TaskListComponent } from "../components/TaskListComponent";
import { Goal } from "../types";

interface GoalDetailsPageProps {
  goal: Goal;
  onBack: () => void;
  onUpdate: () => void;
}

export const GoalDetailsPage: React.FC<GoalDetailsPageProps> = ({
  goal: initialGoal,
  onBack,
  onUpdate,
}) => {
  const [goal, setGoal] = useState<Goal>(initialGoal);
  const [isEditing, setIsEditing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [isLinkingTasks, setIsLinkingTasks] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(
    null,
  );

  if (!goal) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (confirm("Delete this goal?")) {
      await api.deleteGoal(goal.id);
      onUpdate();
      onBack();
    }
  };

  const handleCompleteGoal = async () => {
    try {
      setIsCompleting(true);
      await api.completeGoal(goal.id);
      setCompletionMessage(
        "✓ Goal marked as completed! Parent goal progress updated.",
      );
      onUpdate();
      // Clear message after 3 seconds
      setTimeout(() => setCompletionMessage(null), 3000);
    } catch (e) {
      console.error("Failed to complete goal", e);
      setCompletionMessage("✗ Failed to mark goal as completed");
      setTimeout(() => setCompletionMessage(null), 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleUncompleteGoal = async () => {
    try {
      setIsCompleting(true);
      await api.uncompleteGoal(goal!.id);
      setCompletionMessage(
        "↺ Goal marked as incomplete. Parent goal progress updated.",
      );
      onUpdate();
      setTimeout(() => setCompletionMessage(null), 3000);
    } catch (e) {
      console.error("Failed to mark goal incomplete", e);
      setCompletionMessage("✗ Failed to mark goal as incomplete");
      setTimeout(() => setCompletionMessage(null), 3000);
    } finally {
      setIsCompleting(false);
    }
  };

  const summary = goal.progressSummary;
  const percent =
    summary?.percentComplete ??
    (goal.targetValue
      ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
      : 0);

  // Check if goal is 100% complete
  const isGoalComplete = summary?.percentComplete === 100;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{goal.title}</h1>
          {goal.description && (
            <p className="text-slate-400 mt-2">{goal.description}</p>
          )}
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
            {goal.progressSummary.mode.replace(/_/g, " ")}
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
          <p className="text-green-300 mb-3">
            ✓ This goal is marked as completed.
          </p>
          {completionMessage && (
            <div className="mb-3 text-green-200 text-sm font-medium">
              {completionMessage}
            </div>
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
          {summary?.mode === "TASK_BASED" ? (
            <>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>
                    Tasks: {summary.taskTotals.completedCount}/
                    {summary.taskTotals.totalCount}
                  </span>
                  <span>
                    Effort: {summary.taskTotals.completedSize}/
                    {summary.taskTotals.totalSize}
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
                  {goal.currentValue}{" "}
                  {goal.targetValue ? `/ ${goal.targetValue}` : "tracked"}
                </div>
                <div className="w-full bg-slate-700/30 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="text-4xl font-bold text-white">
                {percent.toFixed(0)}%
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Actions</h2>
          <div className="space-y-2">
            {(goal.scope === "MONTHLY" || goal.scope === "YEARLY") && (
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

      {/* Chart 
            {activitiesLoaded && chartData.length > 1 && (
                <div className="glass-panel p-6 mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Progress History</h2>
                    <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id={`gradient-detail-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area 
                                    type="monotone" 
                                    dataKey="value" 
                                    stroke="#8884d8" 
                                    fillOpacity={1} 
                                    fill={`url(#gradient-detail-${goal.id})`}
                                    strokeWidth={2} 
                                />
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} 
                                    itemStyle={{ color: 'white' }} 
                                    formatter={(val: any, name: any, props: any) => [val, props.payload.customData || 'Value']} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )} */}

      {/* Tasks Section */}
      <TaskListComponent goalId={goal.id} onTasksUpdated={onUpdate} />

      {/* Activities Section */}
      <ActivitiesListComponent goalId={goal.id} />

      {/* Modals */}
      {isEditing && (
        <EditGoalModal
          goal={goal}
          onClose={() => setIsEditing(false)}
          onUpdated={() => {
            onUpdate();
          }}
        />
      )}

      {isLogging && (
        <AddProgressModal
          goal={goal}
          onClose={() => setIsLogging(false)}
          onUpdated={() => {
            onUpdate();
          }}
        />
      )}
      {isCreatingTasks && (
        <BulkTaskModal
          parentGoal={goal}
          onClose={() => setIsCreatingTasks(false)}
          onCreated={() => {
            onUpdate();
          }}
        />
      )}
      {isLinkingTasks && (
        <LinkTasksModal
          isOpen={isLinkingTasks}
          onClose={() => setIsLinkingTasks(false)}
          goal={goal}
          onTasksLinked={() => {
            onUpdate();
          }}
        />
      )}
    </div>
  );
};
