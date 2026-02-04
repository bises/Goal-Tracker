# UI Revamp Plan: Mobile-First Workflow Optimization

**Date**: February 2, 2026
**Status**: Planning Phase
**Priority**: High Impact - Addresses core user workflows

---

## 📊 User Research Findings

### Primary User Workflows (In Order of Frequency)

1. **Daily Check-in** (Most Frequent)
   - View today's tasks
   - Mark tasks as complete
   - See completion progress
   - View goal progress updates

2. **Planning** (Daily/Weekly)
   - Schedule tasks to specific dates
   - Create new tasks
   - Create new goals
   - Visual calendar overview

3. **Goal Management** (Weekly/Monthly)
   - Review goal progress
   - Link tasks to goals
   - Log manual progress
   - Create sub-goals

### Device Usage

- **Primary**: Mobile phone (PWA)
- **Secondary**: Desktop/laptop
- **Requirement**: Must work intuitively on both without tutorials

### Current Pain Points

- ❌ No dedicated "Today View" - requires 3 clicks to see today's tasks
- ❌ Unscheduled tasks hidden in horizontal scroll bar (low discoverability)
- ❌ Too many action buttons on goal cards (cognitive overload)
- ❌ Modal-heavy workflows (slows down quick actions)
- ❌ Mobile calendar not optimized for touch (week view shows full month grid)

---

## 🎯 Proposed UI Structure

### New Navigation (3 Main Tabs)

```
┌─────────────────────────────────────┐
│  🏠 Today  |  📅 Plan  |  🎯 Goals  │
└─────────────────────────────────────┘
```

**Key Change**: Add "Today" as default landing page, shift current "Planner" to "Plan" tab

---

## 🎨 DESIGN SYSTEM: Achievement Engine Aesthetic

### Design Philosophy

**Purpose**: A goal tracker isn't just a list—it's an achievement engine. The design should feel powerful, motivating, and rewarding, celebrating progress while maintaining clarity for daily productivity.

**Tone**: **Achievement-Focused Minimalism** - Clean and spacious for focus, but with bold moments of celebration. Dark background for reduced eye strain during daily check-ins, with energetic accent colors that pop for completed actions. Think "mission control meets victory dashboard."

**Differentiation**: The moment a task is checked off triggers a satisfying micro-celebration. Progress bars aren't just bars—they're momentum indicators with kinetic energy.

---

### Typography

**Display Font (Headings, Numbers, Stats)**:

```css
font-family: 'Archivo Black', 'Impact', sans-serif;
/* Bold, geometric, powerful - for numbers, page titles, completion stats */
/* Alternative: 'Bebas Neue' or 'Oswald' for condensed impact */
```

**Body Font (Task names, descriptions)**:

```css
font-family: 'Work Sans', 'DM Sans', sans-serif;
/* Modern, readable, friendly - NOT Inter, NOT Roboto */
/* Slightly rounded terminals for approachability */
```

**Accent Font (Dates, labels, metadata)**:

```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
/* Monospace for dates and numeric data - adds precision feel */
/* Gives "engineered" aesthetic to timestamps */
```

**Type Scale**:

```css
--text-xs: 0.75rem; /* 12px - metadata, badges */
--text-sm: 0.875rem; /* 14px - descriptions, secondary text */
--text-base: 1rem; /* 16px - task titles */
--text-lg: 1.125rem; /* 18px - section headers */
--text-xl: 1.5rem; /* 24px - page titles */
--text-2xl: 2rem; /* 32px - Today title */
--text-3xl: 3rem; /* 48px - completion numbers */
```

**Font Weights**:

- Display: 800-900 (Extra Bold)
- Body: 400 (Regular), 500 (Medium), 600 (SemiBold)
- Mono: 500 (Medium)

---

### Color Palette

**Base (Dark Theme)**:

```css
:root {
  /* Background - Deep space blues, not pure black */
  --bg-primary: #0a0e1a; /* Main background - deep navy */
  --bg-secondary: #121829; /* Cards, elevated surfaces */
  --bg-tertiary: #1a2235; /* Hover states, active elements */

  /* Text - High contrast hierarchy */
  --text-primary: #f8fafc; /* Main text - near white */
  --text-secondary: #94a3b8; /* Secondary text - slate */
  --text-tertiary: #64748b; /* Metadata, disabled - muted slate */

  /* Borders & Dividers */
  --border-subtle: rgba(148, 163, 184, 0.1); /* Barely visible */
  --border-default: rgba(148, 163, 184, 0.2); /* Standard */
  --border-strong: rgba(148, 163, 184, 0.3); /* Emphasis */
}
```

**Accent Colors - Two Options:**

**OPTION A: Electric Cyan (Recommended - Tech-Forward)**

```css
:root {
  /* Primary Action - Electric cyan (not the overused purple!) */
  --accent-primary: #06b6d4; /* Cyan 500 - main actions */
  --accent-primary-hover: #0891b2; /* Cyan 600 - hover */
  --accent-primary-glow: rgba(6, 182, 212, 0.3); /* Glow effect */

  /* Success - Vivid lime green (energetic, not typical green) */
  --success-primary: #84cc16; /* Lime 500 - completed tasks */
  --success-secondary: #65a30d; /* Lime 600 - hover */
  --success-glow: rgba(132, 204, 22, 0.3);

  /* Warning - Energizing amber */
  --warning-primary: #f59e0b; /* Amber 500 - overdue */
  --warning-secondary: #d97706; /* Amber 600 */

  /* Danger - Bold red */
  --danger-primary: #ef4444; /* Red 500 - delete, errors */
  --danger-secondary: #dc2626; /* Red 600 */

  /* Goal Scopes - Color coded for quick recognition */
  --scope-yearly: #fbbf24; /* Amber 400 - sun/year cycle */
  --scope-monthly: #34d399; /* Emerald 400 - growth/progress */
  --scope-weekly: #60a5fa; /* Blue 400 - rhythm/routine */
  --scope-standalone: #a78bfa; /* Violet 400 - individual gems */
}
```

**OPTION B: Warm Orange (Alternative - Achievement-Focused)**

```css
:root {
  /* Primary Action - Energetic orange for celebration feel */
  --accent-primary: #ff6b35; /* Energy orange - main actions */
  --accent-primary-hover: #e55a2b; /* Darker orange - hover */
  --accent-primary-glow: rgba(255, 107, 53, 0.3); /* Glow effect */

  /* Success - Deep amber progression */
  --success-primary: #ff8c42; /* Deep amber - completed tasks */
  --success-secondary: #f59e0b; /* Golden amber - hover */
  --success-glow: rgba(255, 140, 66, 0.3);

  /* Warning - Coral accent */
  --warning-primary: #ff4e50; /* Coral - overdue */
  --warning-secondary: #e63946; /* Deep coral */

  /* Danger - Maintain red */
  --danger-primary: #ef4444;
  --danger-secondary: #dc2626;

  /* Goal Scopes - Same color coding */
  --scope-yearly: #fbbf24;
  --scope-monthly: #34d399;
  --scope-weekly: #60a5fa;
  --scope-standalone: #a78bfa;
}
```

