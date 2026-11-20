# Goal Tracker

## Why

A personal goal and task management app that helps users set hierarchical goals (yearly → monthly → weekly), track tasks with scheduling, priorities, and categories, and visualize progress through charts and timelines.

## What

Full-stack monorepo with a React PWA frontend (`apps/web`), Express.js API backend (`apps/api`), and PostgreSQL database via Prisma ORM. Authentication via Auth0. Deployed with Docker.

> **Note on Mobile App:** The React Native mobile app was extracted into its own standalone repository: [`bises/Goal-Tracker-Android`](https://github.com/bises/Goal-Tracker-Android).

**Structure:**

```
goal-tracker/
├── apps/web/          # React 18 + Vite + TailwindCSS v4 + shadcn/ui
├── apps/api/          # Express.js + Prisma 7 + PostgreSQL
├── apps/mcp/          # Model Context Protocol stdio server & Auth0 Device Flow CLI
├── packages/shared/   # Shared types and utilities
├── docs/              # Project documentation
└── .claude/           # Claude Code configuration
```

## How

### Environment

- **Package manager:** pnpm (workspaces)
- **Node.js:** 20+
- **Database:** PostgreSQL 15
- **Auth:** Auth0 (JWT bearer tokens)

### Key Commands

```bash
# Install dependencies
pnpm install

# Start development (from root)
pnpm --filter web dev          # Frontend at localhost:5173
pnpm --filter api dev          # Backend at localhost:3001

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Testing
pnpm --filter api prisma generate   # REQUIRED before first API test run
pnpm --filter api test         # Backend tests (Jest)
pnpm --filter web test         # Frontend tests (Vitest)

# Database
pnpm --filter api prisma migrate dev --name <name>   # Create migration
pnpm --filter api prisma generate                      # Generate client
pnpm --filter api prisma studio                        # Visual DB browser

# Build
pnpm --filter web build
pnpm --filter api build
pnpm --filter @goal-tracker/mcp build

# MCP Server & Authentication
pnpm mcp:login --profile production    # Authenticate MCP CLI via Auth0 Device Flow
pnpm mcp:status                        # Check MCP authentication and profile status
pnpm mcp:logout                        # Clear stored local MCP credentials
pnpm --filter @goal-tracker/mcp test   # Run MCP concurrency & security tests

# Docker
docker compose up -d           # Start all services
```

### Code Conventions

**TypeScript strict mode** everywhere. Never use `any`.

**Frontend (apps/web/):**

- Functional components only: `export const ComponentName = () => {}`
- Props interfaces defined above component
- Hooks order: useState → useContext → useEffect → useCallback → useMemo
- TailwindCSS for styling, CSS variables for theme colors
- React Context for global state (no Redux)
- File naming: PascalCase for components (.tsx), camelCase for utils/hooks (.ts)
- shadcn/ui for base components, Framer Motion for animations

**Backend (apps/api/):**

- REST API with Express.js
- Response format: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`
- Auth middleware validates JWT on all protected routes
- Prisma for database access with soft deletes (`isDeleted` field)
- Try-catch on all async operations

**Database:**

- Models: User, Goal (self-referential hierarchy), Task (self-referential subtasks), GoalTask (M:M join), Progress
- Enums: GoalType, GoalScope, FrequencyType, TaskPriority, TaskCategory
- Always create migrations: `prisma migrate dev --name descriptive_name`
- Include `createdAt` and `updatedAt` on all models

**Mobile App:**

- The mobile app was migrated out of this repository and is actively maintained at [`bises/Goal-Tracker-Android`](https://github.com/bises/Goal-Tracker-Android).
- See that repository for Expo/React Native setup, EAS build configurations, and mobile CI/CD.

**Naming:**

- Variables/functions: camelCase
- Components: PascalCase
- Constants: UPPERCASE_WITH_UNDERSCORES
- Booleans: prefix with `is`, `has`, `can`
- Database fields: camelCase

### Skills

Use the Skill tool for specialized workflows:

- **frontend-dev**: Creating or modifying React components, pages, and UI features
- **api-dev**: Creating or modifying API routes, services, and middleware
- **db-ops**: Database schema changes, migrations, and Prisma operations
- **git-ops**: Git operations (branches, commits, pull requests)
- **test-ops**: Writing and running tests for frontend and backend
- **deploy-ops**: Docker, deployment, and infrastructure operations

### MCP Servers

The following MCP servers are configured in `.mcp.json` (Claude Code) and `.vscode/mcp.json` (VS Code):

- **github** (`mcp__github`): GitHub integration — PRs, issues, branches, code search
  - Type: HTTP
  - URL: https://api.githubcopilot.com/mcp/

- **chrome-devtools** (`mcp__chrome-devtools`): Browser debugging — screenshots, DOM inspection, network, console, performance
  - Type: stdio
  - Command: `npx -y chrome-devtools-mcp@latest`

- **shadcn** (`mcp__shadcn`): Generate and add shadcn/ui components to the project
  - Type: stdio
  - Command: `npx shadcn@latest mcp`

- **context7** (`mcp__context7`): Fetch up-to-date documentation for any library (React, Prisma, Express, Tailwind, etc.)
  - Type: stdio
  - Command: `npx -y @upstash/context7-mcp@latest`

- **playwright** (`mcp__playwright`): E2E browser testing — navigate, click, fill forms, screenshot, assert
  - Type: stdio
  - Command: `npx -y @playwright/mcp@latest`

- **goal-tracker** (`mcp__goal-tracker`): Query goals, tasks, calendar agendas, and system status using authenticated user identity
  - Type: stdio
  - Command: `node apps/mcp/dist/index.js stdio --profile production`
  - Read-Only Tools (v1): `list_goals`, `get_goal`, `list_tasks`, `get_task`, `get_calendar_agenda`, `get_system_status`

**Configuration:**

- MCP servers are enabled via `enableAllProjectMcpServers: true` in `.claude/settings.local.json`
- Permissions are pre-configured for all MCP servers in the Claude Code settings
- Restart Claude Code after modifying MCP server configurations

### Safety Rules

- Never commit directly to main — always use feature branches
- Never modify existing migrations after they are pushed
- Never log tokens, passwords, or API keys
- Always validate user input server-side
- Always verify user owns the data they are accessing (auth guards)
- Never add `react` or frontend libraries as root-level dependencies — they belong in `apps/web`
- Run `pnpm run type-check` before committing

### Troubleshooting

**"Module '@prisma/client' has no exported member 'PrismaClient'" in API tests:**
Prisma client not generated. Run `pnpm --filter api prisma generate` before running tests. This is needed after fresh `pnpm install` or when the schema changes.
