import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ProfileConfig } from './config';
import { TokenManager } from './auth/tokenManager';
import { GoalTrackerApiClient } from './client/apiClient';
import { registerGoalTools } from './tools/goals';
import { registerTaskTools } from './tools/tasks';
import { registerCalendarTools } from './tools/calendar';
import { registerSystemTools } from './tools/system';

/**
 * Enforce stdout protocol hygiene:
 * All non-JSON-RPC logs (like console.log) are redirected to stderr
 * to prevent corrupting the MCP stdio communication channel.
 */
function protectStdout(): void {
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    console.error(...args);
  };
}

export function createMcpServer(config: ProfileConfig): {
  server: any;
  tokenManager: TokenManager;
  apiClient: GoalTrackerApiClient;
} {
  const server = new McpServer({
    name: 'goal-tracker',
    version: '1.0.0',
  });

  const tokenManager = new TokenManager(config);
  const apiClient = new GoalTrackerApiClient(config, tokenManager);

  // Register all v1 read-only tools
  registerGoalTools(server, apiClient);
  registerTaskTools(server, apiClient);
  registerCalendarTools(server, apiClient);
  registerSystemTools(server, apiClient);

  return { server, tokenManager, apiClient };
}

export async function runStdioServer(config: ProfileConfig): Promise<void> {
  protectStdout();

  const { server } = createMcpServer(config);
  const transport = new StdioServerTransport();

  console.error(`[MCP] Goal Tracker MCP server starting in stdio mode (profile: ${config.profile})...`);
  await server.connect(transport);
  console.error(`[MCP] Connected over stdio transport. Ready for tool requests.`);

  // Handle graceful termination
  const cleanup = () => {
    console.error('[MCP] Server shutting down.');
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
