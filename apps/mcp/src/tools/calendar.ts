import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoalTrackerApiClient } from '../client/apiClient';
import { formatErrorResult, formatSuccessResult, sanitizeString } from './sanitize';

export function registerCalendarTools(server: McpServer, apiClient: GoalTrackerApiClient): void {
  // Tool 4: get_calendar_agenda
  (server as any).tool(
    'get_calendar_agenda',
    'Fetch daily scheduled tasks and commitments for a calendar date range',
    {
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').describe('Start date (YYYY-MM-DD)'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').describe('End date (YYYY-MM-DD)'),
      includeUnscheduled: z.boolean().optional().default(false).describe('Include unassigned tasks'),
      parentGoalId: z.string().uuid().optional().describe('Filter by specific parent goal ID'),
    },
    async ({ startDate, endDate, includeUnscheduled, parentGoalId }: any) => {
      try {
        const query: Record<string, string | boolean | undefined> = {
          startDate,
          endDate,
          includeUnscheduled: includeUnscheduled ? 'true' : undefined,
          parentGoalId,
        };

        const res = await apiClient.get<any>('/api/calendar/tasks', query);
        const scheduledTasks: any[] = res?.tasks || [];
        const unscheduledTasks: any[] = res?.unscheduledTasks || [];

        if (scheduledTasks.length === 0 && unscheduledTasks.length === 0) {
          return formatSuccessResult(`No scheduled tasks found between ${startDate} and ${endDate}.`);
        }

        // Group tasks by scheduled date
        const groupedByDate = new Map<string, any[]>();
        for (const task of scheduledTasks) {
          const dateKey = task.scheduledDate ? task.scheduledDate.substring(0, 10) : 'Unscheduled';
          if (!groupedByDate.has(dateKey)) {
            groupedByDate.set(dateKey, []);
          }
          groupedByDate.get(dateKey)!.push(task);
        }

        const lines: string[] = [
          `### Calendar Agenda (${startDate} to ${endDate})`,
          `Total scheduled tasks: ${scheduledTasks.length}`,
          '',
        ];

        // Sort dates chronologically
        const sortedDates = Array.from(groupedByDate.keys()).sort();
        for (const date of sortedDates) {
          lines.push(`#### ${date}`);
          const tasksOnDate = groupedByDate.get(date)!;
          for (const t of tasksOnDate) {
            const check = t.isCompleted ? 'x' : ' ';
            const time = t.scheduledTime ? `[${t.scheduledTime}] ` : '';
            const goals = (t.goalTasks || [])
              .map((gt: any) => sanitizeString(gt.goal?.title || ''))
              .filter(Boolean)
              .join(', ');
            const goalTag = goals ? ` *(Goal: ${goals})*` : '';
            lines.push(`- [${check}] ${time}${sanitizeString(t.title)} (\`${t.id}\`)${goalTag}`);
          }
          lines.push('');
        }

        if (unscheduledTasks.length > 0) {
          lines.push('#### Unscheduled Tasks');
          for (const t of unscheduledTasks) {
            const check = t.isCompleted ? 'x' : ' ';
            lines.push(`- [${check}] ${sanitizeString(t.title)} (\`${t.id}\`)`);
          }
        }

        return formatSuccessResult(lines.join('\n'));
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}
