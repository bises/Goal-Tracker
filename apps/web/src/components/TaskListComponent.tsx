import React, { useState } from "react";
import { api } from "../api";
import { useTaskContext } from "../contexts/TaskContext";
import TaskCard from "./Tasks/TaskCard";

interface TaskListComponentProps {
  goalId: string;
  onTasksUpdated: () => void;
}

interface TaskItem {
  task: {
    id: string;
    title: string;
    description?: string;
    size: number;
    isCompleted: boolean;
    scheduledDate?: string;
    completedAt?: string;
  };
}

interface Child {
  id: string;
  title: string;
  description?: string;
  scope: string;
  progressMode: string;
  targetValue: number;
  currentValue: number;
  parentId: string | null;
  isMarkedComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TasksData {
  goalTasks: TaskItem[];
  children: Child[];
}

export const TaskListComponent: React.FC<TaskListComponentProps> = ({
  goalId,
  onTasksUpdated,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tasksData, setTasksData] = useState<TasksData | null>(null);
  const { toggleComplete, updateTaskFields, deleteTask } = useTaskContext();

  const loadTasks = async () => {
    if (isExpanded || isLoading) return;
    try {
      setIsLoading(true);
      const data = await api.getGoalTasks(goalId);
      setTasksData(data);
      setIsExpanded(true);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleComplete(taskId);
      // Reload tasks to get updated data
      const data = await api.getGoalTasks(goalId);
      setTasksData(data);
      onTasksUpdated();
    } catch (e) {
      console.error("Failed to toggle task", e);
    }
  };

  const handleUnlinkTask = async (taskId: string) => {
    if (confirm("Unlink this task from the goal? (Task will not be deleted)")) {
      try {
        // Update the task's goalIds via context (server returns canonical state)
        await updateTaskFields(taskId, { goalIds: [] });

        // Reload tasks
        const data = await api.getGoalTasks(goalId);
        setTasksData(data);
        onTasksUpdated();
      } catch (e) {
        console.error("Failed to unlink task", e);
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Delete this task permanently?")) {
      try {
        await deleteTask(taskId);
        // Reload tasks
        const data = await api.getGoalTasks(goalId);
        setTasksData(data);
        onTasksUpdated();
      } catch (e) {
        console.error("Failed to delete task", e);
      }
    }
  };

  if (!isExpanded) {
    return (
      <div className="glass-panel p-6 mb-8">
        <button
          onClick={loadTasks}
          disabled={isLoading}
          className="text-white font-medium text-lg hover:text-blue-400 transition-colors"
        >
          {isLoading ? "↻ Loading tasks..." : "⊕ Load Tasks"}
        </button>
      </div>
    );
  }

  if (!tasksData) {
    return null;
  }

  const { goalTasks, children } = tasksData;
  const hasSubgoals = children && children.length > 0;
  const hasLinkedTasks = goalTasks && goalTasks.length > 0;

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Tasks</h2>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-slate-400 hover:text-white transition-colors"
          title="Collapse"
        >
          ⊖
        </button>
      </div>

      {/* Linked Tasks */}
      {hasLinkedTasks && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Linked Tasks
          </h3>
          <div className="space-y-3">
            {goalTasks.map((gt) => (
              <TaskCard
                key={gt.task.id}
                task={gt.task}
                onUpdate={onTasksUpdated}
                onToggle={handleToggleTask}
                onUnlink={handleUnlinkTask}
                onDelete={handleDeleteTask}
                showEdit={false}
                showUnlink={true}
                showDelete={true}
                showLinkedGoals={false}
                showCompletedBadge={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Subgoals */}
      {hasSubgoals && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
            Subgoals
          </h3>
          <div className="space-y-2.5">
            {children.map((child) => {
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
                      <h4 className="font-semibold text-white mb-1">
                        {child.title}
                      </h4>
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
                          {child.progressMode.replace(/_/g, " ")}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-medium border border-emerald-500/40">
                          {progress}% ({child.currentValue}/{child.targetValue})
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>

                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!hasLinkedTasks && !hasSubgoals && (
        <p className="text-slate-400 text-center py-4">
          No tasks or subgoals yet
        </p>
      )}
    </div>
  );
};
