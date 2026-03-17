# Goal Tracker: React Native Migration Guide

**PWA → React Native App (apps/mobile/) in Existing Monorepo**
_Definitive strategy, tooling, implementation roadmap, and best practices_

---

## Table of Contents

1. [Executive Summary & Feasibility](#1-executive-summary--feasibility)
2. [Code Reusability Analysis](#2-code-reusability-analysis)
3. [Technology Decisions](#3-technology-decisions)
4. [Monorepo Setup](#4-monorepo-setup)
5. [Phase-by-Phase Implementation Plan](#5-phase-by-phase-implementation-plan)
6. [Component Migration Map](#6-component-migration-map)
7. [Styling System Migration](#7-styling-system-migration)
8. [Authentication Migration (Auth0)](#8-authentication-migration-auth0)
9. [Navigation Migration](#9-navigation-migration)
10. [Gesture & Animation Migration](#10-gesture--animation-migration)
11. [Screen Implementation Examples](#11-screen-implementation-examples)
12. [Best Practices](#12-best-practices)
13. [Recommended Libraries](#13-recommended-libraries)
14. [MCP Servers & AI Tooling](#14-mcp-servers--ai-tooling)
15. [AI Agents, Skills & Prompts](#15-ai-agents-skills--prompts)
16. [Testing Strategy](#16-testing-strategy)
17. [CI/CD & Deployment](#17-cicd--deployment)
18. [Risk Register](#18-risk-register)
19. [Definition of Done](#19-definition-of-done)
20. [Quick Reference Cheatsheet](#20-quick-reference-cheatsheet)

---

## 1. Executive Summary & Feasibility

### Current State

- **Project**: Goal Tracker PWA
- **Tech Stack**: React 18 + Vite + Tailwind CSS v4 + Express + Prisma + PostgreSQL
- **Total LOC**: ~23,000 lines
- **Components**: 60+ React components
- **Features**: Goal hierarchy, task management, calendar planner with drag-drop timeline, progress tracking

### Verdict: **HIGH FEASIBILITY**

| Factor                            | Assessment                                                               |
| --------------------------------- | ------------------------------------------------------------------------ |
| Backend (Express + Prisma)        | ✅ **Zero changes needed** — clean REST API with JWT auth                |
| State management (Contexts)       | ✅ **Fully reusable** — React Context works identically in RN            |
| Data models (`types.ts`)          | ✅ **100% portable** — pure TypeScript interfaces                        |
| Shared utils (`packages/shared/`) | ✅ **100% portable** — no DOM dependencies                               |
| API client (`api.ts`)             | ✅ **~90% portable** — only `import.meta.env` must change                |
| Business logic                    | ✅ **Fully portable** — no DOM coupling in contexts/services             |
| UI components                     | ⚠️ **Full rewrite** — Radix/Tailwind/shadcn must be replaced             |
| Routing                           | ⚠️ **Full rewrite** — `react-router-dom` → `expo-router`                 |
| Auth SDK                          | ⚠️ **SDK swap** — `@auth0/auth0-react` → `react-native-auth0`            |
| Animations                        | ⚠️ **Rewrite** — Framer Motion → `react-native-reanimated` v3            |
| Styling                           | ⚠️ **Adaptable** — TailwindCSS → NativeWind v4 (keeps class name syntax) |

### Effort Estimate

| Layer                                  | Effort                   |
| -------------------------------------- | ------------------------ |
| Project scaffolding & monorepo setup   | ~1–2 days                |
| Navigation & auth integration          | ~2–3 days                |
| Core screens (Dashboard, Goals, Tasks) | ~5–7 days                |
| Planner + Timeline (most complex)      | ~5–8 days                |
| Sheets, modals, form components        | ~3–4 days                |
| Polish, theming, testing               | ~3–5 days                |
| **Total**                              | **~3–5 developer weeks** |

---

## 2. Code Reusability Analysis

### By Asset

| Asset                          | Location                                | Reusability | Notes                                       |
| ------------------------------ | --------------------------------------- | ----------- | ------------------------------------------- |
| Express REST API               | `apps/api/`                             | 100%        | No changes needed                           |
| Prisma schema & DB             | `apps/api/prisma/`                      | 100%        | No changes needed                           |
| TypeScript interfaces          | `apps/web/src/types.ts`                 | 100%        | Move to `packages/shared/`                  |
| Shared date utils              | `packages/shared/`                      | 100%        | Pure TS, no DOM                             |
| GoalContext                    | `apps/web/src/contexts/GoalContext.tsx` | 100%        | Copy directly                               |
| TaskContext                    | `apps/web/src/contexts/TaskContext.tsx` | 100%        | Copy directly                               |
| API client logic               | `apps/web/src/api.ts`                   | 90%         | Replace `import.meta.env`                   |
| Auth token provider pattern    | `apps/web/src/api.ts`                   | 90%         | Same design, different SDK                  |
| `useKeyboardHeight.ts`         | `apps/web/src/hooks/`                   | 0%          | Replace with RN `Keyboard` API              |
| `useMediaQuery.ts`             | `apps/web/src/hooks/`                   | 0%          | Replace with `useWindowDimensions()`        |
| `useTouchHandlers.ts`          | `apps/web/src/hooks/`                   | 0%          | Replace with `react-native-gesture-handler` |
| All `components/ui/*` (shadcn) | `apps/web/src/components/ui/`           | 0%          | Replace with RN Paper / custom              |
| All sheet components (vaul)    | `apps/web/src/components/`              | 0%          | Replace with `@gorhom/bottom-sheet`         |
| All TailwindCSS classes        | Throughout web app                      | ~80%        | NativeWind v4 keeps most class names        |
| CSS custom properties          | `apps/web/src/styles/`                  | 0%          | Convert to JS theme object                  |
| Routing (`App.tsx`)            | `apps/web/src/App.tsx`                  | 0%          | Replace with Expo Router                    |
| Recharts                       | `apps/web/`                             | 0%          | Replace with `victory-native`               |

### By LOC

| Layer                       | Current LOC | Reusable LOC | %        |
| --------------------------- | ----------- | ------------ | -------- |
| Backend (API)               | 3,000       | 3,000        | 100%     |
| API Client                  | 320         | 288          | 90%      |
| Utilities                   | 500         | 400          | 80%      |
| State Management (Contexts) | 250         | 250          | 100%     |
| UI Components               | 5,353       | 0            | 0%       |
| Styling                     | 12,093      | 0            | 0%       |
| Screens                     | 1,500       | 150          | 10%      |
| Navigation                  | 200         | 0            | 0%       |
| **TOTAL**                   | **~23,200** | **~4,100**   | **~18%** |

> **Note**: The 18% pure code reuse understates the real picture. Business logic, data flow patterns, API shapes, and state management design all carry over. With NativeWind v4, ~80% of Tailwind classes map directly too.

---

## 3. Technology Decisions

### Core Stack

| Layer             | Technology                      | Why (over alternatives)                                                                                                                                                    |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**     | Expo SDK 53                     | Managed RN — cloud builds (EAS), OTA updates, 95% native module coverage. No Xcode/Android Studio for basic dev.                                                           |
| **Routing**       | Expo Router v4                  | File-based routing maps 1:1 to existing `pages/` structure. Deep linking & web URLs built-in. Preferred over manual React Navigation setup.                                |
| **Styling**       | NativeWind v4                   | Keeps Tailwind class name syntax — massive migration speed advantage. Preferred over raw `StyleSheet.create()` or Tamagui (which would require rewriting the web app too). |
| **State**         | React Context (as-is)           | GoalContext + TaskContext work identically in RN. No need to switch to Zustand — avoids unnecessary rewrite.                                                               |
| **Animations**    | react-native-reanimated v3      | 60fps worklet-based. Direct replacement for Framer Motion.                                                                                                                 |
| **Gestures**      | react-native-gesture-handler v2 | Required for timeline drag-and-drop. Pairs with Reanimated.                                                                                                                |
| **Sheets**        | @gorhom/bottom-sheet v5         | Industry standard RN bottom sheet. Replaces `vaul`.                                                                                                                        |
| **UI Components** | react-native-paper v5           | Material Design components for inputs, buttons, checkboxes. Fills shadcn/Radix gap.                                                                                        |
| **Auth**          | react-native-auth0 v3           | Same `useAuth0()` hook API as web SDK. Easiest migration path.                                                                                                             |
| **Charts**        | victory-native                  | Skia-based, replaces recharts. More powerful than react-native-gifted-charts.                                                                                              |
| **Build**         | EAS Build + EAS Update          | Cloud builds for iOS/Android. OTA JS updates bypass App Store review.                                                                                                      |

### Rejected Alternatives (with reasoning)

| Alternative                         | Why Rejected                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tamagui + Next.js universal app** | Would require rewriting the existing Vite web app to Next.js. The user wants `apps/mobile/` alongside existing `apps/web/` — not a replacement. |
| **Turborepo**                       | Already using pnpm workspaces. Adding Turborepo for one new app is overkill.                                                                    |
| **Zustand**                         | React Context works perfectly in RN. Switching state management adds migration work with no benefit.                                            |
| **Bare React Native CLI**           | Requires local Xcode/Android Studio, manual `pod install`, no OTA updates. Expo solves all of this.                                             |
| **Solito**                          | Universal navigation bridge for Next.js + RN. Not needed since we're keeping web and mobile separate.                                           |
| **Raw StyleSheet.create()**         | Works but means converting every Tailwind class to inline JS styles. NativeWind v4 avoids this entirely.                                        |

---

## 4. Monorepo Setup

### Target Structure

```
goal-tracker/
├── apps/
│   ├── api/          ← Backend (unchanged)
│   ├── web/          ← Existing React PWA (unchanged, stays live)
│   └── mobile/       ← NEW: React Native / Expo app
│       ├── app/      ← Expo Router file-based routes
│       │   ├── _layout.tsx
│       │   ├── (auth)/
│       │   │   ├── login.tsx
│       │   │   └── callback.tsx
│       │   └── (app)/
│       │       ├── _layout.tsx
│       │       ├── index.tsx         ← Dashboard
│       │       ├── goals/
│       │       │   ├── index.tsx     ← Goals list
│       │       │   └── [goalId].tsx  ← Goal detail
│       │       ├── tasks.tsx         ← Tasks
│       │       └── planner.tsx       ← Planner
│       ├── src/
│       │   ├── components/
│       │   │   ├── cards/
│       │   │   ├── forms/
│       │   │   ├── sheets/
│       │   │   └── common/
│       │   ├── contexts/      ← Copy from web (GoalContext, TaskContext)
│       │   ├── hooks/
│       │   ├── theme/
│       │   └── api.ts         ← Adapted from web
│       ├── metro.config.js
│       ├── tailwind.config.js
│       ├── app.json
│       ├── eas.json
│       └── package.json
└── packages/
    └── shared/       ← Types + utils shared by all three apps
```

### Step 1: Move Shared Types to `packages/shared/`

```
packages/shared/src/
  index.ts
  types/
    index.ts          ← Move apps/web/src/types.ts here
  utils/
    dateUtils.ts      ← Already here
```

Update exports:

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './utils/dateUtils';
```

Keep backward compatibility:

```typescript
// apps/web/src/types.ts
export * from '@goal-tracker/shared';
```

### Step 2: Create `apps/mobile/`

```bash
cd apps
npx create-expo-app mobile --template expo-template-blank-typescript
```

### Step 3: Configure Metro for Monorepo

```javascript
// apps/mobile/metro.config.js
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

### Step 4: Configure TypeScript Paths

```json
// apps/mobile/tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "paths": {
      "@goal-tracker/shared": ["../../packages/shared/src"]
    }
  }
}
```

### Step 5: Root `package.json` Scripts

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

### Step 6: Validation

App launches successfully, shows blank screen, `packages/shared/` types import correctly in Metro bundler.

---

## 5. Phase-by-Phase Implementation Plan

### Phase 0: Foundation (Days 1–2)

- [ ] Scaffold `apps/mobile/` with Expo Router template
- [ ] Configure Metro for monorepo (pnpm workspaces)
- [ ] Move `types.ts` to `packages/shared/`
- [ ] Install and configure NativeWind v4
- [ ] Set up the theme (colors, fonts, border radii)
- [ ] Set up EAS Build (`eas.json`)
- [ ] Create `.env` files for mobile with API URL
- [ ] Verify `packages/shared/` imports work in Metro

**Validation**: App launches, shared types import correctly.

---

### Phase 1: Auth + Navigation Shell (Days 3–5)

- [ ] Install `react-native-auth0` + `expo-secure-store`
- [ ] Configure Auth0 dashboard (callback URLs, refresh token rotation)
- [ ] Create root `_layout.tsx` with Auth0Provider, GoalProvider, TaskProvider
- [ ] Create `(auth)/login.tsx` screen
- [ ] Create `(app)/_layout.tsx` with tab navigator (4 tabs: Home, Goals, Tasks, Planner)
- [ ] Port `ProtectedRoute` logic to `_layout.tsx` auth guard
- [ ] Adapt `api.ts` token provider for `react-native-auth0`
- [ ] Test login flow end-to-end on device

**Validation**: Can log in via Auth0, lands on dashboard (placeholder), bottom tabs work.

---

### Phase 2: Core Screens — Dashboard & Tasks (Days 6–10)

- [ ] Port `AchievementDashboardPage` → `app/(app)/index.tsx`
  - [ ] `TodayProgressCard` component
  - [ ] `DailyFocusList` component (RN FlatList)
  - [ ] `GoalsProgress` component
- [ ] Port `TasksPage` → `app/(app)/tasks.tsx`
  - [ ] Pagination with RN FlatList + onEndReached
  - [ ] Tab filter (Pending/Completed) with segmented control
  - [ ] Date filter via RN Modal + calendar
- [ ] Port `TaskCard` component
- [ ] Port `TaskEditSheet` → `@gorhom/bottom-sheet` based sheet
- [ ] Port `ConfirmDialog` → RN `Alert.alert()` or custom Modal

**Validation**: Can view, create, edit, complete, delete tasks.

---

### Phase 3: Goals (Days 11–14)

- [ ] Port `GoalsPage` → `app/(app)/goals/index.tsx`
  - [ ] Scope filter tabs (ALL/YEARLY/MONTHLY/WEEKLY/STANDALONE)
  - [ ] `GoalCard` component with gradient, progress bar
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

**Validation**: Full CRUD on goals, link tasks, add progress.

---

### Phase 4: Planner (Days 15–20) ⚠️ HIGHEST COMPLEXITY

This is the most complex screen due to the drag-and-drop timeline.

- [ ] Port `PlannerPage` → `app/(app)/planner.tsx`
  - [ ] Month view (custom RN grid, task dots on dates)
  - [ ] Day view toggle
- [ ] Rebuild `DailyTimelineView` in RN:
  - [ ] ScrollView with 24 "hour rows" (each `HOUR_HEIGHT=80` — larger for mobile touch targets)
  - [ ] Task blocks positioned with absolute coordinates
  - [ ] Drag-to-reschedule via `react-native-gesture-handler` + `react-native-reanimated`
  - [ ] Snap to 15-minute intervals
- [ ] Rebuild `UnscheduledTaskStrip` (horizontal FlatList)
- [ ] Port `RescheduleSheet`
- [ ] Port `TasksForDateSheet`
- [ ] **Fallback plan**: If drag-drop proves too complex, ship v1 with a simplified list view for the day planner and add drag-drop in v1.1

**Validation**: Month/day switching works, tasks render in timeline, drag reschedule works.

---

### Phase 5: Polish & Production (Days 21–28)

- [ ] Apply design system fully (fonts, colors, shadows, gradients)
- [ ] Responsive layout for tablets (iPad)
- [ ] Loading skeletons / shimmer effects
- [ ] Error states (network error, empty states, retry patterns)
- [ ] Accessibility pass (labels, roles, hints, 44x44pt touch targets)
- [ ] App icons and splash screen
- [ ] Deep linking configuration
- [ ] Testing (unit, component, E2E)
- [ ] Performance profiling on real devices (60fps target)
- [ ] EAS Build profiles (dev, preview, production)
- [ ] App Store / Google Play metadata
- [ ] Final QA on physical iOS + Android devices

**Validation**: Production-ready app submitted to TestFlight + Google Play Internal Testing.

---

## 6. Component Migration Map

### Navigation & Layout

| Web Component              | RN Replacement                        | Notes                                         |
| -------------------------- | ------------------------------------- | --------------------------------------------- |
| `TopNavBar.tsx`            | Expo Router Stack header config       | `screenOptions` in `_layout.tsx`              |
| `BottomNav.tsx`            | Expo Router `Tabs` component          | 4 tabs: Home, Goals, Tasks, Planner           |
| `ProtectedRoute.tsx`       | `(app)/_layout.tsx` auth check        | `useEffect` redirect if not `isAuthenticated` |
| `FloatingActionButton.tsx` | Custom `Pressable` + `LinearGradient` | Reanimated for glow animation                 |

### Sheets & Modals

| Web Component           | RN Replacement                | Key Differences                                       |
| ----------------------- | ----------------------------- | ----------------------------------------------------- |
| `TaskEditSheet.tsx`     | `@gorhom/bottom-sheet` + form | `TextInput` instead of `<input>`, RN `DateTimePicker` |
| `GoalEditSheet.tsx`     | `@gorhom/bottom-sheet`        | Same structure                                        |
| `AddProgressSheet.tsx`  | `@gorhom/bottom-sheet`        | Numeric `TextInput`                                   |
| `BulkTaskSheet.tsx`     | `@gorhom/bottom-sheet`        | RN `ScrollView` inside                                |
| `LinkTasksSheet.tsx`    | `@gorhom/bottom-sheet`        | `FlatList` for search results                         |
| `RescheduleSheet.tsx`   | `@gorhom/bottom-sheet`        | `@react-native-community/datetimepicker`              |
| `TasksForDateSheet.tsx` | `@gorhom/bottom-sheet`        | `FlatList` inside                                     |
| `ConfirmDialog.tsx`     | `Alert.alert()` or RN `Modal` | Use `Alert` for simple, `Modal` for complex           |

### Data Display

| Web Component                 | RN Replacement                     | Key Differences                                    |
| ----------------------------- | ---------------------------------- | -------------------------------------------------- |
| `GoalCard.tsx`                | `Pressable` + `LinearGradient`     | NativeWind classes + gradient background           |
| `TaskCard.tsx`                | `Pressable` with animated feedback | `Pressable` → `onPressIn`/`onPressOut` for haptics |
| `SquircleCard.tsx`            | Custom `View` with `borderRadius`  | `overflow: 'hidden'` + `borderRadius: 20`          |
| `GoalsProgress.tsx`           | `FlatList` or `ScrollView`         | `Animated.View` width for progress bar             |
| `TodayProgressCard.tsx`       | Native `View`                      | Animated circle via `react-native-progress`        |
| `DailyFocusList.tsx`          | `FlatList`                         | More performant than `.map()`                      |
| `ActivitiesListComponent.tsx` | `FlatList` with pagination         | `onEndReached` for infinite scroll                 |

### UI Primitives (shadcn/ui → RN)

| shadcn Component | RN Replacement                                              |
| ---------------- | ----------------------------------------------------------- |
| `Button`         | Custom `Pressable` or `react-native-paper` `Button`         |
| `Dialog`         | RN `Modal`                                                  |
| `Select`         | `@react-native-picker/picker` or custom bottom sheet picker |
| `Checkbox`       | `react-native-paper` `Checkbox`                             |
| `Badge`          | Custom `View` + `Text`                                      |
| `Avatar`         | `expo-image` or custom `View` + initials                    |
| `Progress`       | `View` with animated width                                  |
| `ScrollArea`     | RN `ScrollView` (built-in)                                  |
| `Accordion`      | Custom with `react-native-reanimated` layout animation      |
| `DropdownMenu`   | `@react-native-menu/menu` or custom Modal                   |

### Charts

| Web        | RN                                                            |
| ---------- | ------------------------------------------------------------- |
| `recharts` | `victory-native` (Skia-based) or `react-native-gifted-charts` |

---

## 7. Styling System Migration

### Strategy: NativeWind v4

NativeWind v4 brings Tailwind CSS syntax to React Native. Your existing Tailwind classes translate almost directly:

```tsx
// Web (Tailwind)
<div className="flex flex-row items-center p-4 rounded-2xl bg-white">

// React Native (NativeWind v4 — SAME CLASSES!)
<View className="flex-row items-center p-4 rounded-2xl bg-white">
```

### Platform Differences to Watch

| Web Tailwind                         | NativeWind Behavior                                                                |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| `flex` (default row in web)          | `flex-col` is default in RN — **always be explicit** with `flex-row` or `flex-col` |
| CSS custom properties `var(--color)` | Must convert to JS theme values in `tailwind.config.js`                            |
| `boxShadow`                          | Limited — use `shadow-*` NativeWind classes or platform-specific                   |
| `backdrop-blur`                      | Not supported in RN — remove blur glass effects                                    |
| `::before` / `::after`               | Not supported — remove grain texture overlay                                       |
| `hover:` pseudo-classes              | Not applicable on mobile — use `active:` for press states                          |

### Theme Config

Convert CSS variables from `apps/web/src/styles/design-system.css` to NativeWind config:

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
        'light-peach': '#ffeee5',
      },
      fontFamily: {
        display: ['Outfit_800ExtraBold'],
        body: ['PlusJakartaSans_400Regular'],
      },
      borderRadius: {
        'squircle-sm': 12,
        'squircle-md': 20,
        'squircle-lg': 32,
        'squircle-xl': 40,
      },
    },
  },
};
```

### Font Loading

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

### Gradient Helper (for GoalCard, FAB, etc.)

```bash
pnpm --filter mobile add react-native-linear-gradient
```

```typescript
// apps/mobile/src/theme/gradients.ts
export const gradients = {
  primary: ['#ff8c42', '#ff3e83'],
  subtle: ['rgba(255, 140, 66, 0.1)', 'rgba(255, 62, 131, 0.1)'],
  scopeColors: {
    YEARLY: ['#ff8c42', '#ff3e83'],
    MONTHLY: ['#ff3e83', '#ff6b9d'],
    WEEKLY: ['#ffb088', '#ffeee5'],
    STANDALONE: ['#6b7280', '#2a2a2a'],
  },
};
```

---

## 8. Authentication Migration (Auth0)

### Web vs. Mobile Comparison

|                | Web (`@auth0/auth0-react`) | Mobile (`react-native-auth0`)                         |
| -------------- | -------------------------- | ----------------------------------------------------- |
| OAuth flow     | Redirect in same tab       | Opens system browser (ASWebAuth / Chrome Custom Tabs) |
| Token storage  | Memory + `localStorage`    | `expo-secure-store` (Keychain/Keystore)               |
| Refresh tokens | Silent iframe              | Stored securely, explicit refresh                     |
| Hook           | `useAuth0()`               | `useAuth0()` (same API!)                              |

### Auth0 Dashboard Setup

1. Go to Auth0 Dashboard → Applications → Your App
2. Add to **Allowed Callback URLs**: `goaltracker://callback`
3. Add to **Allowed Logout URLs**: `goaltracker://`
4. Enable **Refresh Token Rotation** in Advanced Settings
5. Enable **Absolute Expiration** for refresh tokens

### Installation

```bash
pnpm --filter mobile add react-native-auth0 expo-secure-store
npx expo install expo-web-browser
```

### Root Layout with Auth

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

### Login Screen

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

### Adapting the Token Provider Pattern

The existing `setAuthTokenProvider()` pattern from `api.ts` works identically:

```typescript
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

| Web Route        | Expo Router File               | Notes                   |
| ---------------- | ------------------------------ | ----------------------- |
| `/login`         | `app/(auth)/login.tsx`         |                         |
| `/callback`      | `app/(auth)/callback.tsx`      | Auth0 deep link handler |
| `/`              | `app/(app)/index.tsx`          | Dashboard               |
| `/goals`         | `app/(app)/goals/index.tsx`    |                         |
| `/goals/:goalId` | `app/(app)/goals/[goalId].tsx` |                         |
| `/tasks`         | `app/(app)/tasks.tsx`          |                         |
| `/planner`       | `app/(app)/planner.tsx`        |                         |

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
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <CheckCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Deep Linking

```json
// apps/mobile/app.json
{
  "expo": {
    "scheme": "goaltracker",
    "ios": {
      "bundleIdentifier": "com.yourname.goaltracker",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourname.goaltracker",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#fff9f5"
      }
    }
  }
}
```

### Hook Migration: Navigation

```typescript
// Web                              → React Native (Expo Router)
import { useNavigate } from 'react-router-dom'  →  import { router } from 'expo-router'
navigate('/goals/123')              →  router.push('/goals/123')
navigate(-1)                        →  router.back()
import { useParams } from '...'    →  import { useLocalSearchParams } from 'expo-router'
const { goalId } = useParams()      →  const { goalId } = useLocalSearchParams()
```

---

## 10. Gesture & Animation Migration

### Framer Motion → Reanimated v3

| Framer Motion                                           | React Native Reanimated v3            |
| ------------------------------------------------------- | ------------------------------------- |
| `motion.div`                                            | `Animated.View`                       |
| `animate={{ x: 100 }}`                                  | `useSharedValue` + `useAnimatedStyle` |
| `drag` prop                                             | `PanGestureHandler` from RNGH         |
| Layout animations                                       | `Layout` prop from reanimated         |
| Spring physics                                          | `withSpring()`                        |
| `initial={{ opacity: 0 }}` + `animate={{ opacity: 1 }}` | `entering={FadeIn.duration(300)}`     |

### Daily Timeline Drag Implementation (Full Example)

```tsx
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const HOUR_HEIGHT = 80; // Larger for mobile touch targets
const SNAP_INTERVAL = HOUR_HEIGHT / 4; // 15-minute snaps

function DraggableTask({ task, onPositionChange }) {
  const startY = task.scheduledTime ? timeToPixels(task.scheduledTime) : 0;
  const translateY = useSharedValue(startY);
  const isDragging = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateY.value = startY + event.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      // Snap to 15-minute increments
      const snapped = Math.round(translateY.value / SNAP_INTERVAL) * SNAP_INTERVAL;
      translateY.value = withSpring(snapped);

      const minutes = Math.round((snapped / HOUR_HEIGHT) * 60);
      const newTime = minutesToTime(minutes);
      runOnJS(onPositionChange)(task.id, newTime);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value ? 1000 : 1,
    elevation: isDragging.value ? 8 : 2,
    opacity: isDragging.value ? 0.85 : 1,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskBlock, animatedStyle]}>
        <Text className="font-body text-deep-charcoal">{task.title}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

export function DailyTimelineView({ date }) {
  const { tasks, updateTaskFields } = useTaskContext();
  const todayTasks = tasks.filter((t) => isSameDay(new Date(t.scheduledDate), date));

  const handleTaskMove = async (taskId: string, newTime: string) => {
    await updateTaskFields(taskId, { scheduledTime: newTime });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timeline}>
        {/* Hour markers */}
        {Array.from({ length: 24 }, (_, i) => (
          <View key={i} style={styles.hourRow}>
            <Text style={styles.hourLabel}>{`${i}:00`}</Text>
            <View style={styles.hourLine} />
          </View>
        ))}

        {/* Draggable task blocks */}
        <View style={styles.tasksOverlay}>
          {todayTasks.map((task) => (
            <DraggableTask key={task.id} task={task} onPositionChange={handleTaskMove} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  timeline: { position: 'relative', minHeight: 24 * HOUR_HEIGHT },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  hourLabel: { width: 60, paddingHorizontal: 12, fontSize: 12, color: '#6b7280' },
  hourLine: { flex: 1 },
  tasksOverlay: { position: 'absolute', left: 60, right: 0, top: 0, bottom: 0 },
  taskBlock: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
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
// useMediaQuery.ts → useIsTablet.ts (RN version)
import { useWindowDimensions } from 'react-native';

export const useIsTablet = () => {
  const { width } = useWindowDimensions();
  return width >= 768;
};
```

---

## 11. Screen Implementation Examples

### Goals Screen (Full Reference Implementation)

```tsx
// apps/mobile/app/(app)/goals/index.tsx
import { View, FlatList } from 'react-native';
import { Searchbar, FAB } from 'react-native-paper';
import { router } from 'expo-router';
import { useGoalContext } from '../../src/contexts/GoalContext';
import { GoalCard } from '../../src/components/cards/GoalCard';
import { GoalEditSheet } from '../../src/components/sheets/GoalEditSheet';

export default function GoalsScreen() {
  const { goals, fetchGoals, loading } = useGoalContext();
  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const filteredGoals = goals.filter((g) => g.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <View className="flex-1 bg-peach-cream">
      <Searchbar
        placeholder="Search goals..."
        value={search}
        onChangeText={setSearch}
        className="mx-4 mt-4"
      />

      <FlatList
        data={filteredGoals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard goal={item} onPress={() => router.push(`/goals/${item.id}`)} />
        )}
        refreshing={loading}
        onRefresh={fetchGoals}
        contentContainerStyle={{ padding: 16 }}
        removeClippedSubviews
        maxToRenderPerBatch={10}
      />

      <FAB
        icon="plus"
        className="absolute right-4 bottom-4"
        style={{ backgroundColor: '#ff8c42' }}
        onPress={() => setSheetVisible(true)}
      />

      <GoalEditSheet visible={sheetVisible} onDismiss={() => setSheetVisible(false)} />
    </View>
  );
}
```

### GoalCard Component (Full Reference)

```tsx
// apps/mobile/src/components/cards/GoalCard.tsx
import { View, Text, Pressable } from 'react-native';
import { ProgressBar, IconButton, Menu } from 'react-native-paper';
import LinearGradient from 'react-native-linear-gradient';
import { gradients } from '../../theme/gradients';
import type { Goal } from '@goal-tracker/shared';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const GoalCard = ({ goal, onPress, onEdit, onDelete }: GoalCardProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const colors = gradients.scopeColors[goal.scope];
  const progress = goal.targetValue ? goal.currentValue / goal.targetValue : 0;

  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-squircle-md p-4 mb-3"
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-semibold text-white opacity-90">{goal.scope}</Text>
          {(onEdit || onDelete) && (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  iconColor="#fff"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              {onEdit && <Menu.Item onPress={onEdit} title="Edit" />}
              {onDelete && <Menu.Item onPress={onDelete} title="Delete" />}
            </Menu>
          )}
        </View>

        <Text className="text-lg font-bold text-white mb-1">{goal.title}</Text>
        {goal.description && (
          <Text className="text-sm text-white opacity-80 mb-3" numberOfLines={2}>
            {goal.description}
          </Text>
        )}

        <View className="mt-2">
          <ProgressBar
            progress={progress}
            color="#fff"
            style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' }}
          />
          <Text className="text-xs text-white mt-1 text-right">
            {goal.currentValue} / {goal.targetValue}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
};
```

---

## 12. Best Practices

### Component Design

**Use composition, not props drilling:**

```tsx
// ✅ Pass the whole object
<GoalCard goal={goal} onPress={handlePress} />

// ❌ Don't spread every field
<GoalCard title={goal.title} description={goal.description} currentValue={goal.currentValue} ... />
```

**Separate presentational and container logic when complexity warrants it:**

```tsx
// Presentational (pure render from props)
export const GoalCardView = ({ goal, onPress }: GoalCardViewProps) => (
  <Pressable onPress={onPress}>
    <Text>{goal.title}</Text>
  </Pressable>
);

// Container (data fetching + business logic)
export const GoalCard = ({ goalId }: { goalId: string }) => {
  const goal = useGoalContext().goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return <GoalCardView goal={goal} onPress={() => router.push(`/goals/${goalId}`)} />;
};
```

### Performance

**FlatList optimization for long lists:**

```tsx
<FlatList
  data={goals}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <GoalCard goal={item} />}
  removeClippedSubviews
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={21}
  // If item height is fixed:
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

**Memoization strategy:**

```tsx
// Memoize expensive calculations
const progressPercentage = useMemo(
  () => (goal.currentValue / goal.targetValue) * 100,
  [goal.currentValue, goal.targetValue]
);

// Memoize callbacks passed to children
const handlePress = useCallback(() => router.push(`/goals/${goal.id}`), [goal.id]);

// Memoize entire components when props rarely change
export const GoalCard = React.memo(
  ({ goal, onPress }: GoalCardProps) => {
    // ...
  },
  (prev, next) => prev.goal.id === next.goal.id && prev.goal.currentValue === next.goal.currentValue
);
```

### Error Handling

**User-facing error states pattern:**

```tsx
export default function GoalsScreen() {
  const { goals, loading, error, fetchGoals } = useGoalContext();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-peach-cream">
        <AlertCircle size={48} color="#ff3e83" />
        <Text className="text-deep-charcoal mt-4">{error}</Text>
        <Pressable onPress={fetchGoals} className="bg-energizing-orange rounded-2xl px-6 py-3 mt-4">
          <Text className="text-white font-body">Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && goals.length === 0) return <LoadingSpinner />;
  if (goals.length === 0) return <EmptyState message="No goals yet. Create your first goal!" />;

  return <FlatList data={goals} /* ... */ />;
}
```

**Network retry with exponential backoff:**

```typescript
export async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### Accessibility

- Use `accessible={true}` on interactive elements
- Provide `accessibilityLabel` for icons and images
- Use `accessibilityRole` to indicate element type
- Use `accessibilityHint` for complex interactions
- Ensure touch targets are at least **44×44 points**
- Test with VoiceOver (iOS) and TalkBack (Android)

```tsx
<Pressable
  accessible
  accessibilityLabel={`${goal.title} goal`}
  accessibilityRole="button"
  accessibilityHint="Opens goal details"
  onPress={handlePress}
>
  <GoalCardView goal={goal} />
</Pressable>
```

### Internationalization (Future — Optional)

```bash
pnpm --filter mobile add react-i18next i18next
```

```typescript
// apps/mobile/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { 'goals.title': 'Goals', 'goals.empty': 'No goals yet' } },
  },
  lng: 'en',
  fallbackLng: 'en',
});
```

---

## 13. Recommended Libraries

### Core

| Library                        | Version | Purpose                           |
| ------------------------------ | ------- | --------------------------------- |
| `expo`                         | ~53     | Expo SDK                          |
| `expo-router`                  | ~4      | File-based routing                |
| `nativewind`                   | ^4      | Tailwind CSS in RN                |
| `react-native-reanimated`      | ^3      | Animations (worklet-based, 60fps) |
| `react-native-gesture-handler` | ^2      | Touch gesture recognition         |
| `react-native-auth0`           | ^3      | Auth0 SDK                         |

### UI Components

| Library                             | Purpose                       |
| ----------------------------------- | ----------------------------- |
| `@gorhom/bottom-sheet` ^5           | Bottom sheets (replaces vaul) |
| `react-native-paper` ^5             | Material Design components    |
| `@expo/vector-icons` (included)     | Icon library                  |
| `expo-image` ~2                     | Optimized image component     |
| `react-native-safe-area-context` ^4 | Safe area handling            |
| `react-native-screens` ^3           | Native navigation screens     |
| `react-native-linear-gradient`      | Gradient backgrounds          |

### Forms & Inputs

| Library                                   | Purpose                         |
| ----------------------------------------- | ------------------------------- |
| `@react-native-community/datetimepicker`  | Native date/time picker         |
| `react-native-keyboard-aware-scroll-view` | Auto-scroll when keyboard opens |

### Charts & Data

| Library                 | Purpose                               |
| ----------------------- | ------------------------------------- |
| `victory-native`        | Skia-based charts (replaces recharts) |
| `react-native-progress` | Circular/bar progress indicators      |

### Storage & Platform

| Library                              | Purpose                     |
| ------------------------------------ | --------------------------- |
| `expo-secure-store`                  | Secure token storage        |
| `expo-constants`                     | App config / env vars       |
| `expo-font` + `@expo-google-fonts/*` | Font loading                |
| `expo-notifications`                 | Push notifications (future) |
| `expo-updates`                       | OTA updates                 |

### Dev Tools

| Library                         | Purpose                  |
| ------------------------------- | ------------------------ |
| `eas-cli`                       | EAS Build + Submit       |
| `expo-dev-client`               | Custom development build |
| `@testing-library/react-native` | Component testing        |
| `detox`                         | E2E testing (optional)   |

---

## 14. MCP Servers & AI Tooling

### Tier 1: Essential

| MCP Server                                    | Use Case                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **`@modelcontextprotocol/server-filesystem`** | Full codebase context for AI-assisted migration. Read existing web components to produce accurate RN conversions. |
| **`@modelcontextprotocol/server-github`**     | PR creation, branch management, code reviews during migration.                                                    |
| **`@modelcontextprotocol/server-fetch`**      | Fetch Expo/RN library docs on-demand for accurate API usage.                                                      |

### Tier 2: Highly Recommended

| MCP Server                                  | Use Case                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| **`@modelcontextprotocol/server-postgres`** | Inspect live PostgreSQL schema in AI context for correct query generation. |
| **`shadcn-mcp`** (already in workspace)     | Look up shadcn component patterns to find correct RN alternatives.         |
| **`expo-mcp`** (community)                  | EAS Build status, app store submission queries from editor.                |

### Tier 3: Nice-to-Have

| MCP Server                             | Use Case                                                         |
| -------------------------------------- | ---------------------------------------------------------------- |
| **`@modelcontextprotocol/server-git`** | Automated commits, branch management, merge conflict resolution. |
| **Sentry MCP**                         | Error tracking for the new RN app.                               |

### VS Code MCP Configuration

```json
// .vscode/settings.json
{
  "mcp": {
    "servers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "./"],
        "description": "Full codebase read access for migration context"
      },
      "postgres": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": { "POSTGRES_CONNECTION_STRING": "${env:DATABASE_URL}" },
        "description": "Read Prisma/postgres schema"
      },
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}" },
        "description": "GitHub API for PR management"
      }
    }
  }
}
```

---

## 15. AI Agents, Skills & Prompts

### Copilot Instructions for Mobile (add to `.github/copilot-instructions.md`)

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
- Use `className` prop (NativeWind) as primary styling method
- NEVER use `style={{ flex: 1, flexDirection: 'row' }}` — use NativeWind classes instead

### Sheet Pattern

```tsx
const bottomSheetRef = useRef<BottomSheetModal>(null);
// trigger: bottomSheetRef.current?.present()
<BottomSheetModal ref={bottomSheetRef} snapPoints={['50%', '90%']}>
  <BottomSheetView className="p-4">{/* content */}</BottomSheetView>
</BottomSheetModal>;
```

### Navigation

- Use `router.push('/goals/123')` not `navigate()`
- Use `useLocalSearchParams()` for route params
- Use `router.back()` not `history.goBack()`

### Env Variables

- Use `process.env.EXPO_PUBLIC_*` — NEVER `import.meta.env`
````

### Prompt Files

#### `.github/prompts/migrate-component.prompt.md`

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
- Keep the same props interface and business logic
- Add proper TypeScript types

The component to migrate:
${selection}
```

#### `.github/prompts/create-rn-sheet.prompt.md`

```markdown
---
mode: agent
description: Create a React Native bottom sheet component
---

Create a React Native bottom sheet using @gorhom/bottom-sheet v5.

Requirements:

- Use `BottomSheetModal` (not `BottomSheet`)
- Use `BottomSheetView` for content wrapper
- Export ref callback and `present()`/`dismiss()` control interface
- NativeWind styling with project theme colors
- Include form fields using `BottomSheetTextInput` where needed
- Handle keyboard avoiding via `keyboardBehavior="interactive"`

Sheet purpose: ${input:Purpose of the sheet}
Fields needed: ${input:List the form fields}
```

#### `.github/prompts/migrate-style.prompt.md`

```markdown
---
mode: agent
description: Convert Tailwind CSS classes to NativeWind for React Native
---

Convert this web component's Tailwind classes to NativeWind React Native classes.

Key differences:

- `flex` default is column in RN — always use explicit `flex-row` or `flex-col`
- Remove `hover:` pseudo-classes (not applicable on mobile)
- Remove `backdrop-blur` (not supported in RN)
- Replace CSS custom properties `var(--color)` with theme color names: `text-deep-charcoal`, `bg-peach-cream`, `bg-energizing-orange`
- Replace `<div>` → `<View>`, `<span>`/`<p>` → `<Text>`, `<input>` → `<TextInput>`
- Use `className` prop (NativeWind)

Component to convert:
${selection}
```

### Custom Skill: `react-native-component`

Create `.claude/skills/react-native-component/SKILL.md`:

````markdown
# React Native Component Generator

Generates React Native components for the Goal Tracker mobile app.

## Component Template

```tsx
import { View, Text, Pressable } from 'react-native';

interface ComponentNameProps {
  // Always define props interface
}

export const ComponentName = ({ ...props }: ComponentNameProps) => {
  // Hook order: useState → useContext → useEffect → useCallback → useMemo

  return (
    <View className="...nativewind classes...">
      <Text className="font-display text-deep-charcoal">...</Text>
    </View>
  );
};
```

## Constraints

- No HTML elements (`div`, `span`, `input`)
- No Framer Motion — use `react-native-reanimated`
- No `window.*` / `document.*` APIs
- Use `FlatList` for lists > 10 items
- Use `Pressable` not `TouchableOpacity`
- Use NativeWind `className` for styling
- All sheets use `@gorhom/bottom-sheet` `BottomSheetModal`
- Navigation: `router.push()` / `useLocalSearchParams()` from `expo-router`
````

### Migration Agents (Prompt Templates for Subagents)

**Style Migration Agent:**

> Convert Tailwind web component to NativeWind React Native. Map all CSS classes, use theme colors, handle flex direction default difference.

**Component Migration Agent:**

> Convert React web component using Radix/shadcn to React Native using react-native-paper + NativeWind. Map: `div→View`, `span→Text`, `button→Pressable`, `input→TextInput`. Keep business logic identical.

**Test Migration Agent:**

> Convert React Testing Library (web) test to `@testing-library/react-native`. Replace `screen.getByText` with `getByText` from render result. Replace `userEvent.click` with `fireEvent.press`.

---

## 16. Testing Strategy

### Test Pyramid

```
           /\
          /  \        E2E Tests (10%)
         /    \       - Login flow, create goal, complete task
        /------\
       /        \     Integration Tests (30%)
      /          \    - Component + context interactions
     /            \   - API mocking with MSW
    /--------------\
   /                \  Unit Tests (60%)
  /                  \ - Pure functions, custom hooks, business logic
 /--------------------\
```

### Tools

| Type        | Tool                            | Purpose                              |
| ----------- | ------------------------------- | ------------------------------------ |
| Unit        | Jest                            | Utilities, hooks, business logic     |
| Component   | `@testing-library/react-native` | Render + interaction testing         |
| E2E         | Detox                           | Full user flows on real devices      |
| Visual      | Storybook for React Native      | Component visual testing (optional)  |
| API Mock    | MSW (Mock Service Worker)       | Mock API responses                   |
| Performance | Flipper                         | Profile performance, memory, network |

### Coverage Goals

- **Unit Tests**: 80% coverage for utilities and business logic
- **Component Tests**: 60% coverage for UI components
- **E2E Tests**: 5–10 critical user flows

### Example Tests

**Unit Test:**

```typescript
import { formatLocalDate, parseLocalDate } from '@goal-tracker/shared';

describe('Date Utilities', () => {
  it('formats date correctly', () => {
    expect(formatLocalDate(new Date('2024-01-15'))).toBe('2024-01-15');
  });
});
```

**Component Test:**

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { GoalCard } from '../src/components/cards/GoalCard';

describe('GoalCard', () => {
  const mockGoal = {
    id: '1',
    title: 'Test Goal',
    scope: 'MONTHLY',
    targetValue: 100,
    currentValue: 50,
  };

  it('renders title', () => {
    const { getByText } = render(<GoalCard goal={mockGoal} />);
    expect(getByText('Test Goal')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GoalCard goal={mockGoal} onPress={onPress} />);
    fireEvent.press(getByText('Test Goal'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

**E2E Test (Detox):**

```typescript
describe('Goals Flow', () => {
  it('should create a new goal', async () => {
    await element(by.id('fab-add-goal')).tap();
    await element(by.id('input-goal-title')).typeText('New Goal');
    await element(by.id('button-save-goal')).tap();
    await expect(element(by.text('New Goal'))).toBeVisible();
  });
});
```

---

## 17. CI/CD & Deployment

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
```

### GitHub Actions Workflow

```yaml
# .github/workflows/mobile-build.yml
name: Mobile CI/CD

on:
  push:
    branches: [main]
    paths: ['apps/mobile/**', 'packages/shared/**']
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm --filter mobile test --coverage
      - run: pnpm --filter mobile type-check

  build:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: pnpm --filter mobile eas build --platform all --non-interactive --profile preview
```

### OTA Updates (JS-only changes)

```bash
# Skip App Store review for JS/asset changes
pnpm --filter mobile eas update --branch production --message "Fix timeline drag snap"
```

### Build Commands

```bash
# Development (requires dev client)
pnpm --filter mobile eas build --profile development --platform ios

# Preview (internal testing)
pnpm --filter mobile eas build --profile preview --platform all

# Production
pnpm --filter mobile eas build --profile production --platform all

# Submit to stores
pnpm --filter mobile eas submit --platform ios --latest
pnpm --filter mobile eas submit --platform android --latest
```

### Release Checklist

**Pre-Release:**

- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance profiling completed (60fps scroll/drag)
- [ ] Accessibility audit passed (VoiceOver + TalkBack)
- [ ] Privacy policy updated
- [ ] App store screenshots prepared (all device sizes)
- [ ] Beta testing completed (TestFlight / Internal Track)

**iOS:**

- [ ] App Store Connect app created
- [ ] Privacy declarations completed
- [ ] Screenshots uploaded
- [ ] Submit for review

**Android:**

- [ ] Google Play Console app created
- [ ] Content rating questionnaire completed
- [ ] Privacy policy link added
- [ ] Submit: internal → closed → production

### Post-Release Monitoring

| Metric           | Target     | Tool                             |
| ---------------- | ---------- | -------------------------------- |
| Crash-free rate  | >99%       | Sentry or Firebase Crashlytics   |
| App Store rating | >4.0 stars | App Store Connect / Play Console |
| API error rate   | <1%        | Backend logging                  |
| App launch time  | <2 seconds | Firebase Performance             |

---

## 18. Risk Register

| Risk                                        | Probability | Impact | Mitigation                                                                                                                                        |
| ------------------------------------------- | ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Metro monorepo symlink issues**           | High        | High   | Use explicit `watchFolders` and `nodeModulesPaths` in Metro config                                                                                |
| **DailyTimelineView complexity**            | High        | High   | Start with simplified list view, add drag-drop incrementally. Consider `react-native-draggable-flatlist` as fallback. Allocate 2× time (10 days). |
| **NativeWind v4 + Expo SDK compat**         | Medium      | High   | Pin NativeWind version, test with Expo SDK 53 specifically                                                                                        |
| **Auth0 redirect URI mismatch**             | Medium      | High   | Carefully configure `scheme` in app.json, test on physical device (simulators have networking quirks)                                             |
| **@gorhom/bottom-sheet keyboard**           | Medium      | Medium | Use `keyboardBehavior="interactive"`, test on both iOS/Android                                                                                    |
| **Tailwind flex direction default**         | High        | Low    | `flex-col` is default in RN (vs `flex-row` in web). Add ESLint rule flagging bare `flex` without direction.                                       |
| **Performance on low-end Android**          | Medium      | Medium | Test on real budget devices. Profile with Flipper. Use `removeClippedSubviews`, `React.memo`, `getItemLayout`.                                    |
| **Platform-specific bugs (iOS vs Android)** | Medium      | Medium | Test on both platforms continuously. Use `Platform.OS` when needed.                                                                               |
| **react-native-reanimated + Hermes**        | Low         | High   | Use version from Expo SDK compatibility matrix                                                                                                    |
| **Offline sync (if implemented)**           | Medium      | Medium | Use WatermelonDB with last-write-wins conflict resolution for v1                                                                                  |

---

## 19. Definition of Done

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
- [ ] All bottom sheets work correctly with keyboard on iOS and Android

### Quality

- [ ] No TypeScript errors (`pnpm --filter mobile type-check`)
- [ ] No crashes in Expo Go / dev build
- [ ] Tested on iOS 16+ (physical device or simulator)
- [ ] Tested on Android 12+ (physical device or emulator)
- [ ] 60fps scroll and drag performance
- [ ] Accessibility: all interactive elements labeled, 44×44pt touch targets
- [ ] 80%+ unit test coverage, 60%+ component test coverage

### Deployment

- [ ] `eas.json` configured for dev/preview/production
- [ ] GitHub Actions workflow builds on push to main
- [ ] App submitted to TestFlight (iOS) and Internal Testing (Android)
- [ ] Auth0 production credentials configured
- [ ] Post-release monitoring operational (crash reporting)

---

## 20. Quick Reference Cheatsheet

### Element Mapping

```
div           → View
span          → View (or Text for inline)
p / h1-h6     → Text
input         → TextInput
button        → Pressable (preferred)
img           → Image (or expo-image)
ul / li       → FlatList / SectionList
a             → Pressable + router.push()
form          → View + KeyboardAwareScrollView
textarea      → TextInput multiline={true}
```

### API / Platform Mapping

```
import.meta.env.VITE_*  → process.env.EXPO_PUBLIC_*
useNavigate()           → router.push() / router.back()
useParams()             → useLocalSearchParams()
window.matchMedia()     → useWindowDimensions()
window.visualViewport   → Keyboard API
localStorage            → expo-secure-store
fetch()                 → fetch() ✓ (same)
className="flex ..."    → className="flex-col ..." (RN default is column!)
```

### Library Mapping

```
react-router-dom        → expo-router
framer-motion           → react-native-reanimated v3
tailwindcss             → nativewind v4
vaul (drawers)          → @gorhom/bottom-sheet v5
@auth0/auth0-react      → react-native-auth0 v3
recharts                → victory-native
radix-ui + shadcn/ui    → react-native-paper v5 + custom
react-day-picker        → @react-native-community/datetimepicker
lucide-react            → lucide-react-native (or @expo/vector-icons)
```

---

_Document version: 2.0 — March 2026_
_Merged from: REACT-NATIVE-MIGRATION.md + PWA-TO-REACT-NATIVE-MIGRATION.md_
_Project: Goal Tracker — apps/mobile in existing monorepo_
