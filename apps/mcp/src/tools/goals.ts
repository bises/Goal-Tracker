import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoalTrackerApiClient } from '../client/apiClient';
import { formatErrorResult, formatSuccessResult, sanitizeString, checkWritesAllowed } from './sanitize';

const progressMode = z
  .enum(['AUTOMATIC', 'COMPLETED_SUBGOALS'])
  .optional()
  .describe('Use COMPLETED_SUBGOALS to count finished child goals against a fixed whole-number target');

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
          ...(goal.progressMode === 'COMPLETED_SUBGOALS' ? ['- **Tracks**: Completed subgoals'] : []),
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

  // Tool 3: create_goal
  (server as any).tool(
    'create_goal',
    'Create a new goal with scope, target value, and optional parent goal hierarchy',
    {
      title: z.string().min(1, 'Title cannot be empty').max(255).describe('Goal title'),
      description: z.string().max(4000).optional().describe('Goal description or acceptance criteria'),
      scope: z.enum(['YEARLY', 'MONTHLY', 'WEEKLY', 'STANDALONE']).optional().default('STANDALONE').describe('Goal scope'),
      type: z.enum(['TOTAL_TARGET', 'FREQUENCY']).optional().default('TOTAL_TARGET').describe('Goal measurement type'),
      progressMode,
      targetValue: z.number().positive().optional().describe('Target numeric value. Required for COMPLETED_SUBGOALS.'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('Target completion date (YYYY-MM-DD)'),
      parentId: z.string().uuid('Invalid parent goal ID format').optional().describe('Parent goal UUID for hierarchy'),
    },
    async (args: any) => {
      const writeGuard = checkWritesAllowed(apiClient.getProfile());
      if (writeGuard) return writeGuard;

      try {
        const body: Record<string, any> = {
          title: sanitizeString(args.title),
          scope: args.scope || 'STANDALONE',
          type: args.type || 'TOTAL_TARGET',
        };
        if (args.description !== undefined) body.description = sanitizeString(args.description);
        if (args.progressMode !== undefined) body.progressMode = args.progressMode;
        if (args.targetValue !== undefined) body.targetValue = args.targetValue;
        if (args.endDate !== undefined) body.endDate = args.endDate;
        if (args.parentId !== undefined) body.parentId = args.parentId;

        const created = await apiClient.post<any>('/api/goals', body);
        return formatSuccessResult(
          `Successfully created goal "${sanitizeString(created.title)}" (\`${created.id}\`). Scope: ${created.scope}, Target: ${created.targetValue ?? 1}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool 4: update_goal
  (server as any).tool(
    'update_goal',
    'Update goal metadata, title, description, target value, dates, or parent goal',
    {
      goalId: z.string().uuid('Invalid goal ID format').describe('Goal UUID to update'),
      title: z.string().min(1).max(255).optional().describe('New goal title'),
      description: z.string().max(4000).optional().describe('New goal description'),
      progressMode,
      targetValue: z.number().positive().optional().describe('New target numeric value. Required when switching to COMPLETED_SUBGOALS.'),
      scope: z.enum(['YEARLY', 'MONTHLY', 'WEEKLY', 'STANDALONE']).optional().describe('New goal scope'),
      parentId: z.string().uuid('Invalid parent goal ID format').nullable().optional().describe('New parent goal UUID (or null to unparent)'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional().describe('New target completion date (YYYY-MM-DD)'),
    },
    async ({ goalId, ...fields }: any) => {
      const writeGuard = checkWritesAllowed(apiClient.getProfile());
      if (writeGuard) return writeGuard;

      try {
        const body: Record<string, any> = {};
        if (fields.title !== undefined) body.title = sanitizeString(fields.title);
        if (fields.description !== undefined) body.description = sanitizeString(fields.description);
        if (fields.progressMode !== undefined) body.progressMode = fields.progressMode;
        if (fields.targetValue !== undefined) body.targetValue = fields.targetValue;
        if (fields.scope !== undefined) body.scope = fields.scope;
        if (fields.parentId !== undefined) body.parentId = fields.parentId;
        if (fields.endDate !== undefined) body.endDate = fields.endDate;

        const updated = await apiClient.put<any>(`/api/goals/${goalId}`, body);
        return formatSuccessResult(
          `Successfully updated goal "${sanitizeString(updated.title)}" (\`${updated.id}\`). Scope: ${updated.scope}, Progress: ${updated.currentValue ?? 0}/${updated.targetValue ?? 0}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );

  // Tool 5: complete_goal
  (server as any).tool(
    'complete_goal',
    'Mark a goal as completed or re-open it, updating parent goal progress atomically',
    {
      goalId: z.string().uuid('Invalid goal ID format').describe('Goal UUID'),
      isCompleted: z.boolean().optional().default(true).describe('True to mark complete, false to re-open (default true)'),
    },
    async ({ goalId, isCompleted = true }: any) => {
      const writeGuard = checkWritesAllowed(apiClient.getProfile());
      if (writeGuard) return writeGuard;

      try {
        const endpoint = isCompleted ? `/api/goals/${goalId}/complete` : `/api/goals/${goalId}/uncomplete`;
        const result = await apiClient.post<any>(endpoint, {});
        const goalTitle = result?.updatedGoal?.title ? `"${sanitizeString(result.updatedGoal.title)}"` : `\`${goalId}\``;
        return formatSuccessResult(
          `Goal ${goalTitle} successfully ${isCompleted ? 'marked completed' : 're-opened'}.`
        );
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}
