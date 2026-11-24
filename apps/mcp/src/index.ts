import { getProfileConfig } from './config';
import { runStdioServer } from './server';
import { TokenManager } from './auth/tokenManager';
import { DeviceFlow } from './auth/deviceFlow';

function printHelp(): void {
  console.error(`
Goal Tracker MCP Server & CLI

Usage:
  goal-tracker-mcp [command] [options]

Commands:
  stdio                     Run MCP server in stdio mode (default)
  login                     Authenticate interactively using Auth0 Device Authorization
  logout                    Clear stored credentials and session
  status                    Inspect local authentication and profile state

Options:
  --profile, -p <name>      Environment profile ('development' | 'production', default: 'production')
  --help, -h                Show this help message
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  let profileArg: string | undefined;
  let command = 'stdio';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--profile' || arg === '-p') {
      profileArg = args[++i];
    } else if (arg.startsWith('--profile=')) {
      profileArg = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      command = arg;
    }
  }

  const config = getProfileConfig(profileArg);
  const tokenManager = new TokenManager(config);

  switch (command) {
    case 'login': {
      const flow = new DeviceFlow(config, tokenManager);
      await flow.login();
      process.exit(0);
      break;
    }

    case 'logout': {
      console.error(`[MCP] Logging out from profile '${config.profile}'...`);
      await tokenManager.logout();
      console.error(`[MCP] Credentials cleared for profile '${config.profile}'.`);
      process.exit(0);
      break;
    }

    case 'status': {
      const tokens = tokenManager.getStoredTokens();
      console.error('============================================================');
      console.error('            Goal Tracker MCP - Profile Status               ');
      console.error('============================================================');
      console.error(` Profile:          ${config.profile}`);
      console.error(` Backend API URL:  ${config.apiUrl}`);
      console.error(` Auth0 Domain:     ${config.auth0Domain}`);
      console.error(` Auth0 Audience:   ${config.auth0Audience}`);
      console.error(` Credentials File: ${config.credentialsPath}`);
      console.error('------------------------------------------------------------');
      if (tokens) {
        const isFresh = tokenManager.isTokenFresh(tokens);
        const expDate = new Date(tokens.expiresAt).toLocaleString();
        console.error(` Status:           Authenticated (${isFresh ? 'Valid' : 'Expired'})`);
        console.error(` Token Expiration: ${expDate}`);
        console.error(` Scopes Granted:   ${tokens.scope}`);
      } else {
        console.error(' Status:           Unauthenticated (no stored credentials found)');
        console.error(` Login command:    pnpm mcp:login --profile ${config.profile}`);
      }
      console.error('============================================================');
      process.exit(0);
      break;
    }

    case 'stdio':
    default: {
      await runStdioServer(config);
      break;
    }
  }
}

main().catch((err) => {
  console.error('[MCP:fatal]', err instanceof Error ? err.message : err);
  process.exit(1);
});
