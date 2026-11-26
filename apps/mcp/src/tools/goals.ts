import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoalTrackerApiClient } from '../client/apiClient';
import { formatErrorResult, formatSuccessResult, sanitizeString } from './sanitize';

export function registerGoalTools(server: McpServer, apiClient: GoalTrackerApiClient): void {
  // Tool 1: list_goals
  (server as any).tool(
    'list_goals',
    'List active goals with hierarchical structure, scope, and progress metrics',
    {
      scope: z.enum(['YEARLY', 'MONTHLY', 'WEEKLY', 'STANDALONE']).optional().describe('Filter by goal scope'),
      status: z.enum(['active', 'completed', 'all']).optional().default('active').describe('Filter by status'),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Start date range'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('End date range'),
    },
    async ({ scope, status, startDate, endDate }: any) => {
      try {
        const query: Record<string, string | undefined> = {};
        if (status) query.status = status;
        if (scope) query.scope = scope;
        if (startDate) query.startDate = startDate;
        if (endDate) query.endDate = endDate;

        const rawGoals = await apiClient.get<any[]>('/api/goals', query);
        let goals = Array.isArray(rawGoals) ? rawGoals : (rawGoals as any)?.goals || [];

        if (status === 'active') {
          goals = goals.filter((g: any) => !g.isMarkedComplete);
        } else if (status === 'completed') {
          goals = goals.filter((g: any) => Boolean(g.isMarkedComplete));
        }

        if (goals.length === 0) {
          return formatSuccessResult(`No goals found matching criteria (status: ${status}${scope ? `, scope: ${scope}` : ''}).`);
        }

        // Format Markdown table
        const rows = goals.map((g: any) => {
          const title = sanitizeString(g.title);
          const gScope = g.scope || 'STANDALONE';
          const type = g.type || 'TASK_COUNT';
          const progress = `${g.currentValue ?? 0}/${g.targetValue ?? 0}`;
          const isDone = g.isMarkedComplete ? '✓ Completed' : 'In Progress';
          const parent = g.parent?.title ? sanitizeString(g.parent.title) : '-';
          return `| \`${g.id}\` | ${title} | ${gScope} | ${type} | ${progress} | ${isDone} | ${parent} |`;
        });

        const table = [
          `### Goal Tracker - Goals (${goals.length} found)`,
          '',
          '| ID | Title | Scope | Type | Progress | Status | Parent |',
          '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |',
          ...rows,
        ].join('\n');

        return formatSuccessResult(table);
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool 2: get_goal
  (server as any).tool(
    'get_goal',
    'Get detailed goal information including child goals, linked tasks, and progress details',
    {
      goalId: z.string().uuid('Invalid goal ID format').describe('Goal UUID'),
    },
    async ({ goalId }: any) => {
      try {
        const goal = await apiClient.get<any>(`/api/goals/${goalId}`);

        if (!goal) {
          return formatSuccessResult(`Goal '${goalId}' not found.`);
        }

        const lines: string[] = [
          `## Goal: ${sanitizeString(goal.title)}`,
          `- **ID**: \`${goal.id}\``,
          `- **Scope**: ${goal.scope || 'STANDALONE'}`,
          `- **Type**: ${goal.type || 'TASK_COUNT'}`,
          `- **Status**: ${goal.isMarkedComplete ? 'Completed' : 'Active'}`,
          `- **Progress**: ${goal.currentValue ?? 0} / ${goal.targetValue ?? 0}`,
        ];

        if (goal.description) {
          lines.push(`- **Description**: ${sanitizeString(goal.description)}`);
        }

        if (goal.parent) {
          lines.push(`- **Parent Goal**: ${sanitizeString(goal.parent.title)} (\`${goal.parent.id}\`)`);
        }

        if (goal.children && goal.children.length > 0) {
          lines.push('', '### Child Goals:');
          for (const c of goal.children) {
            lines.push(`- ${sanitizeString(c.title)} (\`${c.id}\`) - ${c.isMarkedComplete ? 'Completed' : 'Active'}`);
          }
        }

        if (goal.goalTasks && goal.goalTasks.length > 0) {
          lines.push('', '### Linked Tasks:');
          for (const gt of goal.goalTasks) {
            const t = gt.task;
            if (t) {
              const status = t.isCompleted ? '✓' : '○';
              lines.push(`- [${status}] ${sanitizeString(t.title)} (\`${t.id}\`)`);
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
