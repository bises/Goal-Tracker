---
name: test-ops
description: Use this skill for writing and running tests across the Goal Tracker monorepo. Trigger when user asks to "write tests", "add tests", "run tests", "check coverage", or any testing-related task. Supports Jest (backend) and Vitest (frontend).
---

# Test Operations

## Frameworks

| Workspace | Framework | Config           | Test Dir         | Command                  |
| --------- | --------- | ---------------- | ---------------- | ------------------------ |
| apps/api/ | Jest      | `jest.config.ts` | `src/__tests__/` | `pnpm --filter api test` |
| apps/web/ | Vitest    | `vite.config.ts` | `src/__tests__/` | `pnpm --filter web test` |

## Prerequisites

**Before running API tests:** Run `pnpm --filter api prisma generate` to generate the Prisma client. Without this, `@prisma/client` exports nothing and all tests fail with `TS2305: Module has no exported member 'PrismaClient'`.

**Before running web tests:** Ensure `.npmrc` has `resolve-peers-from-workspace-root=false`. This monorepo has React 18 (web) and React 19 (mobile) — without this setting, pnpm creates duplicate React instances causing `TypeError: Cannot read properties of null (reading 'useState')` in every test that uses React hooks.

## Running All Tests

```bash
# Full test suite (from root)
pnpm --filter api prisma generate && pnpm run test
```

## Backend Test Pattern (Jest)

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
jest.mock('../prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe('GoalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return goals for user', async () => {
    // Arrange
    const mockGoals = [{ id: '1', title: 'Test Goal', userId: 'user-1' }];
    (prisma.goal.findMany as jest.Mock).mockResolvedValue(mockGoals);

    // Act
    const result = await goalService.getAll('user-1');

    // Assert
    expect(result).toEqual(mockGoals);
    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1', isDeleted: false } })
    );
  });
});
```

## Frontend Test Pattern (Vitest + React Testing Library)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalCard } from '../components/GoalCard';

describe('GoalCard', () => {
  const defaultProps = {
    title: 'Test Goal',
    progress: 0.5,
    onEdit: vi.fn(),
  };

  it('should render goal title', () => {
    render(<GoalCard {...defaultProps} />);
    expect(screen.getByText('Test Goal')).toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    render(<GoalCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(defaultProps.onEdit).toHaveBeenCalled();
  });
});
```

## Test Writing Guidelines

- **AAA pattern:** Arrange → Act → Assert
- **One concept per test** — multiple asserts for same concept is OK
- **Descriptive names:** "should return 404 when goal not found"
- **Mock external deps:** Auth0, Prisma, API calls, `fetch`
- **Test behavior, not implementation**
- **No `console.log` in tests**
- **Tests must be independent** — run in any order

## MCP Integrations

- **playwright MCP:** Use `mcp__playwright` for E2E testing — navigate pages, fill forms, click buttons, take screenshots, and assert page content in a real browser
- **chrome-devtools MCP:** Use `mcp__chrome-devtools` to debug test failures by inspecting the DOM, network requests, and console errors
- **context7 MCP:** Use `mcp__context7` to fetch up-to-date documentation for Jest, Vitest, React Testing Library, or Playwright

## What to Test

**Backend:**

- Route handlers (request → response)
- Service functions (business logic)
- Middleware (auth, validation)
- Error scenarios (invalid input, not found, unauthorized)

**Frontend:**

- Component rendering with different props
- User interactions (click, type, submit)
- Loading and error states
- Context behavior
- Hook return values
