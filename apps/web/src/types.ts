/**
 * Re-export all types from the shared package.
 * This file is maintained for backward compatibility so existing
 * imports like `from '../types'` continue to work.
 */
export type {
  FrequencyType,
  Goal,
  GoalScope,
  GoalTask,
  GoalTasksResponse,
  GoalType,
  PaginatedTasksResponse,
  Progress,
  ProgressSummary,
  Task,
  TaskCategory,
  TaskEvent,
  TaskPriority,
} from '@goal-tracker/shared';
