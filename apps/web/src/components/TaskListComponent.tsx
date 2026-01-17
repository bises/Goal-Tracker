import { CheckCircle2, Circle, Trash2 } from "lucide-react";
import React, { useState } from "react";
import { api } from "../api";
import { useTaskContext } from "../contexts/TaskContext";
import { parseLocalDate } from "../utils/dateUtils";

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
            {goalTasks.map((gt) => {
              const isOverdue =
                gt.task.scheduledDate &&
                !gt.task.isCompleted &&
                parseLocalDate(gt.task.scheduledDate) < new Date();
              const statusColor = gt.task.isCompleted
                ? "border-green-500"
                : isOverdue
                  ? "border-red-500"
                  : gt.task.scheduledDate
                    ? "border-cyan-500"
                    : "border-slate-600";

              return (
                <div
                  key={gt.task.id}
                  className={`group relative rounded-xl overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-l-4 ${statusColor} shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5 ${gt.task.isCompleted ? "opacity-75" : ""}`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleTask(gt.task.id)}
                        className="flex-shrink-0 text-slate-400 hover:text-white transition-all duration-200 mt-0.5 hover:scale-110"
                        title={
                          gt.task.isCompleted
                            ? "Mark incomplete"
                            : "Mark complete"
                        }
                      >
                        {gt.task.isCompleted ? (
                          <CheckCircle2
                            size={22}
                            className="text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]"
                          />
                        ) : (
                          <Circle size={22} className="hover:text-cyan-400" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-semibold text-base text-white mb-1 ${gt.task.isCompleted ? "line-through" : ""}`}
                        >
                          {gt.task.title}
                        </h4>
                        {gt.task.description && (
                          <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                            {gt.task.description}
                          </p>
                        )}

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center px-2.5 py-1 bg-slate-700/60 text-slate-200 rounded-full font-medium border border-slate-600/50">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                              />
                            </svg>
                            {gt.task.size}d
                          </span>
                          {gt.task.scheduledDate && (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full font-medium border ${
                                isOverdue
                                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                                  : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              }`}
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {parseLocalDate(
                                gt.task.scheduledDate,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                          {gt.task.isCompleted && gt.task.completedAt && (
                            <span className="inline-flex items-center px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full font-medium border border-green-500/40">
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {new Date(gt.task.completedAt).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons - visible on hover (desktop) or always (mobile) */}
                      <div className="flex-shrink-0 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleUnlinkTask(gt.task.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-all duration-200"
                          title="Unlink from goal"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71"></path>
                            <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71"></path>
                            <line x1="8" y1="2" x2="8" y2="5"></line>
                            <line x1="2" y1="8" x2="5" y2="8"></line>
                            <line x1="16" y1="19" x2="16" y2="22"></line>
                            <line x1="19" y1="16" x2="22" y2="16"></line>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTask(gt.task.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                          title="Delete task permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Subtle glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              );
            })}
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
