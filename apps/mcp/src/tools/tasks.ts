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
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Filter by exact scheduled date (YYYY-MM-DD)'),
      month: z.string().regex(/^\d{4}-\d{2}$/, 'Must be YYYY-MM').optional().describe('Filter by month (YYYY-MM)'),
      unscheduled: z.boolean().optional().describe('When true, returns only unscheduled tasks'),
      page: z.number().int().min(1).optional().default(1).describe('Page number for pagination'),
      limit: z.number().int().min(1).max(50).optional().default(50).describe('Max items to return (1-50)'),
    },
    async ({ status, date, month, unscheduled, page, limit }: any) => {
      try {
        const query: Record<string, string | number | boolean | undefined> = {
          page,
          limit,
        };
        if (status && status !== 'all') query.status = status;
        if (date) query.date = date;
        if (month) query.month = month;
        if (unscheduled !== undefined) query.unscheduled = unscheduled;

        const res = await apiClient.get<any>('/api/tasks', query);
        const tasks: any[] = Array.isArray(res) ? res : res?.tasks || [];
        const pagination = res?.pagination;

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
}