**Recommendation**: **Option A (Cyan)** for distinctive tech aesthetic, or **Option B (Orange)** for warmer achievement feel. Both avoid generic purple gradients. Choose based on your brand personality:

- **Cyan** = Modern, efficient, professional
- **Orange** = Energetic, motivating, celebratory

**Gradient Meshes** (For hero sections, empty states):

```css
.hero-gradient {
  background:
    radial-gradient(ellipse at top right, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(132, 204, 22, 0.1) 0%, transparent 50%);
}

.achievement-glow {
  background: radial-gradient(circle at center, rgba(6, 182, 212, 0.4) 0%, transparent 70%);
  filter: blur(60px);
}
```

---

### Motion Design

**Guiding Principles**:

- Completion actions get CELEBRATION (bounce, glow, scale)
- Navigation is INSTANT (no sluggish transitions)
- Loading states are INFORMATIVE (not just spinners)
- Scroll reveals are STAGGERED (not all at once)

**Animation Variables**:

```css
:root {
  /* Durations */
  --duration-instant: 100ms;
  --duration-fast: 200ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-celebration: 600ms;

  /* Easings */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --ease-elastic: cubic-bezier(0.68, -0.25, 0.265, 1.25);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

**Key Animations**:

1. **Task Completion (The Hero Moment)**:

```css
@keyframes taskComplete {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  20% {
    transform: scale(1.05);
  }
  40% {
    transform: scale(0.98) translateX(-4px);
  }
  60% {
    transform: scale(1.02) translateX(2px);
  }
  80% {
    opacity: 0.7;
    filter: brightness(1.3);
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
    filter: blur(0px);
  }
}

.task-completed {
  animation: taskComplete var(--duration-celebration) var(--ease-bounce);
}

/* Checkbox check animation */
@keyframes checkboxCheck {
  0% {
    transform: scale(0) rotate(0deg);
  }
  50% {
    transform: scale(1.2) rotate(10deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
  }
}

/* Success glow pulse */
@keyframes glowPulse {
  0%,
  100% {
    box-shadow: 0 0 20px var(--success-glow);
  }
  50% {
    box-shadow:
      0 0 40px var(--success-glow),
      0 0 60px var(--success-glow);
  }
}
```

2. **Progress Bar Fill (Momentum)**:

```css
@keyframes progressFill {
  from {
    transform: scaleX(0);
    transform-origin: left;
  }
  to {
    transform: scaleX(1);
    transform-origin: left;
  }
}

.progress-bar-fill {
  animation: progressFill var(--duration-slow) var(--ease-out-expo);
  /* Add shimmer effect */
  background: linear-gradient(90deg, var(--accent-primary) 0%, var(--success-primary) 100%);
  position: relative;
  overflow: hidden;
}

.progress-bar-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  to {
    left: 100%;
  }
}
```

3. **Page Load (Staggered Reveal)**:

```css
/* Stagger reveal for task list */
.task-card {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp var(--duration-normal) var(--ease-out-expo) forwards;
}

.task-card:nth-child(1) {
  animation-delay: 0ms;
}
.task-card:nth-child(2) {
  animation-delay: 50ms;
}
.task-card:nth-child(3) {
  animation-delay: 100ms;
}
.task-card:nth-child(4) {
  animation-delay: 150ms;
}
/* ... continue pattern */

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

4. **Floating Add Button (Breathing)**:

```css
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 30px rgba(6, 182, 212, 0.6);
  }
}

.fab-button {
  animation: breathe 3s ease-in-out infinite;
}

.fab-button:active {
  animation: none;
  transform: scale(0.95);
}
```

5. **Sheet/Modal Entrance**:

```css
@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bottom-sheet {
  animation: slideUp var(--duration-normal) var(--ease-out-expo);
}

/* Backdrop fade */
@keyframes backdropFade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sheet-backdrop {
  animation: backdropFade var(--duration-fast) ease-out;
  background: rgba(10, 14, 26, 0.8);
  backdrop-filter: blur(4px);
}
```

6. **Goal Completion Celebration (Confetti)**:

```tsx
// Install: npm install canvas-confetti
// or: pnpm add canvas-confetti
import confetti from 'canvas-confetti';

const celebrateGoalCompletion = () => {
  // Burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#06b6d4', '#84cc16', '#fbbf24', '#f59e0b'],
  });

  // Side cannons for extra celebration
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
    });
  }, 250);
};

// Use on goal completion
const handleCompleteGoal = async () => {
  await api.completeGoal(goalId);
  celebrateGoalCompletion();
  // Also trigger confetti on task completion that completes a goal
};
```

---

### Spatial Composition

**Layout Principles**:

- **Asymmetric Card Placement**: Tasks aren't in a boring grid—they flow with natural rhythm
- **Diagonal Flow**: Stats and badges flow diagonally across cards
- **Z-axis Layering**: Use shadows and overlaps to create depth
- **Generous Touch Targets**: Mobile-first means ≥44px tap areas

**Component Spacing**:

```css
:root {
  --space-xs: 0.25rem; /* 4px */
  --space-sm: 0.5rem; /* 8px */
  --space-md: 1rem; /* 16px */
  --space-lg: 1.5rem; /* 24px */
  --space-xl: 2rem; /* 32px */
  --space-2xl: 3rem; /* 48px */
  --space-3xl: 4rem; /* 64px */
}
```

**Card Elevation System**:

```css
.glass-panel {
  background: rgba(18, 24, 41, 0.6);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;

  /* Layered shadows for depth */
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.glass-panel:hover {
  border-color: var(--border-default);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 8px 24px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(6, 182, 212, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-1px);
  transition: all var(--duration-fast) var(--ease-smooth);
}

/* Elevated cards (modals, sheets) */
.elevated-panel {
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(6, 182, 212, 0.2);
}
```

**Geometric Accents**:

```css
/* Left border accent for task cards (4px for better mobile visibility) */
.task-card {
  border-left: 4px solid transparent;
  transition: border-color var(--duration-fast);
}

.task-card.completed {
  border-left-color: var(--success-primary);
}

.task-card.overdue {
  border-left-color: var(--warning-primary);
}

.task-card.scheduled {
  border-left-color: var(--accent-primary);
}

/* Diagonal corner accent */
.achievement-badge::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--success-primary) 0%, transparent 100%);
  clip-path: polygon(100% 0, 100% 100%, 0 0);
}
```

---

### Visual Details & Atmosphere

**Background Texture (Subtle Grain)**:

```css
body {
  background-color: var(--bg-primary);
  background-image:
    /* Noise texture for depth */
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"),
    /* Subtle gradient mesh */
    radial-gradient(ellipse at top, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse at bottom, rgba(132, 204, 22, 0.03) 0%, transparent 50%);
}
```

**Custom Checkbox Design**:

```css
.custom-checkbox {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-secondary);
  cursor: pointer;
  position: relative;
  transition: all var(--duration-fast);
}

.custom-checkbox:hover {
  border-color: var(--accent-primary);
  transform: scale(1.05);
}

.custom-checkbox.checked {
  background: linear-gradient(135deg, var(--success-primary) 0%, var(--success-secondary) 100%);
  border-color: var(--success-primary);
  box-shadow: 0 0 20px var(--success-glow);
}

.custom-checkbox.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  color: var(--bg-primary);
  font-weight: 900;
  font-size: 18px;
  animation: checkboxCheck var(--duration-normal) var(--ease-bounce) forwards;
}
```

