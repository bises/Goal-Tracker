# Goal Tracker: PWA to React Native Migration Guide

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Feasibility Assessment](#feasibility-assessment)
3. [Migration Strategies](#migration-strategies)
4. [Recommended Approach](#recommended-approach)
5. [Technology Stack for React Native](#technology-stack-for-react-native)
6. [Phase-by-Phase Migration Plan](#phase-by-phase-migration-plan)
7. [MCP Servers & Tools](#mcp-servers--tools)
8. [Best Practices](#best-practices)
9. [Code Reusability Matrix](#code-reusability-matrix)
10. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

### Current State
- **Project**: Goal Tracker PWA
- **Tech Stack**: React 18 + Vite + Tailwind CSS + Express + PostgreSQL
- **Total LOC**: ~20,000 lines
- **Components**: 60+ React components
- **Features**: Goal hierarchy, task management, calendar, progress tracking

### Conversion Feasibility: ✅ VIABLE
**Recommended Timeline**: 4-6 weeks (1 developer)
**Code Reusability**: ~20% (API client, business logic, utilities)
**Effort Level**: Medium-High (major UI rewrite, minimal backend changes)

### Key Findings
- ✅ Well-structured codebase with clear separation of concerns
- ✅ Backend API requires ZERO changes
- ✅ Business logic is framework-agnostic
- ⚠️ UI components must be 100% rewritten (Radix UI → React Native components)
- ⚠️ Styling system needs complete overhaul (Tailwind → StyleSheet)
- ⚠️ Complex features (drag-drop timeline) require significant rework

---

## Feasibility Assessment

### ✅ What Can Be Reused (20% of codebase)

#### 1. Backend API (100% reusable)
```
apps/api/
├── prisma/              ✅ No changes needed
├── src/routes/          ✅ All endpoints remain identical
├── src/services/        ✅ Business logic unchanged
└── src/middleware/      ✅ Auth middleware works as-is
```

#### 2. API Client & Business Logic (90% reusable)
```typescript
// apps/web/src/utils/api.ts
// Only needs authentication token retrieval updated

// Current (Auth0 web)
const token = await getAccessTokenSilently()

// React Native (Auth0 RN)
const credentials = await auth0.credentials.getAccessToken()
const token = credentials.accessToken
```

#### 3. Shared Utilities (80% reusable)
```typescript
// packages/shared/utils/
- dateUtils.ts           ✅ 100% reusable
- formatters.ts          ✅ 100% reusable
- validation.ts          ✅ 100% reusable
```

#### 4. TypeScript Interfaces (100% reusable)
```typescript
// All type definitions work identically
interface Goal { /* ... */ }
interface Task { /* ... */ }
interface Progress { /* ... */ }
```

### ❌ What Must Be Rewritten (80% of codebase)

#### 1. All UI Components (0% reusable)
**Reason**: Web-specific libraries (Radix UI, shadcn/ui) have no React Native equivalent

| Current (Web) | React Native Alternative |
|---------------|--------------------------|
| shadcn/ui Button | React Native Paper Button |
| Radix Dialog | react-native-modal |
| Radix Dropdown | react-native-paper Menu |
| vaul (Drawer) | @gorhom/bottom-sheet |
| HTML divs/spans | View, Text, ScrollView |

#### 2. Entire Styling System (0% reusable)
**Reason**: Tailwind CSS doesn't work with React Native

```diff
- // Current (Tailwind)
- <View className="flex items-center gap-4 px-3 py-2 bg-peach-cream">

+ // React Native (StyleSheet)
+ <View style={styles.container}>
+ const styles = StyleSheet.create({
+   container: {
+     flexDirection: 'row',
+     alignItems: 'center',
+     gap: 16,
+     paddingHorizontal: 12,
+     paddingVertical: 8,
+     backgroundColor: '#fff9f5'
+   }
+ })
```

#### 3. Routing & Navigation (0% reusable)
```diff
- // Current (React Router)
- import { BrowserRouter, Routes, Route } from 'react-router-dom'

+ // React Native (React Navigation)
+ import { NavigationContainer } from '@react-navigation/native'
+ import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
```

#### 4. Complex Features Requiring Redesign

##### DailyTimelineView (31,568 LOC - CRITICAL)
**Current**: Canvas-based drag-drop with pixel calculations
**Challenge**: React Native requires different gesture handling approach

**Conversion Strategy**:
```typescript
// Current: DOM-based drag events
onMouseDown={(e) => {
  const y = e.clientY - rect.top
  const minutes = Math.round((y / PIXELS_PER_HOUR) * 60)
}}

// React Native: Gesture Handler + Reanimated
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'

const pan = Gesture.Pan()
  .onUpdate((event) => {
    translateY.value = event.translationY
  })
```

**Recommended Library**: `react-native-gesture-handler` + `react-native-reanimated`

##### Animations (Framer Motion → Reanimated)
```diff
- // Current (Framer Motion)
- <motion.div
-   initial={{ opacity: 0 }}
-   animate={{ opacity: 1 }}
-   transition={{ duration: 0.3 }}
- >

+ // React Native (Reanimated)
+ <Animated.View
+   entering={FadeIn.duration(300)}
+   exiting={FadeOut.duration(300)}
+ >
```

---

## Migration Strategies

### Strategy 1: Big Bang Rewrite (NOT RECOMMENDED)
**Description**: Rewrite entire app from scratch
**Timeline**: 4-6 weeks
**Pros**: Clean slate, optimal architecture
**Cons**: High risk, no fallback, long delivery time

### Strategy 2: Gradual Migration (RECOMMENDED)
**Description**: Port features incrementally, maintain both codebases
**Timeline**: 8-12 weeks (with parallel maintenance)
**Pros**: Lower risk, continuous delivery, A/B testing possible
**Cons**: Requires managing two codebases temporarily

### Strategy 3: Shared Codebase with Expo + Next.js (OPTIMAL)
**Description**: Use Expo + Next.js universal app architecture
**Timeline**: 6-8 weeks initial, long-term maintainable
**Pros**:
- Share 50-70% of code between web and mobile
- Single codebase for both platforms
- Unified component library (Tamagui, NativeWind)
**Cons**:
- Learning curve for universal patterns
- Some platform-specific code still needed

---

## Recommended Approach

### 🏆 **OPTIMAL: Expo + Tamagui Universal App**

This approach allows you to share significantly more code between web and mobile.

#### Architecture Overview
```
goal-tracker-universal/
├── apps/
│   ├── expo/           # React Native app (iOS + Android)
│   ├── next/           # Next.js app (Web)
│   └── api/            # Express API (unchanged)
├── packages/
│   ├── app/            # Shared UI logic (screens, navigation)
│   ├── ui/             # Shared component library (Tamagui)
│   └── api-client/     # Shared API client
└── turbo.json          # Turborepo for monorepo orchestration
```

#### Why This Approach?

1. **Code Sharing**: 60-70% code reuse vs 20% with separate apps
2. **Unified Design System**: Single component library works on both platforms
3. **Faster Development**: Write once, run everywhere
4. **Better Maintainability**: Single source of truth for business logic
5. **Future-Proof**: Easy to add new platforms (Windows, macOS)

#### Technology Decisions

| Layer | Technology | Why |
|-------|-----------|-----|
| **UI Framework** | Tamagui | Universal components (web + native), styled-components API |
| **Styling** | Tamagui + NativeWind | Write Tailwind-like classes, work on both platforms |
| **Navigation** | Solito | Universal navigation (Next.js + React Navigation) |
| **State Management** | Zustand | Simpler than Context API, same API on both platforms |
| **Forms** | React Hook Form | Works identically on web and native |
| **Animations** | Moti | Unified animation API built on Reanimated |
| **Build Tool** | Turborepo | Efficient monorepo builds |

---

## Technology Stack for React Native

### Core Framework
```json
{
  "expo": "^52.0.0",                    // Managed React Native platform
  "react-native": "0.76.0",             // RN runtime
  "expo-router": "^4.0.0"               // File-based routing
}
```

### UI Component Library (Choose One)

#### Option 1: Tamagui (RECOMMENDED for universal app)
```bash
npm install tamagui @tamagui/config
```
**Pros**: Universal (web + native), excellent performance, styled-components API
**Cons**: Learning curve, newer library

#### Option 2: React Native Paper (RECOMMENDED for RN-only)
```bash
npm install react-native-paper
```
**Pros**: Material Design, well-documented, large community
**Cons**: Web support limited

#### Option 3: NativeBase
```bash
npm install native-base
```
**Pros**: Comprehensive components, themeable
**Cons**: Bundle size, performance issues with large lists

### Essential Libraries

#### Navigation
```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
expo install react-native-screens react-native-safe-area-context
```

#### Animations
```bash
npm install react-native-reanimated react-native-gesture-handler
```

#### Forms & Input
```bash
npm install react-hook-form react-native-paper-dates
```

#### Date Handling
```bash
npm install date-fns  # Already in use, works identically
```

#### Authentication
```bash
npm install react-native-auth0
```

#### Local Database (Offline-First)
```bash
npm install @nozbe/watermelondb
# OR
npm install realm
```

#### Bottom Sheets & Modals
```bash
npm install @gorhom/bottom-sheet react-native-modal
```

#### Charts (for progress visualization)
```bash
npm install react-native-svg react-native-chart-kit
# OR
npm install victory-native  # More powerful but larger
```

#### Notifications
```bash
expo install expo-notifications
# OR
npm install @react-native-firebase/messaging  # For Firebase
```

---

## Phase-by-Phase Migration Plan

### Phase 0: Preparation (Week 1)
**Objective**: Set up React Native project structure and tooling

#### Tasks
1. **Initialize Expo Project**
   ```bash
   npx create-expo-app goal-tracker-mobile --template tabs
   cd goal-tracker-mobile
   ```

2. **Set Up Monorepo Structure**
   ```bash
   # In root directory
   pnpm init

   # Update pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'

   # Move expo app to apps/mobile
   mv goal-tracker-mobile apps/mobile
   ```

3. **Install Core Dependencies**
   ```bash
   cd apps/mobile
   pnpm install react-native-paper react-navigation/native
   expo install react-native-screens react-native-safe-area-context
   pnpm install react-native-reanimated react-native-gesture-handler
   ```

4. **Set Up Shared Package**
   ```bash
   mkdir -p packages/api-client
   # Copy apps/web/src/utils/api.ts to packages/api-client/src/
   ```

5. **Configure TypeScript Paths**
   ```json
   // apps/mobile/tsconfig.json
   {
     "extends": "expo/tsconfig.base",
     "compilerOptions": {
       "paths": {
         "@goal-tracker/api-client": ["../../packages/api-client/src"],
         "@goal-tracker/shared": ["../../packages/shared/src"]
       }
     }
   }
   ```

**Deliverable**: Working React Native dev environment with "Hello World"

---

### Phase 1: Foundation (Week 1-2)
**Objective**: Establish core infrastructure and design system

#### 1.1 Design System Translation
**File**: `apps/mobile/src/theme/index.ts`

```typescript
import { MD3LightTheme, configureFonts } from 'react-native-paper'

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Translate CSS variables to RN theme
    peachCream: '#fff9f5',
    energizingOrange: '#ff8c42',
    electricPink: '#ff3e83',
    softCoral: '#ffb088',
    warmRose: '#ff6b9d',
    deepCharcoal: '#2a2a2a',
    warmGray: '#6b6b6b',
    lightPeach: '#ffeee5',

    primary: '#ff8c42',
    secondary: '#ff3e83',
    background: '#fff9f5',
    surface: '#ffffff',
  },
  fonts: configureFonts({
    config: {
      displayLarge: {
        fontFamily: 'Outfit-Bold',
        fontSize: 36,
      },
      displayMedium: {
        fontFamily: 'Outfit-SemiBold',
        fontSize: 30,
      },
      bodyLarge: {
        fontFamily: 'PlusJakartaSans-Regular',
        fontSize: 16,
      },
    },
  }),
  roundness: 20,  // Squircle approximation
}

// Gradient helper (react-native-linear-gradient)
export const gradients = {
  primary: ['#ff8c42', '#ff3e83'],
  subtle: ['rgba(255, 140, 66, 0.1)', 'rgba(255, 62, 131, 0.1)'],
}
```

#### 1.2 Set Up Navigation Structure
**File**: `apps/mobile/src/navigation/index.tsx`

```typescript
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { MaterialCommunityIcons } from '@expo/vector-icons'

const Tab = createBottomTabNavigator()

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.warmGray,
        }}
      >
        <Tab.Screen
          name="Planner"
          component={PlannerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="calendar-month" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="checkbox-marked-circle" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Goals"
          component={GoalsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="target" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
```

#### 1.3 Migrate API Client
**File**: `packages/api-client/src/index.ts`

```typescript
import { Auth0 } from 'react-native-auth0'

const auth0 = new Auth0({
  domain: 'YOUR_AUTH0_DOMAIN',
  clientId: 'YOUR_CLIENT_ID',
})

async function getAuthToken() {
  try {
    const credentials = await auth0.credentialsManager.getCredentials()
    return credentials.accessToken
  } catch (error) {
    // Handle token refresh or re-authentication
    const credentials = await auth0.webAuth.authorize({
      scope: 'openid profile email offline_access',
    })
    return credentials.accessToken
  }
}

export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = await getAuthToken()
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return response.json()
  },

  // Goals
  goals: {
    list: () => api.fetch('/api/goals'),
    create: (goal: CreateGoalDto) => api.fetch('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    }),
    update: (id: string, goal: UpdateGoalDto) => api.fetch(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    }),
    delete: (id: string) => api.fetch(`/api/goals/${id}`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    list: () => api.fetch('/api/tasks'),
    // ... other methods
  },
}
```

#### 1.4 Set Up State Management
**File**: `apps/mobile/src/store/index.ts`

```typescript
import create from 'zustand'
import { api } from '@goal-tracker/api-client'

interface GoalStore {
  goals: Goal[]
  loading: boolean
  error: string | null

  fetchGoals: () => Promise<void>
  addGoal: (goal: CreateGoalDto) => Promise<void>
  updateGoal: (id: string, goal: UpdateGoalDto) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null })
    try {
      const goals = await api.goals.list()
      set({ goals, loading: false })
    } catch (error) {
      set({ error: error.message, loading: false })
    }
  },

  addGoal: async (goal) => {
    try {
      const newGoal = await api.goals.create(goal)
      set({ goals: [...get().goals, newGoal] })
    } catch (error) {
      set({ error: error.message })
    }
  },

  updateGoal: async (id, updates) => {
    try {
      const updated = await api.goals.update(id, updates)
      set({
        goals: get().goals.map(g => g.id === id ? updated : g)
      })
    } catch (error) {
      set({ error: error.message })
    }
  },

  deleteGoal: async (id) => {
    try {
      await api.goals.delete(id)
      set({ goals: get().goals.filter(g => g.id !== id) })
    } catch (error) {
      set({ error: error.message })
    }
  },
}))

// Similarly create useTaskStore
```

**Deliverables**:
- ✅ Theme system with design tokens
- ✅ Navigation structure
- ✅ API client connected to backend
- ✅ State management set up

---

### Phase 2: Core Components (Week 2-3)
**Objective**: Build reusable UI components

#### Priority Component List

##### 2.1 Basic Components
1. **SquircleCard** (1 day)
   ```typescript
   // apps/mobile/src/components/SquircleCard.tsx
   import { View, StyleSheet } from 'react-native'
   import { Surface } from 'react-native-paper'

   export function SquircleCard({ children, variant = 'default' }) {
     return (
       <Surface style={[styles.card, styles[variant]]} elevation={2}>
         {children}
       </Surface>
     )
   }

   const styles = StyleSheet.create({
     card: {
       borderRadius: 20,  // Approximates squircle
       padding: 16,
       backgroundColor: '#fff',
     },
     default: {
       borderWidth: 1,
       borderColor: 'rgba(255, 140, 66, 0.2)',
     },
     compact: {
       padding: 12,
     },
   })
   ```

2. **GoalCard** (2 days)
   ```typescript
   // apps/mobile/src/components/GoalCard.tsx
   import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
   import { ProgressBar, IconButton, Menu } from 'react-native-paper'
   import LinearGradient from 'react-native-linear-gradient'

   interface GoalCardProps {
     goal: Goal
     onPress?: () => void
     onEdit?: () => void
     onDelete?: () => void
     variant?: 'default' | 'compact'
   }

   export function GoalCard({ goal, onPress, onEdit, onDelete, variant = 'default' }: GoalCardProps) {
     const [menuVisible, setMenuVisible] = useState(false)

     const scopeColors = {
       YEARLY: { gradient: ['#ff8c42', '#ff3e83'], border: '#ff8c42' },
       MONTHLY: { gradient: ['#ff3e83', '#ff6b9d'], border: '#ff3e83' },
       WEEKLY: { gradient: ['#ffb088', '#ffeee5'], border: '#ffb088' },
       STANDALONE: { gradient: ['#6b6b6b', '#2a2a2a'], border: '#6b6b6b' },
     }

     const colors = scopeColors[goal.scope]
     const progress = goal.currentValue / goal.targetValue

     return (
       <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
         <LinearGradient
           colors={colors.gradient}
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={styles.card}
         >
           <View style={styles.header}>
             <Text style={styles.scope}>{goal.scope}</Text>
             <Menu
               visible={menuVisible}
               onDismiss={() => setMenuVisible(false)}
               anchor={
                 <IconButton
                   icon="dots-vertical"
                   size={20}
                   onPress={() => setMenuVisible(true)}
                 />
               }
             >
               <Menu.Item onPress={onEdit} title="Edit" />
               <Menu.Item onPress={onDelete} title="Delete" />
             </Menu>
           </View>

           <Text style={styles.title}>{goal.title}</Text>
           {goal.description && (
             <Text style={styles.description} numberOfLines={2}>
               {goal.description}
             </Text>
           )}

           <View style={styles.progressContainer}>
             <ProgressBar
               progress={progress}
               color="#fff"
               style={styles.progressBar}
             />
             <Text style={styles.progressText}>
               {goal.currentValue} / {goal.targetValue}
             </Text>
           </View>
         </LinearGradient>
       </TouchableOpacity>
     )
   }

   const styles = StyleSheet.create({
     card: {
       borderRadius: 20,
       padding: 16,
       marginBottom: 12,
     },
     header: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: 8,
     },
     scope: {
       fontSize: 12,
       fontWeight: '600',
       color: '#fff',
       opacity: 0.9,
     },
     title: {
       fontSize: 18,
       fontWeight: '700',
       color: '#fff',
       marginBottom: 4,
     },
     description: {
       fontSize: 14,
       color: '#fff',
       opacity: 0.8,
       marginBottom: 12,
     },
     progressContainer: {
       marginTop: 8,
     },
     progressBar: {
       height: 8,
       borderRadius: 4,
       backgroundColor: 'rgba(255, 255, 255, 0.3)',
     },
     progressText: {
       fontSize: 12,
       color: '#fff',
       marginTop: 4,
       textAlign: 'right',
     },
   })
   ```

3. **TaskCard** (2 days)
4. **FloatingActionButton** (1 day)

##### 2.2 Form Components
5. **TaskEditSheet** (3 days)
   - Uses `@gorhom/bottom-sheet` for native feel
   - React Hook Form for form state
   - Date/time pickers from `react-native-paper-dates`

6. **GoalEditSheet** (3 days)

##### 2.3 Navigation Components
7. **BottomNav** (already provided by React Navigation)
8. **TopNavBar** (1 day)

**Deliverables**:
- ✅ 8-10 core components built
- ✅ Component Storybook for testing (optional: use React Native Storybook)

---

### Phase 3: Screen Implementation (Week 3-4)
**Objective**: Build main app screens

#### Screen Priority Order

##### 3.1 Goals Screen (2 days)
```typescript
// apps/mobile/src/screens/GoalsScreen.tsx
import { FlatList, View, StyleSheet } from 'react-native'
import { FAB, Searchbar } from 'react-native-paper'
import { useGoalStore } from '../store'
import { GoalCard } from '../components/GoalCard'

export function GoalsScreen({ navigation }) {
  const { goals, fetchGoals, loading } = useGoalStore()
  const [search, setSearch] = useState('')
  const [sheetVisible, setSheetVisible] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const filteredGoals = goals.filter(g =>
    g.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search goals..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      <FlatList
        data={filteredGoals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
          />
        )}
        refreshing={loading}
        onRefresh={fetchGoals}
        contentContainerStyle={styles.list}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setSheetVisible(true)}
      />

      <GoalEditSheet
        visible={sheetVisible}
        onDismiss={() => setSheetVisible(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff9f5' },
  searchbar: { margin: 16 },
  list: { padding: 16 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#ff8c42',
  },
})
```

##### 3.2 Tasks Screen (2 days)
##### 3.3 Dashboard Screen (2 days)
##### 3.4 Calendar Planner Screen (3 days)
  - **Simplified version first** (list view instead of grid)
  - Add calendar grid view later

##### 3.5 Daily Timeline Screen (5 days) ⚠️ COMPLEX
**Challenge**: 31k LOC drag-drop feature needs complete redesign

**Simplified Approach**:
```typescript
// apps/mobile/src/screens/DailyTimelineScreen.tsx
import { ScrollView, View, StyleSheet } from 'react-native'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring
} from 'react-native-reanimated'

const HOUR_HEIGHT = 80  // Larger for mobile touch targets
const MINUTE_HEIGHT = HOUR_HEIGHT / 60

function DraggableTask({ task, onPositionChange }) {
  const startY = task.scheduledTime ? timeToPixels(task.scheduledTime) : 0
  const translateY = useSharedValue(startY)
  const isDragging = useSharedValue(false)

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true
    })
    .onUpdate((event) => {
      translateY.value = startY + event.translationY
    })
    .onEnd(() => {
      isDragging.value = false

      // Snap to 15-minute increments
      const minutes = Math.round((translateY.value / MINUTE_HEIGHT) / 15) * 15
      const newTime = minutesToTime(minutes)

      translateY.value = withSpring(minutes * MINUTE_HEIGHT)
      runOnJS(onPositionChange)(task.id, newTime)
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value ? 1000 : 1,
    elevation: isDragging.value ? 8 : 2,
  }))

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.taskBlock, animatedStyle]}>
        <TaskCard task={task} compact />
      </Animated.View>
    </GestureDetector>
  )
}

export function DailyTimelineScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { tasks, updateTaskFields } = useTaskStore()

  const todayTasks = tasks.filter(t =>
    isSameDay(new Date(t.scheduledDate), selectedDate)
  )

  const handleTaskMove = async (taskId: string, newTime: string) => {
    await updateTaskFields(taskId, { scheduledTime: newTime })
  }

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

        {/* Draggable tasks */}
        <View style={styles.tasksOverlay}>
          {todayTasks.map(task => (
            <DraggableTask
              key={task.id}
              task={task}
              onPositionChange={handleTaskMove}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
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
  hourLabel: {
    width: 60,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#6b6b6b',
  },
  hourLine: { flex: 1 },
  tasksOverlay: {
    position: 'absolute',
    left: 60,
    right: 0,
    top: 0,
    bottom: 0,
  },
  taskBlock: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 60,  // Default 1-hour task
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
})
```

**Deliverables**:
- ✅ All 5 main screens functional
- ✅ Navigation between screens working
- ✅ Data loading and display working

---

### Phase 4: Advanced Features (Week 4-5)
**Objective**: Implement complex interactions and polish

#### 4.1 Offline Support (2 days)
**Install WatermelonDB**:
```bash
npm install @nozbe/watermelondb
```

**Schema Definition**:
```typescript
// apps/mobile/src/database/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'target_value', type: 'number' },
        { name: 'current_value', type: 'number' },
        { name: 'scope', type: 'string' },
        { name: 'synced_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'is_completed', type: 'boolean' },
        { name: 'scheduled_date', type: 'number', isOptional: true },
        { name: 'synced_at', type: 'number' },
      ],
    }),
  ],
})
```

**Sync Strategy**:
```typescript
// apps/mobile/src/services/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './database'
import { api } from '@goal-tracker/api-client'

export async function syncDatabase() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await api.fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ lastPulledAt }),
      })
      return response
    },
    pushChanges: async ({ changes }) => {
      await api.fetch('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify({ changes }),
      })
    },
  })
}
```

#### 4.2 Push Notifications (2 days)
```bash
expo install expo-notifications
```

```typescript
// apps/mobile/src/services/notifications.ts
import * as Notifications from 'expo-notifications'

export async function scheduleTaskReminder(task: Task) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Reminder',
      body: task.title,
      data: { taskId: task.id },
    },
    trigger: {
      date: new Date(task.scheduledDate),
      repeats: false,
    },
  })
}
```

#### 4.3 Animations & Polish (2 days)
- Add screen transitions (React Navigation config)
- Add micro-interactions (buttons, cards)
- Loading skeletons

#### 4.4 Error Handling & Edge Cases (1 day)
- Network error states
- Empty states
- Permission errors

**Deliverables**:
- ✅ Offline-first architecture
- ✅ Push notifications
- ✅ Polished animations
- ✅ Comprehensive error handling

---

### Phase 5: Testing & Optimization (Week 5-6)
**Objective**: Ensure quality and performance

#### 5.1 Unit Tests (2 days)
```bash
npm install --save-dev @testing-library/react-native jest
```

```typescript
// apps/mobile/__tests__/components/GoalCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native'
import { GoalCard } from '../src/components/GoalCard'

describe('GoalCard', () => {
  const mockGoal = {
    id: '1',
    title: 'Test Goal',
    scope: 'MONTHLY',
    targetValue: 100,
    currentValue: 50,
  }

  it('renders correctly', () => {
    const { getByText } = render(<GoalCard goal={mockGoal} />)
    expect(getByText('Test Goal')).toBeTruthy()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByText } = render(<GoalCard goal={mockGoal} onPress={onPress} />)
    fireEvent.press(getByText('Test Goal'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

#### 5.2 E2E Tests (2 days)
```bash
npm install --save-dev detox
```

```typescript
// apps/mobile/e2e/goals.e2e.ts
describe('Goals Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should create a new goal', async () => {
    await element(by.id('fab-add-goal')).tap()
    await element(by.id('input-goal-title')).typeText('New Goal')
    await element(by.id('button-save-goal')).tap()
    await expect(element(by.text('New Goal'))).toBeVisible()
  })
})
```

#### 5.3 Performance Optimization (2 days)
- Use `React.memo` for expensive components
- Optimize FlatList with `getItemLayout`
- Use `useMemo` and `useCallback` strategically
- Profile with React DevTools and Flipper

```typescript
// Optimize GoalCard with React.memo
export const GoalCard = React.memo(({ goal, onPress }) => {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.goal.id === nextProps.goal.id &&
         prevProps.goal.currentValue === nextProps.goal.currentValue
})
```

#### 5.4 Accessibility (1 day)
```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add new goal"
  accessibilityRole="button"
  accessibilityHint="Opens a form to create a new goal"
>
  <FAB icon="plus" />
</TouchableOpacity>
```

**Deliverables**:
- ✅ 80%+ test coverage
- ✅ E2E tests for critical flows
- ✅ Performance benchmarks met (60 FPS)
- ✅ WCAG 2.1 AA compliance

---

### Phase 6: Deployment (Week 6)
**Objective**: Prepare for production release

#### 6.1 Build Configuration
```json
// app.json
{
  "expo": {
    "name": "Goal Tracker",
    "slug": "goal-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#fff9f5"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.goaltracker",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourcompany.goaltracker",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#fff9f5"
      }
    }
  }
}
```

#### 6.2 App Store Submission (iOS)
```bash
eas build --platform ios
eas submit --platform ios
```

#### 6.3 Google Play Submission (Android)
```bash
eas build --platform android
eas submit --platform android
```

---

## MCP Servers & Tools

### Recommended MCP Servers for This Project

#### 1. **TypeScript MCP Server**
**Purpose**: Type checking, auto-completion, refactoring
**Install**:
```bash
npm install -g @modelcontextprotocol/server-typescript
```
**Usage**: Helps with TypeScript-specific tasks, type inference

#### 2. **Git MCP Server**
**Purpose**: Version control operations
**Install**:
```bash
npm install -g @modelcontextprotocol/server-git
```
**Usage**: Automated commits, branch management, merge conflict resolution

#### 3. **Filesystem MCP Server**
**Purpose**: File operations, search, pattern matching
**Install**:
```bash
npm install -g @modelcontextprotocol/server-filesystem
```
**Usage**: Bulk file operations, code generation

#### 4. **React Native MCP Server** (Custom - Create This!)
**Purpose**: React Native-specific operations
**Features**:
- Component generation from templates
- Screen scaffolding
- StyleSheet to theme variable conversion
- Navigation route generation

**Example Custom Tool**:
```typescript
// tools/rn-component-generator.ts
import { z } from 'zod'

export const generateComponent = {
  name: 'generate-rn-component',
  description: 'Generate a React Native component with TypeScript and styling',
  parameters: z.object({
    name: z.string(),
    type: z.enum(['screen', 'component', 'form']),
    includeTests: z.boolean().default(true),
  }),
  handler: async ({ name, type, includeTests }) => {
    // Generate component boilerplate
    const componentCode = generateComponentTemplate(name, type)
    const styleCode = generateStyleTemplate(name)
    const testCode = includeTests ? generateTestTemplate(name) : null

    return {
      files: [
        { path: `src/components/${name}.tsx`, content: componentCode },
        { path: `src/components/${name}.styles.ts`, content: styleCode },
        { path: `__tests__/components/${name}.test.tsx`, content: testCode },
      ],
    }
  },
}
```

### Claude Code Skills to Use

#### 1. **frontend-design** (Built-in)
**When**: Creating UI components from scratch
**Usage**:
```bash
/frontend-design "Create a GoalCard component with gradient background, progress bar, and action menu"
```

#### 2. **commit** (Built-in)
**When**: After completing each phase
**Usage**:
```bash
/commit
```

### Custom Agents to Create

#### 1. **Style Migration Agent**
**Purpose**: Convert Tailwind classes to React Native StyleSheet

**Prompt Template**:
```
Convert the following Tailwind component to React Native StyleSheet:

Input (Tailwind):
<View className="flex items-center gap-4 px-3 py-2 bg-peach-cream rounded-lg">
  <Text className="text-lg font-bold text-deep-charcoal">Hello</Text>
</View>

Output (React Native):
<View style={styles.container}>
  <Text style={styles.text}>Hello</Text>
</View>

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff9f5',
    borderRadius: 8,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2a2a2a',
  },
})

Rules:
- Convert all Tailwind classes to StyleSheet properties
- Use design system colors from theme
- Maintain responsive values
- Add TypeScript types for style props
```

**Usage with Claude Code**:
```bash
# Create a .claudecode/agents/style-migration.yaml file
name: style-migration
description: Convert Tailwind CSS to React Native StyleSheet
system_prompt: |
  You are an expert at converting Tailwind CSS to React Native StyleSheet.
  Follow these rules...
```

#### 2. **Component Migration Agent**
**Purpose**: Convert web React components to React Native

**Prompt Template**:
```
Convert this React web component to React Native:

Input (Web):
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'

export function GoalCard({ goal }) {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold">{goal.title}</h2>
      <Button onClick={() => alert('Edit')}>Edit</Button>
    </Card>
  )
}

