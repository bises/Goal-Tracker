# Goal Tracker - Repository Architectural Analysis

**Analysis Date:** 2026-03-17
**Repository:** Goal Tracker Monorepo
**Focus:** Full Architecture Analysis with React Native Migration Considerations

---

## Table of Contents

1. [Repository Overview](#1-repository-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architectural Patterns](#3-architectural-patterns)
4. [Module Structure](#4-module-structure)
5. [Data Flow & Communication](#5-data-flow--communication)
6. [Database Schema Summary](#6-database-schema-summary)
7. [Authentication Flow](#7-authentication-flow)
8. [Key Components Deep Dive](#8-key-components-deep-dive)
9. [Configuration & Infrastructure](#9-configuration--infrastructure)
10. [Quality Attributes](#10-quality-attributes)
11. [React Native Migration Readiness](#11-react-native-migration-readiness)
12. [Technical Debt & Improvements](#12-technical-debt--improvements)
13. [Quick Reference](#13-quick-reference)

---

## 1. Repository Overview

### Structure

```
goal-tracker/
├── apps/
│   ├── api/              # Express.js REST API (14 TypeScript files)
│   │   ├── prisma/       # Database schema + 16 migrations
│   │   └── src/          # Routes, services, middleware
│   └── web/              # React PWA Frontend (60 TypeScript files)
│       └── src/          # Components, pages, contexts, hooks
├── packages/
│   └── shared/           # Shared utilities (dateUtils)
├── docs/                 # 20 documentation files
├── scripts/              # Deployment automation
└── docker-compose.yml    # Container orchestration
```

### Key Metrics

- **Frontend Files:** 60 TypeScript/TSX files
- **Backend Files:** 14 TypeScript files
- **Shared Package:** 2 utility modules
- **Database Migrations:** 16 migrations
- **Documentation:** 20+ comprehensive guides
- **Package Manager:** pnpm with workspaces
- **Monorepo Tool:** Turborepo (installed but minimal usage)

### Design Philosophy

- **Single-user focus:** Personal productivity tool
- **Self-hosted:** No cloud dependencies
- **TypeScript-first:** Strict typing everywhere
- **REST-based:** Simple HTTP API with JWT auth
- **Progressive Web App:** Installable, offline-capable
- **Hierarchical data model:** Goals and tasks with parent-child relationships

---

## 2. Technology Stack

### Frontend (`apps/web/`)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI library |
| **Build Tool** | Vite | 4.3.2 | Fast dev server & bundler |
| **Language** | TypeScript | 5.0.0 | Type safety |
| **Styling** | TailwindCSS | 4.1.18 | Utility-first CSS |
| **UI Components** | shadcn/ui + Radix UI | Latest | Accessible component library |
| **Routing** | React Router DOM | 7.12.0 | Client-side routing |
| **Animation** | Framer Motion | 10.18.0 | Animations & transitions |
| **Auth** | @auth0/auth0-react | 2.12.0 | Auth0 integration |
| **Icons** | lucide-react | 0.576.0 | Icon library |
| **Charts** | recharts | 2.5.0 | Data visualization |
| **PWA** | vite-plugin-pwa | 1.2.0 | Service worker & manifest |
| **Date Handling** | date-fns | 4.1.0 | Date utilities |
| **Testing** | Vitest + RTL | 3.2.0 | Unit & integration tests |

**Key Dependencies:**
- `vaul` (1.1.2) - Mobile drawer component
- `react-day-picker` (9.13.0) - Calendar picker
- `class-variance-authority` (0.7.1) - Component variants
- `tailwind-merge` (3.4.0) - Conditional Tailwind classes

### Backend (`apps/api/`)

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | HTTP server |
| **Language** | TypeScript | 5.0.0 | Type safety |
| **ORM** | Prisma | 7.2.0 | Database toolkit |
| **Database** | PostgreSQL | 15 | Relational database |
| **Auth** | express-oauth2-jwt-bearer | 1.6.0 | JWT validation |
| **CORS** | cors | 2.8.5 | Cross-origin requests |
| **Testing** | Jest + Supertest | 29.7.0 | API testing |
| **Dev Server** | nodemon + ts-node | Latest | Hot reload |

**Key Dependencies:**
- `@prisma/adapter-pg` (7.2.0) - PostgreSQL adapter
- `jwks-rsa` (3.1.0) - RSA key validation
- `pg` (8.17.0) - PostgreSQL client
- `tsconfig-paths` (4.2.0) - Path alias resolution

### Shared (`packages/shared/`)

| Module | Purpose | Platform Support |
|--------|---------|------------------|
| `dateUtils.ts` | UTC-based date parsing, formatting, and validation | Universal (Node + Browser) |

### Infrastructure

- **Docker:** Multi-stage builds for production
- **CI/CD:** GitHub Actions (build, test, deploy)
- **Deployment:** Docker Compose with optional HTTPS
- **Version Control:** Git with conventional commits

---

## 3. Architectural Patterns

### 3.1 Monorepo Architecture

**Pattern:** pnpm Workspaces
**Structure:**
- Three workspaces: `apps/*`, `packages/*`
- Workspace protocol for internal dependencies: `workspace:*`
- Shared types and utilities in `@goal-tracker/shared`

**Dependency Flow:**
```
apps/web → @goal-tracker/shared
apps/api → @goal-tracker/shared
```

**Build Strategy:**
- Parallel builds via pnpm recursive commands
- Independent build outputs per workspace
- Vite path aliases for frontend imports

### 3.2 Frontend Architecture

**Pattern:** Context-Based State Management + React Router

```
main.tsx (Entry Point)
  ↓
Auth0Provider (Authentication wrapper)
  ↓
GoalProvider (Global goal state)
  ↓
TaskProvider (Global task state)
  ↓
App (Router + Layout)
  ↓
Routes (Protected & Public)
  ↓
Pages (Dashboard, Goals, Tasks, Planner)
  ↓
Components (Cards, Sheets, Forms)
```

**State Management Strategy:**
- **React Context API** for global state (no Redux)
- **Custom hooks** for reusable logic
- **Optimistic updates** in context providers
- **Lazy loading** with conditional fetch (checks if data already loaded)
- **Force refresh** after mutations

**Component Architecture:**
- **Functional components only** (no class components)
- **Composition over inheritance**
- **Props interfaces** defined above components
- **Hooks order convention:** useState → useContext → useEffect → useCallback → useMemo

**Routing Strategy:**
- BrowserRouter for client-side navigation
- Protected routes with Auth0 authentication guard
- Nested layout with persistent TopNav and BottomNav
- Dynamic padding adjustment for authenticated pages

### 3.3 Backend Architecture

**Pattern:** Layered REST API with Express Middleware Chain

```
HTTP Request
  ↓
Express App (CORS + JSON Parser)
  ↓
Route Handler (validateJWT → requireAuth)
  ↓
Service Layer (Business logic)
  ↓
Prisma Client (ORM)
  ↓
PostgreSQL Database
```

**Layering:**
1. **Routes** (`routes/*.ts`) - HTTP endpoint definitions
2. **Middleware** (`middleware/auth.ts`) - JWT validation, user extraction
3. **Services** (`services/*.ts`) - Business logic (completion, user management)
4. **Prisma** (`prisma.ts`) - Database client with PG adapter
5. **Database** - PostgreSQL 15

**Authentication Middleware:**
```typescript
validateJWT (express-oauth2-jwt-bearer)
  ↓
requireAuth (custom - extracts user claims)
  ↓
ensureUser (creates user if first login)
  ↓
Route handler (userId available)
```

**Response Format:**
- Success: `{ success: true, data: {...} }` (not always followed)
- Error: `{ success: false, error: "message" }` (not always followed)
- **Note:** Some endpoints return data directly without wrapping

### 3.4 Data Access Patterns

**Prisma Query Strategies:**

1. **Optimized Join Strategy:**
```typescript
prisma.goal.findMany({
  relationLoadStrategy: 'join', // Efficient eager loading
  include: {
    goalTasks: {
      include: { task: true }
    },
    children: true,
    parent: true
  }
})
```

2. **Selective Loading:**
```typescript
include: {
  goalTasks: {
    select: {
      id: true,
      title: true // Only needed fields
    }
  }
}
```

3. **Computed Fields:**
- Progress percentage calculated server-side
- Task totals aggregated in route handlers
- `progressSummary` added to goal responses

### 3.5 API Design Patterns

**RESTful Endpoints:**
- `GET /api/goals` - List all goals
- `GET /api/goals/:id` - Single goal details
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/progress` - Add progress entry
- `POST /api/goals/:id/complete` - Mark goal complete
- `GET /api/goals/:id/tasks` - Get linked tasks
- `POST /api/goals/:id/bulk-tasks` - Bulk create tasks

**Special Endpoints:**
- `/api/calendar/tasks` - Date-range task queries
- `/api/calendar/goals` - Date-range goal queries
- `/api/tasks/unscheduled/list` - Backlog tasks
- `/api/tasks/:id/schedule` - Update task date

---

## 4. Module Structure

### 4.1 Frontend Structure (`apps/web/src/`)

```
src/
├── main.tsx                  # Entry point with Auth0 + Context providers
├── App.tsx                   # Router + Layout (TopNav, BottomNav, Routes)
├── api.ts                    # HTTP client with auth token interceptor
├── types.ts                  # TypeScript interfaces (Goal, Task, etc.)
│
├── components/               # 23 React components
│   ├── ui/                   # 16 shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── custom-calendar.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── GoalCard.tsx          # Goal display with progress bar
│   ├── TaskCard.tsx          # Task display with actions
│   ├── GoalEditSheet.tsx     # Goal creation/edit modal
│   ├── TaskEditSheet.tsx     # Task creation/edit modal
│   ├── AddProgressSheet.tsx  # Manual progress logging
│   ├── BulkTaskSheet.tsx     # Bulk task creation
│   ├── LinkTasksSheet.tsx    # Link tasks to goals
│   ├── RescheduleSheet.tsx   # Task date picker
│   ├── DailyTimelineView.tsx # Calendar timeline
│   ├── DraggableTaskStrip.tsx# Drag-and-drop tasks
│   ├── BottomNav.tsx         # Mobile navigation bar
│   ├── TopNavBar.tsx         # Top app bar with user menu
│   └── ProtectedRoute.tsx    # Auth guard component
│
├── pages/                    # 7 route pages
│   ├── LoginPage.tsx         # Auth0 login screen
│   ├── CallbackPage.tsx      # OAuth callback handler
│   ├── AchievementDashboardPage.tsx # Home / stats dashboard
│   ├── GoalsPage.tsx         # Goal list with filters
│   ├── TasksPage.tsx         # Task list with pagination
│   ├── PlannerPage.tsx       # Calendar planner view
│   └── GoalDetailsPage.tsx   # Single goal detail view
│
├── contexts/                 # 2 React contexts
│   ├── GoalContext.tsx       # Global goal state + CRUD operations
│   └── TaskContext.tsx       # Global task state + CRUD operations
│
├── hooks/                    # 3 custom hooks
│   ├── useTouchHandlers.ts   # Mobile tap/long-press detection
│   ├── useMediaQuery.ts      # Responsive breakpoint detection
│   └── useKeyboardHeight.ts  # Mobile keyboard height (iOS fix)
│
├── lib/                      # 1 utility
│   └── utils.ts              # cn() helper (clsx + tailwind-merge)
│
├── utils/                    # 2 utilities
│   ├── dateUtils.ts          # Re-exports from @goal-tracker/shared
│   └── authDebug.ts          # Auth0 debugging helpers
│
├── styles/                   # 1 CSS file
│   └── design-system.css     # CSS variables for theme colors
│
└── __tests__/                # Vitest test files
    └── contexts/
        ├── GoalContext.test.tsx
        └── TaskContext.test.tsx
```

### 4.2 Backend Structure (`apps/api/src/`)

```
src/
├── index.ts                  # Server entry point (HTTP/HTTPS)
├── app.ts                    # Express app setup
├── prisma.ts                 # Prisma client instance
│
├── config/                   # 1 config file
│   └── auth.ts               # Auth0 configuration + validation
│
├── middleware/               # 1 middleware
│   └── auth.ts               # JWT validation + user extraction helpers
│
├── routes/                   # 4 route files
│   ├── auth.ts               # POST /api/auth/signin (user creation)
│   ├── goals.ts              # Goal CRUD + hierarchy + progress (530 lines)
│   ├── tasks.ts              # Task CRUD + scheduling + linking (650 lines)
│   └── calendar.ts           # Calendar view queries (140 lines)
│
├── services/                 # 2 service files
│   ├── userService.ts        # User creation + Auth0 userinfo fetch
│   └── completionService.ts  # Goal/task completion logic
│
└── __tests__/                # Jest test files
    └── (test files)
```

### 4.3 Shared Package Structure (`packages/shared/src/`)

```
src/
├── index.ts                  # Re-exports all utilities
└── utils/
    └── dateUtils.ts          # Platform-agnostic date utilities
        ├── parseDateOnly()      # YYYY-MM-DD → Date (UTC)
        ├── formatDateOnly()     # Date → YYYY-MM-DD (UTC)
        ├── parseLocalDate()     # YYYY-MM-DD → Date (local)
        ├── formatLocalDate()    # Date → YYYY-MM-DD (local)
        ├── getTodayString()     # Today as YYYY-MM-DD
        ├── isToday()            # Check if date is today
        ├── isPastDate()         # Check if date is past
        ├── addDays()            # Add days to date string
        ├── formatScheduledDate() # Localized date display
        ├── formatTimestamp()    # ISO timestamp → localized
        └── extractDateOnly()    # Remove time from ISO string
```

---

## 5. Data Flow & Communication

### 5.1 Frontend → Backend Communication

**HTTP Client Setup:**

```typescript
// apps/web/src/api.ts

// Auth token provider (set by App.tsx)
let getAccessToken: (() => Promise<string>) | null = null;

export const setAuthTokenProvider = (provider: () => Promise<string>) => {
  getAccessToken = provider;
};

// HTTP interceptor pattern
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  // Inject Auth0 token
  if (getAccessToken) {
    const token = await getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // Handle 401 errors
  if (response.status === 401) {
    console.warn('Token expired - redirecting to login');
  }

  return response;
};
```

**API Client Modules:**

1. **`api` (Goal operations):**
   - `fetchGoals()` - GET /api/goals
   - `getGoal(id)` - GET /api/goals/:id
   - `createGoal()` - POST /api/goals
   - `updateGoal()` - PUT /api/goals/:id
   - `deleteGoal()` - DELETE /api/goals/:id
   - `updateProgress()` - POST /api/goals/:id/progress
   - `completeGoal()` - POST /api/goals/:id/complete
   - `getGoalTasks()` - GET /api/goals/:id/tasks
   - `bulkCreateTasks()` - POST /api/goals/:id/bulk-tasks

2. **`taskApi` (Task operations):**
   - `fetchTasks(params)` - GET /api/tasks (with filtering & pagination)
   - `createTask()` - POST /api/tasks
   - `updateTask()` - PUT /api/tasks/:id
   - `deleteTask()` - DELETE /api/tasks/:id
   - `toggleComplete()` - POST /api/tasks/:id/complete
   - `scheduleTask()` - POST /api/tasks/:id/schedule
   - `linkGoal()` - POST /api/tasks/:id/link-goal
   - `unlinkGoal()` - POST /api/tasks/:id/unlink-goal

3. **`calendarApi` (Calendar queries):**
   - `fetchCalendarTasks(start, end)` - GET /api/calendar/tasks
   - `fetchCalendarGoals(start, end)` - GET /api/calendar/goals

### 5.2 State Management Flow

**Context Provider Pattern:**

```typescript
// GoalContext.tsx

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Internal fetch implementation
  const doFetch = useCallback(async () => {
    setLoading(true);
    const data = await api.fetchGoals();
    setGoals(data);
    setLoading(false);
  }, []);

  // Lazy fetch (only if empty)
  const fetchGoals = useCallback(() => {
    if (goals.length === 0) {
      doFetch();
    }
  }, [goals.length, doFetch]);

  // Force refresh (always fetches)
  const refreshGoals = useCallback(() => {
    doFetch();
  }, [doFetch]);

  // Optimistic updates
  const updateGoal = useCallback(async (updated) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    try {
      await api.updateGoal(updated.id, updated);
    } catch (err) {
      await doFetch(); // Revert on error
    }
  }, [doFetch]);

  return (
    <GoalContext.Provider value={{
      goals, loading, error,
      fetchGoals, refreshGoals,
      updateGoal, deleteGoal, addGoal
    }}>
      {children}
    </GoalContext.Provider>
  );
}
```

**Usage Pattern:**

```typescript
// In a page component
function GoalsPage() {
  const { goals, loading, fetchGoals } = useGoalContext();

  useEffect(() => {
    fetchGoals(); // Lazy load on mount
  }, [fetchGoals]);

  if (loading) return <Spinner />;
  return <div>{goals.map(g => <GoalCard goal={g} />)}</div>;
}
```

### 5.3 Authentication Flow

```
1. User lands on app
   ↓
2. App.tsx checks isAuthenticated
   ↓
   [Not Authenticated]
   ↓
3. Attempt silent auth (getAccessTokenSilently)
   ↓
   [Silent Auth Fails]
   ↓
4. Redirect to /login
   ↓
5. LoginPage calls loginWithRedirect()
   ↓
6. Auth0 Universal Login
   ↓
7. Redirect to /callback with auth code
   ↓
8. Auth0Provider exchanges code for tokens
   ↓
9. Redirect to original page (via appState.returnTo)
   ↓
10. App.tsx sets auth token provider
    ↓
11. All API calls include JWT in Authorization header
    ↓
12. Backend validates JWT via express-oauth2-jwt-bearer
    ↓
13. ensureUser() creates/updates user in DB
    ↓
14. Route handler receives user.id
```

**Token Storage:**
- Location: `localStorage` (configured in Auth0Provider)
- Refresh tokens: Enabled (`useRefreshTokens={true}`)
- Auto-renewal: Silent token refresh on expiry

### 5.4 Data Transformation Pipeline

**Backend → Frontend:**

```typescript
// Backend (routes/goals.ts)
const goals = await prisma.goal.findMany({
  include: {
    goalTasks: { include: { task: true } },
    children: true,
    progress: true
  }
});

// Add computed fields
const goalsWithProgress = goals.map(computeGoalView);

res.json(goalsWithProgress); // Direct array response
```

```typescript
// Frontend (api.ts)
export const api = {
  fetchGoals: async () => {
    const res = await authenticatedFetch(`${API_URL}/goals`);
    const data = await res.json();
    return Array.isArray(data) ? data : []; // Fallback safety
  }
};
```

```typescript
// Frontend (GoalContext.tsx)
const doFetch = useCallback(async () => {
  const data = await api.fetchGoals();
  setGoals(Array.isArray(data) ? data : []); // Double safety
}, []);
```

**Frontend → Backend:**

```typescript
// Frontend (GoalEditSheet.tsx)
const handleSave = async () => {
  const goalData: Partial<Goal> = {
    title,
    description,
    type,
    targetValue,
    scope,
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate)
  };

  await api.createGoal(goalData);
  refreshGoals(); // Force refresh after mutation
};
```

```typescript
// Backend (routes/goals.ts)
router.post('/', async (req, res) => {
  const user = await ensureUser(req);

  const goal = await prisma.goal.create({
    data: {
      ...req.body,
      userId: user.id,
      startDate: new Date(req.body.startDate),
      endDate: req.body.endDate ? new Date(req.body.endDate) : null
    },
    include: {
      goalTasks: { include: { task: true } },
      children: true
    }
  });

  res.json(goal);
});
```

---

## 6. Database Schema Summary

### 6.1 Entity-Relationship Diagram

```
User (Auth0 identity)
  ├── 1:N → Goal (hierarchical tree)
  │         ├── self-referential (parentId)
  │         ├── M:N → Task (via GoalTask)
  │         └── 1:N → Progress
  └── 1:N → Task (hierarchical tree)
            └── self-referential (parentTaskId)
```

### 6.2 Schema Details

**User Model:**
```prisma
model User {
  id        Int      @id @default(autoincrement())
  sub       String   @unique      // Auth0 user ID
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  goals     Goal[]
  tasks     Task[]

  @@index([sub])
  @@index([email])
}
```

**Goal Model:**
```prisma
model Goal {
  id               String         @id @default(uuid())
  title            String
  description      String?
  type             GoalType       @default(TOTAL_TARGET)
  targetValue      Float?
  currentValue     Float          @default(0)
  stepSize         Float          @default(1)
  frequencyTarget  Int?
  frequencyType    FrequencyType?
  startDate        DateTime       @default(now())
  endDate          DateTime?
  customDataLabel  String?
  scope            GoalScope      @default(STANDALONE)
  isMarkedComplete Boolean        @default(false)

  // Hierarchy
  parentId         String?
  parent           Goal?          @relation("GoalHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children         Goal[]         @relation("GoalHierarchy")

  // Relationships
  userId           Int
  user             User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  goalTasks        GoalTask[]
  progress         Progress[]

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@index([userId])
}

enum GoalType {
  TOTAL_TARGET    // Numeric target (e.g., "Read 12 books")
  FREQUENCY       // Habit tracking (e.g., "Exercise 3x/week")
}

enum GoalScope {
  YEARLY          // Annual goal
  MONTHLY         // Monthly goal
  WEEKLY          // Weekly goal
  STANDALONE      // No time scope
}

enum FrequencyType {
  DAILY
  WEEKLY
  MONTHLY
}
```

**Task Model:**
```prisma
model Task {
  id                        String        @id @default(uuid())
  title                     String
  description               String?
  size                      Int           @default(1)      // Effort in days
  isCompleted               Boolean       @default(false)
  completedAt               DateTime?
  scheduledDate             DateTime?
  priority                  TaskPriority?
  category                  TaskCategory?
  scheduledTime             String?       // HH:mm format
  estimatedDurationMinutes  Int?
  estimatedCompletionDate   DateTime?
  customData                String?

  // Hierarchy
  parentTaskId              String?
  parentTask                Task?         @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: Cascade)
  subTasks                  Task[]        @relation("TaskHierarchy")

  // Relationships
  userId                    Int
  user                      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  goalTasks                 GoalTask[]

  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt

  @@index([userId])
  @@index([scheduledDate, isCompleted])
  @@index([isCompleted])
}

enum TaskPriority {
  HIGH
  MEDIUM
  LOW
}

enum TaskCategory {
  WORK
  PERSONAL
  HEALTH
  LEARNING
  FINANCE
  SOCIAL
  HOUSEHOLD
  OTHER
}
```

**GoalTask Model (Join Table):**
```prisma
model GoalTask {
  id        String   @id @default(uuid())
  goalId    String
  taskId    String
  createdAt DateTime @default(now())
  goal      Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([goalId, taskId])
}
```

**Progress Model:**
```prisma
model Progress {
  id         String   @id @default(uuid())
  goalId     String
  value      Float
  date       DateTime @default(now())
  note       String?
  customData String?
  goal       Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
}
```

### 6.3 Key Indexing Strategy

- **User lookups:** Indexed on `sub` (Auth0 ID) and `email`
- **Task queries:** Composite index on `(scheduledDate, isCompleted)` for calendar views
- **Goal queries:** Indexed on `userId` for user-scoped queries
- **Cascade deletes:** All child records deleted when parent is deleted

### 6.4 Migration History

- **16 migrations** tracked in `apps/api/prisma/migrations/`
- Schema evolution documented
- No destructive changes to existing data

---

## 7. Authentication Flow

### 7.1 Frontend Authentication Setup

**Entry Point (`main.tsx`):**

```typescript
ReactDOM.createRoot(rootElement).render(
  <Auth0Provider
    domain="bises.auth0.com"
    clientId="izygI8zTKeFDiyME5JETirr288UDMr7q"
    authorizationParams={{
      redirect_uri: window.location.origin + '/callback',
      audience: 'https://goal-tracker-api',
      scope: 'openid profile email offline_access',
    }}
    cacheLocation="localstorage"
    useRefreshTokens={true}
    leeway={60}
    sessionCheckExpiryDays={1}
  >
    <GoalProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </GoalProvider>
  </Auth0Provider>
);
```

**Silent Authentication (`App.tsx`):**

```typescript
useEffect(() => {
  const attemptSilentAuth = async () => {
    if (silentAuthAttemptedRef.current || isLoading) return;
    silentAuthAttemptedRef.current = true;

    const location = window.location.pathname;
    if (isAuthenticated || location === '/login' || location === '/callback') {
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      if (token) {
        console.log('✅ Silent authentication successful');
      }
    } catch (error) {
      console.warn('⚠️ Silent authentication failed');
      loginWithRedirect({ appState: { returnTo: location } });
    }
  };

  attemptSilentAuth();
}, [isLoading, isAuthenticated, getAccessTokenSilently, loginWithRedirect]);
```

**Token Provider Setup:**

```typescript
useEffect(() => {
  setAuthTokenProvider(async () => {
    try {
      const token = await getAccessTokenSilently();
      return token;
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      navigate('/login');
      return '';
    }
  });
}, [getAccessTokenSilently, navigate]);
```

### 7.2 Backend Authentication Middleware

**JWT Validation (`middleware/auth.ts`):**

```typescript
import { auth } from 'express-oauth2-jwt-bearer';

// Validates JWT signature and claims
export const validateJWT = auth({
  issuerBaseURL: 'https://bises.auth0.com/',
  audience: 'https://goal-tracker-api',
});

// Ensures user is authenticated
export const requireAuth = (req, res, next) => {
  const payload = req.auth?.payload;
  if (!payload?.sub) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }
  next();
};

// Helper to extract user ID
export const getUserId = (req) => {
  const payload = req.auth?.payload;
  if (!payload?.sub) throw new Error('User not authenticated');
  return payload.sub;
};
```

**User Creation (`services/userService.ts`):**

```typescript
export const ensureUser = async (req) => {
  const sub = getUserId(req);
  let email = getUserEmail(req);
  let name = getUserName(req);

  // Find or create user
  let user = await prisma.user.findUnique({ where: { sub } });

  if (!user) {
    // Fetch additional info from Auth0 if needed
    if (!email) {
      const token = req.headers.authorization?.slice(7);
      const userInfo = await fetchAuth0UserInfo(token);
      email = userInfo?.email;
      name = name || userInfo?.name;
    }

    user = await prisma.user.create({
      data: {
        sub,
        email: email || `user-${sub}@placeholder.local`,
        name: name || 'User',
      },
    });
  }

  return user;
};
```

**Route Protection Pattern:**

```typescript
// routes/goals.ts
import { requireAuth, validateJWT } from '../middleware/auth';

const router = Router();

// Apply to all routes in this router
router.use(validateJWT, requireAuth);

router.get('/', async (req, res) => {
  const user = await ensureUser(req); // Guaranteed to succeed
  const goals = await prisma.goal.findMany({
    where: { userId: user.id }
  });
  res.json(goals);
});
```

### 7.3 Token Lifecycle

1. **Initial Login:**
   - User redirected to Auth0 Universal Login
   - Auth0 returns authorization code
   - Auth0Provider exchanges code for access + refresh tokens
   - Tokens stored in `localStorage`

2. **API Calls:**
   - `authenticatedFetch()` retrieves token via `getAccessTokenSilently()`
   - Token injected into `Authorization: Bearer <token>` header
   - Backend validates token signature and claims

3. **Token Refresh:**
   - Auth0Provider automatically refreshes tokens before expiry
   - Refresh token used to obtain new access token
   - No user interaction required (silent refresh)

4. **Token Expiry:**
   - If token expired and refresh fails → 401 error
   - Frontend catches 401 → redirects to `/login`
   - User re-authenticates

### 7.4 Security Considerations

- **JWT Signature Validation:** Uses Auth0's public JWKS keys
- **Audience Claim:** Ensures token is for this API (`https://goal-tracker-api`)
- **Issuer Claim:** Validates token from trusted Auth0 tenant
- **Scope Validation:** Ensures `openid profile email` scopes present
- **HTTPS Required:** Production deployment should use HTTPS (Tailscale certs supported)
- **CORS:** Configured to allow frontend origin only

---

## 8. Key Components Deep Dive

### 8.1 Critical Frontend Components

#### 8.1.1 GoalContext.tsx (State Management)

**File:** `apps/web/src/contexts/GoalContext.tsx`

**Responsibility:** Global goal state, CRUD operations, optimistic updates

**Key Features:**
- Lazy fetch pattern (only loads once)
- Force refresh after mutations
- Optimistic updates with rollback on error
- Error boundary handling

**API Surface:**
```typescript
interface GoalContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;      // Lazy (if empty)
  refreshGoals: () => Promise<void>;    // Force refresh
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addGoal: (goal: Goal) => void;
}
```

**Usage Pattern:**
- Mount: Call `fetchGoals()` (only fetches if empty)
- After mutation: Call `refreshGoals()` (always fetches)
- Optimistic UI: Updates local state immediately, reverts on error

#### 8.1.2 TaskContext.tsx (State Management)

**File:** `apps/web/src/contexts/TaskContext.tsx`

**Responsibility:** Global task state, CRUD operations, scheduling

**Key Features:**
- Uses shared `@goal-tracker/shared` date utilities
- Supports pagination and filtering
- Task-goal linking/unlinking
- Scheduling and completion toggling

**API Surface:**
```typescript
interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  updateTaskFields: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  scheduleTask: (taskId: string, date: Date | null) => Promise<void>;
  createTask: (payload: Partial<Task> & { goalIds?: string[] }) => Promise<Task>;
  toggleComplete: (id: string) => Promise<Task>;
  upsertTask: (task: Task) => void;
  addTask: (task: Task) => void;
}
```

#### 8.1.3 GoalCard.tsx (UI Component)

**File:** `apps/web/src/components/GoalCard.tsx`

**Responsibility:** Display goal with progress, actions menu, and metadata

**Key Features:**
- Progress bar with task-based or manual calculation
- Scope-based color coding (YEARLY=purple, MONTHLY=blue, WEEKLY=green, STANDALONE=orange)
- Dropdown menu with actions (Edit, Log Progress, Add Tasks, Link Tasks, View, Delete)
- Modal integration (GoalEditSheet, AddProgressSheet, BulkTaskSheet, LinkTasksSheet)
- Navigate to detail page on click

**Styling Pattern:**
```typescript
const getScopeColor = (scope: string) => {
  const colors = {
    YEARLY: {
      bg: 'rgba(147, 51, 234, 0.1)',
      text: '#9333ea',
      border: 'rgba(147, 51, 234, 0.3)',
      gradient: 'linear-gradient(135deg, ...)'
    },
    // ... other scopes
  };
  return colors[scope] || colors.STANDALONE;
};
```

#### 8.1.4 TaskCard.tsx (UI Component)

**File:** `apps/web/src/components/TaskCard.tsx`

**Responsibility:** Display task with completion state, schedule, and actions

**Key Features:**
- Toggle completion with optimistic UI
- Category icon display
- Scheduled date with calendar picker
- Priority and duration display
- Linked goals display
- Edit/delete/reschedule/unlink actions

**Date Handling:**
```typescript
import { formatScheduledDate, formatTimestamp } from '@goal-tracker/shared';

// Display scheduled date
{task.scheduledDate && (
  <div className="text-sm text-muted-foreground">
    {formatScheduledDate(task.scheduledDate, { month: 'short', day: 'numeric' })}
  </div>
)}

// Display completed date
{task.completedAt && (
  <div className="text-sm text-green-600">
    Completed {formatTimestamp(task.completedAt)}
  </div>
)}
```

#### 8.1.5 api.ts (HTTP Client)

**File:** `apps/web/src/api.ts`

**Responsibility:** Centralized API client with authentication

**Key Features:**
- Token injection via interceptor pattern
- Automatic 401 handling
- Type-safe response parsing
- Separation of concerns (api, taskApi, calendarApi)

**Interceptor Pattern:**
```typescript
let getAccessToken: (() => Promise<string>) | null = null;

export const setAuthTokenProvider = (provider: () => Promise<string>) => {
  getAccessToken = provider;
};

const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  if (getAccessToken) {
    const token = await getAccessToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    console.warn('⚠️ Received 401 Unauthorized');
    // Could trigger logout or token refresh here
  }

  return response;
};
```

#### 8.1.6 useTouchHandlers.ts (Mobile UX Hook)

**File:** `apps/web/src/hooks/useTouchHandlers.ts`

**Responsibility:** Mobile tap and long-press detection

**Key Features:**
- Distinguishes tap vs long-press
- Movement threshold to cancel gestures
- Prevents default behaviors (context menu)
- Ref-based state management (no re-renders)

**Usage Example:**
```typescript
const touchHandlers = useTouchHandlers({
  onTap: () => handleTaskClick(),
  onLongPress: () => handleTaskEdit(),
  longPressDelay: 500,
  movementThreshold: 10,
});

<div {...touchHandlers}>
  <TaskCard task={task} />
</div>
```

### 8.2 Critical Backend Components

#### 8.2.1 routes/goals.ts (REST Endpoints)

**File:** `apps/api/src/routes/goals.ts`

**Lines:** ~530 lines

**Endpoints:**
- `GET /api/goals` - List all goals with filters
- `GET /api/goals/tree` - Hierarchical goal tree
- `GET /api/goals/scope/:scope` - Goals by scope (YEARLY, MONTHLY, etc.)
- `GET /api/goals/:id` - Single goal details
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal (cascades to children)
- `POST /api/goals/:id/progress` - Add manual progress entry
- `POST /api/goals/:id/complete` - Mark goal complete
- `POST /api/goals/:id/uncomplete` - Mark goal incomplete
- `GET /api/goals/:id/tasks` - Get linked tasks + child goals
- `GET /api/goals/:id/activities` - Get activity log (paginated)
- `POST /api/goals/:id/bulk-tasks` - Bulk create tasks

**Progress Calculation:**
```typescript
const computeGoalView = (goal: any) => {
  const goalTasks = goal.goalTasks || [];
  const children = goal.children || [];

  // Direct task progress
  let totalSize = goalTasks.reduce((acc, gt) => acc + (gt.task?.size || 1), 0);
  let completedSize = goalTasks
    .filter(gt => gt.task?.isCompleted)
    .reduce((acc, gt) => acc + (gt.task?.size || 1), 0);

  // Include child task progress
  for (const child of children) {
    totalSize += computeChildTaskSize(child);
    completedSize += computeChildCompletedSize(child);
  }

  const percentComplete = totalSize > 0 ? (completedSize / totalSize) * 100 : 0;

  return {
    ...goal,
    progressSummary: {
      percentComplete,
      taskTotals: { totalCount, completedCount, totalSize, completedSize },
      manualTotals: { currentValue: goal.currentValue, targetValue: goal.targetValue }
    }
  };
};
```

#### 8.2.2 routes/tasks.ts (REST Endpoints)

**File:** `apps/api/src/routes/tasks.ts`

**Lines:** ~650 lines

**Endpoints:**
- `GET /api/tasks` - List tasks with filtering & pagination
- `GET /api/tasks/scheduled/:date` - Tasks for specific date
- `GET /api/tasks/unscheduled/list` - Unscheduled tasks
- `GET /api/tasks/:id` - Single task details
- `POST /api/tasks` - Create task (with goalIds)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (cascades to subtasks)
- `POST /api/tasks/:id/complete` - Toggle completion
- `POST /api/tasks/:id/schedule` - Update scheduled date
- `POST /api/tasks/:id/link-goal` - Link task to goal
- `POST /api/tasks/:id/unlink-goal` - Unlink task from goal

**Date Handling:**
```typescript
import { parseDateOnly } from '@goal-tracker/shared';

// Parse YYYY-MM-DD from request
if (date && typeof date === 'string') {
  const [year, monthNum, day] = date.split('-');
  const startDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(monthNum) - 1,
    parseInt(day)
  ));
  const endDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(monthNum) - 1,
    parseInt(day) + 1
  ));

  where.scheduledDate = {
    gte: startDate,
    lt: endDate,
  };
}
```

#### 8.2.3 services/completionService.ts (Business Logic)

**File:** `apps/api/src/services/completionService.ts`

**Responsibility:** Goal and task completion logic

**Key Methods:**
- `markGoalComplete(goalId)` - Marks goal and all child goals complete
- `markGoalIncomplete(goalId)` - Marks goal and all child goals incomplete
- `updateGoalProgress(goalId)` - Recalculates progress based on tasks

**Cascade Logic:**
```typescript
async markGoalComplete(goalId: string) {
  const goal = await this.prisma.goal.findUnique({
    where: { id: goalId },
    include: { children: true }
  });

  // Mark this goal complete
  await this.prisma.goal.update({
    where: { id: goalId },
    data: { isMarkedComplete: true }
  });

  // Recursively mark children complete
  for (const child of goal.children) {
    await this.markGoalComplete(child.id);
  }
}
```

#### 8.2.4 middleware/auth.ts (Authentication)

**File:** `apps/api/src/middleware/auth.ts`

**Responsibility:** JWT validation and user extraction

**Key Exports:**
- `validateJWT` - express-oauth2-jwt-bearer middleware
- `requireAuth` - Ensures user is authenticated
- `getUserId(req)` - Extract Auth0 sub claim
- `getUserEmail(req)` - Extract email claim
- `getUserName(req)` - Extract name claim

**Implementation:**
```typescript
export const validateJWT = auth({
  issuerBaseURL: authConfig.issuer,
  audience: authConfig.audience,
});

export const requireAuth = (req, res, next) => {
  const payload = req.auth?.payload;
  if (!payload?.sub) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }
  next();
};
```

---

## 9. Configuration & Infrastructure

### 9.1 Environment Variables

**Frontend (`apps/web/.env`):**
```bash
VITE_API_URL=http://localhost:3000/api
VITE_AUTH0_DOMAIN=bises.auth0.com
VITE_AUTH0_CLIENT_ID=izygI8zTKeFDiyME5JETirr288UDMr7q
VITE_AUTH0_AUDIENCE=https://goal-tracker-api
```

**Backend (`apps/api/.env`):**
```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/goaltracker
AUTH0_ISSUER=https://bises.auth0.com/
AUTH0_AUDIENCE=https://goal-tracker-api
PORT=3000
USE_HTTPS=false
SSL_CERT_PATH=/certs/cert.crt
SSL_KEY_PATH=/certs/cert.key
```

**Note:** Hardcoded defaults in code for simplified deployment (not best practice for production)

### 9.2 Build Configuration

**Frontend (`vite.config.ts`):**
```typescript
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Goal Tracker',
        short_name: 'Goals',
        theme_color: '#4f46e5',
        display: 'standalone',
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/localhost:3000\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxAgeSeconds: 60 * 5 }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@goal-tracker/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts'
  }
});
```

**Backend (`tsconfig.json`):**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

### 9.3 Docker Configuration

**Frontend Dockerfile (`apps/web/Dockerfile`):**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm --filter web build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Backend Dockerfile (`apps/api/Dockerfile`):**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm
RUN pnpm install
RUN pnpm --filter api build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json .
COPY --from=builder /app/apps/api/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/apps/api/src/index.js"]
```

**Docker Compose (`docker-compose.yml`):**
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: goaltracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:postgres@db:5432/goaltracker
      AUTH0_ISSUER: https://bises.auth0.com/
      AUTH0_AUDIENCE: https://goal-tracker-api
    ports:
      - "3000:3000"
    depends_on:
      - db

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    environment:
      VITE_API_URL: http://localhost:3000/api
    ports:
      - "5173:80"
    depends_on:
      - api

volumes:
  postgres_data:
```

### 9.4 CI/CD Pipeline

**GitHub Actions (`.github/workflows/deploy.yml`):**
- Trigger: Push to `main` branch
- Steps:
  1. Checkout code
  2. Build Docker images
  3. Push to Docker Hub
  4. SSH to server
  5. Pull images and restart containers
  6. Run database migrations

**Secrets Required:**
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SSH_PRIVATE_KEY`
- `SERVER_HOST`
- `SERVER_USER`
- `DATABASE_URL`

### 9.5 Database Migrations

**Commands:**
```bash
cd apps/api

# Create migration
pnpm prisma migrate dev --name add_task_priority

# Apply migrations (production)
pnpm prisma migrate deploy

# Check migration status
pnpm prisma migrate status

# Generate Prisma client
pnpm prisma generate

# Visual database browser
pnpm prisma studio
```

**Migration Strategy:**
- Never modify existing migrations after push
- Use descriptive migration names
- Test migrations locally first
- Always backup database before deploying

---

## 10. Quality Attributes

### 10.1 Performance

**Frontend Optimizations:**
- Vite for fast HMR (Hot Module Replacement)
- Lazy loading with conditional fetch (only if data empty)
- Optimistic UI updates (instant feedback)
- Service worker caching (PWA)
- Memoization with useMemo/useCallback
- CSS-in-JS avoided (Tailwind for better performance)

**Backend Optimizations:**
- Prisma relationLoadStrategy: 'join' (N+1 query prevention)
- Selective field loading with `select`
- Database indexes on frequently queried fields
- Connection pooling via pg adapter
- No ORM overhead (Prisma generates optimized SQL)

**Metrics:**
- Frontend bundle size: Not measured (TODO)
- API response time: Not measured (TODO)
- Database query count: Monitored via Prisma logs

### 10.2 Scalability

**Current Limitations:**
- Single-user design (no multi-tenancy)
- No horizontal scaling (single instance)
- No caching layer (Redis)
- No CDN for static assets
- No API rate limiting

**Scalability Considerations:**
- User-scoped queries prevent data leakage
- Database indexes support growth
- Stateless API (scales horizontally if needed)
- Prisma connection pooling

### 10.3 Maintainability

**Code Organization:**
- Clear separation of concerns (routes → services → Prisma)
- Consistent naming conventions
- TypeScript strict mode (in progress)
- ESLint + Prettier configured
- Comprehensive documentation (20+ docs)

**Developer Experience:**
- Fast feedback loop (Vite HMR, nodemon)
- Type safety across stack
- Shared date utilities
- Monorepo with workspaces
- Clear git history (conventional commits encouraged)

### 10.4 Testability

**Current State:**
- Frontend: Vitest configured, minimal tests
- Backend: Jest configured, minimal tests
- E2E: Not implemented

**Testing Infrastructure:**
- Test setup files present
- Testing libraries installed
- Mocking utilities available

**Gaps:**
- Low test coverage
- No E2E tests (Playwright suggested)
- No API contract tests

### 10.5 Security

**Authentication:**
- Auth0 for identity management
- JWT validation on all protected endpoints
- Token refresh for long sessions
- Secure token storage (localStorage with HttpOnly not possible in SPA)

**Authorization:**
- User-scoped queries (all data filtered by userId)
- Cascade deletes prevent orphaned data
- No SQL injection (Prisma parameterized queries)

**Known Issues:**
- Hardcoded Auth0 credentials (should use env vars)
- No HTTPS by default (Tailscale certs supported)
- No CSRF protection (stateless API)
- No rate limiting

### 10.6 Accessibility

**Frontend:**
- Radix UI primitives (ARIA compliant)
- Keyboard navigation support
- Focus management in modals
- Screen reader compatible (needs audit)

**Mobile:**
- Touch-friendly tap targets
- Mobile keyboard height adjustment
- Responsive design (Tailwind breakpoints)
- PWA installable on iOS/Android

### 10.7 Observability

**Logging:**
- Console logs for debugging
- Auth0 logs for login events
- No structured logging (Winston/Pino)

**Monitoring:**
- No APM (Application Performance Monitoring)
- No error tracking (Sentry)
- No analytics

**Health Checks:**
- `/health` endpoint on API
- Version reporting in health check

---

## 11. React Native Migration Readiness

### 11.1 Shared Code Analysis

**Currently Shareable:**

1. **`packages/shared/src/utils/dateUtils.ts`** ✅
   - Platform-agnostic
   - No DOM/browser dependencies
   - Works in React Native out of the box

2. **`apps/web/src/types.ts`** ✅
   - Pure TypeScript interfaces
   - No React dependencies
   - Should be moved to `packages/shared/src/types/`

3. **`apps/web/src/api.ts`** ⚠️ (Needs Adaptation)
   - Uses `fetch` (supported in RN)
   - `import.meta.env` needs replacement (use react-native-config)
   - Token provider pattern is reusable

**Business Logic to Extract:**

1. **Context Providers Logic:**
   - `GoalContext.tsx` → Extract state management logic
   - `TaskContext.tsx` → Extract state management logic
   - Keep React-specific parts (useState, useEffect) in app layer

2. **API Client:**
   - Extract to `packages/shared/src/api/`
   - Make environment variables configurable
   - Support both `fetch` and React Native's networking

### 11.2 Web-Specific Dependencies

**Cannot Use in React Native:**

1. **UI Libraries:**
   - `@radix-ui/*` - Web-only (DOM-based)
   - `vaul` - Drawer component (web-only)
   - `react-day-picker` - Calendar (web-only)
   - `recharts` - Charts (SVG-based, web-only)

2. **Routing:**
   - `react-router-dom` - Web-only
   - Use `@react-navigation/native` instead

3. **Styling:**
   - `tailwindcss` - Web-only CSS
   - Use `nativewind` (Tailwind for RN) or StyleSheet

4. **PWA Features:**
   - `vite-plugin-pwa` - Service workers (web-only)
   - No direct RN equivalent (use native app features)

5. **Build Tools:**
   - `vite` - Web bundler
   - Use Metro bundler for React Native

6. **Auth:**
   - `@auth0/auth0-react` - Web-only
   - Use `react-native-auth0` instead

### 11.3 React Native Alternatives

| Web Dependency | React Native Alternative | Notes |
|----------------|-------------------------|-------|
| @radix-ui/* | React Native Paper, NativeBase | Material Design components |
| vaul (drawer) | react-native-bottom-sheet | Native drawer |
| react-day-picker | @react-native-community/datetimepicker | Native date picker |
| recharts | react-native-svg + victory-native | SVG-based charts |
| react-router-dom | @react-navigation/native | Native navigation |
| tailwindcss | nativewind, StyleSheet | Styling |
| @auth0/auth0-react | react-native-auth0 | Auth0 SDK |
| lucide-react | react-native-vector-icons | Icon library |
| framer-motion | react-native-reanimated | Animations |
| vite | Metro | Bundler |

### 11.4 Component Portability Matrix

| Component | Portability | Notes |
|-----------|------------|-------|
| GoalContext | 🟢 High | State logic extractable |
| TaskContext | 🟢 High | State logic extractable |
| api.ts | 🟡 Medium | Needs env var adaptation |
| types.ts | 🟢 High | Pure TypeScript |
| dateUtils.ts | 🟢 High | Already shared, platform-agnostic |
| GoalCard | 🔴 Low | Radix UI, Tailwind (needs rewrite) |
| TaskCard | 🔴 Low | Radix UI, Tailwind (needs rewrite) |
| GoalEditSheet | 🔴 Low | Dialog, Form (needs rewrite) |
| TaskEditSheet | 🔴 Low | Dialog, Form (needs rewrite) |
| useTouchHandlers | 🟡 Medium | Use RN Gesture Handler instead |
| useMediaQuery | 🟡 Medium | Use Dimensions API instead |
| useKeyboardHeight | 🟢 High | Similar RN equivalent exists |

### 11.5 Migration Strategy Recommendation

**Phase 1: Extract Shared Logic**
1. Move `types.ts` to `packages/shared/src/types/`
2. Create `packages/shared/src/api/` with platform-agnostic API client
3. Extract context state management logic to shared hooks
4. Create `packages/shared/src/hooks/` for reusable hooks

**Phase 2: Create React Native App**
1. Add `apps/mobile/` with React Native CLI
2. Install RN alternatives (React Navigation, NativeWind, etc.)
3. Implement authentication with `react-native-auth0`
4. Reuse API client and types from shared package

**Phase 3: Rebuild UI Components**
1. Create RN component library in `apps/mobile/src/components/`
2. Use React Native Paper or NativeBase for base components
3. Implement goal/task cards with native styling
4. Implement forms and modals with native components

**Phase 4: Feature Parity**
1. Implement all pages from web app
2. Add native features (push notifications, biometrics)
3. Test on iOS and Android
4. Maintain shared API client and business logic

**Estimated Effort:**
- Phase 1: 1-2 weeks (extract shared code)
- Phase 2: 2-3 weeks (RN setup + auth)
- Phase 3: 4-6 weeks (rebuild UI)
- Phase 4: 2-4 weeks (feature parity + testing)
- **Total: 9-15 weeks** for a single developer

### 11.6 Recommended Shared Package Structure

```
packages/
├── shared/
│   ├── src/
│   │   ├── types/
│   │   │   ├── goal.ts
│   │   │   ├── task.ts
│   │   │   ├── user.ts
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   ├── client.ts        # Platform-agnostic fetch wrapper
│   │   │   ├── goals.ts         # Goal API methods
│   │   │   ├── tasks.ts         # Task API methods
│   │   │   ├── calendar.ts      # Calendar API methods
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useGoals.ts      # Goal state management logic
│   │   │   ├── useTasks.ts      # Task state management logic
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── dateUtils.ts     # Existing date utilities
│   │   │   ├── validation.ts    # Form validation
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
└── mobile-ui/                    # Optional: Shared RN components
    └── (React Native components that could be shared)
```

---

## 12. Technical Debt & Improvements

### 12.1 Current Technical Debt

**High Priority:**

1. **TypeScript Strict Mode**
   - Currently not fully strict
   - `any` types used in some places
   - Missing null checks in route handlers

2. **Inconsistent API Response Format**
   - Some endpoints return `{ success, data }` wrapper
   - Others return data directly
   - Standardization needed

3. **Hardcoded Configuration**
   - Auth0 credentials in source code
   - API URLs in source code
   - Should use environment variables consistently

4. **Error Handling**
   - No global error boundary in frontend
   - Inconsistent error messages
   - No error logging service

5. **Test Coverage**
   - Minimal unit tests
   - No E2E tests
   - No API contract tests

**Medium Priority:**

6. **State Management**
   - Context API becoming complex
   - Consider React Query for server state
   - Optimize re-renders

7. **Code Duplication**
   - Similar logic in GoalContext and TaskContext
   - Repeated data fetching patterns
   - Should extract generic hooks

8. **Documentation**
   - API documentation missing (no OpenAPI/Swagger)
   - Component prop documentation sparse
   - Architecture diagrams missing

9. **Performance Monitoring**
   - No APM (Application Performance Monitoring)
   - No error tracking (Sentry)
   - No bundle size analysis

10. **Accessibility**
    - No accessibility audit performed
    - Focus management incomplete
    - ARIA labels inconsistent

**Low Priority:**

11. **Build Optimization**
    - No code splitting
    - No tree shaking analysis
    - No bundle size budget

12. **Development Experience**
    - No pre-commit hooks (Husky)
    - No conventional commit enforcement
    - No automatic changelog generation

### 12.2 Recommended Improvements

**Immediate (1-2 weeks):**

1. **Standardize API responses:**
```typescript
// Implement consistent response wrapper
export const apiResponse = <T>(data: T) => ({
  success: true,
  data,
  timestamp: new Date().toISOString()
});

export const apiError = (message: string, code?: string) => ({
  success: false,
  error: { message, code },
  timestamp: new Date().toISOString()
});
```

2. **Move configuration to environment variables:**
```typescript
// Remove hardcoded values from:
// - apps/web/src/main.tsx
// - apps/api/src/config/auth.ts
// Use .env files exclusively
```

3. **Add global error boundary:**
```typescript
// apps/web/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**Short-term (1-2 months):**

4. **Migrate to React Query:**
```typescript
// Replace Context providers with React Query
import { useQuery, useMutation } from '@tanstack/react-query';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: api.fetchGoals,
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });
}
```

5. **Extract shared hook patterns:**
```typescript
// packages/shared/src/hooks/useResource.ts
export function useResource<T>(
  resourceName: string,
  fetchFn: () => Promise<T[]>
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... reusable logic

  return { data, loading, error, fetch, refresh, update, delete };
}
```

6. **Add E2E testing:**
```typescript
// Install Playwright
// Create e2e/ directory
// Write critical path tests:
// - Login flow
// - Create goal
// - Create task
// - Complete task
// - View progress
```

**Long-term (3-6 months):**

7. **TypeScript strict mode enforcement:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

8. **API documentation with OpenAPI:**
```typescript
// Use @nestjs/swagger equivalent for Express
// Generate OpenAPI spec from code
// Auto-generate API client types
```

9. **Performance monitoring:**
```typescript
// Add Sentry for error tracking
// Add Plausible or PostHog for analytics
// Add bundle analyzer to CI/CD
// Set performance budgets
```

10. **Accessibility audit and fixes:**
```typescript
// Run axe-core on all pages
// Add ARIA labels
// Fix keyboard navigation
// Test with screen readers
// Add focus indicators
```

### 12.3 Refactoring Opportunities

**Extract Shared UI Patterns:**
```typescript
// Create reusable components:
// - ResourceList (generic list with loading/error states)
// - ResourceCard (generic card with actions menu)
// - ResourceEditSheet (generic edit modal)
// - ConfirmDialog (already exists, standardize usage)
```

**Simplify Route Handlers:**
```typescript
// Current: 530-line goal route file
// Refactor: Extract business logic to services
// Keep routes thin (validation + delegation)

// routes/goals.ts
router.post('/', validateGoalInput, async (req, res) => {
  const user = await ensureUser(req);
  const goal = await goalService.createGoal(user.id, req.body);
  res.json(apiResponse(goal));
});

// services/goalService.ts
export class GoalService {
  async createGoal(userId: number, data: CreateGoalDto) {
    // Business logic here
  }
}
```

**Consolidate Date Utilities:**
```typescript
// Already good! dateUtils.ts in shared package
// Ensure all date operations use these utilities
// Add JSDoc comments for clarity
```

---

## 13. Quick Reference

### 13.1 Development Commands

```bash
# Install dependencies
pnpm install

# Start development (from root)
pnpm --filter web dev          # Frontend at localhost:5173
pnpm --filter api dev          # Backend at localhost:3000

# Run both simultaneously (alternative)
cd apps/web && pnpm dev &
cd apps/api && pnpm dev &

# Type checking
pnpm --filter web run tsc --noEmit
pnpm --filter api run tsc --noEmit

# Linting
pnpm --filter web lint
pnpm --filter api lint

# Testing
pnpm --filter web test         # Vitest
pnpm --filter api test         # Jest

# Build
pnpm --filter web build
pnpm --filter api build

# Database
cd apps/api
pnpm prisma migrate dev --name <name>   # Create migration
pnpm prisma generate                     # Generate client
pnpm prisma studio                       # Visual DB browser
pnpm prisma migrate deploy               # Apply migrations (prod)

# Docker
docker compose up -d           # Start all services
docker compose down            # Stop all services
docker compose logs -f api     # View API logs
docker compose logs -f web     # View web logs
```

### 13.2 File Locations

**Configuration:**
- Frontend env: `apps/web/.env`
- Backend env: `apps/api/.env`
- Vite config: `apps/web/vite.config.ts`
- Tailwind config: `apps/web/tailwind.config.js`
- TypeScript config: `tsconfig.base.json` (root)
- Prisma schema: `apps/api/prisma/schema.prisma`
- Docker Compose: `docker-compose.yml` (root)

**Entry Points:**
- Frontend: `apps/web/src/main.tsx`
- Backend: `apps/api/src/index.ts`
- Shared package: `packages/shared/src/index.ts`

**Key Directories:**
- Frontend pages: `apps/web/src/pages/`
- Frontend components: `apps/web/src/components/`
- Frontend contexts: `apps/web/src/contexts/`
- Frontend hooks: `apps/web/src/hooks/`
- Backend routes: `apps/api/src/routes/`
- Backend services: `apps/api/src/services/`
- Backend middleware: `apps/api/src/middleware/`
- Shared utilities: `packages/shared/src/utils/`

### 13.3 API Endpoints

**Goals:**
- `GET /api/goals` - List all goals
- `GET /api/goals/tree` - Hierarchical tree
- `GET /api/goals/scope/:scope` - Filter by scope
- `GET /api/goals/:id` - Single goal
- `POST /api/goals` - Create goal
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `POST /api/goals/:id/progress` - Add progress
- `POST /api/goals/:id/complete` - Mark complete
- `POST /api/goals/:id/uncomplete` - Mark incomplete
- `GET /api/goals/:id/tasks` - Get linked tasks
- `POST /api/goals/:id/bulk-tasks` - Bulk create tasks

**Tasks:**
- `GET /api/tasks` - List tasks (with filters)
- `GET /api/tasks/scheduled/:date` - Tasks for date
- `GET /api/tasks/unscheduled/list` - Unscheduled tasks
- `GET /api/tasks/:id` - Single task
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/complete` - Toggle completion
- `POST /api/tasks/:id/schedule` - Update scheduled date
- `POST /api/tasks/:id/link-goal` - Link to goal
- `POST /api/tasks/:id/unlink-goal` - Unlink from goal

**Calendar:**
- `GET /api/calendar/tasks?startDate=...&endDate=...` - Date range tasks
- `GET /api/calendar/goals?startDate=...&endDate=...` - Date range goals

**Auth:**
- `POST /api/auth/signin` - Create/update user (not used directly)

**Health:**
- `GET /health` - Server health check

### 13.4 Common Patterns

**Creating a New Context:**
```typescript
// 1. Define interface
interface MyContextType {
  data: MyType[];
  loading: boolean;
  fetchData: () => Promise<void>;
}

// 2. Create context
const MyContext = createContext<MyContextType | undefined>(undefined);

// 3. Provider component
export function MyProvider({ children }) {
  const [data, setData] = useState<MyType[]>([]);
  // ... state management logic
  return <MyContext.Provider value={{ data, loading, fetchData }}>
    {children}
  </MyContext.Provider>;
}

// 4. Hook
export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
}
```

**Creating a New API Endpoint:**
```typescript
// 1. Define route (apps/api/src/routes/myroute.ts)
import { Router } from 'express';
import { requireAuth, validateJWT } from '../middleware/auth';
import { ensureUser } from '../services/userService';

const router = Router();
router.use(validateJWT, requireAuth);

router.get('/', async (req, res) => {
  const user = await ensureUser(req);
  const data = await prisma.myModel.findMany({
    where: { userId: user.id }
  });
  res.json(data);
});

export default router;

// 2. Register route (apps/api/src/app.ts)
import myRoute from './routes/myroute';
app.use('/api/myroute', myRoute);

// 3. Create API client method (apps/web/src/api.ts)
export const myApi = {
  fetchData: async () => {
    const res = await authenticatedFetch(`${API_URL}/myroute`);
    return res.json();
  }
};
```

**Creating a Database Migration:**
```bash
cd apps/api

# 1. Modify schema
# Edit prisma/schema.prisma

# 2. Create migration
pnpm prisma migrate dev --name add_new_field

# 3. Migration file created in prisma/migrations/
# 4. Prisma client regenerated automatically
```

### 13.5 Troubleshooting

**Common Issues:**

1. **"Cannot find module '@goal-tracker/shared'"**
   - Run `pnpm install` in root
   - Rebuild shared package: `cd packages/shared && pnpm build`

2. **"Prisma Client not found"**
   - Run `pnpm prisma generate` in `apps/api/`

3. **Database connection error**
   - Check DATABASE_URL in `apps/api/.env`
   - Ensure PostgreSQL is running
   - Test connection: `psql $DATABASE_URL`

4. **Auth0 token expired**
   - Clear localStorage
   - Logout and login again
   - Check Auth0 dashboard for configuration

5. **CORS errors**
   - Check API URL in `apps/web/.env`
   - Ensure CORS middleware configured in `apps/api/src/app.ts`

6. **Hot reload not working**
   - Restart dev server
   - Check file watcher limits (Linux): `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf`

---

## Appendix A: Key File Contents

### A.1 Main Entry Points

**Frontend Entry (`apps/web/src/main.tsx`):**
- Sets up Auth0Provider with config
- Wraps app with GoalProvider and TaskProvider
- Renders App component

**Backend Entry (`apps/api/src/index.ts`):**
- Creates HTTP or HTTPS server
- Supports Tailscale certificates
- Starts Express app on configured port

**Backend App (`apps/api/src/app.ts`):**
- Configures CORS
- Registers JSON parser
- Mounts route handlers
- Provides health check endpoint

### A.2 Type Definitions

**Goal Type (`apps/web/src/types.ts`):**
```typescript
interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'TOTAL_TARGET' | 'FREQUENCY';
  targetValue?: number;
  currentValue: number;
  frequencyTarget?: number;
  frequencyType?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startDate: string;
  endDate?: string;
  stepSize?: number;
  customDataLabel?: string;
  parentId?: string;
  parent?: Partial<Goal>;
  children?: Partial<Goal>[];
  goalTasks?: GoalTask[];
  scope: GoalScope;
  progress: Progress[];
  progressSummary?: ProgressSummary;
}
```

**Task Type (`apps/web/src/types.ts`):**
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  size: number;
  isCompleted: boolean;
  completedAt?: string;
  scheduledDate?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  scheduledTime?: string;
  estimatedDurationMinutes?: number;
  estimatedCompletionDate?: string;
  goalTasks?: GoalTask[];
  parentTaskId?: string;
  parentTask?: Partial<Task>;
  subTasks?: Partial<Task>[];
  customData?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Conclusion

The Goal Tracker monorepo is a well-structured TypeScript-based application with clear separation between frontend (React PWA), backend (Express.js API), and shared utilities. The codebase demonstrates good architectural patterns including:

- Context-based state management with optimistic updates
- JWT authentication with Auth0
- RESTful API with Prisma ORM
- Hierarchical data models for goals and tasks
- Progressive Web App capabilities
- Docker-based deployment

**Strengths:**
- Comprehensive documentation (20+ guides)
- Consistent TypeScript usage
- Platform-agnostic date utilities ready for React Native
- Clear monorepo structure with shared packages
- Modern tooling (Vite, Prisma, pnpm)

**React Native Migration Readiness:**
- Date utilities are fully portable
- Type definitions can be easily shared
- API client needs minor adaptation
- UI components need complete rewrite with React Native alternatives
- Estimated effort: 9-15 weeks for full migration

**Priority Improvements:**
1. Standardize API response format
2. Move configuration to environment variables
3. Add comprehensive testing (unit + E2E)
4. Implement React Query for server state
5. Achieve TypeScript strict mode compliance

The repository is production-ready for personal use but would benefit from the recommended improvements before scaling or team collaboration.

---

**Document Version:** 1.0
**Last Updated:** 2026-03-17
**Author:** Claude Code (Repository Analysis Tool)