**Progress Bar with Glow**:

```css
.progress-container {
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-primary) 0%, var(--success-primary) 100%);
  box-shadow: 0 0 20px var(--accent-primary-glow);
  position: relative;
}

/* Moving shine effect */
.progress-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  border-radius: 999px 999px 0 0;
}
```

**Floating Action Button**:

```css
.fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-primary-hover) 100%);
  box-shadow:
    0 8px 24px rgba(6, 182, 212, 0.4),
    0 0 60px rgba(6, 182, 212, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  position: fixed;
  bottom: 80px;
  right: 20px;
  z-index: 50;

  /* Icon */
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 300;
}

.fab:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow:
    0 12px 36px rgba(6, 182, 212, 0.6),
    0 0 80px rgba(6, 182, 212, 0.3);
}

.fab:active {
  transform: scale(0.95);
}
```

**Badge Styles**:

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-sm);
  border-radius: 6px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.badge-scope-yearly {
  background: rgba(251, 191, 36, 0.15);
  color: var(--scope-yearly);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.badge-scope-monthly {
  background: rgba(52, 211, 153, 0.15);
  color: var(--scope-monthly);
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.badge-count {
  background: var(--danger-primary);
  color: white;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}
```

---

### Implementation Notes

**CSS Variables Setup**:

```tsx
// apps/web/src/styles/design-system.css
:root {
  /* All variables defined above */
}

/* Dark theme (default) */
@media (prefers-color-scheme: dark) {
  :root {
    /* Already defined above */
  }
}

/* Optional: Light theme toggle */
[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  /* ... rest of light theme variables */
}
```

**Font Loading**:

```html
<!-- apps/web/index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap"
  rel="stylesheet"
/>
```

**Tailwind Config Extension**:

```js
// apps/web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo Black', 'Impact', 'sans-serif'],
        body: ['Work Sans', 'DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#06b6d4',
          hover: '#0891b2',
        },
        success: {
          DEFAULT: '#84cc16',
          secondary: '#65a30d',
        },
        // ... rest of custom colors
      },
      animation: {
        'task-complete': 'taskComplete 600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'progress-fill': 'progressFill 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        breathe: 'breathe 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
};
```

---

## 🏗️ ARCHITECTURE DECISION: Routes vs View State

### Why Use React Router (Pages) Instead of View State (Tabs)?

**Current Implementation** uses view state:

```tsx
const [viewMode, setViewMode] = useState<'goals' | 'tasks' | 'planner'>('planner');
{
  viewMode === 'goals' && <GoalsView />;
}
{
  viewMode === 'planner' && <PlannerPage />;
}
```

**New Implementation** uses React Router:

```tsx
<Routes>
  <Route path="/" element={<TodayPage />} />
  <Route path="/plan" element={<PlannerPage />} />
  <Route path="/goals" element={<GoalsView />} />
</Routes>
```

---

### Key Benefits of Routes

#### 1. **Mobile PWA Experience** ⭐⭐⭐⭐⭐

**Browser back button works naturally:**

```
User flow with Routes:
1. Opens app → /today
2. Taps "Plan" → /plan
3. Taps "Goals" → /goals
4. Taps back → /plan (stays in app!)
5. Taps back → /today (stays in app!)

User flow with View State:
4. Taps back → Exits app entirely ❌
```

Mobile users expect the back button to navigate through app history, not exit immediately.

#### 2. **Shareable URLs** ⭐⭐⭐⭐

```tsx
// User shares their daily routine
https://goaltracker.app/today

// User bookmarks their planning page
https://goaltracker.app/plan

// Accountability partner checks goals
https://goaltracker.app/goals

// With view state: All URLs are just "/"
```

#### 3. **Deep Linking from Notifications** ⭐⭐⭐⭐

```tsx
// Push notification: "You have 3 tasks due today"
notification.onclick = () => {
  window.open('https://goaltracker.app/today'); // Opens directly to today!
};

// With view state: Opens to default view, user must navigate manually
```

#### 4. **Code Splitting & Performance** ⭐⭐⭐

```tsx
// Lazy load pages - only load what's needed
const TodayPage = lazy(() => import('./pages/TodayPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const GoalsView = lazy(() => import('./pages/GoalsView'));

// User on /today doesn't load PlannerPage code
// Saves ~50-100KB initial bundle
```

#### 5. **Independent Component State** ⭐⭐⭐

```tsx
// Each page has its own isolated state
// PlannerPage.tsx
const [calendarDate, setCalendarDate] = useState(new Date());
const [viewMode, setViewMode] = useState('week');

// TodayPage.tsx
const [expandedGoals, setExpandedGoals] = useState(false);

// With view state: ALL state must live in parent App.tsx (messy!)
```

#### 6. **Better Testing** ⭐⭐⭐

```tsx
// Test pages independently
test('TodayPage shows today tasks', () => {
  render(
    <MemoryRouter initialEntries={['/today']}>
      <TodayPage />
    </MemoryRouter>
  );
  expect(screen.getByText('Today')).toBeInTheDocument();
});

// With view state: Must test entire App component for every test
```

#### 7. **Analytics & Tracking** ⭐⭐

```tsx
// Automatic page view tracking
useEffect(() => {
  analytics.track('Page View', { page: location.pathname });
}, [location.pathname]);

// With view state: Need custom event tracking for every view change
```

---

### Addressing Common Concerns

#### ❓ "Will switching between pages feel slow?"

**No!** React Router uses client-side navigation (no page reload):

```tsx
// This is INSTANT (no network request)
<Link to="/plan">Plan</Link>

// Same speed as:
<button onClick={() => setViewMode('plan')}>Plan</button>
```

Both are instant client-side transitions. The difference is routes give you all the benefits above.

---

#### ❓ "Will I lose state when navigating?"

**No!** State persists through multiple strategies:

**Strategy 1: Context (state persists across routes)**

```tsx
// TaskContext wraps entire app
<TaskProvider>
  <GoalProvider>
    <Routes>
      <Route path="/today" element={<TodayPage />} />
      <Route path="/plan" element={<PlannerPage />} />
    </Routes>
  </GoalProvider>
</TaskProvider>;

// Both pages access same tasks - no refetch needed
const { tasks } = useTaskContext(); // Same data everywhere
```

**Strategy 2: React Query / SWR (automatic caching)**

```tsx
// Data cached globally, survives navigation
const { data: tasks } = useQuery('tasks', fetchTasks, {
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Navigate to /plan and back - data still cached!
```

**Strategy 3: Scroll Position Restoration (built-in)**

```tsx
<BrowserRouter>
  <ScrollRestoration /> {/* Restores scroll on back */}
  <Routes>...</Routes>
</BrowserRouter>
```

---

#### ❓ "Is routing more complex to set up?"

**Not really!** Compare the code:

**View State (Current):**

```tsx
const [viewMode, setViewMode] = useState('planner');

<div className="tabs">
  <button onClick={() => setViewMode('goals')}>Goals</button>
  <button onClick={() => setViewMode('planner')}>Planner</button>
</div>;

{
  viewMode === 'goals' && <GoalsView />;
}
{
  viewMode === 'planner' && <PlannerPage />;
}
```

**Routes (Proposed):**

```tsx
import { Link, useLocation } from 'react-router-dom';

<nav className="tabs">
  <Link to="/goals">Goals</Link>
  <Link to="/plan">Plan</Link>
</nav>

<Routes>
  <Route path="/goals" element={<GoalsView />} />
  <Route path="/plan" element={<PlannerPage />} />
</Routes>
```

**Almost identical complexity**, but you get:

- ✅ Working back button
- ✅ Shareable URLs
- ✅ Deep linking
- ✅ Bookmarks
- ✅ Code splitting
- ✅ Better testing

---

### Navigation UI Implementation

The visual design stays the same - tabs look like tabs:

```tsx
function Navigation() {
  const location = useLocation();

  return (
    <nav className="flex gap-3 border-b border-white/10 pb-3">
      <Link
        to="/"
        className={`px-6 py-2 rounded transition-all ${
          location.pathname === '/'
            ? 'bg-cyan-500 font-semibold text-white'
            : 'bg-transparent text-white hover:bg-white/5'
        }`}
      >
        🏠 Today
      </Link>

      <Link
        to="/plan"
        className={`px-6 py-2 rounded transition-all ${
          location.pathname === '/plan'
            ? 'bg-cyan-500 font-semibold text-white'
            : 'bg-transparent text-white hover:bg-white/5'
        }`}
      >
        📅 Plan
      </Link>

      <Link
        to="/goals"
        className={`px-6 py-2 rounded transition-all ${
          location.pathname === '/goals'
            ? 'bg-cyan-500 font-semibold text-white'
            : 'bg-transparent text-white hover:bg-white/5'
        }`}
      >
        🎯 Goals
      </Link>
    </nav>
  );
}
```

**Result**: Looks identical to view state tabs, but with all the routing benefits!

---

### When Would View State Make Sense?

View state (tabs) is appropriate for:

- ❌ Admin settings panels (single page, non-shareable)
- ❌ Multi-step forms/wizards (linear flow)
- ❌ Modal sub-tabs (temporary context)
- ❌ Embedded widgets (no URL control)

**But for a standalone mobile PWA** where users:

- ✅ Use it daily
- ✅ Navigate frequently between sections
- ✅ May want to share/bookmark specific views
- ✅ Expect back button to work

**Routes are the clear winner.**

---

### Implementation in This Revamp

The route structure will be:

```tsx
<Routes>
  {/* DEFAULT: Today page */}
  <Route path="/" element={<TodayPage />} />

  {/* Secondary views */}
  <Route path="/plan" element={<PlannerPage />} />
  <Route path="/goals" element={<GoalsView />} />

  {/* Detail pages */}
  <Route path="/goals/:goalId" element={<GoalDetailsPage />} />

  {/* Auth */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/callback" element={<CallbackPage />} />
</Routes>
```

This structure provides:

1. Clear default landing (Today)
2. Memorable URLs (`/plan`, `/goals`)
3. Deep linking to specific goals
4. Auth flow separation

---

## 1️⃣ NEW: Today Tab (Home Screen)

### Purpose

Zero-click access to daily tasks and immediate completion tracking.

### Layout

```
┌─────────────────────────────────────┐
│ Today                                │
│ Sunday, February 2                   │
│ ✓ 3 done  ⊙ 5 remaining             │
├─────────────────────────────────────┤
│                                      │
│ ☐ [Large Checkbox] Task 1           │
│    🎯 Linked to: "Read 12 books"    │
│                               📅     │
│                                      │
│ ☐ [Large Checkbox] Task 2           │
│    🎯 Linked to: "Learn React"      │
│                               📅     │
│                                      │
│ ✓ [Checked] Completed Task          │
│                                      │
├─────────────────────────────────────┤
│ ▼ Goal Progress Today                │
│   - Read 12 books: 3/12 (25%)       │
│   - Learn React: 5/10 (50%)         │
└─────────────────────────────────────┘
        [+] Add Task (Floating)
```

### Key Features

1. **Large Touch Targets**
   - Checkboxes: 28px × 28px (vs current 20px)
   - Task cards: 64px min-height with 16px padding
   - All tappable areas ≥ 44px (Apple HIG guideline)

2. **Completion Stats**
   - Show "X done, Y remaining" at top
   - Real-time updates when tasks checked
   - Motivational feedback

3. **Goal Progress Section**
   - Collapsible accordion (default open)
   - Shows only goals with tasks due today
   - Progress bars with percentages

4. **Quick Actions**
   - Floating "+ Add Task" button (bottom-right)
   - Quick reschedule button (📅 icon) per task
   - No modals for checkbox toggle - instant feedback

### Implementation Details

**New File**: `apps/web/src/pages/TodayPage.tsx`

```tsx
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useTaskContext } from '@/contexts/TaskContext';
import { useGoalContext } from '@/contexts/GoalContext';
import { parseLocalDate } from '@/utils/dateUtils';

export function TodayPage() {
  const { tasks, toggleComplete } = useTaskContext();
  const { goals } = useGoalContext();
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Filter tasks for today
  const todayTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter(
      (task) => task.scheduledDate && parseLocalDate(task.scheduledDate).toDateString() === today
    );
  }, [tasks]);

  const completedCount = todayTasks.filter((t) => t.isCompleted).length;
  const remainingCount = todayTasks.length - completedCount;

  // Goals with tasks due today
  const activeGoals = useMemo(() => {
    const goalIds = new Set(todayTasks.flatMap((t) => t.goalTasks?.map((gt) => gt.goalId) || []));
    return goals.filter((g) => goalIds.has(g.id));
  }, [todayTasks, goals]);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Today</h1>
        <p className="text-gray-400 text-lg mt-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-green-400 font-medium">✓ {completedCount} completed</span>
          <span className="text-cyan-400 font-medium">⊙ {remainingCount} remaining</span>
        </div>
      </header>

      {/* Today's Tasks */}
      <section className="space-y-3 mb-8">
        {todayTasks.length === 0 ? (
          <div className="glass-panel p-8 text-center text-gray-400">
            <p>No tasks scheduled for today</p>
            <Button onClick={() => setShowQuickAdd(true)} className="mt-4">
              Add Your First Task
            </Button>
          </div>
        ) : (
          todayTasks.map((task) => (
            <div
              key={task.id}
              className="glass-panel p-4 flex items-start gap-4 hover:bg-white/5 transition-colors"
            >
              {/* Large Checkbox */}
              <Checkbox
                checked={task.isCompleted}
                onCheckedChange={() => toggleComplete(task.id)}
                className="h-7 w-7 mt-1 border-2"
              />

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <h3
                  className={`text-lg font-medium ${task.isCompleted ? 'line-through text-gray-500' : 'text-white'}`}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                )}

                {/* Linked Goals */}
                {task.goalTasks && task.goalTasks.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {task.goalTasks.map((gt) => (
                      <span
                        key={gt.goalId}
                        className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded border border-cyan-500/30"
                      >
                        🎯 {gt.goal.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Reschedule */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white"
                onClick={() => {
                  /* Open reschedule modal */
                }}
              >
                📅
              </Button>
            </div>
          ))
        )}
      </section>

      {/* Goal Progress */}
      {activeGoals.length > 0 && (
        <Accordion type="single" collapsible defaultValue="goals">
          <AccordionItem value="goals" className="border-none">
            <AccordionTrigger className="glass-panel px-4 py-3 hover:no-underline hover:bg-white/5">
              <span className="text-lg font-medium">Goal Progress Today</span>
            </AccordionTrigger>
            <AccordionContent className="pt-3 space-y-3">
              {activeGoals.map((goal) => {
                const percent = goal.targetValue
                  ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                  : 0;

                return (
                  <div key={goal.id} className="glass-panel p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-white">{goal.title}</span>
                      <span className="text-sm text-gray-400">
                        {goal.currentValue} / {goal.targetValue}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-gray-400 mt-1">
                      {percent.toFixed(0)}%
                    </div>
                  </div>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Floating Add Button */}
      <Button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-cyan-500 hover:bg-cyan-600"
        size="icon"
      >
        <span className="text-2xl">+</span>
      </Button>
    </div>
  );
}
```

**Update Routes**: `apps/web/src/App.tsx`

```tsx
// Change default route to Today page
<Route path="/" element={
  <ProtectedRoute>
    <TodayPage />
  </ProtectedRoute>
} />

// Add separate route for planner
<Route path="/plan" element={
  <ProtectedRoute>
    <PlannerPage />
  </ProtectedRoute>
} />
```

**Update Navigation Tabs**: `apps/web/src/App.tsx`

```tsx
// Replace current view mode tabs with route-based navigation
<nav className="flex gap-1 sm:gap-3 mb-6 sm:mb-8 border-b border-white/10 pb-2 sm:pb-3">
  <Link
    to="/"
    className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all ${
      location.pathname === '/'
        ? 'bg-cyan-500 font-semibold text-white'
        : 'bg-transparent text-white hover:bg-white/5'
    }`}
  >
    🏠 Today
  </Link>
  <Link
    to="/plan"
    className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all ${
      location.pathname === '/plan'
        ? 'bg-cyan-500 font-semibold text-white'
        : 'bg-transparent text-white hover:bg-white/5'
    }`}
  >
    📅 Plan
  </Link>
  <Link
    to="/goals"
    className={`px-3 sm:px-6 py-2 rounded text-sm sm:text-base transition-all ${
      location.pathname === '/goals'
        ? 'bg-cyan-500 font-semibold text-white'
        : 'bg-transparent text-white hover:bg-white/5'
    }`}
  >
    🎯 Goals
  </Link>
</nav>
```

---

## 2️⃣ OPTIMIZE: Plan Tab (Mobile-First Calendar)

### Purpose

Visual planning interface optimized for both mobile touch and desktop drag-and-drop.

### Mobile Layout (< 768px)

```
┌─────────────────────────────────────┐
│ Week View: Feb 2-8, 2026     [≡]    │
├─────────────────────────────────────┤
│ Sun   Mon   Tue   Wed   Thu   Fri...│
│  2     3     4     5     6     7     │
│ ┌─┐  ┌─┐  ┌─┐  ┌─┐  ┌─┐  ┌─┐       │
│ │ │  │T│  │T│  │ │  │T│  │ │       │
│ │T│  │ │  │T│  │ │  │ │  │ │       │
│ └─┘  └─┘  └─┘  └─┘  └─┘  └─┘       │
└─────────────────────────────────────┘

        [📋 3 Unscheduled] ← Floating badge
```

Tap badge → Opens bottom sheet with unscheduled tasks

### Desktop Layout (≥ 768px)

```
┌─────────────────────────────────────┬─────────────┐
│ Month View: February 2026     [≡]   │ Unscheduled │
├─────────────────────────────────────┤     (3)     │
│ Sun   Mon   Tue   Wed   Thu   Fri   │             │
│  2     3     4     5     6     7     │ □ Task 1    │
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐      │   [Drag me] │
│ │  │ │T1│ │T2│ │  │ │T1│ │  │      │             │
│ │T3│ │  │ │T3│ │  │ │  │ │  │      │ □ Task 2    │
│ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘      │   [Drag me] │
│                                      │             │
└─────────────────────────────────────┴─────────────┘
```

Drag from sidebar → Drop on calendar date

### Implementation Details

**Update**: `apps/web/src/pages/PlannerPage.tsx`

```tsx
import { useState, useMemo } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PlannerPage() {
  const { tasks, scheduleTask } = useTaskContext();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Default view based on device
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(() =>
    isMobile ? 'week' : 'month'
  );

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.scheduledDate && !t.isCompleted);
  }, [tasks]);

  const handleQuickSchedule = async (taskId: string, daysFromNow: number) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    await scheduleTask(taskId, date);
    setShowUnscheduled(false);
  };

  return (
    <div className="flex h-full gap-4">
      {/* MOBILE: Floating Badge + Bottom Sheet */}
      {isMobile ? (
        <>
          <Sheet open={showUnscheduled} onOpenChange={setShowUnscheduled}>
            <SheetTrigger asChild>
              <button className="fixed bottom-20 left-4 z-50 bg-cyan-500 hover:bg-cyan-600 rounded-full p-4 shadow-lg flex items-center gap-2">
                <span className="text-xl">📋</span>
                <Badge className="bg-red-500 text-white ml-1">{unscheduledTasks.length}</Badge>
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="h-[70vh]">
              <div className="mb-4">
                <h2 className="text-xl font-bold">Unscheduled Tasks</h2>
                <p className="text-sm text-gray-400">
                  {unscheduledTasks.length} tasks waiting to be scheduled
                </p>
              </div>

              <ScrollArea className="h-[calc(70vh-80px)]">
                <div className="space-y-2">
                  {unscheduledTasks.map((task) => (
                    <div key={task.id} className="glass-panel p-4 space-y-3">
                      <div>
                        <h3 className="font-medium text-white">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Quick Schedule Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSchedule(task.id, 0)}
                        >
                          Today
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSchedule(task.id, 1)}
                        >
                          Tomorrow
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickSchedule(task.id, 7)}
                        >
                          Next Week
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTask(task);
                            // Open date picker
                          }}
                        >
                          Pick Date...
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          {/* Calendar - Full Width on Mobile */}
          <div className="flex-1">
            <CalendarView
              viewMode={viewMode}
              onTaskClick={handleTaskClick}
              onDateClick={handleDateClick}
            />
          </div>
        </>
      ) : (
        // DESKTOP: Side Panel with Drag-and-Drop
        <>
          {/* Calendar - Takes most space */}
          <div className="flex-1">
            <CalendarView
              viewMode={viewMode}
              onTaskClick={handleTaskClick}
              onDateClick={handleDateClick}
            />
          </div>

          {/* Unscheduled Tasks - Right Sidebar */}
          <aside className="w-80 border-l border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Unscheduled</h2>
              <Badge variant="secondary">{unscheduledTasks.length}</Badge>
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {unscheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', task.id);
                      e.currentTarget.classList.add('opacity-50');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('opacity-50');
                    }}
                    className="glass-panel p-3 cursor-move hover:bg-white/5 transition-colors"
                  >
                    <h3 className="font-medium text-white text-sm line-clamp-2">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>#{task.size}d</span>
                      {task.goalTasks && task.goalTasks.length > 0 && (
                        <span className="text-cyan-400">🎯 {task.goalTasks[0].goal.title}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        </>
      )}
    </div>
  );
}
```

**New Hook**: `apps/web/src/hooks/useMediaQuery.ts`

```tsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

**Add shadcn/ui Sheet Component** (if not already present):

```bash
cd apps/web
npx shadcn-ui@latest add sheet
```

---

## 3️⃣ STREAMLINE: Goals Tab

### Changes

1. **Consolidate Action Buttons**
   - PRIMARY: "Log Progress" button (most common action)
   - SECONDARY: "•••" dropdown menu (Edit, Link, Create Tasks, Delete)

2. **Visual Cleanup**
   - Reduce from 6 buttons to 2 buttons per card
   - Better mobile readability
   - Less cognitive load

### Implementation

**Update**: `apps/web/src/components/Goals/GoalCard.tsx`

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Eye, Link, Edit2, Trash2 } from 'lucide-react';

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onUpdate }) => {
  // ... existing state ...

  return (
    <div className="glass-panel p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-1">{goal.title}</h3>
          {/* ... existing badges ... */}
        </div>

        {/* Simplified Actions */}
        <div className="flex gap-2 ml-4">
          {/* PRIMARY: Log Progress */}
          <Button
            onClick={() => setIsLogging(true)}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log
          </Button>

          {/* SECONDARY: Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate(`/goals/${goal.id}`)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setIsLinkingTasks(true)}>
                <Link className="w-4 h-4 mr-2" />
                Link Tasks
              </DropdownMenuItem>

              {(goal.scope === 'MONTHLY' || goal.scope === 'YEARLY') && (
                <DropdownMenuItem onClick={() => setIsCreatingTasks(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tasks
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Goal
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Goal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ... rest of card (progress, etc.) ... */}
    </div>
  );
};
```

**Install dropdown if needed**:

```bash
cd apps/web
npx shadcn-ui@latest add dropdown-menu
```

---

## 📱 Responsive Breakpoints

Use consistent breakpoints across all components:

```css
/* Mobile First */
- Default: < 640px (mobile portrait)
- sm: ≥ 640px (mobile landscape, small tablets)
- md: ≥ 768px (tablets)
- lg: ≥ 1024px (desktop)
- xl: ≥ 1280px (large desktop)
```

**Key Responsive Changes**:

- **< 768px**: Week view calendar, bottom sheet for unscheduled, large touch targets
- **≥ 768px**: Month view calendar, sidebar for unscheduled, drag-and-drop enabled

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Create `TodayPage.tsx` component
- [ ] Add `useMediaQuery` hook
- [ ] Update routing in `App.tsx` to add Today as default
- [ ] Update navigation tabs to use routes instead of view state
- [ ] Test Today page on mobile and desktop

### Phase 2: Mobile Optimization (Week 2)

- [ ] Install and configure shadcn/ui Sheet component
- [ ] Implement mobile bottom sheet for unscheduled tasks
- [ ] Add quick schedule buttons (Today, Tomorrow, Next Week)
- [ ] Update CalendarView to default to week view on mobile
- [ ] Test touch interactions and scrolling

### Phase 3: Desktop Enhancement (Week 3)

- [ ] Implement desktop sidebar for unscheduled tasks
- [ ] Ensure drag-and-drop still works on desktop
- [ ] Update CalendarView to default to month view on desktop
- [ ] Add hover states and cursor changes
- [ ] Test drag-and-drop workflow

### Phase 4: Goal Card Streamline (Week 4)

- [ ] Install shadcn/ui Dropdown Menu component
- [ ] Update GoalCard to use dropdown for secondary actions
- [ ] Test all actions still work correctly
- [ ] Ensure mobile dropdown works well
- [ ] Update GoalDetailsPage if needed

### Phase 5: Polish & Testing (Week 5)

- [ ] Add transitions and animations
- [ ] Test on real mobile devices (iOS Safari, Android Chrome)
- [ ] Test PWA install and functionality
- [ ] Performance testing (ensure no lag on older phones)
- [ ] Accessibility testing (keyboard navigation, screen readers)

---

## 🎨 Design Principles

### Mobile-First

- Start with mobile layout, enhance for desktop
- Touch targets ≥ 44px × 44px
- Single-column layouts on small screens
- Bottom sheets instead of sidebars

### Progressive Disclosure

- Show most common actions first
- Hide advanced options in menus
- Collapsible sections for optional content

### Zero-Click Defaults

- Today page = default landing
- Smart defaults for form fields
- Minimize modal dialogs

### Native Platform Feel

- Touch gestures on mobile (swipe, long-press)
- Drag-and-drop on desktop
- Keyboard shortcuts for power users

---

## 📊 Success Metrics

### Quantitative

- **Task Completion Time**: Should reduce by 50%
  - Before: 3 clicks to see today's tasks
  - After: 0 clicks (default page)

- **Scheduling Time**: Should reduce by 40%
  - Before: Drag from horizontal scroll or open modal
  - After: Tap badge → Select task → Tap "Today" (3 taps)

- **Mobile Usage**: Should increase by 30%
  - Better mobile UX will encourage mobile usage

### Qualitative

- Users should not need a tutorial
- First-time users should complete their first task within 2 minutes
- Mobile users should rate experience 4+ stars
- Zero complaints about "can't find X feature"

---

## 🔧 Technical Requirements

### Dependencies to Add

```bash
cd apps/web

# shadcn/ui components (if not already installed)
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add accordion  # If not already present
```

### Browser Support

- Chrome 90+ (mobile & desktop)
- Safari 14+ (iOS & macOS)
- Firefox 88+
- Edge 90+
- PWA support required

### Performance Targets

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse Score: > 90 (mobile)

---

## 🐛 Edge Cases to Consider

1. **Empty States**
   - No tasks scheduled for today
   - No unscheduled tasks
   - No goals created yet

2. **Large Data Sets**
   - 100+ tasks in unscheduled list
   - 50+ tasks on a single day
   - Scrolling performance

3. **Offline PWA**
   - Ensure Today page works offline
   - Cache task data properly
   - Show offline indicator

4. **Timezone Handling**
   - "Today" should use local timezone
   - Tasks scheduled in different timezone
   - DST transitions

5. **Device Rotation**
   - Mobile portrait ↔ landscape
   - Maintain scroll position
   - Re-layout calendar appropriately

---

## 💡 Future Enhancements (Post-MVP)

1. **Swipe Gestures**
   - Swipe right on task = mark complete
   - Swipe left on task = reschedule

2. **Keyboard Shortcuts**
   - Ctrl/Cmd + N = New task
   - Ctrl/Cmd + G = New goal
   - Ctrl/Cmd + P = Go to Planner

3. **Quick Actions**
   - Inline task creation (press Enter in empty cell)
   - Batch operations (select multiple tasks)

4. **Smart Scheduling**
   - AI suggestions for task scheduling
   - "Schedule similar tasks" button
   - Recurring tasks

5. **Notifications**
   - Push notifications for tasks due today
   - Reminder 30 min before scheduled time
   - Daily summary at morning

---

## 🧩 INCREMENTAL IMPLEMENTATION STRATEGY

**Goal**: Ship small, testable changes without breaking existing functionality.

### Strategy: Feature Flags + Gradual Rollout

Each chunk can be deployed independently and works alongside existing features. Users can test new features without losing access to old ones.

---

### **CHUNK 1: Goal Card Cleanup** ⭐ EASIEST - START HERE

**Time**: 2-3 hours | **Risk**: Low | **Value**: Immediate

**Why first?**

- Smallest change with visible impact
- No new dependencies required (use existing UI components)
- Doesn't affect routing or other pages
- Easy to revert if needed

**What to do:**

1. Install dropdown menu component
2. Update `GoalCard.tsx` to consolidate buttons
3. Test all existing actions still work
4. Deploy

**Files to change:**

- `apps/web/src/components/Goals/GoalCard.tsx` (1 file)

**Success criteria:**

- ✅ All 6 actions still accessible
- ✅ UI cleaner (2 buttons instead of 6)
- ✅ Works on mobile and desktop
- ✅ No regression in functionality

**Rollback plan:** Keep old GoalCard in `GoalCard.old.tsx` as backup

---

### **CHUNK 2: Mobile Unscheduled Tasks** ⭐⭐ MEDIUM EFFORT

**Time**: 4-6 hours | **Risk**: Low | **Value**: High

**Why second?**

- Addresses major mobile pain point
- Self-contained feature (doesn't affect other views)
- Can coexist with current horizontal scroll

**What to do:**

1. Install Sheet component
2. Add `useMediaQuery` hook
3. Update `PlannerPage.tsx` to add floating badge + bottom sheet
4. Keep existing horizontal scroll as fallback for desktop
5. Test on mobile device

**Files to change:**

- `apps/web/src/hooks/useMediaQuery.ts` (new file)
- `apps/web/src/pages/PlannerPage.tsx` (1 update)

**Feature flag approach:**

```tsx
const isMobile = useMediaQuery('(max-width: 768px)');

// Show new bottom sheet on mobile, keep old horizontal scroll on desktop
{
  isMobile ? <NewBottomSheet /> : <OldHorizontalScroll />;
}
```

**Success criteria:**

- ✅ Mobile users see floating badge with count
- ✅ Tapping badge opens bottom sheet
- ✅ Quick schedule buttons work (Today/Tomorrow/Next Week)
- ✅ Desktop still has existing horizontal scroll
- ✅ No breaking changes

---

### **CHUNK 3: Desktop Unscheduled Sidebar** ⭐⭐ MEDIUM EFFORT

**Time**: 3-4 hours | **Risk**: Low | **Value**: Medium

**Why third?**

- Completes the unscheduled tasks optimization
- Desktop users get better experience
- Builds on Chunk 2

**What to do:**

1. Update `PlannerPage.tsx` to show sidebar on desktop (≥768px)
2. Move drag-and-drop logic to sidebar
3. Remove horizontal scroll completely
4. Test drag-and-drop still works

**Files to change:**

- `apps/web/src/pages/PlannerPage.tsx` (1 update)
- `apps/web/src/components/Tasks/UnscheduledTasksContainer.tsx` (can delete after)

**Success criteria:**

- ✅ Desktop users see right sidebar with unscheduled tasks
- ✅ Drag-and-drop from sidebar to calendar works
- ✅ Mobile still has bottom sheet from Chunk 2
- ✅ Old horizontal scroll removed

---

### **CHUNK 4: Today Page (Route Only - No Default Yet)** ⭐⭐⭐ MODERATE EFFORT

**Time**: 6-8 hours | **Risk**: Medium | **Value**: Very High

**Why fourth?**

- Big feature but isolated to new route
- Doesn't affect existing workflows yet (not default)
- Users can manually navigate to test it

**What to do:**

1. Create `TodayPage.tsx` component with all features
2. Add route `/today` (NOT default yet)
3. Add optional nav link to test (hidden or in user menu)
4. Test thoroughly before making default

**Files to change:**

- `apps/web/src/pages/TodayPage.tsx` (new file)
- `apps/web/src/App.tsx` (add route, don't change default)

**Testing approach:**

```tsx
// In App.tsx - Add route but keep "/" as Planner for now
<Route path="/today" element={<TodayPage />} />
<Route path="/" element={<PlannerPage />} />  {/* Still default */}

// Optional: Add link in user menu for testing
<DropdownMenuItem onClick={() => navigate('/today')}>
  🧪 Try New Today View (Beta)
</DropdownMenuItem>
```

**Success criteria:**

- ✅ `/today` route shows new Today page
- ✅ Today's tasks displayed correctly
- ✅ Checkboxes work
- ✅ Completion stats update in real-time
- ✅ Goal progress shown
- ✅ Existing "/" route still works normally

---

### **CHUNK 5: Switch Default to Today Page** ⭐ EASY BUT CRITICAL

**Time**: 1 hour | **Risk**: Medium | **Value**: Very High

**Why fifth?**

- Only do this after Chunk 4 is thoroughly tested
- This is where users see the biggest workflow change
- Easy to revert if issues found

**What to do:**

1. Swap route priorities in `App.tsx`
2. Add navigation tabs (Today/Plan/Goals)
3. Update default landing behavior
4. Monitor user feedback

**Files to change:**

- `apps/web/src/App.tsx` (route changes + nav tabs)

**Implementation:**

```tsx
// Switch these:
<Route path="/" element={<TodayPage />} />      {/* NOW default */}
<Route path="/plan" element={<PlannerPage />} /> {/* Renamed */}
<Route path="/goals" element={<GoalsView />} />  {/* New route */}
```

**Rollback plan:**

- Keep a feature flag in localStorage
- If users report issues, add toggle to switch back to old default

**Success criteria:**

- ✅ Opening app shows Today page by default
- ✅ All 3 tabs work
- ✅ Navigation between tabs smooth
- ✅ URLs shareable
- ✅ Browser back button works correctly

---

### **CHUNK 6: Polish & Refinements** ⭐⭐ ONGOING

**Time**: Varies | **Risk**: Low | **Value**: Medium

**After core features work, iterate on:**

- Animations and transitions
- Touch target sizes (ensure ≥44px)
- Loading states
- Empty states
- Error handling
- Accessibility (keyboard nav, screen readers)
- Performance optimization

---

## 🎯 Recommended Implementation Order

### **Sprint 1: Quick Wins (Week 1)**

✅ Chunk 1: Goal Card Cleanup (Day 1-2)
✅ Chunk 2: Mobile Unscheduled Tasks (Day 3-5)

**Deliverable**: Mobile users have better unscheduled task management + cleaner goal cards

---

### **Sprint 2: Desktop Parity + Today Page (Week 2)**

✅ Chunk 3: Desktop Unscheduled Sidebar (Day 1-2)
✅ Chunk 4: Today Page (Route Only) (Day 3-5)

**Deliverable**: Desktop users have improved unscheduled tasks + Today page available for beta testing

---

### **Sprint 3: The Big Switch (Week 3)**

✅ Chunk 5: Make Today Page Default (Day 1)
✅ Chunk 6: Polish based on feedback (Day 2-5)

**Deliverable**: New workflow is default + refined based on real user feedback

---

## 🛡️ Risk Mitigation

### Feature Flags (Optional but Recommended)

Add simple localStorage feature flags for easy rollback:

```tsx
// apps/web/src/utils/featureFlags.ts
export const useFeatureFlag = (flag: string) => {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem(`feature_${flag}`);
    return stored ? JSON.parse(stored) : true; // Default to enabled
  });

  return { enabled, setEnabled };
};

