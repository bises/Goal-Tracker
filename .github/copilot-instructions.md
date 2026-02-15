# Copilot Instructions for Goal Tracker

Coding standards and best practices guide for the Goal Tracker project. Ensure all new code follows these patterns.

---

## 📁 Project Structure

**Monorepo Layout:**
```
goal-tracker/
├── apps/api/              # Express.js backend
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── config/       # Config (auth, db)
│   │   ├── prisma.ts     # Prisma client setup
│   │   └── index.ts      # Server entry point
│   └── prisma/           # Database schema & migrations
├── apps/web/             # React frontend
│   ├── src/
│   │   ├── pages/        # Page components (routing)
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React Context (state)
│   │   ├── hooks/        # Custom hooks
│   │   ├── utils/        # Helper functions
│   │   ├── lib/          # External integrations
│   │   ├── api.ts        # HTTP client wrapper
│   │   ├── types.ts      # TypeScript interfaces
│   │   └── App.tsx       # Root component
├── packages/shared/      # Shared utilities (optional)
└── .github/              # GitHub config & CI/CD
```

---

## 🎨 Frontend Code Patterns

### Component Structure
- **Functional Components Only:** Always use `const ComponentName = () => {}` pattern
- **Props Interface:** Define props with TypeScript interface above component
- **Hooks Order:** `useState` → `useContext` → `useEffect` → `useCallback` → `useMemo`
- **Export:** Use named exports: `export const ComponentName = ...`

```typescript
interface MyComponentProps {
  title: string;
  onClose: () => void;
  variant?: 'default' | 'compact';
}

export const MyComponent = ({ title, onClose, variant = 'default' }: MyComponentProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return <div>{title}</div>;
};
```

### Styling
- **TailwindCSS First:** Use Tailwind classes for styling
- **CSS Variables:** Use CSS variables for theme colors: `color: 'var(--deep-charcoal)'`, `color: 'var(--energizing-orange)'`
- **Inline Styles:** Only for dynamic values or CSS variable usage
- **Rounded Corners:** Use `rounded-2xl` for consistency (buttons, cards)
- **Shadows:** Use `boxShadow: '0 4px 16px rgba(255, 140, 66, 0.3)'` for primary button shadows

### State Management
- **React Context:** Use for global state (auth, tasks, goals)
- **Local State:** `useState` for component-level state
- **Never Redux:** Keep it simple with Context API

### Data Fetching
- **API Wrapper:** Use `api.ts` for all HTTP calls
- **Error Handling:** Catch and display errors gracefully
- **Loading States:** Always show loading indicator during fetch

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

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

### Forms & Validation
- **Controlled Components:** Always use state for form inputs
- **onSubmit Handler:** Prevent default and validate before API call
- **Error Messages:** Show inline validation errors

---

## 🔐 Authentication

- **Auth0 Integration:** Use `@auth0/auth0-react` hooks (`useAuth0()`, `getAccessTokenSilently()`)
- **Token Management:** Auth0 SDK handles refresh tokens automatically
- **Silent Auth:** Always attempt silent auth on app load before data fetching
- **Protected Routes:** Redirect to `/login` if no valid token

---

## 🔧 Backend Patterns (Express.js + Prisma)

### API Routes
- **File Naming:** `camelCase.ts` (e.g., `tasks.ts`, `goals.ts`)
- **Route Structure:** Organize by resource (goals, tasks, users)
- **HTTP Methods:** GET, POST, PUT, DELETE following REST conventions
- **Response Format:**
  ```typescript
  res.json({ success: true, data: {...}, message?: "Optional message" });
  res.status(400).json({ success: false, error: "Error message" });
  ```

### Middleware
- **Auth Middleware:** Verify JWT token before accessing protected routes
- **Error Middleware:** Catch and format errors consistently
- **Validation Middleware:** Validate request body/params early

### Database (Prisma)
- **Schema Design:** Keep schema normalized and well-documented
- **Relations:** Use explicit relation fields (e.g., `goalId`, `userId`)
- **Indexes:** Add indexes on frequently queried fields
- **Migrations:** Always use `prisma migrate dev --name <descriptive_name>`
- **Soft Deletes:** Use `isDeleted` boolean field instead of hard deletes for audit trails
- **Timestamps:** Include `createdAt` and `updatedAt` fields

### Error Handling
- **Try-Catch:** Wrap async operations
- **Prisma Errors:** Handle `PrismaClientKnownRequestError` specifically
- **HTTP Status Codes:** Use appropriate codes (400, 401, 404, 500)
- **Logging:** Log errors with context for debugging

---

## 📝 Naming Conventions

### Variables & Functions
- **camelCase:** `userId`, `isLoading`, `handleClick()`
- **Constants:** `UPPERCASE_WITH_UNDERSCORES` for truly constant values
- **Booleans:** Prefix with `is`, `has`, `can`: `isOpen`, `hasError`, `canSubmit`

### Components
- **PascalCase:** `GoalCard`, `DailyTimelineView`, `TaskEditSheet`
- **Descriptive:** Use full names, not abbreviations: `GoalCard` not `GCard`

### Files
- **Components:** `PascalCase.tsx` (e.g., `GoalCard.tsx`)
- **Hooks:** `camelCase.ts` with `use` prefix (e.g., `useTaskContext.ts`)
- **Utils:** `camelCase.ts` (e.g., `dateUtils.ts`)
- **API:** `camelCase.ts` (e.g., `api.ts`)

