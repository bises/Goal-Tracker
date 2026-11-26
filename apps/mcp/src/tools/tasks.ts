import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoalTrackerApiClient } from '../client/apiClient';
import { formatErrorResult, formatSuccessResult, sanitizeString } from './sanitize';

export function registerTaskTools(server: McpServer, apiClient: GoalTrackerApiClient): void {
  // Tool 3: list_tasks
  (server as any).tool(
    'list_tasks',
    'List tasks filtered by date, month, completion status, or unscheduled state',
    {
      status: z.enum(['completed', 'pending', 'all']).optional().default('all').describe('Filter by task completion state'),
      goalId: z.string().uuid('Invalid goal ID format').optional().describe('Filter tasks linked to a specific goal UUID'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Filter by exact scheduled date (YYYY-MM-DD)'),
      month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM').optional().describe('Filter by month (YYYY-MM)'),
      unscheduled: z.boolean().optional().describe('When true, returns only unscheduled tasks'),
      page: z.number().int().min(1).optional().default(1).describe('Page number for pagination'),
      limit: z.number().int().min(1).max(50).optional().default(50).describe('Max items to return (1-50)'),
    },
    async ({ status, goalId, date, month, unscheduled, page, limit }: any) => {
      try {
        let tasks: any[] = [];
        let pagination: any = undefined;

        if (goalId) {
          const goal = await apiClient.get<any>(`/api/goals/${goalId}`);
          if (!goal) {
            return formatSuccessResult(`Goal '${goalId}' not found.`);
          }
          const rawTasks = (goal.goalTasks || []).map((gt: any) => ({
            ...gt.task,
            goalTasks: [{ goal: { id: goal.id, title: goal.title } }],
          }));

          tasks = rawTasks;
          if (status === 'completed') {
            tasks = tasks.filter((t: any) => t.isCompleted);
          } else if (status === 'pending') {
            tasks = tasks.filter((t: any) => !t.isCompleted);
          }
        } else {
          const query: Record<string, string | number | boolean | undefined> = {
            page,
            limit,
          };
          if (status && status !== 'all') query.status = status;
          if (date) query.date = date;
          if (month) query.month = month;
          if (unscheduled !== undefined) query.unscheduled = unscheduled;

          const res = await apiClient.get<any>('/api/tasks', query);
          tasks = Array.isArray(res) ? res : res?.tasks || [];
          pagination = res?.pagination;
        }

        if (tasks.length === 0) {
          return formatSuccessResult(
            `No tasks found matching criteria (status: ${status}${date ? `, date: ${date}` : ''}${
              unscheduled ? ', unscheduled' : ''
            }).`
          );
        }

        const rows = tasks.map((t: any) => {
          const check = t.isCompleted ? '✓' : '○';
          const title = sanitizeString(t.title);
          const sched = t.scheduledDate ? t.scheduledDate.substring(0, 10) : 'Unscheduled';
          const priority = t.priority || 'MEDIUM';
          const category = t.category ? sanitizeString(t.category) : '-';
          const goals = (t.goalTasks || [])
            .map((gt: any) => sanitizeString(gt.goal?.title || 'Goal'))
            .join(', ') || '-';
          return `| \`${t.id}\` | [${check}] | ${title} | ${sched} | ${priority} | ${category} | ${goals} |`;
        });

        const headerLines = [
          `### Goal Tracker - Tasks (${tasks.length} displayed${pagination ? `, page ${pagination.page}/${pagination.totalPages}` : ''})`,
          '',
          '| ID | State | Title | Scheduled | Priority | Category | Linked Goals |',
          '| :--- | :---: | :--- | :--- | :--- | :--- | :--- |',
          ...rows,
        ];

        return formatSuccessResult(headerLines.join('\n'));
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: get_task
  (server as any).tool(
    'get_task',
    'Get detailed information for a specific task including description, parent task, subtasks, and linked goals',
    {
      taskId: z.string().uuid('Invalid task ID format').describe('Task UUID'),
    },
    async ({ taskId }: any) => {
      try {
        const task = await apiClient.get<any>(`/api/tasks/${taskId}`);

        if (!task) {
          return formatSuccessResult(`Task '${taskId}' not found.`);
        }

        const lines: string[] = [
          `## Task: ${sanitizeString(task.title)}`,
          `- **ID**: \`${task.id}\``,
          `- **Status**: ${task.isCompleted ? 'Completed' : 'Pending'}`,
          `- **Scheduled Date**: ${task.scheduledDate ? task.scheduledDate.substring(0, 10) : 'None'}`,
          `- **Scheduled Time**: ${task.scheduledTime || 'None'}`,
          `- **Priority**: ${task.priority || 'MEDIUM'}`,
          `- **Category**: ${task.category ? sanitizeString(task.category) : 'None'}`,
          `- **Size / Weight**: ${task.size || 1}`,
        ];

        if (task.description) {
          lines.push(`- **Description**: ${sanitizeString(task.description)}`);
        }

        if (task.parentTask) {
          lines.push(`- **Parent Task**: ${sanitizeString(task.parentTask.title)} (\`${task.parentTask.id}\`)`);
        }

        if (task.subTasks && task.subTasks.length > 0) {
          lines.push('', '### Subtasks:');
          for (const st of task.subTasks) {
            lines.push(`- [${st.isCompleted ? '✓' : '○'}] ${sanitizeString(st.title)} (\`${st.id}\`)`);
          }
        }

        if (task.goalTasks && task.goalTasks.length > 0) {
          lines.push('', '### Linked Goals:');
          for (const gt of task.goalTasks) {
            const g = gt.goal;
            if (g) {
              lines.push(`- ${sanitizeString(g.title)} (\`${g.id}\`)`);
            }
          }
        }

        return formatSuccessResult(lines.join('\n'));
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: create_task
  (server as any).tool(
    'create_task',
    'Create a new task with optional scheduled date, priority, category, and goal links',
    {
      title: z.string().min(1, 'Title cannot be empty').max(255).describe('Task title'),
      description: z.string().max(4000).optional().describe('Task description or notes'),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Scheduled date (YYYY-MM-DD)'),
      scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').optional().describe('Scheduled time (HH:mm)'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM').describe('Task priority'),
      category: z.string().max(50).optional().describe('Task category'),
      parentTaskId: z.string().uuid('Invalid parent task ID format').optional().describe('Parent task UUID for subtasks'),
      goalIds: z.array(z.string().uuid('Invalid goal ID format')).optional().describe('Array of Goal UUIDs to link to'),
    },
    async (args: any) => {
      try {
        const body: Record<string, any> = {
          title: sanitizeString(args.title),
          priority: args.priority || 'MEDIUM',
        };
        if (args.description !== undefined) body.description = sanitizeString(args.description);
        if (args.scheduledDate !== undefined) body.scheduledDate = args.scheduledDate;
        if (args.scheduledTime !== undefined) body.scheduledTime = args.scheduledTime;
        if (args.category !== undefined) body.category = sanitizeString(args.category);
        if (args.parentTaskId !== undefined) body.parentTaskId = args.parentTaskId;
        if (args.goalIds !== undefined) body.goalIds = args.goalIds;

        const created = await apiClient.post<any>('/api/tasks', body);
        return formatSuccessResult(
          `Successfully created task "${sanitizeString(created.title)}" (\`${created.id}\`). Priority: ${created.priority}, Scheduled: ${created.scheduledDate ? created.scheduledDate.substring(0, 10) : 'None'}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: update_task
  (server as any).tool(
    'update_task',
    'Update an existing task title, description, scheduled date/time, priority, category, or status',
    {
      taskId: z.string().uuid('Invalid task ID format').describe('Task UUID to update'),
      title: z.string().min(1).max(255).optional().describe('New task title'),
      description: z.string().max(4000).optional().describe('New task description'),
      scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').nullable().optional().describe('New scheduled date (YYYY-MM-DD or null to unschedule)'),
      scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:mm').nullable().optional().describe('New scheduled time (HH:mm)'),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().describe('New priority'),
      category: z.string().max(50).nullable().optional().describe('New category'),
      isCompleted: z.boolean().optional().describe('New completion status'),
    },
    async ({ taskId, ...fields }: any) => {
      try {
        const body: Record<string, any> = {};
        if (fields.title !== undefined) body.title = sanitizeString(fields.title);
        if (fields.description !== undefined) body.description = sanitizeString(fields.description);
        if (fields.scheduledDate !== undefined) body.scheduledDate = fields.scheduledDate;
        if (fields.scheduledTime !== undefined) body.scheduledTime = fields.scheduledTime;
        if (fields.priority !== undefined) body.priority = fields.priority;
        if (fields.category !== undefined) body.category = fields.category ? sanitizeString(fields.category) : null;
        if (fields.isCompleted !== undefined) body.isCompleted = fields.isCompleted;

        const updated = await apiClient.put<any>(`/api/tasks/${taskId}`, body);
        return formatSuccessResult(
          `Successfully updated task "${sanitizeString(updated.title)}" (\`${updated.id}\`). Status: ${updated.isCompleted ? 'Completed' : 'Pending'}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: set_task_completion
  (server as any).tool(
    'set_task_completion',
    'Idempotently mark a task as completed or pending, updating linked goal progress atomically',
    {
      taskId: z.string().uuid('Invalid task ID format').describe('Task UUID'),
      isCompleted: z.boolean().describe('True to complete task, false to reopen'),
      completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Must be YYYY-MM-DD or ISO timestamp').optional().describe('Optional historical completion date (YYYY-MM-DD)'),
    },
    async ({ taskId, isCompleted, completedAt }: any) => {
      try {
        const body: Record<string, any> = { isCompleted };
        if (completedAt) body.completedAt = completedAt;

        let updated: any;
        try {
          updated = await apiClient.post<any>(`/api/tasks/${taskId}/set-completion`, body);
        } catch (postErr: any) {
          if (postErr?.status === 404 || postErr?.statusCode === 404) {
            updated = await apiClient.put<any>(`/api/tasks/${taskId}`, { isCompleted });
          } else {
            throw postErr;
          }
        }

        return formatSuccessResult(
          `Task "${sanitizeString(updated.title)}" (\`${updated.id}\`) is now ${isCompleted ? '✓ Completed' : '○ Pending'}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: batch_set_task_completion
  (server as any).tool(
    'batch_set_task_completion',
    'Batch complete or reopen multiple tasks by task IDs or by linked goal ID',
    {
      taskIds: z.array(z.string().uuid('Invalid task ID format')).optional().describe('Array of Task UUIDs to update'),
      goalId: z.string().uuid('Invalid goal ID format').optional().describe('Goal UUID whose tasks should be updated'),
      isCompleted: z.boolean().describe('True to mark complete, false to reopen'),
      completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Must be YYYY-MM-DD or ISO timestamp').optional().describe('Optional historical completion date (YYYY-MM-DD)'),
    },
    async ({ taskIds, goalId, isCompleted, completedAt }: any) => {
      try {
        if ((!taskIds || taskIds.length === 0) && !goalId) {
          throw new Error('Must provide either taskIds array or goalId.');
        }

        // Try batch endpoint first
        try {
          const res = await apiClient.post<any>('/api/tasks/batch-set-completion', {
            taskIds,
            goalId,
            isCompleted,
            completedAt,
          });
          if (res && res.updatedCount !== undefined) {
            return formatSuccessResult(
              `Batch completion successful: ${res.updatedCount} task(s) ${isCompleted ? 'completed' : 'reopened'}${res.skippedCount ? ` (${res.skippedCount} already in requested state)` : ''}.`
            );
          }
        } catch (apiErr: any) {
          // If batch endpoint returns 404 (not yet deployed on API), fall back to individual calls
          if (apiErr?.status !== 404 && apiErr?.statusCode !== 404) {
            throw apiErr;
          }
        }

        // Fallback: Resolve task IDs if only goalId was passed
        let targetIds: string[] = taskIds || [];
        let goalTitle = '';
        if (goalId && targetIds.length === 0) {
          const goal = await apiClient.get<any>(`/api/goals/${goalId}`);
          goalTitle = goal?.title ? ` for goal "${sanitizeString(goal.title)}"` : '';
          const goalTasks = goal?.goalTasks || [];
          targetIds = goalTasks
            .filter((gt: any) => Boolean(gt.task) && Boolean(gt.task.isCompleted) !== isCompleted)
            .map((gt: any) => gt.task.id);
        }

        if (targetIds.length === 0) {
          return formatSuccessResult(
            `All tasks${goalTitle} are already in the requested state (${isCompleted ? 'Completed' : 'Pending'}).`
          );
        }

        let updatedCount = 0;
        const body: Record<string, any> = { isCompleted };
        if (completedAt) body.completedAt = completedAt;

        for (const tid of targetIds) {
          try {
            await apiClient.post<any>(`/api/tasks/${tid}/set-completion`, body);
          } catch (postErr: any) {
            if (postErr?.status === 404 || postErr?.statusCode === 404) {
              await apiClient.put<any>(`/api/tasks/${tid}`, { isCompleted });
            } else {
              throw postErr;
            }
          }
          updatedCount++;
        }

        return formatSuccessResult(
          `Successfully ${isCompleted ? 'completed' : 'reopened'} ${updatedCount} task(s)${goalTitle}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool: delete_task
  (server as any).tool(
    'delete_task',
    'Permanently delete a task (requires explicit confirm: true). Use for dropped or discarded tasks.',
    {
      taskId: z.string().uuid('Invalid task ID format').describe('Task UUID to delete'),
      confirm: z.boolean().describe('Must be explicitly true to confirm permanent deletion'),
    },
    async ({ taskId, confirm }: any) => {
      try {
        if (!confirm) {
          return formatErrorResult(
            new Error('Deletion requires confirm: true to prevent accidental data loss.'),
            apiClient.getProfile()
          );
        }

        await apiClient.delete<any>(`/api/tasks/${taskId}`);
        return formatSuccessResult(`Task \`${taskId}\` was permanently deleted.`);
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}
