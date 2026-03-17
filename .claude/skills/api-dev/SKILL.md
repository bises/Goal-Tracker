---
name: api-dev
description: Use this skill when creating or modifying API routes, services, middleware, or any backend code in apps/api/. Trigger when user asks to "add an endpoint", "create a route", "update the API", "fix the backend", or similar backend development tasks.
---

# API Development

## Overview

Create and modify Express.js API routes, services, and middleware for the Goal Tracker backend following established patterns.

## Context — Always Read First

Before making changes, read these files for current patterns:

- `apps/api/src/routes/` — Existing route patterns
- `apps/api/src/services/` — Service layer patterns
- `apps/api/src/middleware/` — Auth and validation middleware
- `apps/api/prisma/schema.prisma` — Current database schema
- `apps/api/src/prisma.ts` — Prisma client setup

## Route Creation Workflow

### 1. Route File

```typescript
// apps/api/src/routes/myResource.ts
import { Router } from 'express';
import { myService } from '../services/myService';

const router = Router();

// GET /api/my-resource
router.get('/', async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const data = await myService.getAll(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
```

### 2. Service File

```typescript
// apps/api/src/services/myService.ts
import { prisma } from '../prisma';

export const myService = {
  async getAll(userId: string) {
    return prisma.myModel.findMany({
      where: { userId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(userId: string, data: CreateInput) {
    return prisma.myModel.create({
      data: { ...data, userId },
    });
  },

  async update(id: string, userId: string, data: UpdateInput) {
    return prisma.myModel.update({
      where: { id, userId },
      data,
    });
  },

  async softDelete(id: string, userId: string) {
    return prisma.myModel.update({
      where: { id, userId },
      data: { isDeleted: true },
    });
  },
};
```

### 3. Register Route

Add to `apps/api/src/app.ts`:

```typescript
import myResourceRoutes from './routes/myResource';
app.use('/api/my-resource', authMiddleware, myResourceRoutes);
```

## Response Format

**Success:**

```json
{ "success": true, "data": { ... }, "message": "Optional message" }
```

**Error:**

```json
{ "success": false, "error": "Human-readable error message" }
```

**Status Codes:**

- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (user doesn't own resource)
- 404: Not Found
- 500: Internal Server Error

## Patterns

- **Auth:** Every protected route checks `req.auth?.payload?.sub` for userId
- **Soft deletes:** Use `isDeleted: false` in all queries
- **Validation:** Validate request body early, return 400 with clear message
- **Prisma errors:** Handle `PrismaClientKnownRequestError` for constraint violations
- **Logging:** Log errors with context, never log tokens or sensitive data

## MCP Integrations

- **context7 MCP:** Use `mcp__context7` to fetch up-to-date documentation for Express.js, Prisma, or any backend library
- **github MCP:** Use `mcp__github` for creating PRs, checking issues, and code search across the repo

## Checklist

- [ ] Auth middleware on route
- [ ] userId extracted from JWT
- [ ] User ownership verified on data access
- [ ] Input validation
- [ ] Proper error handling with try-catch
- [ ] Correct HTTP status codes
- [ ] Response follows `{ success, data/error }` format
- [ ] Soft delete instead of hard delete
- [ ] No `any` types
