# Goal Tracker Local Stdio MCP Server (`apps/mcp`)

* **Author:** bishesh
* **Date:** 2026-11-16

## Overview

Goal Tracker Local MCP Server is a Node.js stdio daemon package (`apps/mcp`) within the Goal Tracker monorepo. It enables any Model Context Protocol (MCP) compatible AI agent (such as Claude Code, Antigravity, or Cursor) to view, create, update, and manage goals, daily tasks, and calendar schedules directly through natural language. 

The server delegates authentication to Auth0's Native Device Authorization Flow (RFC 8628), allowing the user to sign in once via browser verification (`https://bises.auth0.com/activate`) without hardcoded secrets or passwords. Tokens are stored in a local secure file (`~/.goal-tracker/auth.json`) and maintained with Auth0 Refresh Token Rotation. The MCP server acts as an HTTP client proxy to Goal Tracker's Express REST backend, preserving all existing business logic, validation rules, task deduplication, and automated progress recalculation across both local development (`localhost:3000`) and the home server deployment on `jbhouse` over Tailscale (`100.115.237.63:3000`).

## Analysis

Seven specialized review lenses evaluated the architecture across protocol boundaries, agent ergonomics, concurrency, and monorepo structure:

### 1. UX, Stdio Protocol Hygiene & Agent Ergonomics
- **Stdio Protocol Purity**: MCP stdio transport requires `stdout` to carry strictly valid JSON-RPC 2.0 messages. Any unexpected text (such as interactive login banners, console logs, or unhandled warnings) written to `stdout` breaks agent communication. All diagnostic messages, login URLs, and progress logs must route strictly to `stderr` (`console.error`).
- **Semantic Tool Grouping**: Instead of exposing 15+ fine-grained REST endpoints that dilute LLM attention and consume excess context tokens, the MCP server consolidates operations into semantic tools (`manage_goals`, `manage_tasks`, `link_task_to_goal`, `get_calendar_agenda`, `get_system_status`).
- **Informative Mutation Responses**: Mutating operations return structured operation summaries (e.g. affected goal, remaining task counts, updated completion percentage) so agents can report clear outcomes without issuing follow-up read queries.

### 2. Codebase Integration & Monorepo Reuse
- **Shared Types**: `apps/mcp` directly consumes `@goal-tracker/shared` via pnpm workspace references (`workspace:*`), reusing TypeScript interfaces (`Goal`, `Task`, `TaskPriority`, `GoalScope`) and date formatting functions.
- **Date Invariance**: Goal Tracker schedules tasks using date-only strings (`YYYY-MM-DD`) without timezone shifts. Tool input schemas enforce this strictly via the regex pattern `^\d{4}-\d{2}-\d{2}$`.
- **Fast Startup**: Stdio MCP processes are spawned on demand by IDEs. Using pre-bundled single-file builds via `tsup` keeps cold startup under 150ms and avoids `ts-node` runtime overhead. Native Node 18+ `fetch` is used for all HTTP communication without external HTTP dependencies.

### 3. Dual-Environment Routing & Fail-Fast Connectivity
- The server dynamically routes requests via the environment variable `GOAL_TRACKER_API_URL` (defaulting to local `http://localhost:3000`, switchable to `http://100.115.237.63:3000` for remote `jbhouse` deployments).
- When targeting `jbhouse` over Tailscale, the client enforces a short connection timeout (3 seconds) to fail fast with actionable guidance if the Tailscale VPN tunnel is disconnected.

### 4. Inventive Contradictions & Architectural Resolutions

#### Contradiction 1: Headless Agent Startup vs. Interactive Browser Authentication
- **Conflict**: RFC 8628 requires user confirmation in a web browser, but AI coding assistants launch MCP servers as headless child processes over stdio. If the server pauses waiting for auth during agent startup, the agent times out.
- **Resolution (Prior Action & Informative Tool Error)**:
  1. Users run `pnpm --filter mcp login` interactively in their terminal before launching IDE tools.
  2. If an agent calls a tool when credentials are missing or expired, the MCP tool returns a structured error payload (`isError: true`) with the exact verification URL and prompts the user to complete verification in the opened browser, rather than hanging the stdio stream.