Output (React Native):
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Card, Button } from 'react-native-paper'

export function GoalCard({ goal }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>{goal.title}</Text>
      <Button mode="contained" onPress={() => alert('Edit')}>
        Edit
      </Button>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
})

Mappings:
- div/span → View
- h1-h6/p → Text
- button → TouchableOpacity or Button (from UI library)
- a → TouchableOpacity with Linking
- img → Image (with require() for local, uri for remote)
- input → TextInput
```

#### 3. **Test Migration Agent**
**Purpose**: Convert React Testing Library tests to React Native Testing Library

---

## Best Practices

### 1. Code Organization

#### Folder Structure (Recommended)
```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── cards/
│   │   │   ├── GoalCard.tsx
│   │   │   └── TaskCard.tsx
│   │   ├── forms/
│   │   │   ├── GoalForm.tsx
│   │   │   └── TaskForm.tsx
│   │   └── common/
│   │       ├── Button.tsx
│   │       └── Input.tsx
│   ├── screens/             # Screen-level components
│   │   ├── Goals/
│   │   │   ├── GoalsScreen.tsx
│   │   │   ├── GoalDetailScreen.tsx
│   │   │   └── index.ts
│   │   └── Tasks/
│   ├── navigation/          # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   └── types.ts
│   ├── store/               # State management (Zustand)
│   │   ├── goalStore.ts
│   │   └── taskStore.ts
│   ├── services/            # Business logic & APIs
│   │   ├── api.ts
│   │   ├── sync.ts
│   │   └── notifications.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useGoals.ts
│   │   └── useTasks.ts
│   ├── utils/               # Utility functions
│   │   ├── date.ts
│   │   └── format.ts
│   ├── theme/               # Design system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── index.ts
│   ├── types/               # TypeScript types
│   │   ├── goal.ts
│   │   └── task.ts
│   └── App.tsx
└── package.json
```

### 2. Component Design Patterns

#### Use Composition Over Props Drilling
```typescript
// ❌ Bad: Props drilling
<GoalCard
  title={goal.title}
  description={goal.description}
  progress={goal.currentValue / goal.targetValue}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>

