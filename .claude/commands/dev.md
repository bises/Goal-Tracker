---
description: Development workflow for implementing features, fixing bugs, and working on the Goal Tracker codebase
---

# Developer Workflow

Select a task to begin:

## 1. Implement a Feature

Plan and implement a new feature end-to-end across frontend, backend, and database.

## 2. Fix a Bug

Diagnose and fix a reported bug with proper error handling and testing.

## 3. Refactor Code

Improve existing code structure, performance, or readability without changing behavior.

## 4. Add a Component

Create a new React component following project conventions (TailwindCSS, shadcn/ui, TypeScript).

## 5. Add an API Route

Create a new Express.js API endpoint with proper auth, validation, and error handling.

## 6. Resume Previous Work

Continue work from a previous session.

---

**Respond with the number (1-6) or task name.**

## Instructions

**Option 1: Implement a Feature**

- Invoke the `feature-planner` agent to create an implementation plan
- Then implement step by step, starting with database → API → frontend
- Use `git-ops` skill for branch creation and commits

**Option 2: Fix a Bug**

- Ask user for bug description and steps to reproduce
- Read relevant code to identify the root cause
- Fix the issue and add a test to prevent regression
- Use `git-ops` skill for branch and commit

**Option 3: Refactor Code**

- Identify the target code and current issues
- Plan the refactoring approach
- Execute changes while maintaining all existing behavior
- Run tests to verify nothing broke

**Option 4: Add a Component**

- Ask for component requirements (props, behavior, styling)
- Read existing components in `apps/web/src/components/` for patterns
- Create the component with TypeScript interface, TailwindCSS styling
- Use `frontend-design` skill for high-quality UI

**Option 5: Add an API Route**

- Ask for endpoint requirements (method, path, request/response)
- Read existing routes in `apps/api/src/routes/` for patterns
- Create route with auth middleware, validation, error handling
- Add corresponding service in `apps/api/src/services/`

**Option 6: Resume Previous Work**

- Ask what was being worked on previously
- Read relevant files to restore context
- Continue from where work left off