#### Contradiction 2: Multi-Agent Concurrency vs. Refresh Token Rotation (RTR)
- **Conflict**: Auth0 Refresh Token Rotation immediately invalidates the previous refresh token. If two agents (e.g., Claude Code and Cursor) execute concurrently and both attempt token refreshes simultaneously, one request sends an invalidated token, triggering Auth0 Reuse Detection and revoking the entire user session.
- **Resolution (Cross-Process Mutex & Single-Flight Dedup)**:
  - Token refresh operations acquire an atomic file lock (`~/.goal-tracker/auth.lock`).
  - Prior to sending a refresh request to Auth0, the process checks if `auth.json` was already updated within the last 30 seconds by another process. If updated, the new access token is read directly from disk without initiating a duplicate refresh.

## Goals vs. Non-Goals

### In-Scope Goals
* **Monorepo Package (`apps/mcp`)**: Standalone TypeScript package managed by pnpm, packaged with `tsup` for rapid stdio startup.
* **Auth0 Native Device Code Flow**: CLI-driven authentication (`pnpm --filter mcp login`, `status`, `logout`) caching tokens in `~/.goal-tracker/auth.json`.
* **Refresh Token Rotation Handling**: Automatic in-memory token caching and silent refresh with cross-process concurrency locking.
* **Semantic MCP Tools**:
  * `manage_goals`: List, get, create, update, and delete goals with scope and frequency configuration.
  * `manage_tasks`: List, get, create, update, delete, complete, and uncomplete daily tasks.
  * `link_task_to_goal` / `unlink_task_from_goal`: Relational task-goal associations.
  * `get_calendar_agenda`: Query tasks by date range and calendar view.
  * `get_system_status`: Inspect connected API URL, version, and authenticated user identity.
* **Environment Switching**: Support both local development (`localhost:3000`) and home server (`100.115.237.63:3000`) via `GOAL_TRACKER_API_URL`.

### Out-of-Scope Non-Goals
* **Remote HTTP/SSE MCP Hosting**: The MCP server runs locally via stdio; it does not expose an open HTTP/SSE port over the network.
* **Mobile Client Direct MCP Integration**: Mobile apps continue to consume the existing Express REST API directly, not the MCP server.
* **Machine-to-Machine (M2M) System Auth**: M2M client credentials are not used, as they do not carry the personal `sub` identity required to access user-scoped goals.
* **Database Direct Access**: The MCP server does not connect directly to PostgreSQL or run Prisma; all mutations must flow through the Express API to guarantee progress calculation consistency.

## Alternatives Weighed

* **Remote HTTP/SSE MCP Server on `jbhouse`**: Rejected by author. Running a shared remote MCP server requires managing multi-tenant auth or exposing personal credentials over the network, whereas local stdio runs natively in developer tools.
* **Direct Database Access via Prisma in MCP**: Rejected by author. While faster, bypassing Express would duplicate validation logic, bypass Auth0 security checks, and risk corrupting goal progress recalculations.
* **Machine-to-Machine (M2M) Client Credentials Flow**: Rejected by author. Goal Tracker's relational data is partitioned by individual Auth0 user IDs (`sub`). M2M tokens represent headless services and cannot access user-owned data without implementing custom impersonation.

## Key Decisions & Staging for Next Steps

1. **Auth0 Application Type**: Create an Auth0 Application of type **Native** with **Device Code** and **Refresh Token** grants enabled, targeting audience `https://goal-tracker-api`.
2. **Local Token Cache**: Store credentials at `~/.goal-tracker/auth.json` with file locking on `~/.goal-tracker/auth.lock`.
3. **Packaging**: Scaffold package at `apps/mcp` with `@modelcontextprotocol/sdk` and `tsup`.
4. **Handoff**: Proceed to formal design drafting with `egm-draft` or refine specific tool signatures.