### Database Models
- **Table Names:** Singular, `camelCase` (e.g., `User`, `Task`, `Goal`)
- **Fields:** `camelCase` (e.g., `userId`, `createdAt`)
- **Relations:** Use explicit naming (e.g., `goalId` for FK to Goal)

---

## 🧪 Type Safety

- **TypeScript:** Always use TS, never `any`
- **Interfaces:** Define interfaces for data shapes (see `types.ts`)
- **Union Types:** Use for variants: `type Scope = 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'STANDALONE'`
- **Enums:** Use for fixed sets of values in backend
- **Generics:** Use for reusable components/functions

---

## 📚 Common Patterns

### API Calls
```typescript
// In components, use context to access API methods
const { tasks, fetchTasks, updateTask } = useTaskContext();

// Always handle loading and error states
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Date Handling
- **Use `parseLocalDate()`:** Always parse ISO dates with this utility to handle timezone
- **Format:** Display dates as `toLocaleDateString('en-US')`
- **Storage:** Store as ISO string in database

### Error Boundaries
- **Wrap Routes:** Use error boundaries around page components
- **User Messages:** Show friendly error messages, not stack traces
- **Logging:** Log errors to console in development

### Drag & Drop / Interactions
- **Framer Motion:** Use for animations
- **Pointer Events:** Use `onPointerDown`, `onPointerMove`, `onPointerUp` for drag
- **State Management:** Track drag state locally with `useState`

---

## 🎯 Development Workflow

### Before Pushing Code
- [ ] Run `pnpm run type-check` (no TypeScript errors)
- [ ] Run `pnpm run lint` (no linting errors)
- [ ] Test in browser (no console errors)
- [ ] Verify API response handling
- [ ] Check responsive design (mobile & desktop)

### Commit Messages
- Use descriptive, present-tense: `Add task filtering` not `added filtering`
- Start with verb: `Add`, `Fix`, `Update`, `Remove`, `Refactor`
- Keep under 50 characters for subject line

### Database Changes
- Always create migration: `pnpm prisma migrate dev --name descriptive_name`
- Never edit migrations after they're pushed
- Test migrations on fresh database

---

## ⚙️ Tech Stack Specifics

### Frontend Libraries
- **React 18.3+:** Use hooks, functional components
- **TypeScript 5.x:** Strict mode
- **Vite:** Build tool (fast HMR)
- **TailwindCSS:** Utility-first CSS
- **shadcn/ui:** Pre-built components (Button, Card, Dialog, etc.)
- **Framer Motion:** Animations
- **Lucide React:** Icons

### Backend Libraries
- **Express.js:** Minimal web framework
- **Prisma 7.x:** ORM with type safety
- **TypeScript:** Strict mode
- **@prisma/adapter-pg:** PostgreSQL adapter

### Database
- **PostgreSQL 15:** Primary database
- **Migrations:** Tracked in `prisma/migrations/`

---

## 🚀 Performance Considerations

### Frontend
- **useMemo:** Memoize expensive computations
- **useCallback:** Memoize callbacks passed to child components
- **Code Splitting:** Lazy load routes with React.lazy()
- **Image Optimization:** Use appropriate formats and sizes

### Backend
- **Database Indexes:** Add on frequently queried fields (userId, scheduledDate)
- **Query Optimization:** Avoid N+1 queries
- **Pagination:** Implement for large datasets
- **Caching:** Consider for frequently accessed data

---

## 🐛 Debugging Tips

### Frontend
- Browser DevTools: React Devtools extension for context inspection
- Network tab: Verify API calls and responses
- Console: Check for errors, use debug logs sparingly

### Backend
- Prisma Studio: `pnpm prisma studio` to view database visually
- API Testing: Use Postman or similar with Bearer token auth
- Logging: Add `console.log()` at critical points

---

## 📋 Code Review Checklist

When reviewing PRs, ensure:
- [ ] TypeScript strict mode compliance
- [ ] Props have TypeScript interfaces
- [ ] No `console.log()` left in production code
- [ ] Error handling is present
- [ ] Loading states are handled
- [ ] Component is responsive
- [ ] No unnecessary re-renders (check React Devtools)
- [ ] Database changes have migrations
- [ ] Commit messages are descriptive

---

## 🔒 Security Practices

- **Never log sensitive data:** Tokens, passwords, API keys
- **Validate Input:** Server-side validation always, client-side for UX
- **Auth Guards:** Always verify user owns the data they're accessing
- **XSS Prevention:** Sanitize user input, use libraries like `xss`
- **CORS:** Configure appropriately, not `*`
- **Environment Variables:** Never commit `.env`, use `.env.example`

---

## 📖 Documentation

- **README:** Keep updated with setup instructions
- **Components:** Document complex components with JSDoc comments
- **APIs:** Document endpoints with request/response examples
- **Migrations:** Leave comments explaining schema changes

---

## ✅ Best Practices Summary

1. **Type Everything:** Use TypeScript strictly
2. **Component Reusability:** Extract common patterns into components
3. **Keep It Simple:** KISS principle - don't over-engineer
4. **Test Before Pushing:** Run local tests and build
5. **Semantic HTML:** Use proper tags for accessibility
6. **Consistent Naming:** Follow conventions strictly
7. **Error Handling:** Never let errors silently fail
8. **Performance:** Memoize expensive operations
9. **Accessibility:** Include ARIA labels, keyboard navigation
10. **Documentation:** Comment complex logic