// ✅ Good: Composition
<GoalCard goal={goal}>
  <GoalCard.Header>
    <GoalCard.Title />
    <GoalCard.Actions>
      <EditButton onPress={handleEdit} />
      <DeleteButton onPress={handleDelete} />
    </GoalCard.Actions>
  </GoalCard.Header>
  <GoalCard.Body>
    <GoalCard.Description />
    <GoalCard.Progress />
  </GoalCard.Body>
</GoalCard>
```

#### Separate Presentational and Container Components
```typescript
// Presentational (dumb component)
export function GoalCardView({ goal, onPress, onEdit }: GoalCardViewProps) {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.title}>{goal.title}</Text>
        {/* ... */}
      </View>
    </TouchableOpacity>
  )
}

// Container (smart component)
export function GoalCard({ goalId }: { goalId: string }) {
  const goal = useGoalStore(state => state.goals.find(g => g.id === goalId))
  const updateGoal = useGoalStore(state => state.updateGoal)
  const navigation = useNavigation()

  const handlePress = () => {
    navigation.navigate('GoalDetail', { goalId })
  }

  const handleEdit = () => {
    // Edit logic
  }

  if (!goal) return null

  return <GoalCardView goal={goal} onPress={handlePress} onEdit={handleEdit} />
}
```

### 3. Performance Optimization

#### Memoization Strategy
```typescript
// Memoize expensive calculations
const progressPercentage = useMemo(() => {
  return (goal.currentValue / goal.targetValue) * 100
}, [goal.currentValue, goal.targetValue])

