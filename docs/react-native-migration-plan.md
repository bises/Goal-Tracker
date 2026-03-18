# React Native App Setup Plan - Monorepo Approach

**Created:** 2026-03-17
**Status:** Planning
**Estimated Time:** 2-3 weeks for basic setup + feature parity

---

## Table of Contents

1. [Why Monorepo?](#why-monorepo)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Prepare Shared Package](#phase-1-prepare-shared-package)
4. [Phase 2: Setup React Native App](#phase-2-setup-react-native-app)
5. [Phase 3: Authentication](#phase-3-authentication)
6. [Phase 4: API Integration](#phase-4-api-integration)
7. [Phase 5: Build UI Components](#phase-5-build-ui-components)
8. [Phase 6: Feature Implementation](#phase-6-feature-implementation)
9. [Testing Strategy](#testing-strategy)
10. [CI/CD Updates](#cicd-updates)
11. [Common Issues & Solutions](#common-issues--solutions)

---

## Why Monorepo?

### ✅ Advantages for Goal Tracker

1. **Single Source of Truth**
   - Types defined once in `packages/shared`
   - Web and mobile automatically stay in sync
   - No version management overhead

2. **Coordinated Changes**
   ```bash
   # Example: Adding "dueDate" field to Task
   git checkout -b feature/add-task-due-date

   # 1. Update database schema
   # apps/api/prisma/schema.prisma

   # 2. Update TypeScript type (shared by web + mobile)
   # packages/shared/src/types/task.ts

   # 3. Update API endpoint
   # apps/api/src/routes/tasks.ts

   # 4. Update web UI
   # apps/web/src/components/TaskCard.tsx

   # 5. Update mobile UI
   # apps/mobile/src/components/TaskCard.tsx

   # ONE pull request, guaranteed consistency
   ```

3. **Simplified Development**
   - One `git clone`
   - One `pnpm install`
   - Everything works together

4. **Shared Business Logic**
   - Validation rules
   - Date utilities
   - API client logic
   - State management hooks

### 📊 Comparison with Separate Repo

| Aspect | Monorepo | Separate Repos |
|--------|----------|----------------|
| Type sync | ✅ Automatic | ⚠️ Manual/npm publish |
| Setup complexity | 🟢 Low (already exists) | 🟡 Medium (new repo) |
| Code sharing | ✅ Import directly | ⚠️ npm packages |
| Coordinated changes | ✅ Single PR | ❌ Multiple PRs |
| CI/CD | ✅ One pipeline | ⚠️ Two pipelines |
| Git history | ✅ Unified | ❌ Split |
| For solo dev | ✅ Perfect | ⚠️ Overhead |

---

## Architecture Overview

### Current Structure
```
goal-tracker/
├── apps/
│   ├── web/              # React 18 + Vite + TailwindCSS
│   └── api/              # Express.js + Prisma + PostgreSQL
├── packages/
│   └── shared/           # Date utilities only
└── docs/
```

### Target Structure
```
goal-tracker/
├── apps/
│   ├── web/              # React PWA (unchanged)
│   ├── api/              # Express API (unchanged)
│   └── mobile/           # React Native (new) ✨
│       ├── android/
│       ├── ios/
│       ├── src/
│       │   ├── components/      # RN UI components
│       │   ├── screens/         # App screens
│       │   ├── navigation/      # React Navigation
│       │   ├── hooks/           # Mobile-specific hooks
│       │   ├── contexts/        # Import from shared
│       │   └── assets/
│       ├── metro.config.js
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/           # Enhanced ✨
│       ├── src/
│       │   ├── types/           # Goal, Task, User (moved from web)
│       │   ├── api/             # API client (extracted from web)
│       │   ├── hooks/           # State management logic
│       │   ├── utils/           # dateUtils + validation
│       │   └── constants/       # Enums, colors, etc.
│       └── package.json
│
├── turbo.json            # Build orchestration
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### Dependency Graph
```
apps/mobile  ──┐
              │
apps/web    ──┼──> packages/shared ──> (no dependencies)
              │
apps/api    ──┘
```

---

## Phase 1: Prepare Shared Package

**Goal:** Make `packages/shared` the source of truth for types and business logic

**Time Estimate:** 1-2 days

### Step 1.1: Move Types to Shared Package

**Current location:** `apps/web/src/types.ts`
**Target location:** `packages/shared/src/types/`

```bash
# Create directories
mkdir -p packages/shared/src/types

# Move and split types
# Manually or with this script:
```

**File structure:**
```
packages/shared/src/types/
├── goal.ts          # Goal, GoalScope, GoalType
├── task.ts          # Task, TaskPriority, TaskCategory
├── progress.ts      # Progress, ProgressSummary
├── goalTask.ts      # GoalTask (join table)
└── index.ts         # Re-exports
```

**Example - `packages/shared/src/types/task.ts`:**
```typescript
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskCategory =
  | 'WORK'
  | 'PERSONAL'
  | 'HEALTH'
  | 'LEARNING'
  | 'FINANCE'
  | 'SOCIAL'
  | 'HOUSEHOLD'
  | 'OTHER';

export interface Task {
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

**`packages/shared/src/types/index.ts`:**
```typescript
export * from './goal';
export * from './task';
export * from './progress';
export * from './goalTask';
```

### Step 1.2: Extract API Client Base

**Create `packages/shared/src/api/`:**

```typescript
// packages/shared/src/api/client.ts
export interface ApiConfig {
  baseUrl: string;
  getToken: () => Promise<string>;
}

export class ApiClient {
  constructor(private config: ApiConfig) {}

  protected async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const token = await this.config.getToken();

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint);
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'DELETE' });
  }
}
```

```typescript
// packages/shared/src/api/goals.ts
import { ApiClient } from './client';
import type { Goal } from '../types';

export class GoalsApi extends ApiClient {
  async fetchGoals(): Promise<Goal[]> {
    return this.get<Goal[]>('/goals');
  }

  async getGoal(id: string): Promise<Goal> {
    return this.get<Goal>(`/goals/${id}`);
  }

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    return this.post<Goal>('/goals', data);
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    return this.put<Goal>(`/goals/${id}`, data);
  }

  async deleteGoal(id: string): Promise<void> {
    return this.delete(`/goals/${id}`);
  }

  async completeGoal(id: string): Promise<Goal> {
    return this.post<Goal>(`/goals/${id}/complete`, {});
  }
}
```

```typescript
// packages/shared/src/api/tasks.ts
import { ApiClient } from './client';
import type { Task } from '../types';

export class TasksApi extends ApiClient {
  async fetchTasks(params?: {
    completed?: boolean;
    date?: string;
  }): Promise<Task[]> {
    const query = new URLSearchParams(params as any).toString();
    return this.get<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  }

  async createTask(data: Partial<Task>): Promise<Task> {
    return this.post<Task>('/tasks', data);
  }

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    return this.put<Task>(`/tasks/${id}`, data);
  }

  async deleteTask(id: string): Promise<void> {
    return this.delete(`/tasks/${id}`);
  }

  async toggleComplete(id: string): Promise<Task> {
    return this.post<Task>(`/tasks/${id}/complete`, {});
  }

  async scheduleTask(id: string, date: string | null): Promise<Task> {
    return this.post<Task>(`/tasks/${id}/schedule`, { scheduledDate: date });
  }
}
```

### Step 1.3: Update Shared Package Exports

```typescript
// packages/shared/src/index.ts
// Types
export * from './types';

// Utilities
export * from './utils/dateUtils';

// API
export { ApiClient } from './api/client';
export { GoalsApi } from './api/goals';
export { TasksApi } from './api/tasks';
export type { ApiConfig } from './api/client';
```

### Step 1.4: Update Web App to Use Shared Package

**Update imports in web app:**

```typescript
// Before
import { Goal, Task } from './types';

// After
import { Goal, Task } from '@goal-tracker/shared';
```

**Update API usage:**

```typescript
// apps/web/src/api.ts
import { GoalsApi, TasksApi } from '@goal-tracker/shared';

// Create instances
const goalsApi = new GoalsApi({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  getToken: async () => {
    // Use Auth0 token provider
    if (getAccessToken) {
      return getAccessToken();
    }
    return '';
  },
});

const tasksApi = new TasksApi({
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  getToken: async () => {
    if (getAccessToken) {
      return getAccessToken();
    }
    return '';
  },
});

// Export for use in components
export { goalsApi, tasksApi };
```

### Step 1.5: Test Web App Still Works

```bash
# Build shared package
cd packages/shared
pnpm build

# Start web app
cd ../../apps/web
pnpm dev

# Verify:
# - App loads
# - Types are correct
# - API calls work
# - No TypeScript errors
```

---

## Phase 2: Setup React Native App

**Goal:** Create React Native app in monorepo

**Time Estimate:** 1 day

### Step 2.1: Initialize React Native App

```bash
# From monorepo root
npx react-native init mobile --template react-native-template-typescript --skip-install

# Move to apps/ directory
mv mobile apps/mobile

# Update package.json name
cd apps/mobile
```

**Update `apps/mobile/package.json`:**
```json
{
  "name": "@goal-tracker/mobile",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.73.0"
  }
}
```

### Step 2.2: Configure Metro Bundler for Monorepo

**Create `apps/mobile/metro.config.js`:**
```javascript
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// Get the project root
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  // Watch all files in monorepo
  watchFolders: [monorepoRoot],

  resolver: {
    // Let Metro resolve workspace packages
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],

    // Ensure shared package can be resolved
    extraNodeModules: {
      '@goal-tracker/shared': path.resolve(monorepoRoot, 'packages/shared/src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
```

### Step 2.3: Configure TypeScript for Monorepo

**Create `apps/mobile/tsconfig.json`:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@goal-tracker/shared": ["../../packages/shared/src"],
      "@/*": ["./src/*"]
    },
    "jsx": "react-native",
    "module": "commonjs",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "android", "ios"]
}
```

### Step 2.4: Update Workspace Configuration

**Add mobile to `pnpm-workspace.yaml`:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Already includes `apps/*`, so mobile is automatically included!**

### Step 2.5: Install Dependencies

```bash
# From monorepo root
pnpm install

# Install mobile-specific dependencies
cd apps/mobile
pnpm add @goal-tracker/shared@workspace:*

# Install navigation
pnpm add @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
pnpm add react-native-screens react-native-safe-area-context
pnpm add react-native-gesture-handler react-native-reanimated

# Install UI library
pnpm add react-native-paper
pnpm add react-native-vector-icons

# Install utilities
pnpm add date-fns  # Already in shared, but RN might need it
pnpm add react-native-config

# Install Auth0
pnpm add react-native-auth0

# iOS setup (Mac only)
cd ios && pod install && cd ..
```

### Step 2.6: Basic App Structure

**Create directories:**
```bash
mkdir -p src/{components,screens,navigation,hooks,contexts,assets}
```

**Create basic App entry:**

```typescript
// apps/mobile/src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { RootNavigator } from './navigation/RootNavigator';

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App;
```

### Step 2.7: Test Basic Setup

```bash
# Start Metro bundler
pnpm start

# In another terminal, run Android
pnpm android

# Or iOS (Mac only)
pnpm ios

# Should see React Native default screen
```

---

## Phase 3: Authentication

**Goal:** Implement Auth0 authentication in React Native

**Time Estimate:** 1-2 days

### Step 3.1: Configure Auth0

**Create `apps/mobile/src/config/auth0.ts`:**
```typescript
import Config from 'react-native-config';

export const auth0Config = {
  domain: Config.AUTH0_DOMAIN || 'bises.auth0.com',
  clientId: Config.AUTH0_CLIENT_ID || 'YOUR_MOBILE_CLIENT_ID',
  audience: Config.AUTH0_AUDIENCE || 'https://goal-tracker-api',
};
```

**Create `.env` file:**
```bash
# apps/mobile/.env
AUTH0_DOMAIN=bises.auth0.com
AUTH0_CLIENT_ID=YOUR_RN_CLIENT_ID
AUTH0_AUDIENCE=https://goal-tracker-api
API_URL=http://localhost:3000/api
```

**Note:** You'll need to create a new Auth0 application for React Native (Native type, not SPA).

### Step 3.2: Create Auth Context

```typescript
// apps/mobile/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import Auth0 from 'react-native-auth0';
import { auth0Config } from '../config/auth0';

const auth0 = new Auth0({
  domain: auth0Config.domain,
  clientId: auth0Config.clientId,
});

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email offline_access',
        audience: auth0Config.audience,
      });

      setAccessToken(credentials.accessToken);
      setIsAuthenticated(true);

      // Get user info
      const userInfo = await auth0.auth.userInfo({ token: credentials.accessToken });
      setUser(userInfo);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await auth0.webAuth.clearSession();
      setAccessToken('');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    return accessToken;
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 3.3: Create Login Screen

```typescript
// apps/mobile/src/screens/LoginScreen.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen = () => {
  const { login, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Goal Tracker
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Track your goals and tasks
      </Text>
      <Button
        mode="contained"
        onPress={login}
        loading={isLoading}
        disabled={isLoading}
        style={styles.button}
      >
        Login with Auth0
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    marginBottom: 10,
  },
  subtitle: {
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    minWidth: 200,
  },
});
```

### Step 3.4: Update App with Auth

```typescript
// apps/mobile/src/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { LoginScreen } from './screens/LoginScreen';

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RootNavigator />;
};

const App = () => {
  return (
    <PaperProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
};

export default App;
```

---

## Phase 4: API Integration

**Goal:** Connect mobile app to existing API using shared package

**Time Estimate:** 1 day

### Step 4.1: Create API Client Instance

```typescript
// apps/mobile/src/api/client.ts
import Config from 'react-native-config';
import { GoalsApi, TasksApi } from '@goal-tracker/shared';
import { useAuth } from '../contexts/AuthContext';

const apiBaseUrl = Config.API_URL || 'http://localhost:3000/api';

// Token provider will be set by AuthContext
let tokenProvider: (() => Promise<string>) | null = null;

export const setTokenProvider = (provider: () => Promise<string>) => {
  tokenProvider = provider;
};

// Create API instances
export const goalsApi = new GoalsApi({
  baseUrl: apiBaseUrl,
  getToken: async () => {
    if (!tokenProvider) {
      throw new Error('Token provider not set');
    }
    return tokenProvider();
  },
});

export const tasksApi = new TasksApi({
  baseUrl: apiBaseUrl,
  getToken: async () => {
    if (!tokenProvider) {
      throw new Error('Token provider not set');
    }
    return tokenProvider();
  },
});
```

### Step 4.2: Create State Management Hooks

**Goals Hook:**
```typescript
// apps/mobile/src/hooks/useGoals.ts
import { useState, useCallback, useEffect } from 'react';
import { Goal } from '@goal-tracker/shared';
import { goalsApi } from '../api/client';

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await goalsApi.fetchGoals();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (goalData: Partial<Goal>) => {
    try {
      const newGoal = await goalsApi.createGoal(goalData);
      setGoals(prev => [...prev, newGoal]);
      return newGoal;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create goal');
    }
  }, []);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    try {
      const updated = await goalsApi.updateGoal(id, updates);
      setGoals(prev => prev.map(g => g.id === id ? updated : g));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update goal');
    }
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    try {
      await goalsApi.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete goal');
    }
  }, []);

  return {
    goals,
    loading,
    error,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
  };
};
```

**Tasks Hook:**
```typescript
// apps/mobile/src/hooks/useTasks.ts
import { useState, useCallback } from 'react';
import { Task } from '@goal-tracker/shared';
import { tasksApi } from '../api/client';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async (params?: { completed?: boolean; date?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.fetchTasks(params);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData: Partial<Task>) => {
    try {
      const newTask = await tasksApi.createTask(taskData);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create task');
    }
  }, []);

  const toggleComplete = useCallback(async (id: string) => {
    try {
      const updated = await tasksApi.toggleComplete(id);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to toggle task');
    }
  }, []);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    toggleComplete,
  };
};
```

### Step 4.3: Set Token Provider in Auth Context

```typescript
// Update apps/mobile/src/contexts/AuthContext.tsx
import { setTokenProvider } from '../api/client';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing state

  const getAccessToken = useCallback(async () => {
    return accessToken;
  }, [accessToken]);

  // Set token provider when accessToken changes
  useEffect(() => {
    if (accessToken) {
      setTokenProvider(getAccessToken);
    }
  }, [accessToken, getAccessToken]);

  // ... rest of component
};
```

---

## Phase 5: Build UI Components

**Goal:** Create React Native UI components matching web app functionality

**Time Estimate:** 2-3 weeks

### Step 5.1: Navigation Structure

```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { DashboardScreen } from '../screens/DashboardScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { PlannerScreen } from '../screens/PlannerScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#4f46e5',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="target" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="checkbox-marked-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
```

### Step 5.2: Goal Card Component

```typescript
// apps/mobile/src/components/GoalCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar, Chip } from 'react-native-paper';
import { Goal } from '@goal-tracker/shared';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const progress = goal.progressSummary?.percentComplete || 0;

  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium">{goal.title}</Text>
          <Chip mode="outlined" compact>
            {goal.scope}
          </Chip>
        </View>

        {goal.description && (
          <Text variant="bodySmall" style={styles.description}>
            {goal.description}
          </Text>
        )}

        <ProgressBar progress={progress / 100} style={styles.progress} />

        <Text variant="bodySmall" style={styles.progressText}>
          {Math.round(progress)}% complete
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  description: {
    marginBottom: 12,
    color: '#666',
  },
  progress: {
    marginVertical: 8,
  },
  progressText: {
    textAlign: 'right',
    marginTop: 4,
  },
});
```

### Step 5.3: Task Card Component

```typescript
// apps/mobile/src/components/TaskCard.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Checkbox, Chip } from 'react-native-paper';
import { Task } from '@goal-tracker/shared';
import { formatScheduledDate } from '@goal-tracker/shared';

interface TaskCardProps {
  task: Task;
  onToggle?: () => void;
  onPress?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onPress }) => {
  return (
    <Card style={styles.card} onPress={onPress}>
      <Card.Content>
        <View style={styles.row}>
          <Checkbox
            status={task.isCompleted ? 'checked' : 'unchecked'}
            onPress={onToggle}
          />
          <View style={styles.content}>
            <Text
              variant="bodyLarge"
              style={[styles.title, task.isCompleted && styles.completed]}
            >
              {task.title}
            </Text>

            {task.description && (
              <Text variant="bodySmall" style={styles.description}>
                {task.description}
              </Text>
            )}

            <View style={styles.meta}>
              {task.priority && (
                <Chip compact mode="outlined" style={styles.chip}>
                  {task.priority}
                </Chip>
              )}
              {task.category && (
                <Chip compact mode="outlined" style={styles.chip}>
                  {task.category}
                </Chip>
              )}
              {task.scheduledDate && (
                <Text variant="bodySmall">
                  {formatScheduledDate(task.scheduledDate)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontWeight: '500',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  description: {
    marginTop: 4,
    color: '#666',
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    marginRight: 4,
  },
});
```

### Step 5.4: Dashboard Screen

```typescript
// apps/mobile/src/screens/DashboardScreen.tsx
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useGoals } from '../hooks/useGoals';
import { useTasks } from '../hooks/useTasks';

export const DashboardScreen = () => {
  const { goals, loading: goalsLoading, fetchGoals } = useGoals();
  const { tasks, loading: tasksLoading, fetchTasks } = useTasks();

  useEffect(() => {
    fetchGoals();
    fetchTasks();
  }, []);

  const completedGoals = goals.filter(g => g.isMarkedComplete).length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;

  if (goalsLoading || tasksLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text variant="headlineMedium" style={styles.header}>
        Dashboard
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{goals.length}</Text>
          <Text variant="bodyMedium">Total Goals</Text>
          <Text variant="bodySmall">
            {completedGoals} completed
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">{tasks.length}</Text>
          <Text variant="bodyMedium">Total Tasks</Text>
          <Text variant="bodySmall">
            {completedTasks} completed
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
});
```

### Step 5.5: Goals Screen

```typescript
// apps/mobile/src/screens/GoalsScreen.tsx
import React, { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useGoals } from '../hooks/useGoals';
import { GoalCard } from '../components/GoalCard';

export const GoalsScreen = ({ navigation }) => {
  const { goals, loading, fetchGoals } = useGoals();

  useEffect(() => {
    fetchGoals();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No goals yet. Create one!</Text>
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CreateGoal')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
```

---

## Phase 6: Feature Implementation

**Goal:** Implement all features from web app

**Time Estimate:** 2-4 weeks

### Features to Implement

1. **Goals Management** ✓ (from Phase 5)
   - View goals list
   - Create goal
   - Edit goal
   - Delete goal
   - Mark complete
   - View progress

2. **Tasks Management**
   - View tasks list
   - Create task
   - Edit task
   - Delete task
   - Toggle completion
   - Schedule task
   - Link to goals

3. **Planner/Calendar**
   - Calendar view
   - Scheduled tasks
   - Drag-and-drop rescheduling

4. **Dashboard**
   - Statistics
   - Progress charts
   - Recent activity

5. **Settings**
   - User profile
   - Logout
   - App preferences

### Implementation Priority

**Week 1:**
- ✅ Goals list (done in Phase 5)
- ✅ Tasks list (done in Phase 5)
- Create goal form
- Create task form

**Week 2:**
- Edit goal/task
- Delete confirmation
- Task completion
- Basic filtering

**Week 3:**
- Calendar view
- Task scheduling
- Goal-task linking

**Week 4:**
- Dashboard statistics
- Charts (using victory-native)
- Settings screen
- Polish and bug fixes

---

## Testing Strategy

### Unit Tests

```bash
# In apps/mobile
pnpm add -D @testing-library/react-native jest

# Create test files alongside components
src/
├── components/
│   ├── GoalCard.tsx
│   └── GoalCard.test.tsx
```

**Example test:**
```typescript
// apps/mobile/src/components/GoalCard.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { GoalCard } from './GoalCard';

describe('GoalCard', () => {
  it('renders goal title', () => {
    const goal = {
      id: '1',
      title: 'Test Goal',
      scope: 'MONTHLY',
      // ... other required fields
    };

    const { getByText } = render(<GoalCard goal={goal} />);
    expect(getByText('Test Goal')).toBeTruthy();
  });
});
```

### Integration Tests

Test API integration:

```typescript
// apps/mobile/src/hooks/__tests__/useGoals.test.ts
import { renderHook, waitFor } from '@testing-library/react-native';
import { useGoals } from '../useGoals';

// Mock API
jest.mock('../../api/client');

describe('useGoals', () => {
  it('fetches goals successfully', async () => {
    const { result } = renderHook(() => useGoals());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.goals).toHaveLength(2);
  });
});
```

### Manual Testing Checklist

- [ ] Login/logout flow
- [ ] Create goal
- [ ] Edit goal
- [ ] Delete goal
- [ ] Mark goal complete
- [ ] Create task
- [ ] Edit task
- [ ] Delete task
- [ ] Toggle task completion
- [ ] Schedule task
- [ ] Link task to goal
- [ ] View calendar
- [ ] View dashboard statistics
- [ ] Test on iOS (if Mac available)
- [ ] Test on Android

---

## CI/CD Updates

### Update GitHub Actions

**Add mobile build to `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Type check
        run: |
          pnpm --filter web run type-check
          pnpm --filter api run type-check
          pnpm --filter mobile run type-check

      - name: Lint
        run: |
          pnpm --filter web lint
          pnpm --filter api lint
          pnpm --filter mobile lint

      - name: Test
        run: |
          pnpm --filter web test
          pnpm --filter api test
          pnpm --filter mobile test

  build-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: pnpm install
      - name: Build web
        run: pnpm --filter web build

  build-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: pnpm install
      - name: Build API
        run: pnpm --filter api build

  # Optional: Build mobile (requires more setup)
  # build-android:
  #   needs: test
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v3
  #     - name: Setup Java
  #       uses: actions/setup-java@v3
  #       with:
  #         distribution: 'temurin'
  #         java-version: '11'
  #     - name: Build Android
  #       run: |
  #         cd apps/mobile/android
  #         ./gradlew assembleRelease
```

---

## Common Issues & Solutions

### Issue 1: Metro Can't Resolve Shared Package

**Error:**
```
Unable to resolve module @goal-tracker/shared
```

**Solution:**
```bash
# 1. Clear Metro cache
cd apps/mobile
pnpm start -- --reset-cache

# 2. Verify metro.config.js is correct
# 3. Restart Metro bundler
```

### Issue 2: TypeScript Can't Find Shared Types

**Error:**
```
Cannot find module '@goal-tracker/shared'
```

**Solution:**
```bash
# 1. Build shared package
cd packages/shared
pnpm build

# 2. Reinstall dependencies
cd ../../
pnpm install

# 3. Restart TypeScript server in IDE
```

### Issue 3: iOS Build Fails

**Error:**
```
Podfile error
```

**Solution:**
```bash
cd apps/mobile/ios
pod deintegrate
pod install
cd ..
pnpm ios
```

### Issue 4: Android Build Fails

**Error:**
```
Gradle build failed
```

**Solution:**
```bash
cd apps/mobile/android
./gradlew clean
cd ..
pnpm android
```

### Issue 5: Auth0 Callback Not Working

**Symptom:** Login works but doesn't redirect back to app

**Solution:**
1. Check Auth0 dashboard callback URLs
2. Add callback URL for mobile: `com.goaltracker://bises.auth0.com/ios/com.goaltracker/callback`
3. Update `AndroidManifest.xml` and `Info.plist` with deep link config

### Issue 6: API Requests Fail from Device

**Symptom:** Works on simulator, fails on real device

**Solution:**
```typescript
// Use device-accessible URL, not localhost
// For Android emulator:
const API_URL = 'http://10.0.2.2:3000/api';

// For physical device on same network:
const API_URL = 'http://192.168.1.100:3000/api';

// Best: Use environment variable
const API_URL = Config.API_URL;
```

---

## Next Steps

### After Basic Setup

1. **Test thoroughly**
   - Smoke test all features
   - Test on both iOS and Android
   - Test on physical devices

2. **Add native features**
   - Push notifications
   - Biometric auth
   - Widget support
   - Offline support

3. **Performance optimization**
   - Implement React.memo
   - Use FlatList for large lists
   - Lazy load images
   - Profile with React DevTools

4. **Polish UI**
   - Animations with Reanimated
   - Haptic feedback
   - Custom theme
   - Dark mode

5. **Prepare for release**
   - App icons
   - Splash screens
   - App Store / Play Store assets
   - Privacy policy
   - Terms of service

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| 1. Prepare Shared Package | 1-2 days | 🟡 Pending |
| 2. Setup React Native | 1 day | 🟡 Pending |
| 3. Authentication | 1-2 days | 🟡 Pending |
| 4. API Integration | 1 day | 🟡 Pending |
| 5. Build UI Components | 2-3 weeks | 🟡 Pending |
| 6. Feature Implementation | 2-4 weeks | 🟡 Pending |
| **Total** | **5-7 weeks** | 🟡 Pending |

---

## Decision Points

Before starting, decide on:

- [ ] UI Library: React Native Paper vs NativeBase vs Native Base
- [ ] State Management: Keep hooks vs add Zustand/Redux
- [ ] Navigation: Bottom tabs vs side drawer vs both
- [ ] Theme: Material Design vs Custom design
- [ ] Testing: Unit tests only vs E2E with Detox
- [ ] Deployment: Manual vs Fastlane automation

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [react-native-auth0](https://github.com/auth0/react-native-auth0)

### Tools
- [Reactotron](https://github.com/infinitered/reactotron) - Debugging
- [Flipper](https://fbflipper.com/) - Native debugging
- [React DevTools](https://react.dev/learn/react-developer-tools) - Component inspection

---

**Ready to start?**

Begin with Phase 1 and work through each step. Update this document as you progress by changing status from 🟡 Pending to 🟢 Complete.

Good luck! 🚀