// Usage in components:
const { enabled: useTodayPage } = useFeatureFlag('today_page');
const defaultRoute = useTodayPage ? '/today' : '/';
```

Add secret URL to toggle features:

- `/debug/features` - Show all feature flags with toggle switches

---

### Git Strategy

**Branch per chunk:**

```bash
git checkout -b chunk/1-goal-card-cleanup
# Make changes, test, commit
git push origin chunk/1-goal-card-cleanup
# Create PR, review, merge to main

git checkout -b chunk/2-mobile-unscheduled
# Repeat...
```

**Benefits:**

- Easy code review (small PRs)
- Can cherry-pick if needed
- Clear history of what changed when

---

### Testing Between Chunks

After each chunk:

1. **Manual testing**:
   - Test on real mobile device
   - Test on desktop
   - Test existing features still work

2. **Smoke test checklist**:
   - ✅ Can create a goal
   - ✅ Can create a task
   - ✅ Can schedule a task
   - ✅ Can mark task complete
   - ✅ Can log goal progress
   - ✅ Calendar still works

3. **Deploy to staging** (if available):
   - Test with real data
   - Share with beta users
   - Collect feedback

---

### Communication Plan

If you have users already:

- **Chunk 1-3**: Silent rollout (improvements, no workflow change)
- **Chunk 4**: Announce beta feature, invite testing
- **Chunk 5**: Announce new default, provide feedback channel
- **Chunk 6**: Iterate based on feedback

---

## 📋 Chunk-by-Chunk Checklist

### Chunk 1: Goal Card Cleanup ✅

- [ ] Install dropdown menu: `cd apps/web && npx shadcn-ui@latest add dropdown-menu`
- [ ] Backup current GoalCard: `cp apps/web/src/components/Goals/GoalCard.tsx apps/web/src/components/Goals/GoalCard.old.tsx`
- [ ] Update GoalCard component with dropdown
- [ ] Test all 6 actions work
- [ ] Test on mobile (tap dropdown, all items accessible)
- [ ] Test on desktop (hover states work)
- [ ] Commit: `git commit -m "feat: consolidate goal card actions into dropdown"`
- [ ] Deploy

### Chunk 2: Mobile Unscheduled Tasks ✅

- [ ] Install sheet: `cd apps/web && npx shadcn-ui@latest add sheet`
- [ ] Create useMediaQuery hook in `apps/web/src/hooks/useMediaQuery.ts`
- [ ] Update PlannerPage to show bottom sheet on mobile
- [ ] Add floating badge with count
- [ ] Implement quick schedule buttons (Today/Tomorrow/Next Week)
- [ ] Test on mobile (< 768px viewport)
- [ ] Test on desktop (≥ 768px still shows old horizontal scroll)
- [ ] Commit: `git commit -m "feat: add mobile bottom sheet for unscheduled tasks"`
- [ ] Deploy

### Chunk 3: Desktop Unscheduled Sidebar ✅

- [ ] Update PlannerPage to show sidebar on desktop (≥768px)
- [ ] Move drag-and-drop logic to sidebar
- [ ] Remove UnscheduledTasksContainer horizontal scroll
- [ ] Test drag-and-drop from sidebar to calendar
- [ ] Test mobile still uses bottom sheet
- [ ] Commit: `git commit -m "feat: add desktop sidebar for unscheduled tasks"`
- [ ] Deploy

### Chunk 4: Today Page (Route Only) ✅

- [ ] Create `apps/web/src/pages/TodayPage.tsx`
- [ ] Implement all Today page features (task list, completion stats, goal progress)
- [ ] Add `/today` route in App.tsx (NOT default yet)
- [ ] Add beta link in user menu for testing
- [ ] Test all features work correctly
- [ ] Test on mobile and desktop
- [ ] Share with beta testers
- [ ] Collect feedback, fix bugs
- [ ] Commit: `git commit -m "feat: add new Today page (beta route)"`
- [ ] Deploy

### Chunk 5: Switch Default to Today Page ✅

- [ ] Update App.tsx to make `/today` default route
- [ ] Rename old `/` to `/plan`
- [ ] Create `/goals` route for goals-only view
- [ ] Add navigation tabs (Today/Plan/Goals)
- [ ] Test all navigation works
- [ ] Test browser back/forward buttons
- [ ] Add feature flag for easy rollback (optional)
- [ ] Commit: `git commit -m "feat: make Today page default landing"`
- [ ] Announce to users
- [ ] Deploy
- [ ] Monitor feedback

### Chunk 6: Polish & Refinements ✅

- [ ] Add animations/transitions
- [ ] Verify touch target sizes
- [ ] Add loading states
- [ ] Add empty states
- [ ] Test accessibility (keyboard nav)
- [ ] Performance testing
- [ ] Fix any reported bugs
- [ ] Commit: `git commit -m "polish: UI refinements and bug fixes"`
- [ ] Deploy

---

## 📚 References

- Apple Human Interface Guidelines (Touch Targets): https://developer.apple.com/design/human-interface-guidelines/touchbar/
- Google Material Design (Mobile Best Practices): https://m3.material.io/
- PWA Best Practices: https://web.dev/pwa-checklist/
- Accessibility Guidelines (WCAG 2.1): https://www.w3.org/WAI/WCAG21/quickref/

---

## ✅ Checklist for Implementation

Use this checklist to track progress:

- [ ] Phase 1: Today Page Foundation
  - [ ] Create TodayPage component
  - [ ] Add useMediaQuery hook
  - [ ] Update routing
  - [ ] Update navigation tabs
  - [ ] Test on mobile and desktop

- [ ] Phase 2: Mobile Optimization
  - [ ] Install Sheet component
  - [ ] Implement bottom sheet
  - [ ] Add quick schedule buttons
  - [ ] Default to week view on mobile
  - [ ] Test touch interactions

- [ ] Phase 3: Desktop Enhancement
  - [ ] Implement desktop sidebar
  - [ ] Verify drag-and-drop works
  - [ ] Default to month view on desktop
  - [ ] Add hover states
  - [ ] Test drag workflow

- [ ] Phase 4: Goal Card Streamline
  - [ ] Install Dropdown Menu
  - [ ] Update GoalCard component
  - [ ] Test all actions
  - [ ] Test on mobile
  - [ ] Update related pages

- [ ] Phase 5: Polish & Testing
  - [ ] Add animations
  - [ ] Test on real devices
  - [ ] Test PWA functionality
  - [ ] Performance testing
  - [ ] Accessibility testing

---

**Document Version**: 1.0
**Last Updated**: February 2, 2026
**Status**: Ready for Implementation
