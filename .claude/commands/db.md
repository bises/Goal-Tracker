---
description: Database operations workflow for schema changes, migrations, seeding, and Prisma Studio
---

# Database Operations

Select a task to begin:

## 1. Modify Schema

Add or change models, fields, relations, or enums in the Prisma schema.

## 2. Create Migration

Generate a new Prisma migration from schema changes.

## 3. View Database

Launch Prisma Studio for visual database browsing.

## 4. Seed Data

Create or run database seed scripts for development data.

## 5. Migration Status

Check the current migration status and history.

---

**Respond with the number (1-5) or task name.**

## Instructions

**Option 1: Modify Schema**

- Invoke the `db-architect` agent
- Read current schema at `apps/api/prisma/schema.prisma`
- Propose changes following project conventions:
  - Include `userId` for multi-tenancy
  - Add `createdAt`/`updatedAt` timestamps
  - Use `isDeleted` for soft deletes
  - Add appropriate indexes
- Apply changes after user approval

**Option 2: Create Migration**

- Verify schema has uncommitted changes
- Ask for a descriptive migration name
- Run `pnpm --filter api prisma migrate dev --name <name>`
- Report the migration result

**Option 3: View Database**

- Run `pnpm --filter api prisma studio`
- Inform user it opens at http://localhost:5555

**Option 4: Seed Data**

- Read existing seed scripts if any
- Create/update seed script with realistic test data
- Run the seed script

**Option 5: Migration Status**

- List migrations in `apps/api/prisma/migrations/`
- Run `pnpm --filter api prisma migrate status`
- Report which migrations are applied and any pending
