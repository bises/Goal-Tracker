export type GoalScope = "YEARLY" | "MONTHLY" | "WEEKLY" | "STANDALONE";
export type ProgressMode = "TASK_BASED" | "MANUAL_TOTAL" | "HABIT";

export interface Task {
  id: string;
  title: string;
  description?: string;
  size: number;
  isCompleted: boolean;
  completedAt?: string;
  scheduledDate?: string;
  goalTasks?: GoalTask[];
  parentTaskId?: string;
  parentTask?: Partial<Task>;
  subTasks?: Partial<Task>[];
  customData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalTask {
  id: string;
  goalId: string;
  taskId: string;
  goal?: Partial<Goal>;
  task?: Partial<Task>;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: "TOTAL_TARGET" | "FREQUENCY" | "HABIT";
  progressMode: ProgressMode;
  targetValue?: number;
  currentValue: number;
  frequencyTarget?: number;
  frequencyType?: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: string;
  endDate?: string;
  stepSize?: number;
  customDataLabel?: string;

  // Hierarchy fields
  parentId?: string;
  parent?: Partial<Goal>;
  children?: Partial<Goal>[];

  // Linked tasks (many-to-many)
  goalTasks?: GoalTask[];

  // Scope
  scope: GoalScope;

  progress: Progress[];

  progressSummary?: ProgressSummary;
}

export interface ProgressSummary {
  mode: ProgressMode;
  percentComplete: number;
  taskTotals: {
    totalCount: number;
    completedCount: number;
    totalSize: number;
    completedSize: number;
  };
  manualTotals: {
    currentValue: number;
    targetValue?: number;
  };
}

export interface Progress {
  id: string;
  value: number;
  date: string;
  note?: string;
  customData?: string;
}

export interface GoalTasksResponse {
  goalTasks: {
    task: {
      id: string;
      title: string;
      description?: string;
      size: number;
      isCompleted: boolean;
      scheduledDate?: string;
      completedAt?: string;
    };
  }[];
  children: {
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
  }[];
}
