import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Calendar, Edit2, Hash, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTaskContext } from "../../contexts/TaskContext";
import { Task } from "../../types";
import { parseLocalDate } from "../../utils/dateUtils";
import AddTaskModal from "../AddTaskModal";
interface TaskCardProps {
  task: Partial<Task> & Pick<Task, "id" | "title" | "size" | "isCompleted">;
  onUpdate: () => void;
  onUnlink?: (taskId: string) => void; // Optional - goal-specific operation
  showEdit?: boolean;
  showUnlink?: boolean;
  showDelete?: boolean;
  showLinkedGoals?: boolean;
  showCompletedBadge?: boolean;
}

export default function TaskCard({
  task,
  onUpdate,
  onUnlink,
  showEdit = true,
  showUnlink = false,
  showDelete = true,
  showLinkedGoals = true,
  showCompletedBadge = true,
}: TaskCardProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { toggleComplete, deleteTask } = useTaskContext();
  const handleToggleComplete = async () => {
    try {
      await toggleComplete(task.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to toggle task completion:", error);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Delete task "${task.title}"?`)) {
      try {
        await deleteTask(task.id);
        onUpdate();
      } catch (error) {
        console.error("Failed to delete task:", error);
      }
    }
  };

  const handleEdit = () => {
    setEditingTask(task as Task);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
  };

  const handleUnlink = async () => {
    if (onUnlink) {
      await onUnlink(task.id);
    }
  };

  const linkedGoals = task.goalTasks || [];

  // Determine status color
  const isOverdue =
    task.scheduledDate &&
    !task.isCompleted &&
    parseLocalDate(task.scheduledDate) < new Date();
  const statusColor = task.isCompleted
    ? "border-green-500"
    : isOverdue
      ? "border-red-500"
      : task.scheduledDate
        ? "border-cyan-500"
        : "border-slate-600";

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden backdrop-blur-sm bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-l-4 shadow-lg hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5",
          statusColor,
          task.isCompleted && "opacity-75",
        )}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Checkbox */}
            <Checkbox
              checked={task.isCompleted}
              onCheckedChange={handleToggleComplete}
              className="mt-0.5 h-5 w-5 border-slate-400 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-lg text-white mb-1",
                  task.isCompleted && "line-through",
                )}
              >
                {task.title}
              </h3>

              {task.description && (
                <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <Badge
                  variant="secondary"
                  className="bg-slate-700/60 text-slate-200 border-slate-600/50"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {task.size}d
                </Badge>
                {task.scheduledDate && (
                  <Badge
                    className={cn(
                      "border",
                      isOverdue
                        ? "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
                        : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30",
                    )}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {parseLocalDate(task.scheduledDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </Badge>
                )}
                {showCompletedBadge && task.isCompleted && task.completedAt && (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30">
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
                    {new Date(task.completedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Badge>
                )}
              </div>

              {/* Linked Goals */}
              {showLinkedGoals && linkedGoals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {linkedGoals.map((goalTask) => (
                    <Badge
                      key={goalTask.id}
                      className="bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30"
                    >
                      🎯 {goalTask.goal?.title || "Unknown Goal"}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
              {showEdit && !task.isCompleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  className="h-8 w-8 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  title="Edit task"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
              {showUnlink && onUnlink && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUnlink}
                  className="h-8 w-8 text-slate-400 hover:text-yellow-300 hover:bg-yellow-500/10"
                  title="Unlink from goal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
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
                </Button>
              )}
              {showDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-slate-400 hover:text-red-300 hover:bg-red-500/10"
                  title="Delete task permanently"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>

        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </Card>

      {/* Edit Modal */}
      {editingTask && (
        <AddTaskModal
          isOpen={true}
          onClose={handleCloseModal}
          onTaskAdded={onUpdate}
          editTask={editingTask}
        />
      )}
    </>
  );
}
