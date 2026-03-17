---
name: deploy-ops
description: Use this skill for Docker operations, production builds, deployment, and infrastructure management. Trigger when user asks to "deploy", "build for production", "docker up", "check services", or any deployment/infrastructure task.
---

# Deploy Operations

## Overview

Manage Docker deployment, production builds, and infrastructure for the Goal Tracker monorepo.

## Docker Configuration

| File                                | Purpose                    |
| ----------------------------------- | -------------------------- |
| `docker-compose.yml`                | Development environment    |
| `docker-compose.prod.yml`           | Production environment     |
| `docker-compose.shared-network.yml` | Shared network config      |
| `apps/api/Dockerfile`               | Backend container          |
| `apps/web/Dockerfile`               | Frontend container (nginx) |

## Common Operations

### Start Development

```bash
docker compose up -d
```

### Start Production

```bash
docker compose -f docker-compose.prod.yml up -d
```

### Rebuild After Changes

```bash
docker compose build --no-cache <service>
docker compose up -d <service>
```

### View Logs

```bash
docker compose logs -f api    # Backend logs
docker compose logs -f web    # Frontend logs
docker compose logs -f db     # Database logs
```

### Stop Everything

```bash
docker compose down
```

## Production Build

### Frontend

```bash
cd apps/web
pnpm build
# Output: apps/web/dist/ (served by nginx)
```

### Backend

```bash
cd apps/api
pnpm build
# Output: apps/api/dist/
```

## Health Checks

1. **Database:** `docker compose exec db pg_isready`
2. **API:** `curl http://localhost:3001/health` (or appropriate endpoint)
3. **Frontend:** `curl http://localhost:5173` (dev) or `http://localhost:80` (prod)

## Environment Variables

**Backend (`apps/api/.env`):**

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH0_ISSUER_BASE_URL` — Auth0 domain
- `AUTH0_AUDIENCE` — Auth0 API audience
- `PORT` — Server port (default: 3001)
- `CORS_ORIGIN` — Allowed frontend origin

**Frontend (`apps/web/.env`):**

- `VITE_API_URL` — Backend API URL
- `VITE_AUTH0_DOMAIN` — Auth0 domain
- `VITE_AUTH0_CLIENT_ID` — Auth0 client ID
- `VITE_AUTH0_AUDIENCE` — Auth0 API audience

## Pre-Deployment Checklist

- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
- [ ] All tests pass
- [ ] Production build succeeds
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Docker images build successfully
