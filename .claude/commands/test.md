---
description: Testing workflow for writing tests, running test suites, and checking coverage across the Goal Tracker monorepo
---

# Testing Workflow

Select a task to begin:

## 1. Write Tests for a File

Generate comprehensive tests for a specific source file.

## 2. Run All Tests

Execute the full test suite across backend and frontend.

## 3. Run Backend Tests

Execute Jest tests for the API (`apps/api/`).

## 4. Run Frontend Tests

Execute Vitest tests for the web app (`apps/web/`).

## 5. Check Coverage

Run tests with coverage reporting.

---

**Respond with the number (1-5) or task name.**

## Instructions

**Option 1: Write Tests for a File**

- Ask user for the file path to test
- Invoke the `test-writer` agent with that file
- The agent will read existing patterns, generate tests, and validate them

**Option 2: Run All Tests**

- Run `pnpm --filter api test` and report results
- Run `pnpm --filter web test` and report results
- Summarize: total tests, passed, failed, skipped

**Option 3: Run Backend Tests**

- Run `pnpm --filter api test`
- Report results with details on any failures

**Option 4: Run Frontend Tests**

- Run `pnpm --filter web test`
- Report results with details on any failures

**Option 5: Check Coverage**

- Run `pnpm --filter api test -- --coverage`
- Run `pnpm --filter web test -- --coverage`
- Report coverage percentages per workspace
- Highlight files with low coverage