// Memoize callbacks to prevent re-renders
const handlePress = useCallback(() => {
  navigation.navigate('GoalDetail', { goalId: goal.id })
}, [navigation, goal.id])

// Memoize entire components when props rarely change
export const GoalCard = React.memo(({ goal, onPress }) => {
  // Component code
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return prevProps.goal.id === nextProps.goal.id &&
         prevProps.goal.currentValue === nextProps.goal.currentValue
})
```

#### FlatList Optimization
```typescript
<FlatList
  data={goals}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <GoalCard goal={item} />}

  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={21}

  // If item height is fixed
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 4. Error Handling

#### Network Error Boundaries
```typescript
// services/api.ts
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}
```

#### User-Facing Error States
```typescript
export function GoalsScreen() {
  const { goals, loading, error, fetchGoals } = useGoalStore()

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ff3e83" />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchGoals}>
          Retry
        </Button>
      </View>
    )
  }

  if (loading && goals.length === 0) {
    return <LoadingSpinner />
  }

  if (goals.length === 0) {
    return <EmptyState message="No goals yet. Create your first goal!" />
  }

  return <FlatList data={goals} {...} />
}
```

### 5. Accessibility

#### Best Practices Checklist
- ✅ Use `accessible={true}` on interactive elements
- ✅ Provide `accessibilityLabel` for icons and images
- ✅ Use `accessibilityRole` to indicate element type
- ✅ Provide `accessibilityHint` for complex interactions
- ✅ Ensure touch targets are at least 44x44 points
- ✅ Support dynamic font sizes (`useScale` from react-native-size-matters)
- ✅ Test with screen readers (TalkBack on Android, VoiceOver on iOS)

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityLabel={`${goal.title} goal`}
  accessibilityRole="button"
  accessibilityHint="Opens goal details"
  accessibilityState={{ selected: isSelected }}
  style={styles.touchable}
