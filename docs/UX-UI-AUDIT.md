# UX/UI Audit Report: Goal Tracker (Mobile-First)

**Date**: January 21, 2026
**Focus**: Mobile Usability, UI Coherence, and Responsive Design

---

## 🔴 CRITICAL ISSUES

### 1. Calendar View - Mobile Interaction Nightmare

**📍 Location**: `CalendarView.tsx` - Month/Week/Day views

**❌ What is wrong**:

- Fixed `min-height: 120px` on calendar days makes mobile scrolling painful
- Calendar grid uses 7 columns on all screen sizes (text becomes illegible on phones)
- Touch targets for tasks are too small (<44px recommended minimum)
- Long-press detection is implemented but competes with scroll gestures
- Horizontal scrolling in calendar cells (bad UX pattern)

**🤔 Why this hurts**:

- Users can't read dates on narrow screens
- Accidental task taps when trying to scroll
- Calendar takes up entire viewport, forcing vertical scroll
- Long-press (500ms) feels laggy compared to iOS/Android standards (400ms)

**✅ Suggestion**:

- **Mobile (<640px)**: Switch to single-column list view by default
- **Tablet (640-1024px)**: Use 7-day week view
- **Desktop (>1024px)**: Full month grid
- Add a toggle button to switch between list/grid views
- Reduce touch target density on mobile (show fewer days per screen)

**🛠️ Code Strategy**:

```tsx
const [isMobileLayout, setIsMobileLayout] = useState(window.innerWidth < 640);

// Mobile: List view with larger touch targets
<div className="flex flex-col gap-3">
  {dates.map((date) => (
    <div className="p-4 min-h-[80px] touch-manipulation">
      <div className="text-lg font-semibold">{date.toLocaleDateString()}</div>
      {/* Tasks as pills, not compact cards */}
    </div>
  ))}
</div>;
```

---

### 2. Unscheduled Tasks Bar - Horizontal Scroll Hell

**📍 Location**: `UnscheduledTasksContainer.tsx`

**❌ What is wrong**:

- Horizontal scrolling for unscheduled tasks at top of planner
- No indication that more tasks exist off-screen
- Tiny scroll area (height: ~40px makes it hard to grab)
- Competes with vertical page scroll on mobile

**🤔 Why this hurts**:

- Users don't realize tasks are there (no visual affordance)
- Horizontal + vertical scrolling = cognitive overload
- Hard to drag-and-drop on touch devices
- Scrollbar barely visible on mobile

**✅ Suggestion**:

- **Mobile**: Convert to expandable drawer/accordion
- Show "X unscheduled tasks" badge with count
- Tap to expand into full-screen bottom sheet
- Use swipe gestures to schedule (Tinder-style)

**🛠️ Code Strategy**:

```tsx
// Mobile: Collapsible chip with count
<div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
  <button
    onClick={() => setShowUnscheduled(!showUnscheduled)}
    className="w-full p-3 flex items-center justify-between"
  >
    <span>📋 Unscheduled Tasks</span>
    <span className="bg-cyan-500 rounded-full px-3 py-1 text-sm">{tasks.length}</span>
  </button>

  {/* Bottom sheet on mobile */}
  <Sheet open={showUnscheduled}>
    <SheetContent side="bottom" className="h-[80vh]">
      {/* Scrollable task list */}
    </SheetContent>
  </Sheet>
</div>
```

---

### 3. Modal Forms - Keyboard Blocking Content

**📍 Location**: All modal components (AddGoalModal, AddTaskModal, etc.)

**❌ What is wrong**:

- Modals don't account for virtual keyboard height on mobile
- Form inputs get hidden behind keyboard
- No scroll handling when keyboard appears
- Fixed height modals (`maxHeight: 80vh`) don't adjust
- Close button (X) often unreachable when keyboard is open

**🤔 Why this hurts**:

- Users can't see what they're typing
- Can't reach submit button without closing keyboard
- Can't see validation errors
- Frustrating form abandonment

**✅ Suggestion**:

- Add `position: fixed; bottom: 0` for mobile forms
- Use viewport height units with keyboard detection
- Auto-scroll focused input to visible area
- Add "Done" button in keyboard toolbar
- Use native bottom sheet pattern instead of centered modals

**🛠️ Code Strategy**:

