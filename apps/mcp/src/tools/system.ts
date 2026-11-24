import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GoalTrackerApiClient } from '../client/apiClient';
import { formatErrorResult, formatSuccessResult, sanitizeString } from './sanitize';

export function registerSystemTools(server: McpServer, apiClient: GoalTrackerApiClient): void {
  // Tool 5: get_system_status
  (server as any).tool(
    'get_system_status',
    'Check API health, active profile, connected backend URL, and authenticated user identity',
    {},
    async () => {
      try {
        const profile = apiClient.getProfile();
        const apiUrl = apiClient.getApiUrl();

        // 1. Check health
        let healthData: any = { status: 'unknown' };
        try {
          // Health is public; apiClient requests it with credentials or basic fetch
          const res = await fetch(`${apiUrl.replace(/\/+$/, '')}/health`, { redirect: 'error' });
          if (res.ok) {
            healthData = await res.json();
          }
        } catch (hErr: any) {
          healthData = { status: 'unreachable', error: hErr.message };
        }

        // 2. Check current authenticated user
        const userData = await apiClient.get<any>('/api/auth/me');

        const lines = [
          '### Goal Tracker - System Status',
          `- **Profile**: \`${profile}\``,
          `- **Backend API URL**: \`${apiUrl}\``,
          `- **API Health**: \`${healthData.status}\`${healthData.timestamp ? ` (checked at ${healthData.timestamp})` : ''}`,
          '',
          '#### Authenticated User',
          `- **User ID**: \`${userData.id}\``,
          `- **Auth0 Sub**: \`${userData.sub}\``,
          `- **Name**: ${sanitizeString(userData.name || 'N/A')}`,
          `- **Email**: ${sanitizeString(userData.email || 'N/A')}`,
        ];

        return formatSuccessResult(lines.join('\n'));
      } catch (err: any) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}