>
  <GoalCardView goal={goal} />
</TouchableOpacity>
```

### 6. Internationalization (i18n)

#### Set Up react-i18next
```bash
npm install react-i18next i18next
```

```typescript
// i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: {
          'goals.title': 'Goals',
          'goals.empty': 'No goals yet',
          'goals.create': 'Create Goal',
        },
      },
      es: {
        translation: {
          'goals.title': 'Objetivos',
          'goals.empty': 'No hay objetivos todavía',
          'goals.create': 'Crear Objetivo',
        },
      },
    },
    lng: 'en',
    fallbackLng: 'en',
  })

export default i18n
```

```typescript
// Usage in components
import { useTranslation } from 'react-i18next'

export function GoalsScreen() {
  const { t } = useTranslation()

  return (
    <View>
      <Text>{t('goals.title')}</Text>
    </View>
  )
}
```

### 7. Testing Strategy

#### Test Pyramid
```
        /\
       /  \      E2E Tests (10%)
      /    \     - Critical user flows
     /------\    - Login, create goal, complete task
    /        \
   /          \  Integration Tests (30%)
  /            \ - Component interactions
 /              \- API mocking
/----------------\
Unit Tests (60%)
- Pure functions
- Custom hooks
- Business logic
```

#### Test Examples

**Unit Test (Utility Function)**:
```typescript
// utils/__tests__/date.test.ts
import { formatLocalDate, parseLocalDate } from '../date'

