# React Native Migration Guide

**Goal Tracker PWA → React Native App**
_Comprehensive strategy, tooling, and implementation roadmap_

---

## Table of Contents

1. [Executive Summary & Feasibility](#1-executive-summary--feasibility)
2. [What Can Be Reused vs. What Must Change](#2-what-can-be-reused-vs-what-must-change)
3. [Migration Strategy: Expo + Expo Router](#3-migration-strategy-expo--expo-router)
4. [Monorepo Restructuring](#4-monorepo-restructuring)
5. [Phase-by-Phase Implementation Plan](#5-phase-by-phase-implementation-plan)
6. [Component-by-Component Migration Map](#6-component-by-component-migration-map)
7. [Styling System Migration](#7-styling-system-migration)
8. [Authentication Migration (Auth0)](#8-authentication-migration-auth0)
9. [Navigation Migration](#9-navigation-migration)
10. [Gesture & Animation Migration](#10-gesture--animation-migration)
11. [Recommended Libraries](#11-recommended-libraries)
12. [MCP Servers to Use](#12-mcp-servers-to-use)
13. [AI Agents & Skills for the Migration](#13-ai-agents--skills-for-the-migration)
14. [Copilot Prompts & Agent Instructions](#14-copilot-prompts--agent-instructions)
15. [CI/CD & Build Pipeline](#15-cicd--build-pipeline)
16. [Testing Strategy](#16-testing-strategy)
17. [Risk Register](#17-risk-register)
18. [Definition of Done](#18-definition-of-done)

---

## 1. Executive Summary & Feasibility

### Verdict: **High Feasibility — Recommended Path Exists**

After scanning the full codebase, the migration is **highly feasible** for the following reasons:

| Factor                   | Assessment                                                           |
| ------------------------ | -------------------------------------------------------------------- |
| Backend                  | ✅ **Zero changes needed** — clean REST API with JWT auth            |
| State management         | ✅ **Fully reusable** — React Context, same pattern in RN            |
| Data models (`types.ts`) | ✅ **100% portable** — pure TypeScript interfaces                    |
| Shared utils package     | ✅ **100% portable** — no DOM dependencies                           |
| API client (`api.ts`)    | ✅ **~90% portable** — only `import.meta.env` must change            |
| Business logic           | ✅ **Fully portable** — no DOM coupling in contexts/services         |
| UI components            | ⚠️ **Full rewrite** — all Radix/Tailwind/shadcn must be replaced     |
| Routing                  | ⚠️ **Full rewrite** — `react-router-dom` → `expo-router`             |
| Auth SDK                 | ⚠️ **SDK swap** — `@auth0/auth0-react` → `react-native-auth0`        |
| Animations               | ⚠️ **Rewrite** — Framer Motion → `react-native-reanimated` v3        |
| Styling                  | ⚠️ **Rewrite** — TailwindCSS → NativeWind v4 (keeps Tailwind syntax) |

### Effort Estimate

| Layer                                  | Effort                   |
| -------------------------------------- | ------------------------ |
| Project scaffolding & monorepo setup   | ~1–2 days                |
| Navigation & auth integration          | ~2–3 days                |
| Core screens (Dashboard, Goals, Tasks) | ~5–7 days                |
| Planner + Timeline (most complex)      | ~4–6 days                |
| Sheets, modals, form components        | ~3–4 days                |
| Polish, theming, testing               | ~3–5 days                |
| **Total estimate**                     | **~3–5 developer weeks** |

---

## 2. What Can Be Reused vs. What Must Change

### ✅ Reuse As-Is (Zero or Minimal Changes)

| Asset                       | Location                                | Notes                                           |
| --------------------------- | --------------------------------------- | ----------------------------------------------- |
| Express REST API            | `apps/api/`                             | No changes needed                               |
| Prisma schema & DB          | `apps/api/prisma/`                      | No changes needed                               |
| TypeScript data models      | `apps/web/src/types.ts`                 | Move to `packages/shared/src/types/`            |
| API client logic            | `apps/web/src/api.ts`                   | Replace `import.meta.env` with `expo-constants` |
| GoalContext                 | `apps/web/src/contexts/GoalContext.tsx` | Works identically in RN                         |
| TaskContext                 | `apps/web/src/contexts/TaskContext.tsx` | Works identically in RN                         |
| Shared date utils           | `packages/shared/`                      | 100% portable                                   |
| Auth token provider pattern | `apps/web/src/api.ts`                   | Same design, different SDK                      |

### ⚠️ Needs Adaptation (Logic Same, Platform API Different)

| Asset                   | Change Required                                               |
| ----------------------- | ------------------------------------------------------------- |
| `useKeyboardHeight.ts`  | Replace `window.visualViewport` with RN `Keyboard` API        |
| `useMediaQuery.ts`      | Replace `window.matchMedia` with `useWindowDimensions()`      |
| `useTouchHandlers.ts`   | Replace DOM TouchEvents with `react-native-gesture-handler`   |
| `authDebug.ts`          | Replace `localStorage` reads with `expo-secure-store`         |
| App routing (`App.tsx`) | Replace `BrowserRouter`/`react-router-dom` with `expo-router` |

### ❌ Requires Full Rewrite (UI/Platform Only)

| Asset                                             | Replacement Strategy                             |
| ------------------------------------------------- | ------------------------------------------------ |
| All `components/ui/*` (shadcn/Radix)              | `react-native-paper` + custom primitives         |
| All sheet components (vaul)                       | `@gorhom/bottom-sheet`                           |
| `DailyTimelineView.tsx` (CSS grid + pointer drag) | Custom RN ScrollView + reanimated                |
| `UnscheduledTaskStrip.tsx`                        | Custom RN horizontal FlatList + gesture handler  |
| `BottomNav.tsx`                                   | Expo Router tab layout                           |
| `TopNavBar.tsx`                                   | Expo Router Stack header                         |
| `ProtectedRoute.tsx`                              | Expo Router `_layout.tsx` auth guard             |
| All TailwindCSS classes                           | NativeWind v4 (same class names!)                |
| CSS custom properties                             | JavaScript theme object                          |
| PWA config                                        | Expo app.json / EAS Build                        |
| Recharts                                          | `react-native-gifted-charts` or `victory-native` |

---

## 3. Migration Strategy: Expo + Expo Router

### Why Expo (not bare React Native CLI)?

| Feature                 | Expo                            | Bare RN CLI                               |
| ----------------------- | ------------------------------- | ----------------------------------------- |
| Setup speed             | Minutes                         | Hours/days                                |
| OTA updates             | ✅ expo-updates                 | Manual                                    |
| Build service           | ✅ EAS Build (cloud)            | Local Xcode/Android Studio required       |
| Native modules          | ✅ Expo SDK covers 95% of needs | Manual `pod install` for every lib        |
| Web support (keep PWA!) | ✅ `expo-router` supports web   | Requires separate react-native-web config |
| TypeScript              | ✅ First-class                  | Needs extra setup                         |
| Monorepo support        | ✅ Works with pnpm workspaces   | Needs custom Metro config                 |

### Why Expo Router (not React Navigation directly)?

Expo Router brings **file-based routing** (like Next.js) to React Native, which maps your existing `pages/` structure almost 1:1. It also handles deep linking, web URLs, and layouts natively.

```
apps/mobile/app/
  _layout.tsx          ← Root layout (Auth0Provider, GoalProvider, TaskProvider)
  (auth)/
    login.tsx          ← LoginPage
    callback.tsx       ← CallbackPage
  (app)/
    _layout.tsx        ← Tab navigator (BottomNav equivalent)
    index.tsx          ← AchievementDashboardPage  (was /)
    goals/
      index.tsx        ← GoalsPage                 (was /goals)
      [goalId].tsx     ← GoalDetailsPage           (was /goals/:goalId)
    tasks.tsx          ← TasksPage                 (was /tasks)
    planner.tsx        ← PlannerPage               (was /planner)
```

### Strategy: Shared Monorepo (Recommended)

Keep the existing monorepo and add a new `apps/mobile/` target. The web app remains live throughout migration. Both share `packages/shared/` and point to the same backend API.

```
goal-tracker/
├── apps/
│   ├── api/          ← Backend (unchanged)
│   ├── web/          ← Existing React PWA (unchanged, stays live)
│   └── mobile/       ← NEW: React Native / Expo app
└── packages/
    └── shared/       ← Types + utils shared by all three
```

---

## 4. Monorepo Restructuring

### Step 1: Move Shared Types Out of `apps/web/`

Currently `types.ts` lives inside the web app. Move it to the shared package:

```
packages/shared/src/
  index.ts
  types/
    index.ts          ← Move apps/web/src/types.ts here
  utils/
    dateUtils.ts      ← Already here
```

Update `packages/shared/src/index.ts` to export types:

```typescript
export * from './types';
export * from './utils/dateUtils';
```

Update `apps/web/src/types.ts` to re-export from shared:

```typescript
export * from '@goal-tracker/shared';
```

### Step 2: Create `apps/mobile/`

```bash
cd apps
npx create-expo-app mobile --template expo-template-blank-typescript
```

Then configure `pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Step 3: Configure Metro for Monorepo

`apps/mobile/metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

### Step 4: Root `package.json` Scripts

```json
{
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api dev",
    "dev:mobile": "pnpm --filter mobile start",
    "build:mobile:ios": "pnpm --filter mobile eas build --platform ios",
    "build:mobile:android": "pnpm --filter mobile eas build --platform android"
  }
}
```

---

## 5. Phase-by-Phase Implementation Plan

### Phase 0: Foundation (Days 1–2)

- [ ] Scaffold `apps/mobile/` with Expo Router template
- [ ] Configure Metro for monorepo (pnpm workspaces)
- [ ] Move `types.ts` to `packages/shared/`
- [ ] Install and configure NativeWind v4
- [ ] Set up EAS Build (`eas.json`)
- [ ] Create `.env` files for mobile with API URL
- [ ] Verify `packages/shared/` imports work in Metro

**Validation:** App launches, shows blank screen, shared types import correctly.

---

### Phase 1: Auth + Navigation Shell (Days 3–5)

- [ ] Install `react-native-auth0`
- [ ] Create root `_layout.tsx` with Auth0Provider, GoalProvider, TaskProvider
- [ ] Create `(auth)/_layout.tsx` redirect logic
- [ ] Create `(app)/_layout.tsx` with tab navigator (4 tabs)
- [ ] Create `login.tsx` screen
- [ ] Port `ProtectedRoute` logic to `_layout.tsx` auth guard
- [ ] Test login flow end-to-end on device

**Validation:** Can log in via Auth0, lands on dashboard (blank), bottom tabs work.

---

### Phase 2: Core Screens — Dashboard & Tasks (Days 6–10)

- [ ] Port `AchievementDashboardPage` → `app/(app)/index.tsx`
  - [ ] `TodayProgressCard` component
  - [ ] `DailyFocusList` component (RN FlatList)
  - [ ] `GoalsProgress` component
- [ ] Port `TasksPage` → `app/(app)/tasks.tsx`
  - [ ] Pagination with RN FlatList + onEndReached
  - [ ] Tab filter (Pending/Completed) with RN segmented control
  - [ ] Date filter via RN Modal + custom calendar
- [ ] Port `TaskCard` component
- [ ] Port `TaskEditSheet` → `@gorhom/bottom-sheet` based sheet
- [ ] Port `ConfirmDialog` → RN Modal

**Validation:** Can view, create, edit, complete, delete tasks.

---

### Phase 3: Goals (Days 11–14)

- [ ] Port `GoalsPage` → `app/(app)/goals/index.tsx`
  - [ ] Scope filter tabs
  - [ ] `GoalCard` component
  - [ ] Search input
- [ ] Port `GoalDetailsPage` → `app/(app)/goals/[goalId].tsx`
  - [ ] Progress display
  - [ ] Linked tasks list
  - [ ] Child goals accordion
  - [ ] Activities log
- [ ] Port `GoalEditSheet`
- [ ] Port `AddProgressSheet`
- [ ] Port `LinkTasksSheet`
- [ ] Port `BulkTaskSheet`

**Validation:** Full CRUD on goals, link tasks, add progress.

---

### Phase 4: Planner (Days 15–20)

This is the most complex screen due to the drag-and-drop timeline.

- [ ] Port `PlannerPage` → `app/(app)/planner.tsx`
  - [ ] Month view (custom RN grid, no CSS)
  - [ ] Day view with `DailyTimelineView`
- [ ] Rebuild `DailyTimelineView` in RN:
  - [ ] ScrollView with 24 "hour rows" (each `HOUR_HEIGHT=64`)
  - [ ] Task block positioned with absolute coordinates
  - [ ] Drag-to-reschedule via `react-native-gesture-handler` + `react-native-reanimated`
- [ ] Rebuild `UnscheduledTaskStrip` (horizontal FlatList)
- [ ] Port `RescheduleSheet`
- [ ] Port `TasksForDateSheet`

**Validation:** Month/day switching works, tasks render in timeline, drag reschedule works.

---

### Phase 5: Polish & Production Readiness (Days 21–25)

- [ ] Apply design system (fonts, colors, shadows, border radii) via NativeWind theme + JS theme object
- [ ] Responsive layout for tablets (iPad)
- [ ] Deep linking configuration in `app.json`
- [ ] Offline support strategy (optional: `expo-sqlite` as local cache)
- [ ] Push notifications (optional: `expo-notifications`)
- [ ] App icons and splash screen
- [ ] EAS Build profiles (dev, preview, production)
- [ ] App Store / Google Play metadata prep
- [ ] Final QA pass on physical devices

---

## 6. Component-by-Component Migration Map

### Navigation & Layout

| Web Component              | RN Replacement                          | Notes                                            |
| -------------------------- | --------------------------------------- | ------------------------------------------------ |
| `TopNavBar.tsx`            | Expo Router Stack header config         | Configured in `_layout.tsx` via `screenOptions`  |
| `BottomNav.tsx`            | Expo Router `Tabs` component            | 4 tabs: Home, Goals, Tasks, Planner              |
| `ProtectedRoute.tsx`       | `(app)/_layout.tsx` auth check          | `useEffect` redirect if not `isAuthenticated`    |
| `FloatingActionButton.tsx` | Custom `Pressable` with Tailwind shadow | Use `react-native-reanimated` for glow animation |

### Sheets & Modals

| Web Component           | RN Replacement                 | Key Differences                                       |
| ----------------------- | ------------------------------ | ----------------------------------------------------- |
| `TaskEditSheet.tsx`     | `@gorhom/bottom-sheet` + form  | `TextInput` instead of `<input>`, RN `DateTimePicker` |
| `GoalEditSheet.tsx`     | `@gorhom/bottom-sheet`         | Same structure                                        |
| `AddProgressSheet.tsx`  | `@gorhom/bottom-sheet`         | Numeric `TextInput`                                   |
| `BulkTaskSheet.tsx`     | `@gorhom/bottom-sheet`         | RN `ScrollView` inside                                |
| `LinkTasksSheet.tsx`    | `@gorhom/bottom-sheet`         | `FlatList` for search results                         |
| `RescheduleSheet.tsx`   | `@gorhom/bottom-sheet`         | `@react-native-community/datetimepicker`              |
| `TasksForDateSheet.tsx` | `@gorhom/bottom-sheet`         | `FlatList` inside                                     |
| `ConfirmDialog.tsx`     | `react-native` `Alert.alert()` | Or custom RN Modal for complex use                    |

### Data Display

| Web Component                 | RN Replacement                    | Key Differences                                                |
| ----------------------------- | --------------------------------- | -------------------------------------------------------------- |
| `GoalCard.tsx`                | Native `View` + `Pressable`       | `StyleSheet` or NativeWind classes                             |
| `TaskCard.tsx`                | Native `View` + `Pressable`       | `Pressable` with animated feedback                             |
| `SquircleCard.tsx`            | Custom `View` with `borderRadius` | No CSS clip-path, use `overflow: hidden`                       |
| `GoalsProgress.tsx`           | `FlatList` or `ScrollView`        | RN progress bar via `Animated.View` width                      |
| `TodayProgressCard.tsx`       | Native `View`                     | Animated progress circle available via `react-native-progress` |
| `DailyFocusList.tsx`          | `FlatList`                        | More performant than web `map()`                               |
| `ActivitiesListComponent.tsx` | `FlatList` with pagination        | RN pagination via `onEndReached`                               |

### Charts

| Web Component | RN Replacement                                                |
| ------------- | ------------------------------------------------------------- |
| `recharts`    | `victory-native` (Skia-based) or `react-native-gifted-charts` |

### UI Primitives (shadcn/ui → RN)

| shadcn Component | RN Replacement                                              |
| ---------------- | ----------------------------------------------------------- |
| `Button`         | Custom `Pressable` or `react-native-paper` `Button`         |
| `Dialog`         | RN `Modal`                                                  |
| `Select`         | `@react-native-picker/picker` or custom bottom sheet picker |
| `Checkbox`       | `react-native-paper` `Checkbox` or custom                   |
| `Badge`          | Custom `View` + `Text`                                      |
| `Avatar`         | `expo-image` or custom `View` + initials                    |
| `Progress`       | `react-native` `View` with animated width                   |
| `ScrollArea`     | RN `ScrollView` (built-in)                                  |
| `Accordion`      | Custom with `react-native-reanimated` layout animation      |
| `DropdownMenu`   | `@react-native-menu/menu` or custom Modal                   |

---

## 7. Styling System Migration

### Strategy: NativeWind v4 (Recommended)

NativeWind v4 brings Tailwind CSS v3 syntax to React Native via a Babel/Metro transform. This means your Tailwind classes translate almost directly.

**Current web classes and their RN equivalents remain identical:**

```tsx
// Web (Tailwind)
<div className="flex flex-row items-center p-4 rounded-2xl bg-white">

// React Native (NativeWind v4 - SAME CLASSES!)
<View className="flex-row items-center p-4 rounded-2xl bg-white">
```

### Differences to Watch

| Web Tailwind                         | NativeWind Behavior                                              |
| ------------------------------------ | ---------------------------------------------------------------- |
| `flex` (default row in web)          | `flex-col` is default in RN — always be explicit                 |
| CSS custom properties `var(--color)` | Must convert to JS theme values in `tailwind.config.js`          |
| `boxShadow`                          | Limited — use `shadow-*` NativeWind classes or platform-specific |
| `backdrop-blur`                      | Not supported in RN (remove blur glass effects)                  |
| `::before` / `::after`               | Not supported — remove grain texture overlay                     |
| `hover:` pseudo-classes              | Not applicable on mobile                                         |

### Theme Migration

Convert CSS variables to a NativeWind theme extension in `tailwind.config.js`:

```javascript
// apps/mobile/tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'peach-cream': '#fff9f5',
        'energizing-orange': '#ff8c42',
        'electric-pink': '#ff3e83',
        'soft-coral': '#ffb088',
        'warm-rose': '#ff6b9d',
        'deep-charcoal': '#2a2a2a',
        'warm-gray': '#6b7280',
      },
      fontFamily: {
        display: ['Outfit_800ExtraBold'],
        body: ['PlusJakartaSans_400Regular'],
      },
      borderRadius: {
        'squircle-sm': '12px',
        'squircle-md': '20px',
        'squircle-lg': '32px',
        'squircle-xl': '40px',
      },
    },
  },
};
```

### Font Loading with Expo

```tsx
// apps/mobile/app/_layout.tsx
import { useFonts, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_800ExtraBold,
    PlusJakartaSans_400Regular,
  });

  if (!fontsLoaded) return <SplashScreen />;
  // ...
}
```

---

## 8. Authentication Migration (Auth0)

### Web vs. Mobile Auth0

|                | Web (`@auth0/auth0-react`) | Mobile (`react-native-auth0`)           |
| -------------- | -------------------------- | --------------------------------------- |
| OAuth flow     | Redirect in same tab       | Opens system browser (ASWebAuth)        |
| Token storage  | Memory + `localStorage`    | `expo-secure-store` (Keychain/Keystore) |
| Refresh tokens | Silent iframe              | Stored securely, explicit refresh       |
| Hook           | `useAuth0()`               | `useAuth0()` (same API!)                |

### Installation

```bash
pnpm --filter mobile add react-native-auth0 expo-secure-store
npx expo install expo-web-browser
```

### Auth0 Dashboard Setup

1. Go to Auth0 Dashboard → Applications → Your App
2. Add to **Allowed Callback URLs**: `goaltracker://callback`
3. Add to **Allowed Logout URLs**: `goaltracker://`
4. Enable **Refresh Token Rotation** in Advanced Settings
5. Enable **Absolute Expiration** for refresh tokens

### Implementation

```tsx
// apps/mobile/app/_layout.tsx
import Auth0Provider from 'react-native-auth0';

export default function RootLayout() {
  return (
    <Auth0Provider domain="bises.auth0.com" clientId={process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!}>
      <GoalProvider>
        <TaskProvider>
          <Slot />
        </TaskProvider>
      </GoalProvider>
    </Auth0Provider>
  );
}
```

```tsx
// apps/mobile/app/(auth)/login.tsx
import { useAuth0 } from 'react-native-auth0';

export default function LoginScreen() {
  const { authorize } = useAuth0();

  const handleLogin = async () => {
    await authorize({
      audience: 'https://goal-tracker-api',
      scope: 'openid profile email offline_access',
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-peach-cream">
      <Pressable onPress={handleLogin} className="bg-energizing-orange rounded-2xl px-8 py-4">
        <Text className="text-white font-display text-lg">Sign In</Text>
      </Pressable>
    </View>
  );
}
```

### Adapting `api.ts` Token Provider

```typescript
// The setAuthTokenProvider() pattern works identically
// In _layout.tsx useEffect:
const { getCredentials } = useAuth0();

useEffect(() => {
  setAuthTokenProvider(async () => {
    const credentials = await getCredentials(
      'openid profile email',
      0, // minTTL
      { audience: 'https://goal-tracker-api' }
    );
    return credentials?.accessToken ?? null;
  });
}, [getCredentials]);
```

---

## 9. Navigation Migration

### Route Mapping

| Web Route        | Expo Router File               | Notes                            |
| ---------------- | ------------------------------ | -------------------------------- |
| `/login`         | `app/(auth)/login.tsx`         |                                  |
| `/callback`      | `app/(auth)/callback.tsx`      | Auth0 redirect deep link handler |
| `/`              | `app/(app)/index.tsx`          | Dashboard                        |
| `/goals`         | `app/(app)/goals/index.tsx`    |                                  |
| `/goals/:goalId` | `app/(app)/goals/[goalId].tsx` |                                  |
| `/tasks`         | `app/(app)/tasks.tsx`          |                                  |
| `/planner`       | `app/(app)/planner.tsx`        |                                  |

### Auth Guard Layout

```tsx
// apps/mobile/app/(app)/_layout.tsx
import { Tabs, Redirect } from 'expo-router';
import { useAuth0 } from 'react-native-auth0';

export default function AppLayout() {
  const { user, isLoading } = useAuth0();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#fff9f5' },
        tabBarActiveTintColor: '#ff8c42',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ... }} />
      <Tabs.Screen name="goals/index" options={{ title: 'Goals', tabBarIcon: ... }} />
      <Tabs.Screen name="tasks" options={{ title: 'Tasks', tabBarIcon: ... }} />
      <Tabs.Screen name="planner" options={{ title: 'Planner', tabBarIcon: ... }} />
    </Tabs>
  );
}
```

### Deep Linking for Auth0 Callback

```json
// apps/mobile/app.json
{
  "expo": {
    "scheme": "goaltracker",
    "ios": {
      "bundleIdentifier": "com.yourname.goaltracker"
    },
    "android": {
      "package": "com.yourname.goaltracker"
    }
  }
}
```

---

## 10. Gesture & Animation Migration

### Framer Motion → React Native Reanimated v3

| Framer Motion (Web)    | React Native Reanimated v3            |
| ---------------------- | ------------------------------------- |
| `motion.div`           | `Animated.View`                       |
| `animate={{ x: 100 }}` | `useSharedValue` + `useAnimatedStyle` |
| Drag with `drag` prop  | `PanGestureHandler` from RNGH         |
| Layout animations      | `Layout` prop from reanimated         |
| Spring physics         | `withSpring()`                        |

**Example: DailyTimelineView Drag Rewrite**

```tsx
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const HOUR_HEIGHT = 64;
const SNAP_INTERVAL = HOUR_HEIGHT / 4; // 15-minute snaps

export const DraggableTaskBlock = ({ task, onReschedule }) => {
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateY.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      // Snap to nearest 15-minute interval
      const snapped = Math.round(translateY.value / SNAP_INTERVAL) * SNAP_INTERVAL;
      translateY.value = withSpring(snapped);
      isDragging.value = false;

      const minutesDelta = (snapped / HOUR_HEIGHT) * 60;
      runOnJS(onReschedule)(task.id, minutesDelta);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value ? 1000 : 1,
    opacity: isDragging.value ? 0.85 : 1,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskBlock, animatedStyle]} className="...">
        <Text>{task.title}</Text>
      </Animated.View>
    </GestureDetector>
  );
};
```

### Hook Migrations

```typescript
// useKeyboardHeight.ts (RN version)
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent } from 'react-native';

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return keyboardHeight;
};
```

```typescript
// useMediaQuery.ts (RN version — use dimensions instead)
import { useWindowDimensions } from 'react-native';

export const useIsTablet = () => {
  const { width } = useWindowDimensions();
  return width >= 768;
};
```

---

## 11. Recommended Libraries

### Core

| Library                        | Version | Purpose            | Docs                                            |
| ------------------------------ | ------- | ------------------ | ----------------------------------------------- |
| `expo`                         | ~53     | Expo SDK           | expo.dev                                        |
| `expo-router`                  | ~4      | File-based routing | expo.github.io/router                           |
| `nativewind`                   | ^4      | Tailwind CSS in RN | nativewind.dev                                  |
| `react-native-reanimated`      | ^3      | Animations         | docs.swmansion.com/react-native-reanimated      |
| `react-native-gesture-handler` | ^2      | Touch gestures     | docs.swmansion.com/react-native-gesture-handler |
| `react-native-auth0`           | ^3      | Auth0 SDK          | auth0.com/docs/libraries/auth0-react-native     |

### UI Components

| Library                          | Version  | Purpose                                                  |
| -------------------------------- | -------- | -------------------------------------------------------- |
| `@gorhom/bottom-sheet`           | ^5       | Bottom sheets (replaces vaul)                            |
| `react-native-paper`             | ^5       | Material Design components (buttons, inputs, checkboxes) |
| `@expo/vector-icons`             | included | Icon library (includes Lucide-compatible Feather icons)  |
| `expo-image`                     | ~2       | Optimized image component                                |
| `react-native-safe-area-context` | ^4       | Safe area handling                                       |
| `react-native-screens`           | ^3       | Native navigation screens                                |

### Forms & Inputs

| Library                                   | Purpose                                             |
| ----------------------------------------- | --------------------------------------------------- |
| `@react-native-community/datetimepicker`  | Native date/time picker (replaces react-day-picker) |
| `react-native-keyboard-aware-scroll-view` | Auto-scroll when keyboard opens                     |

### Data Visualization

| Library                      | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `victory-native`             | Charts (Skia-based, replaces recharts)  |
| `react-native-gifted-charts` | Alternative chart library (simpler API) |

### Storage & Native

| Library                              | Purpose                                          |
| ------------------------------------ | ------------------------------------------------ |
| `expo-secure-store`                  | Secure token storage (replaces localStorage)     |
| `expo-constants`                     | App config / env vars (replaces import.meta.env) |
| `expo-font` + `@expo-google-fonts/*` | Font loading                                     |
| `expo-notifications`                 | Push notifications (future feature)              |
| `expo-updates`                       | OTA updates                                      |

### Dev Tools

| Library                         | Purpose                  |
| ------------------------------- | ------------------------ |
| `eas-cli`                       | EAS Build + Submit CLI   |
| `expo-dev-client`               | Custom development build |
| `@testing-library/react-native` | Component testing        |
| `detox`                         | E2E testing (optional)   |

---

## 12. MCP Servers to Use

MCP (Model Context Protocol) servers extend AI assistants with real-time database and service context. Here are the most useful ones for this migration:

### Tier 1: Essential for This Migration

#### `@modelcontextprotocol/server-filesystem`

- **Use for**: Reading the existing codebase during AI-assisted migration
- **Install**: `npx @modelcontextprotocol/server-filesystem /path/to/goal-tracker`
- **Value**: Lets Copilot/Claude read all source files with full context, produce accurate migration code

#### `@modelcontextprotocol/server-github`

- **Use for**: PR creation, branch management, code reviews
- **Install**: Configure in `mcp_settings.json` with GitHub token
- **Value**: AI can read issues, create branches, commit migration code

#### Expo EAS MCP Server (Community)

- **Project**: `expo-mcp` (search npm for latest)
- **Use for**: EAS Build status, app store submission queries
- **Value**: Ask AI "what's the build status?" without leaving editor

### Tier 2: Highly Recommended

#### `@modelcontextprotocol/server-postgres`

- **Use for**: Inspect your live PostgreSQL schema in AI context
- **Install**: Configure with `DATABASE_URL`
- **Value**: AI can write correct Prisma queries referencing actual schema

#### `@modelcontextprotocol/server-fetch`

- **Use for**: Fetching Expo/RN library documentation on-demand
- **Install**: Built into many AI tools
- **Value**: AI retrieves up-to-date API docs for `react-native-reanimated`, `@gorhom/bottom-sheet`, etc.

#### `shadcn-mcp` (already in your workspace)

- **Use for**: Looking up component patterns when deciding RN equivalents
- **Value**: Helps identify what each shadcn component does to find the correct RN alternative

### Tier 3: Nice-to-Have

#### `@modelcontextprotocol/server-slack`

- Log migration progress to team channel

#### Sentry MCP

- Connect error tracking for the new RN app

### MCP Server Configuration (VS Code `settings.json`)

```json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/goal-tracker"],
        "description": "Full read/write access to Goal Tracker codebase"
      },
      "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {
          "POSTGRES_CONNECTION_STRING": "${env:DATABASE_URL}"
        },
        "description": "Read Prisma/postgres schema for accurate query generation"
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
        },
        "description": "GitHub API for PR/issue management"
      }
    }
  }
}
```

---

## 13. AI Agents & Skills for the Migration

### Create a Custom Copilot Agent: `rn-migration`

Create `.github/copilot-instructions-mobile.md` (or extend existing `.github/copilot-instructions.md`) with a mobile-specific section:

````markdown
## Mobile App (apps/mobile/) Patterns

### Stack

- Expo SDK 53 + Expo Router v4 (file-based routing)
- NativeWind v4 (Tailwind CSS syntax in React Native)
- react-native-reanimated v3 for animations
- react-native-gesture-handler v2 for gestures
- @gorhom/bottom-sheet v5 for sheets/drawers
- react-native-auth0 v3 for authentication

### Component Rules

- NEVER use `<div>`, `<span>`, `<input>` — use `<View>`, `<Text>`, `<TextInput>`
- ALL text must be inside `<Text>` component
- Use `<Pressable>` (not `<TouchableOpacity>`) for interactive elements
- Use `<FlatList>` (not `.map()`) for lists with > 10 items
- NEVER use `style={{ flex: 1, flexDirection: 'row' }}` — use NativeWind classes instead
- Use `className` prop (NativeWind) as primary styling method

### Sheet Pattern

All sheets use @gorhom/bottom-sheet:

```tsx
const bottomSheetRef = useRef<BottomSheetModal>(null);
// trigger: bottomSheetRef.current?.present()
<BottomSheetModal ref={bottomSheetRef} snapPoints={['50%', '90%']}>
  <BottomSheetView className="p-4">{/* content */}</BottomSheetView>
</BottomSheetModal>;
```
````

### Navigation

- Use `router.push('/goals/123')` not `navigate()`
- Use `useLocalSearchParams()` for route params (not `useParams()`)
- Use `router.back()` not `history.goBack()`

### Env Variables

- Use `process.env.EXPO_PUBLIC_*` (exposed to app via Expo)
- NEVER use `import.meta.env`
- Access via: `import Constants from 'expo-constants'; Constants.expoConfig?.extra?.apiUrl`

````

### Prompt Snippets for Efficient Migration

Create `.github/prompts/migrate-component.prompt.md`:

```markdown
---
mode: agent
description: Migrate a web React component to React Native
---
Convert the following web React component to a React Native component:

Rules:
- Replace all HTML elements with RN equivalents (div→View, span→Text, input→TextInput, button→Pressable)
- Convert all Tailwind CSS classes to NativeWind classes (most are identical, watch flex direction)
- Replace any `window.*`, `document.*`, or DOM APIs with RN equivalents
- Replace `react-router-dom` hooks with `expo-router` equivalents
- Replace Framer Motion with `react-native-reanimated` v3
- Replace vaul/Radix sheets with `@gorhom/bottom-sheet`
- Replace shadcn/ui components with react-native-paper or custom RN components
- Keep the same props interface
- Keep the same business logic / state management
- Add proper TypeScript types

The component to migrate:
${selection}
````

Create `.github/prompts/create-rn-sheet.prompt.md`:

```markdown
---
mode: agent
description: Create a React Native bottom sheet component
---

Create a React Native bottom sheet using @gorhom/bottom-sheet v5.

Requirements:

- Use `BottomSheetModal` (not `BottomSheet`)
- Use `BottomSheetView` for content wrapper
- Export a `ref` callback and `present()`/`dismiss()` control interface
- NativeWind styling with project theme colors
- Include form fields using `BottomSheetTextInput` where needed
- Handle keyboard avoiding automatically via `keyboardBehavior="interactive"`

Sheet purpose: ${input:Purpose of the sheet}
Fields needed: ${input:List the form fields}
```

### Recommended VS Code Agent Skills

#### Skill: `react-native-component`

Creates a custom agent skill for generating RN components following project conventions.

Create `.claude/skills/react-native-component/SKILL.md`:

````markdown
# React Native Component Generator

Generates React Native components for the Goal Tracker mobile app following project conventions.

## Patterns to Follow

### Component Template

```tsx
import { View, Text, Pressable } from 'react-native';

interface ComponentNameProps {
  // Always define props interface
}

export const ComponentName = ({ ...props }: ComponentNameProps) => {
  // useState → useContext → useEffect → handlers

  return (
    <View className="...nativewind classes...">
      <Text className="font-display text-deep-charcoal">...</Text>
    </View>
  );
};
```
````

## Key Constraints

- No HTML elements
- No Framer Motion
- No window/document APIs
- Use FlatList for lists
- Use Pressable not TouchableOpacity

```

---

## 14. Copilot Prompts & Agent Instructions

### High-Value Prompts for Migration Work

#### 1. Initial Screen Scaffold

```

Create a React Native screen for [GoalsPage/TasksPage/etc] in apps/mobile/app/(app)/[path].tsx.

The current web implementation is at apps/web/src/pages/[PageName].tsx.

Migrate the logic and structure using:

- expo-router for navigation (useLocalSearchParams, router.push)
- NativeWind v4 for styling (className prop)
- FlatList for any lists
- Keep GoalContext/TaskContext hooks exactly as-is
- The API client (api.ts) is available unchanged in packages/shared

```

#### 2. Port Bottom Sheet

```

Port the web component [ComponentName] from apps/web/src/components/[File].tsx
to a React Native bottom sheet at apps/mobile/src/components/[File].tsx.

Use @gorhom/bottom-sheet v5 BottomSheetModal.
Replace all shadcn/Radix form primitives with TextInput, Pressable, and react-native-paper components.
Keep all API calls and state logic identical.

```

#### 3. Gesture-Driven Component

```

Recreate apps/web/src/components/DailyTimelineView.tsx for React Native.

The web version uses:

- CSS grid with absolute positioning (HOUR_HEIGHT = 64px)
- Pointer events for drag-to-reschedule
- 15-minute snap intervals

The RN version should use:

- ScrollView with 24 hour rows, each HOUR_HEIGHT = 64
- react-native-gesture-handler PanGestureHandler for drag
- react-native-reanimated useSharedValue/useAnimatedStyle
- Snap to 15-minute intervals using Math.round(y / (HOUR_HEIGHT/4)) \* (HOUR_HEIGHT/4)
- runOnJS to call onReschedule callback after drag ends

```

#### 4. Theme Setup

```

Set up the NativeWind v4 theme for apps/mobile/ to match the web design system.

Source CSS variables are in apps/web/src/styles/design-system.css.
Convert all CSS custom properties to their tailwind.config.js equivalents.
Include: colors, fontFamily (Outfit + Plus Jakarta Sans), borderRadius, and custom shadow utilities.

```

#### 5. Auth0 Integration

```

Implement Auth0 authentication in apps/mobile/ using react-native-auth0 v3.

Requirements:

- Domain: bises.auth0.com (from apps/api/src/config/auth.ts)
- Audience: https://goal-tracker-api
- Deep link scheme: goaltracker://callback
- Use expo-secure-store for token persistence
- Adapt the setAuthTokenProvider pattern from apps/web/src/api.ts using getCredentials()
- Add auth guard in apps/mobile/app/(app)/\_layout.tsx

````

---

## 15. CI/CD & Build Pipeline

### EAS Build Configuration

```json
// apps/mobile/eas.json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "http://localhost:3000" }
    },
    "preview": {
      "distribution": "internal",
      "env": { "EXPO_PUBLIC_API_URL": "https://api.your-domain.com" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.your-domain.com" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789",
        "appleTeamId": "XXXXXXXXXXX"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
````

### GitHub Actions — Mobile Build

Create `.github/workflows/mobile-build.yml`:

```yaml
name: Mobile Build

on:
  push:
    branches: [main]
    paths: ['apps/mobile/**', 'packages/shared/**']
  workflow_dispatch:
    inputs:
      platform:
        type: choice
        options: [all, ios, android]
        default: all

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm --filter mobile eas build --platform ${{ inputs.platform || 'all' }} --non-interactive
```

### OTA Update Strategy

For non-native changes (JS/assets only), use EAS Update:

```bash
# After JS-only changes (no new native modules)
pnpm --filter mobile eas update --branch production --message "Fix timeline drag snap"
```

This avoids a full App Store review cycle for most updates.

---

## 16. Testing Strategy

### Unit Tests (Vitest/Jest)

Contexts, utils, and hooks are shared between web and mobile — **existing web tests cover them**.

For mobile-specific components, use `@testing-library/react-native`:

```tsx
// apps/mobile/__tests__/TaskCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { TaskCard } from '../src/components/TaskCard';

it('calls onToggle when checkbox pressed', () => {
  const mockToggle = jest.fn();
  const { getByTestId } = render(<TaskCard task={mockTask} onToggle={mockToggle} />);
  fireEvent.press(getByTestId('task-toggle'));
  expect(mockToggle).toHaveBeenCalledWith(mockTask.id);
});
```

### E2E Tests (Detox — Optional)

For critical flows like auth + task creation:

```bash
pnpm --filter mobile add -D detox @types/detox
```

```typescript
// apps/mobile/e2e/task-creation.e2e.ts
describe('Task Creation', () => {
  it('should create a task from FAB', async () => {
    await element(by.id('fab-button')).tap();
    await element(by.id('task-title-input')).typeText('Test Task');
    await element(by.id('save-task-button')).tap();
    await expect(element(by.text('Test Task'))).toBeVisible();
  });
});
```

---

## 17. Risk Register

| Risk                                          | Probability | Impact | Mitigation                                                                         |
| --------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------- |
| Metro monorepo symlink issues                 | High        | High   | Use explicit `watchFolders` and `nodeModulesPaths` in Metro config                 |
| NativeWind v4 compatibility with Expo SDK     | Medium      | High   | Pin NativeWind version, test with Expo SDK 53 specifically                         |
| @gorhom/bottom-sheet keyboard conflicts       | Medium      | Medium | Use `keyboardBehavior="interactive"` and test on both iOS/Android                  |
| react-native-reanimated hermes compatibility  | Low         | High   | Always use matching version from Expo SDK compatibility matrix                     |
| Auth0 redirect URI mismatch                   | Medium      | High   | Carefully configure `scheme` in app.json, test on physical device                  |
| DailyTimelineView performance with many tasks | Medium      | Medium | Use `react-native-reanimated` worklet functions, avoid runOnJS in animation frames |
| Tailwind class differences (flex direction)   | High        | Low    | Add ESLint rule flagging `className="flex"` without direction                      |
| react-day-picker has no RN version            | Certain     | Medium | Use `@react-native-community/datetimepicker` or build custom calendar              |
| recharts has no RN version                    | Certain     | Medium | Use victory-native or react-native-gifted-charts                                   |
| vaul has no RN version                        | Certain     | Medium | Use @gorhom/bottom-sheet (already planned)                                         |

---

## 18. Definition of Done

The migration is complete when:

### Functional Parity

- [ ] User can log in / log out via Auth0
- [ ] Dashboard shows today's progress, focus list, and goals progress
- [ ] Can create, edit, delete, and complete tasks
- [ ] Can create, edit, delete, and complete goals
- [ ] Can link tasks to goals
- [ ] Can add manual progress to goals
- [ ] Planner shows month view with task dots
- [ ] Planner day view shows timeline with task blocks
- [ ] Can drag tasks on timeline to reschedule (iOS + Android)
- [ ] FAB opens task creation sheet from any screen
- [ ] All bottom sheets work on iOS and Android keyboard handling

### Quality

- [ ] No TypeScript errors (`pnpm --filter mobile type-check`)
- [ ] No crashes in Expo Go / dev build
- [ ] Tested on iOS 16+ (physical device or simulator)
- [ ] Tested on Android 12+ (physical device or emulator)
- [ ] 60fps scroll and drag performance
- [ ] App builds successfully via EAS Build (iOS + Android)

### Deployment

- [ ] `eas.json` configured for dev/preview/production
- [ ] GitHub Actions workflow builds on push to main
- [ ] App submitted to TestFlight (iOS) and Internal Testing (Android)
- [ ] Auth0 production credentials configured

---

## Quick Reference: Web → RN Cheatsheet

```
div           → View
span          → View (or Text inline)
p / h1-h6     → Text
input         → TextInput
button        → Pressable (preferred) or TouchableOpacity
img           → Image (or expo-image)
ul / li       → FlatList / SectionList
a             → Pressable + router.push()
form          → View + ScrollView for long forms
textarea      → TextInput multiline={true}

import.meta.env.VITE_*  → process.env.EXPO_PUBLIC_*
useNavigate()           → router.push() / router.back()
useParams()             → useLocalSearchParams()
window.matchMedia()     → useWindowDimensions()
window.visualViewport   → Keyboard API
localStorage            → expo-secure-store
fetch()                 → fetch() ✓ (same)
```

---

_Document version: 1.0 — March 2026_
_Project: Goal Tracker — apps/mobile migration from apps/web_