```tsx
// Detect keyboard open
useEffect(() => {
  const handleResize = () => {
    const isKeyboardOpen = window.innerHeight < window.screen.height * 0.75;
    setKeyboardVisible(isKeyboardOpen);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// Mobile-optimized Modal
<Dialog>
  <DialogContent
    className={cn(
      'sm:max-w-md', // Desktop: centered
      'max-sm:fixed max-sm:bottom-0 max-sm:w-full max-sm:rounded-t-2xl', // Mobile: bottom sheet
      keyboardVisible && 'max-sm:max-h-[45vh]' // Shrink when keyboard open
    )}
  >
    {/* Form content with internal scroll */}
  </DialogContent>
</Dialog>;
```

---

### 4. Touch Target Sizes - Too Small

**📍 Location**: GoalCard, TaskCard, Calendar navigation buttons

**❌ What is wrong**:

- Edit/Delete icons are 18-20px (below 44px minimum)
- Calendar navigation chevrons too small
- Task checkboxes are 20x20px (should be 44x44px minimum)
- Action buttons in cards have insufficient padding

**🤔 Why this hurts**:

- Misclicks and frustration
- Accessibility failure (WCAG 2.1 requires 44x44px)
- Users with larger fingers or motor impairments can't use app
- Increased cognitive load from precision requirements

**✅ Suggestion**:

- Minimum 44x44px touch targets for ALL interactive elements
- Add padding around small icons to increase hit area
- Use icon buttons with explicit size classes
- Add visual pressed states (scale down on touch)

**🛠️ Code Strategy**:

```tsx
// Before: Too small
<button className="p-2">
  <Edit2 size={18} />
</button>

// After: Proper touch target
<button className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 transition-transform">
  <Edit2 size={20} />
</button>

// Or use Tailwind plugin
className="touch-target-44" // Custom utility class
```

---

### 5. Navigation - No Clear Back/Home Pattern

**📍 Location**: GoalDetailsPage, general navigation

**❌ What is wrong**:

- Back button is a tiny chevron icon (see issue #4)
- No persistent bottom navigation bar
- No breadcrumbs or location indicator
- Browser back button is only way to navigate on mobile

**🤔 Why this hurts**:

- Users get lost in deep navigation
- No quick way to jump between goals/tasks/planner
- Tiny back button is hard to tap while walking/one-handed use
- No thumb-zone optimized navigation

**✅ Suggestion**:

- Add persistent bottom tab bar (Goals | Tasks | Planner)
- Use native mobile navigation patterns
- Larger back button in top-left
- Swipe-from-edge gesture to go back
- Add floating action button (FAB) for primary actions

**🛠️ Code Strategy**:

```tsx
<div className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur border-t border-white/10 safe-area-inset-bottom">
  <nav className="flex justify-around py-2 px-4">
    <NavButton icon={Target} label="Goals" to="/" />
    <NavButton icon={CheckSquare} label="Tasks" to="/tasks" />
    <NavButton icon={Calendar} label="Planner" to="/planner" />
  </nav>
</div>

// FAB for primary action
<button className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg active:scale-95">
  <Plus size={24} />
</button>
```

---

## 🟡 HIGH PRIORITY ISSUES

### 6. Typography - Poor Mobile Readability

**📍 Location**: Global styles, all components

**❌ What is wrong**:

- Base font size unclear (mix of px and rem)
- `text-xs` (0.75rem/12px) used extensively - too small on mobile
- Line height not optimized for reading
- Long text blocks have no max-width for readability
- Insufficient contrast in many areas (slate-400 on dark bg)

**🤔 Why this hurts**:

- Eye strain, especially in low light
- Older users or users with vision impairment can't read
- WCAG AAA contrast failure
- Poor information hierarchy

**✅ Suggestion**:

```css
/* Mobile-first typography scale */
:root {
  /* Base: 16px on mobile, 18px on desktop */
  font-size: 16px;

  @media (min-width: 768px) {
    font-size: 18px;
  }
}

/* Never go below 14px for body text on mobile */
.text-body-sm {
  font-size: 0.875rem;
} /* 14px */
.text-body {
  font-size: 1rem;
} /* 16px */
.text-body-lg {
  font-size: 1.125rem;
} /* 18px */

/* Increase contrast */
--color-text-muted: #cbd5e1; /* slate-300 instead of slate-400 */
```

---

### 7. Forms - Mobile Input Frustrations

**📍 Location**: AddGoalModal, AddTaskModal, AddProgressModal

**❌ What is wrong**:

- Input type not specified (triggers generic keyboard)
- No autocomplete attributes
- No input labels with `for` attribute
- Required fields not clearly marked
- Error messages not positioned near inputs
- Date pickers use native HTML5 (inconsistent UX)

**🤔 Why this hurts**:

- Wrong keyboard appears (number vs text vs email)
- Can't use browser autofill
- Screen readers can't associate labels
- Users don't know what's required until submit fails

**✅ Suggestion**:

```tsx
<div className="space-y-1">
  <label
    htmlFor="goal-title"
    className="text-sm font-medium flex items-center gap-1"
  >
    Goal Title
    <span className="text-red-400">*</span>
  </label>
  <input
    id="goal-title"
    type="text"
    inputMode="text"
    autoComplete="off"
    required
    aria-required="true"
    aria-invalid={!!error}
    aria-describedby="title-error"
    className="..."
  />
  {error && (
    <p id="title-error" className="text-sm text-red-400 mt-1">
      {error}
    </p>
  )}
</div>

// Number inputs
<input
  type="number"
  inputMode="decimal" // Shows number keyboard on mobile
  pattern="[0-9]*" // iOS hint
/>
```

---

### 8. Spacing & Layout Density

**📍 Location**: GoalCard, TaskCard, Calendar cells

**❌ What is wrong**:

- Inconsistent padding (mix of px/rem and Tailwind classes)
- Content too dense on mobile (feels cramped)
- No breathing room between interactive elements
- Badges/tags have insufficient spacing
- Cards have too much content in small space

**🤔 Why this hurts**:

- Visual overwhelm
- Accidental taps on wrong elements
- Hard to scan and find information
- Looks unprofessional/cluttered

**✅ Suggestion**:

```css
/* Establish consistent spacing scale */
--space-xs: 0.25rem; /* 4px */
--space-sm: 0.5rem; /* 8px */
--space-md: 1rem; /* 16px */
--space-lg: 1.5rem; /* 24px */
--space-xl: 2rem; /* 32px */
--space-2xl: 3rem; /* 48px */

/* Mobile: Increase card padding */
.glass-panel {
  padding: var(--space-lg); /* 24px */

  @media (min-width: 768px) {
    padding: var(--space-xl); /* 32px */
  }
}

/* Add gap between action buttons */
.action-buttons {
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
}
```

---

### 9. Loading States - No Skeleton/Shimmer

**📍 Location**: GoalDetailsPage (good example), but missing in other areas

**❌ What is wrong**:

- Some components show nothing while loading
- Inconsistent loading indicators
- No progressive loading for images/data
- Skeleton in GoalDetailsPage is good but not reused

**🤔 Why this hurts**:

- Perceived slow performance
- Layout shift when content loads (CLS issue)
- Users don't know if app is working or frozen

**✅ Suggestion**:

- Extract skeleton components to shared library
- Add shimmer animation
- Show skeleton for all async data
- Use Suspense boundaries

---

### 10. Drag & Drop on Mobile - Doesn't Work

**📍 Location**: CalendarView, UnscheduledTasksContainer

**❌ What is wrong**:

- HTML5 drag API doesn't work on most mobile browsers
- No touch-specific drag implementation
- Visual feedback missing during drag
- No haptic feedback

**🤔 Why this hurts**:

- Primary feature (scheduling tasks) broken on mobile
- Users forced to use modal workarounds
- Looks like a bug, not intentional

**✅ Suggestion**:

- Use a library like `dnd-kit` or `react-beautiful-dnd` for touch support
- Add visual drag handles
- Provide alternative: long-press → context menu → "Schedule for..."
- Add swipe gestures as alternative

**🛠️ Code Strategy**:

```tsx
import { DndContext, useSensor, TouchSensor, MouseSensor } from '@dnd-kit/core';

const sensors = [
  useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  }),
  useSensor(MouseSensor),
];

<DndContext sensors={sensors}>{/* Your draggable content */}</DndContext>;
```

---

## 🟢 MEDIUM PRIORITY ISSUES

### 11. Color System - Inconsistent & Poor Contrast

**❌ Issues**:

- Mixing HSL and OKLCH in design-system.css
- Slate-400 text on dark backgrounds fails WCAG AA
- No systematic color tokens
- Gradient overuse (hard to read text on gradients)

**✅ Fix**:

```css
:root {
  /* Semantic color system */
  --color-bg-primary: #0f172a; /* slate-900 */
  --color-bg-secondary: #1e293b; /* slate-800 */
  --color-text-primary: #f8fafc; /* slate-50 - WCAG AAA */
  --color-text-secondary: #cbd5e1; /* slate-300 - WCAG AA */
  --color-text-tertiary: #94a3b8; /* slate-400 - Use sparingly */

  /* Interactive colors */
  --color-interactive-default: #3b82f6;
  --color-interactive-hover: #2563eb;
  --color-interactive-active: #1d4ed8;
  --color-interactive-disabled: #64748b;
}
```

---

### 12. Inline Styles Everywhere

**📍 Location**: Nearly all components

**❌ Issues**:

- Mixing inline styles with Tailwind classes
- Hard to maintain and override
- No consistency in styling approach
- Can't benefit from Tailwind purge optimization

**✅ Fix**:

- Move all inline styles to Tailwind utilities or CSS modules
- Use `cn()` utility for conditional classes
- Extract repeated patterns to component variants

---

### 13. No Empty States

**📍 Location**: Goal list, task list, calendar days

**❌ Issues**:

- When no data exists, shows blank space or generic message
- No call-to-action to add first item
- Confusing for new users

**✅ Fix**:

```tsx
{goals.length === 0 ? (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
      <Target size={40} className="text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
    <p className="text-slate-400 mb-6 max-w-sm">
      Start tracking your progress by creating your first goal
    </p>
    <button onClick={() => setShowAddGoal(true)} className="primary-btn">
      Create Your First Goal
    </button>
  </div>
) : (
  // Show goals
)}
```

---

### 14. No Feedback for Actions

**❌ Issues**:

- Button clicks have no loading state
- No success confirmation (except toast sometimes)
- No undo for destructive actions
- Toast messages inconsistent

**✅ Fix**:

- Add loading spinners to async buttons
- Show success animation (checkmark)
- Add "Undo" to destructive actions (like Gmail)
- Use consistent toast position and duration

---

### 15. Fixed-Width Components on Small Screens

**📍 Location**: Modal width settings, calendar grid

**❌ Issues**:

- `maxWidth="500px"` on modals wastes space on tablets
- Calendar view doesn't adapt between phone/tablet
- No container queries

**✅ Fix**:

```tsx
<Modal
  maxWidth="min(500px, calc(100vw - 2rem))" // Never exceed viewport
  className="w-full sm:w-[500px]" // Full width on mobile
>
```

---

## 📊 TOP 10 PRIORITIES (Ranked by Impact)

| Priority | Issue                                 | Impact      | Effort | Quick Win? |
| -------- | ------------------------------------- | ----------- | ------ | ---------- |
| 1        | Fix touch targets (44px minimum)      | 🔴 Critical | Low    | ✅ Yes     |
| 2        | Mobile calendar layout (list view)    | 🔴 Critical | High   | ❌ No      |
| 3        | Modal keyboard handling               | 🔴 Critical | Medium | ⚠️ Maybe   |
| 4        | Add bottom tab navigation             | 🔴 Critical | Medium | ⚠️ Maybe   |
| 5        | Fix unscheduled tasks UI              | 🔴 Critical | Medium | ⚠️ Maybe   |
| 6        | Typography & contrast fixes           | 🟡 High     | Low    | ✅ Yes     |
| 7        | Form input types & labels             | 🟡 High     | Low    | ✅ Yes     |
| 8        | Consistent spacing system             | 🟡 High     | Medium | ⚠️ Maybe   |
| 9        | Replace drag-drop with touch gestures | 🟡 High     | High   | ❌ No      |
| 10       | Empty states & CTAs                   | 🟢 Medium   | Low    | ✅ Yes     |

---

## 🎨 MOBILE-FIRST DESIGN PRINCIPLES TO FOLLOW

### 1. **Thumb Zone Optimization**

- Place primary actions in bottom 1/3 of screen
- Avoid putting critical buttons in top corners
- Use bottom sheets instead of top modals

### 2. **Progressive Disclosure**

- Show less content initially, expand on demand
- Use accordions, tabs, and collapsed sections
- Avoid information overload on small screens

### 3. **Touch-First Interactions**

- Swipe gestures for common actions (delete, complete)
- Long-press for context menus
- Pull-to-refresh for data updates
- No hover states (use active/pressed instead)

### 4. **Responsive Typography**

- Start with mobile sizes, scale up for desktop
- Use `clamp()` for fluid typography
- Never use text smaller than 14px on mobile

### 5. **Vertical Rhythm**

- Mobile is primarily vertical scrolling
- Avoid horizontal scrolling (except carousels with clear affordance)
- Stack content vertically, use horizontal layout only on desktop

### 6. **Performance First**

- Lazy load off-screen content
- Use skeleton loaders
- Optimize images with responsive sizes
- Bundle splitting for faster initial load

### 7. **Accessibility = Mobile UX**

- If it works for screen readers, it works for mobile
- Proper semantic HTML
- Focus management
- Keyboard navigation support

---

## 🔄 BEFORE VS AFTER DESIGN DIRECTION

### BEFORE (Current State)

- ❌ Desktop-first layout forced onto mobile
- ❌ Complex calendar grid illegible on phones
- ❌ Horizontal scrolling everywhere
- ❌ Tiny touch targets and buttons
- ❌ Modals block content, keyboard issues
- ❌ No clear navigation hierarchy
- ❌ Drag-and-drop doesn't work on touch
- ❌ Inconsistent spacing and typography

### AFTER (Target State)

- ✅ **Mobile-first** with progressive enhancement
- ✅ Calendar switches to list view on mobile
- ✅ Bottom tab navigation for easy access
- ✅ All touch targets 44px+ with proper spacing
- ✅ Bottom sheets for forms (keyboard-aware)
- ✅ Swipe gestures for actions
- ✅ Touch-enabled drag-and-drop (or alternatives)
- ✅ Consistent design system with proper contrast
- ✅ Clear visual hierarchy and breathing room
- ✅ Loading states and empty states everywhere
- ✅ Haptic feedback for important actions

---

## 🛠️ IMMEDIATE ACTION ITEMS

### Week 1: Quick Wins

- [ ] Fix all touch target sizes to 44px minimum
- [ ] Improve text contrast (slate-400 → slate-300)
- [ ] Add proper input types and labels
- [ ] Create empty state components
- [ ] Add loading states to buttons

### Week 2: Navigation & Forms

- [ ] Implement bottom tab bar
- [ ] Fix modal keyboard handling
- [ ] Add form validation feedback
- [ ] Improve back button visibility

### Week 3: Calendar & Lists

- [ ] Refactor calendar for mobile (list view)
- [ ] Fix unscheduled tasks container
- [ ] Remove or fix drag-and-drop on mobile
- [ ] Add swipe gestures

### Week 4: Polish

- [ ] Establish consistent spacing system
- [ ] Extract reusable components
- [ ] Add animations and transitions
- [ ] Performance optimization
- [ ] User testing session

---

## 📚 RECOMMENDED LIBRARIES

1. **@dnd-kit/core** - Touch-enabled drag and drop
2. **vaul** - Bottom sheet/drawer component (mobile native feel)
3. **react-swipeable** - Swipe gesture detection
4. **framer-motion** - Smooth animations (you already have this!)
5. **react-hook-form** - Better form handling
6. **zod** - Form validation
7. **react-use** - Useful hooks (useMediaQuery, useKeyPress, etc.)

---

## 📝 TESTING CHECKLIST

- [ ] Test on real devices (not just browser DevTools)
- [ ] Test with different text sizes (accessibility settings)
- [ ] Test with one hand / thumb only
- [ ] Test with gloves or wet fingers
- [ ] Test in bright sunlight (contrast check)
- [ ] Test with slow network (loading states)
- [ ] Test with 0 data (empty states)
- [ ] Run Lighthouse accessibility audit
- [ ] Test with VoiceOver / TalkBack

---

**Next Steps**: Would you like me to start implementing any of these fixes? I recommend starting with #1 (Touch Targets) and #6 (Typography) as they are quick wins with high impact.