describe('Date Utilities', () => {
  it('formats date correctly', () => {
    expect(formatLocalDate(new Date('2024-01-15'))).toBe('2024-01-15')
  })

  it('parses date correctly', () => {
    const parsed = parseLocalDate('2024-01-15')
    expect(parsed.getFullYear()).toBe(2024)
    expect(parsed.getMonth()).toBe(0) // January
    expect(parsed.getDate()).toBe(15)
  })
})
```

**Integration Test (Component with Store)**:
```typescript
// components/__tests__/GoalCard.integration.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { GoalCard } from '../GoalCard'
import { useGoalStore } from '../../store/goalStore'

jest.mock('../../store/goalStore')

describe('GoalCard Integration', () => {
  beforeEach(() => {
    useGoalStore.mockReturnValue({
      updateGoal: jest.fn(),
      deleteGoal: jest.fn(),
    })
  })

  it('updates goal when edited', async () => {
    const mockUpdateGoal = jest.fn()
    useGoalStore.mockReturnValue({ updateGoal: mockUpdateGoal })

    const { getByText, getByTestId } = render(<GoalCard goalId="123" />)

    fireEvent.press(getByTestId('edit-button'))
    fireEvent.changeText(getByTestId('title-input'), 'Updated Goal')
    fireEvent.press(getByText('Save'))

    await waitFor(() => {
      expect(mockUpdateGoal).toHaveBeenCalledWith('123', {
        title: 'Updated Goal',
      })
    })
  })
})
```

**E2E Test (Detox)**:
```typescript
// e2e/goals.e2e.ts
describe('Goals Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
    await device.reloadReactNative()
  })

  it('should complete full goal lifecycle', async () => {
    // Create goal
    await element(by.id('fab-add-goal')).tap()
    await element(by.id('input-goal-title')).typeText('Workout 20 times')
    await element(by.id('input-goal-target')).typeText('20')
    await element(by.id('button-save-goal')).tap()

    // Verify goal appears
    await expect(element(by.text('Workout 20 times'))).toBeVisible()

    // Add progress
    await element(by.text('Workout 20 times')).tap()
    await element(by.id('button-add-progress')).tap()
    await element(by.id('input-progress-value')).typeText('5')
    await element(by.id('button-save-progress')).tap()

    // Verify progress updated
    await expect(element(by.text('5 / 20'))).toBeVisible()
  })
})
```

---

## Code Reusability Matrix

| Module/File | Current (Web) | React Native | Reusability | Notes |
|-------------|---------------|--------------|-------------|-------|
| **Backend API** | ✅ | ✅ | 100% | No changes needed |
| **Prisma Schema** | ✅ | ✅ | 100% | Unchanged |
| **Date Utilities** | ✅ | ✅ | 100% | Works identically |
| **Type Definitions** | ✅ | ✅ | 100% | Pure TypeScript |
| **API Client** | ✅ | ⚠️ | 90% | Only auth token retrieval changes |
| **Business Logic** | ✅ | ⚠️ | 80% | State management patterns transferable |
| **Custom Hooks** | ✅ | ⚠️ | 60% | Core logic reusable, some RN-specific adjustments |
| **UI Components** | ✅ | ❌ | 0% | Complete rewrite (Radix → RN Paper) |
| **Styling** | ✅ | ❌ | 0% | Complete rewrite (Tailwind → StyleSheet) |
| **Navigation** | ✅ | ❌ | 0% | React Router → React Navigation |
| **Animations** | ✅ | ❌ | 30% | Framer Motion → Reanimated (concepts transfer) |
| **Forms** | ✅ | ⚠️ | 50% | React Hook Form works, inputs need rewrite |

### Estimated Code Reuse by LOC

| Layer | Current LOC | Reusable LOC | Reusability % |
|-------|-------------|--------------|---------------|
| Backend (API) | 3,000 | 3,000 | 100% |
| API Client | 320 | 288 | 90% |
| Utilities | 500 | 400 | 80% |
| State Management | 250 | 200 | 80% |
| UI Components | 5,353 | 0 | 0% |
| Styling | 12,093 | 0 | 0% |
| Screens | 1,500 | 150 | 10% |
| Navigation | 200 | 0 | 0% |
| **TOTAL** | **23,216** | **4,038** | **17.4%** |

---

## Risk Assessment & Mitigation

### High-Risk Areas

#### 1. DailyTimelineView Conversion (Risk: HIGH)
**Risk**: 31k LOC drag-drop feature is extremely complex
**Impact**: Core feature, high user engagement
**Mitigation**:
- Start with simplified version (list view, no drag-drop)
- Gradually add complexity (drag-drop, then resize)
- Consider using proven library: `react-native-draggable-flatlist`
- Allocate 2x estimated time (10 days instead of 5)
- Have fallback: basic schedule list if drag-drop proves too difficult

#### 2. Offline Sync Implementation (Risk: MEDIUM)
**Risk**: Complex sync logic, potential data conflicts
**Impact**: Critical for offline-first UX
**Mitigation**:
- Use battle-tested library (WatermelonDB)
- Implement conflict resolution strategy (last-write-wins for v1)
- Add extensive testing for sync scenarios
- Implement sync status UI to show pending changes

#### 3. Performance on Low-End Devices (Risk: MEDIUM)
**Risk**: FlatLists with many items, complex animations
**Impact**: Poor UX on budget Android devices
**Mitigation**:
- Test on real devices (not just simulator)
- Implement virtualization for all lists
- Use React.memo aggressively
- Profile with React DevTools + Flipper
- Add performance budgets to CI/CD

#### 4. Platform-Specific Bugs (Risk: MEDIUM)
**Risk**: Different behavior on iOS vs Android
**Impact**: Inconsistent UX, extra debugging time
**Mitigation**:
- Test on both platforms continuously
- Use Platform-specific code when necessary
- Follow React Native upgrade guide carefully
- Join React Native community for quick help

### Medium-Risk Areas

#### 5. Authentication Flow (Risk: LOW-MEDIUM)
**Risk**: Auth0 setup differences between web and mobile
**Impact**: Users can't log in
**Mitigation**:
- Follow Auth0 React Native quickstart exactly
- Test on real devices (simulators have networking quirks)
- Implement fallback to email/password if OAuth fails

#### 6. Push Notifications (Risk: LOW-MEDIUM)
**Risk**: Permission handling, delivery reliability
**Impact**: Users miss reminders
**Mitigation**:
- Use Expo's managed notifications (easier)
- Handle permission denial gracefully
- Implement local notifications as backup
- Test on real devices (push notifications don't work on simulators)

---

## Testing Strategy

### Testing Tools

| Type | Tool | Purpose |
|------|------|---------|
| **Unit** | Jest | Test utilities, hooks, business logic |
| **Component** | React Native Testing Library | Test component rendering and interactions |
| **E2E** | Detox | Test full user flows on real devices |
| **Visual** | Storybook for React Native | Component visual testing |
| **API** | MSW (Mock Service Worker) | Mock API responses |
| **Performance** | Flipper | Profile performance, memory, network |

### Test Coverage Goals

- **Unit Tests**: 80% coverage for utilities and business logic
- **Component Tests**: 60% coverage for UI components
- **E2E Tests**: Cover 5-10 critical user flows
- **Visual Tests**: All core components in Storybook

### CI/CD Pipeline

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm test --coverage
      - run: pnpm lint
      - run: pnpm type-check

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g pnpm eas-cli
      - run: pnpm install
      - run: eas build --platform ios --profile preview

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install -g pnpm eas-cli
      - run: pnpm install
      - run: eas build --platform android --profile preview
```

