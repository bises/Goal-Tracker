---
name: frontend-dev
description: Use this skill when creating or modifying React components, pages, hooks, contexts, or any frontend code in apps/web/. Trigger when user asks to "create a component", "add a page", "update the UI", "fix the frontend", or similar frontend development tasks.
---

# Frontend Development

## Overview

Create and modify React components, pages, hooks, and contexts for the Goal Tracker web app following established project conventions.

## Context — Always Read First

Before making any changes, read these files for current patterns:

- `apps/web/src/types.ts` — Type definitions
- `apps/web/src/api.ts` — API client wrapper
- `apps/web/src/App.tsx` — Router and provider structure
- `.github/copilot-instructions.md` — Full coding standards

## Component Creation Workflow

### 1. Props Interface

```typescript
interface MyComponentProps {
  title: string;
  onClose: () => void;
  variant?: 'default' | 'compact';
}
```

### 2. Component Structure

```typescript
export const MyComponent = ({ title, onClose, variant = 'default' }: MyComponentProps) => {
  // Hooks order: useState → useContext → useEffect → useCallback → useMemo
  const [isOpen, setIsOpen] = useState(false);
  const { tasks } = useTaskContext();

  useEffect(() => { /* side effects */ }, []);

  const handleClick = useCallback(() => { /* handler */ }, []);

  return <div className="rounded-2xl p-4">{title}</div>;
};
```

### 3. Styling Rules

- **TailwindCSS first** — use utility classes
- **CSS variables** for theme colors: `style={{ color: 'var(--deep-charcoal)' }}`
- **rounded-2xl** for consistency on cards and buttons
- **shadcn/ui** for base components (Button, Card, Dialog, Sheet)
- **Framer Motion** for animations

### 4. State Management

- **React Context** for global state — read `apps/web/src/contexts/`
- **useState** for component-local state
- **Never Redux** — keep it simple

### 5. Data Fetching Pattern

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetch = async () => {
    setLoading(true);
    try {
      const result = await api.getData();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);
```

## File Locations

| Type       | Location                   | Naming                    |
| ---------- | -------------------------- | ------------------------- |
| Pages      | `apps/web/src/pages/`      | PascalCase.tsx            |
| Components | `apps/web/src/components/` | PascalCase.tsx            |
| Contexts   | `apps/web/src/contexts/`   | PascalCase.tsx            |
| Hooks      | `apps/web/src/hooks/`      | camelCase.ts (use prefix) |
| Utils      | `apps/web/src/utils/`      | camelCase.ts              |
| Types      | `apps/web/src/types.ts`    | —                         |

## MCP Integrations

- **shadcn MCP:** Use `mcp__shadcn` to add new shadcn/ui components to the project
- **chrome-devtools MCP:** Use `mcp__chrome-devtools` to take screenshots, inspect the DOM, and debug rendering issues in the browser
- **context7 MCP:** Use `mcp__context7` to fetch up-to-date documentation for React, TailwindCSS, Framer Motion, or any library
- **playwright MCP:** Use `mcp__playwright` for E2E testing of user flows in the browser

## Checklist

- [ ] TypeScript interface for props
- [ ] Named export: `export const ComponentName`
- [ ] Hooks in correct order
- [ ] TailwindCSS for styling
- [ ] Loading and error states handled
- [ ] No `any` types
- [ ] No `console.log` in production
