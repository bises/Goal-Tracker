---
description: Deploy and infrastructure operations for Docker, production builds, and deployment management
---

# Deploy & Infrastructure

Select a task to begin:

## 1. Build for Production

Run production builds for frontend and/or backend.

## 2. Docker Operations

Manage Docker containers (up, down, rebuild, logs).

## 3. Check Health

Verify the health of all services (API, database, frontend).

## 4. Environment Setup

Set up or verify environment variables and configuration.

---

**Respond with the number (1-4) or task name.**

## Instructions

**Option 1: Build for Production**

- Run `pnpm --filter web build` — report build result and bundle size
- Run `pnpm --filter api build` — report build result
- Report any build errors with details

**Option 2: Docker Operations**

- Ask which operation: up, down, rebuild, logs
- `docker compose up -d` — Start all services
- `docker compose down` — Stop all services
- `docker compose build --no-cache` — Rebuild images
- `docker compose logs -f <service>` — View logs
- Reference `docker-compose.yml` for service definitions

**Option 3: Check Health**

- Verify PostgreSQL is running and accessible
- Check API is responding at its endpoint
- Check frontend dev server or build output
- Report status of each service

**Option 4: Environment Setup**

- Check for `.env` files in `apps/api/` and `apps/web/`
- Verify required variables are set:
  - Auth0: domain, client ID, audience, issuer
  - Database: connection URL
  - API: port, CORS origins
- Reference `docs/QUICK-START.md` for setup instructions