---

## Deployment Strategy

### Development Workflow

```
Feature Branch → PR → Staging → Production
     ↓            ↓       ↓          ↓
   Local       CI/CD   TestFlight  App Store
              Tests    Beta Test    Release
```

### Expo EAS Build & Submit

#### 1. Set Up EAS
```bash
npm install -g eas-cli
eas login
eas build:configure
```

#### 2. Configure Build Profiles
```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "appStoreProfile": "release"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your.apple.id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDEF1234"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account.json",
        "track": "internal"
      }
    }
  }
}
```

#### 3. Build Commands
```bash
# Development build (for testing on real devices)
eas build --profile development --platform ios

# Preview build (for internal testing)
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest
```

### Release Checklist

#### Pre-Release
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance profiling completed
- [ ] Accessibility audit passed
- [ ] Privacy policy updated
- [ ] Terms of service reviewed
- [ ] App store screenshots prepared
- [ ] App description written
- [ ] Beta testing completed (TestFlight/Internal Track)

#### iOS Submission
- [ ] Xcode signing configured
- [ ] App Store Connect app created
- [ ] Privacy declarations completed
- [ ] Screenshots uploaded (all device sizes)
- [ ] App review information provided
- [ ] Submit for review

#### Android Submission
- [ ] Google Play Console app created
- [ ] Content rating questionnaire completed
- [ ] Privacy policy link added
- [ ] Screenshots uploaded (phone + tablet)
- [ ] Release notes written
- [ ] Submit to internal track → closed testing → open testing → production

### Post-Release Monitoring

