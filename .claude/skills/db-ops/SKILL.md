---
name: db-ops
description: Use this skill for database schema changes, Prisma migrations, query optimization, and data modeling. Trigger when user asks to "add a field", "create a model", "run migration", "optimize queries", or any database-related task.
---

# Database Operations

## Overview

Manage the Goal Tracker PostgreSQL database via Prisma ORM — schema design, migrations, query patterns, and optimization.

## Context — Always Read First

- `apps/api/prisma/schema.prisma` — Current schema
- `apps/api/src/prisma.ts` — Prisma client configuration
- `apps/api/src/services/` — Query patterns in use

## Current Schema Summary

**Models:**

- `User` — Auth0-linked user profiles
- `Goal` — Hierarchical goals (self-referential: parentGoalId)
- `Task` — Schedulable tasks (self-referential: parentTaskId for subtasks)
- `GoalTask` — Many-to-many join between Goals and Tasks
- `Progress` — Goal progress tracking entries

**Enums:**

- `GoalType`: ACHIEVABLE, MEASURABLE
- `GoalScope`: YEARLY, MONTHLY, WEEKLY, STANDALONE
- `FrequencyType`: DAILY, WEEKLY, MONTHLY, CUSTOM
- `TaskPriority`: LOW, MEDIUM, HIGH, URGENT
- `TaskCategory`: WORK, PERSONAL, HEALTH, LEARNING, OTHER

## Adding a New Model

```prisma
model NewModel {
  id          String   @id @default(cuid())
  userId      String
  // ... fields
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
}
```

Required fields for every model:

- `id` — cuid primary key
- `userId` — foreign key to User (multi-tenancy)
- `isDeleted` — Boolean for soft deletes
- `createdAt` / `updatedAt` — timestamps

## Migration Workflow

1. Modify `apps/api/prisma/schema.prisma`
2. Run: `pnpm --filter api prisma migrate dev --name <descriptive_name>`
3. Verify generated SQL in `apps/api/prisma/migrations/`
4. Run `pnpm --filter api prisma generate` to update the client

**Migration naming:** Use snake_case describing the change:

- `add_notifications_model`
- `add_task_due_date_field`
- `add_index_on_scheduled_date`

## Query Patterns

**Avoid N+1:**

```typescript
// BAD — N+1 queries
const goals = await prisma.goal.findMany({ where: { userId } });
for (const goal of goals) {
  goal.tasks = await prisma.task.findMany({ where: { goalId: goal.id } });
}

// GOOD — Single query with include
const goals = await prisma.goal.findMany({
  where: { userId, isDeleted: false },
  include: { goalTasks: { include: { task: true } } },
});
```

**Use select for performance:**

```typescript
// Only fetch needed fields
const goals = await prisma.goal.findMany({
  where: { userId },
  select: { id: true, title: true, scope: true },
});
```

## MCP Integrations

- **context7 MCP:** Use `mcp__context7` to fetch up-to-date Prisma documentation for schema syntax, query API, and migration commands

## Rules

- NEVER modify existing pushed migrations
- ALWAYS use descriptive migration names
- ALWAYS include userId, isDeleted, createdAt, updatedAt on new models
- ALWAYS add @@index on userId and frequently queried fields
- Use explicit relation fields
- Test migrations on fresh database when possible
