---
description: Architecture and design workflow for planning system-level changes, reviewing architecture, and creating technical designs
---

# Architecture Workflow

Select a task to begin:

## 1. Review Current Architecture

Analyze the current Goal Tracker architecture and produce a comprehensive assessment.

## 2. Design a System Change

Create a detailed technical design for a significant system modification.

## 3. Database Schema Design

Plan database schema changes with migration strategy.

## 4. API Design

Design new API endpoints or restructure existing ones following REST best practices.

---

**Respond with the number (1-4) or task name.**

## Instructions

**Option 1: Review Current Architecture**

- Invoke the `repo-analyzer` agent to produce a full architectural analysis
- Save output to `docs/repo-analysis.md`

**Option 2: Design a System Change**

- Gather requirements from the user
- Analyze impact across all workspaces (web, api, shared)
- Produce a design document covering:
  - Current state and proposed state
  - Component diagram
  - Data flow changes
  - Migration path
  - Risk assessment
- Save to `docs/designs/{feature-name}-design.md`

**Option 3: Database Schema Design**

- Invoke the `db-architect` agent
- Review current schema in `apps/api/prisma/schema.prisma`
- Design new models/relationships
- Plan migration strategy

**Option 4: API Design**

- Review existing routes in `apps/api/src/routes/`
- Design new endpoints following project patterns
- Document request/response contracts
- Consider auth, pagination, and error handling