#### Key Metrics to Track
1. **Crash-Free Rate**: >99% (use Sentry or Firebase Crashlytics)
2. **App Store Rating**: >4.0 stars
3. **API Error Rate**: <1% of requests
4. **App Launch Time**: <2 seconds
5. **User Retention**: Day 1: >40%, Day 7: >20%, Day 30: >10%

#### Monitoring Tools
- **Sentry**: Crash reporting and error tracking
- **Firebase Analytics**: User behavior analytics
- **Firebase Performance**: App performance monitoring
- **App Store Connect**: iOS metrics
- **Google Play Console**: Android metrics

---

## Migration Timeline Summary

### 6-Week Aggressive Schedule (1 Developer, Full-Time)

| Week | Phase | Deliverables | Risk |
|------|-------|--------------|------|
| **1** | **0: Prep + 1: Foundation** | Project setup, navigation, API client, state management | Low |
| **2** | **2: Core Components** | GoalCard, TaskCard, TaskEditSheet, GoalEditSheet, FAB | Medium |
| **3** | **3: Screens (Part 1)** | Goals Screen, Tasks Screen, Dashboard Screen | Medium |
| **4** | **3: Screens (Part 2)** | Calendar Planner, Daily Timeline (simplified) | High |
| **5** | **4: Advanced Features** | Offline support, push notifications, animations | Medium |
| **6** | **5: Testing + 6: Deployment** | Testing, polish, app store submission | Medium |

### 12-Week Conservative Schedule (1 Developer, Part-Time or Parallel Maintenance)

| Week | Phase | Hours/Week | Focus |
|------|-------|------------|-------|
| 1-2 | Preparation & Foundation | 20 | Setup, API, navigation |
| 3-5 | Core Components | 15 | Reusable components |
| 6-8 | Screen Implementation | 20 | Main screens |
| 9-10 | Advanced Features | 15 | Offline, notifications |
| 11 | Testing & Polish | 15 | Quality assurance |
| 12 | Deployment | 10 | App store submission |

---

## Recommended Prompts for Claude Code

### For Component Migration

**Prompt Template**:
```
I need to convert the web React component [ComponentName] to React Native.

Current web implementation:
[Paste web component code]

Requirements:
1. Convert all HTML elements to React Native equivalents (div → View, span → Text)
2. Convert Tailwind classes to StyleSheet
3. Use React Native Paper for UI components (Button, Card, etc.)
4. Maintain the same functionality and UX
5. Add TypeScript types
6. Use the design system theme colors from theme/colors.ts

Output:
- React Native component code
- StyleSheet definitions
- Any new dependencies needed
```

### For Styling Migration

**Prompt Template**:
```
Convert these Tailwind CSS classes to React Native StyleSheet:

<View className="flex items-center justify-between px-4 py-2 bg-peach-cream rounded-lg shadow-md">
  <Text className="text-lg font-bold text-deep-charcoal">Title</Text>
  <Icon className="w-6 h-6 text-energizing-orange" />
</View>

Design system colors:
- peach-cream: #fff9f5
- deep-charcoal: #2a2a2a
- energizing-orange: #ff8c42

Output React Native code with StyleSheet.create()
```

### For State Management

**Prompt Template**:
```
Convert this React Context state management to Zustand:

Current Context code:
[Paste GoalContext.tsx]

Requirements:
1. Use Zustand for simpler state management
2. Maintain the same API (fetchGoals, updateGoal, etc.)
3. Add TypeScript types
4. Include error handling
5. Support optimistic updates

Output Zustand store code
```

### For Navigation

**Prompt Template**:
```
Convert React Router navigation to React Navigation:

Current routes:
- /goals → Goals screen
- /goals/:goalId → Goal detail screen
- /tasks → Tasks screen
- /planner → Calendar planner screen
- /dashboard → Dashboard screen

Requirements:
1. Use bottom tab navigator for main screens
2. Use stack navigator for detail screens
3. Add navigation types
4. Configure tab bar with icons and labels

Output React Navigation configuration code
```

---

## Conclusion

### Key Takeaways

1. **Feasibility**: ✅ Conversion is VIABLE with 4-6 weeks estimated timeline
2. **Reusability**: ~20% code reuse (backend, API client, utilities)
3. **Challenges**: UI components (0% reuse), complex drag-drop feature, styling system
4. **Recommended Approach**: Gradual migration OR Expo + Tamagui universal app
5. **Tools**: React Native Paper, React Navigation, Reanimated, WatermelonDB
6. **Risk Mitigation**: Simplify complex features first, add complexity later

### Next Steps

#### Immediate Actions (Before Starting Migration)
1. **Decision Point**: Choose migration strategy
   - Option A: Gradual migration (maintain both codebases)
   - Option B: Universal app (Expo + Tamagui) ← RECOMMENDED
   - Option C: Big bang rewrite (not recommended)

2. **Prototype**: Build one feature end-to-end (2-3 days)
   - Goal: Validate approach, identify issues early
   - Feature: Goals screen (list + create + edit)
   - Deliverable: Working prototype on iOS and Android

3. **Team Alignment**: Review this document with stakeholders
   - Get buy-in on timeline and approach
   - Identify resource constraints
   - Set success criteria

4. **Environment Setup**: Prepare development environment
   - Install Expo CLI
   - Set up EAS account
   - Configure Auth0 for mobile
   - Set up CI/CD pipeline

#### Long-Term Considerations

1. **Code Sharing**: If choosing universal app, plan for 60-70% code reuse
2. **Maintenance**: Budget for ongoing updates to both platforms
3. **Team Training**: React Native has different patterns than web React
4. **Performance Monitoring**: Set up analytics and crash reporting from day 1
5. **User Feedback**: Plan for beta testing phase (2-4 weeks)

### Success Metrics

**Technical Metrics**:
- [ ] Crash-free rate >99%
- [ ] App launch time <2 seconds
- [ ] API response time <500ms
- [ ] Battery usage within normal range
- [ ] Bundle size <50MB (Android APK)

**Business Metrics**:
- [ ] App Store rating >4.0 stars
- [ ] User retention (Day 1 >40%, Day 7 >20%)
- [ ] Feature parity with web app
- [ ] Monthly active users >1000 (within 3 months)

---

## Additional Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Tamagui Docs](https://tamagui.dev/)
- [WatermelonDB](https://watermelondb.dev/)

### Communities
- [React Native Community Discord](https://discord.gg/react-native)
- [Expo Discord](https://discord.gg/expo)
- [React Navigation GitHub Discussions](https://github.com/react-navigation/react-navigation/discussions)

### Tools & Libraries
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [React Native Directory](https://reactnative.directory/) - Library finder
- [Flipper](https://fbflipper.com/) - Debugging tool
- [Reactotron](https://github.com/infinitered/reactotron) - Inspector

---

**Document Version**: 1.0
**Last Updated**: 2024-03-17
**Author**: Claude Code Migration Analysis
**Project**: Goal Tracker PWA → React Native
