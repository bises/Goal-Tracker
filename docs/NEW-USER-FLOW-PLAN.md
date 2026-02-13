# Goal Tracker - New User Flow Implementation Plan

## Executive Summary

Restructure the app to prioritize **daily task completion** as the primary user experience, with goal progress visibility and minimal navigation overhead.

---

## Current State vs. Desired State

### Current State
- Landing page: Three equal tabs (Goals/Tasks/Planner)
- Task creation: 5+ clicks, 6 form fields, modal workflow
- Goal progress: Hidden in separate tabs/detail pages
- Navigation: Heavy context switching between tabs

### Desired State
- Landing page: "Today" view showing incomplete tasks + achievements + goal progress
- Task creation: Floating + button with quick creation
- Goal progress: Visible immediately on main page, updates in real-time
- Navigation: Minimal menu for Planner/Goals/Tasks

---

## Design System & Visual Identity

### Design Philosophy
The Goal Tracker redesign embraces a **bold, achievement-focused aesthetic** that celebrates progress and motivates daily action. The design must feel distinctive, energizing, and rewarding—avoiding generic productivity tool aesthetics.

### Selected Design Direction: **Energetic Achievement**

**Core Concept**: Transform task completion into a celebration. The UI should feel alive, responsive, and satisfying—like checking off items creates visible momentum toward meaningful goals.

---

### Typography

**Display Font (Headers, Today View Title, Goal Cards)**:
- **Primary Choice**: [Sora](https://fonts.google.com/specimen/Sora) - Bold, geometric, modern
- **Fallback**: Unbounded or Cabinet Grotesk
- **Usage**: 
  - Today page header: `font-size: 48px, font-weight: 700`
  - Goal section titles: `font-size: 32px, font-weight: 600`
  - Task titles: `font-size: 20px, font-weight: 600`

**Body Font (Task descriptions, UI copy)**:
- **Primary Choice**: [DM Sans](https://fonts.google.com/specimen/DM+Sans) - Clean, highly legible, friendly
- **Fallback**: Inter (existing)
- **Usage**:
  - Body text: `font-size: 16px, font-weight: 400, line-height: 1.6`
  - Small UI text: `font-size: 14px, font-weight: 500`

**Rationale**: Sora provides bold, distinctive personality for high-impact moments (goals, achievements). DM Sans maintains excellent readability for task descriptions without feeling generic.

**Font Pairing Example**:
```css
:root {
  --font-display: 'Sora', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
}

h1, h2, .goal-card-title {
  font-family: var(--font-display);
}

p, .task-description, button {
  font-family: var(--font-body);
}
```

---

### Color Palette

**Theme**: Warm Energetic (replaces current blue-cyan gradient)

**Primary Colors**:
- **Energy Orange**: `#FF6B35` (HSL: 14, 100%, 60%) - Primary CTAs, floating + button, achievement badges
- **Deep Amber**: `#FF8C42` (HSL: 28, 100%, 63%) - Progress bars at 75%+, goal completion indicators
- **Coral Accent**: `#FF4E50` (HSL: 359, 100%, 65%) - Urgent/overdue tasks, delete actions

**Secondary Colors**:
- **Deep Navy**: `#1A1F3A` (HSL: 229, 36%, 17%) - Primary background
- **Slate Blue**: `#2D3561` (HSL: 229, 37%, 28%) - Card backgrounds, elevated surfaces
- **Midnight Blue**: `#0F1419` (HSL: 210, 25%, 8%) - Deep background, contrast areas

**Neutral Colors**:
- **Warm White**: `#FAF9F6` (HSL: 40, 22%, 97%) - Primary text
- **Silver Gray**: `#9CA3AF` (HSL: 220, 9%, 65%) - Secondary text, icons
- **Charcoal**: `#4B5563` (HSL: 218, 11%, 34%) - Disabled states, borders

**Semantic Colors**:
- **Success Green**: `#10B981` (HSL: 160, 84%, 39%) - Completed tasks, checkmarks
- **Warning Yellow**: `#F59E0B` (HSL: 38, 92%, 50%) - Today's tasks, attention items
- **Info Blue**: `#3B82F6` (HSL: 221, 91%, 60%) - Goal links, informational badges

**Color Usage Guidelines**:
```css
:root {
  /* Primary Palette */
  --color-primary: #FF6B35;
  --color-primary-hover: #E55A2B;
  --color-primary-light: rgba(255, 107, 53, 0.15);
  
  /* Backgrounds */
  --color-bg-primary: #1A1F3A;
  --color-bg-elevated: #2D3561;
  --color-bg-deep: #0F1419;
  
  /* Text */
  --color-text-primary: #FAF9F6;
  --color-text-secondary: #9CA3AF;
  --color-text-tertiary: #4B5563;
  
  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-info: #3B82F6;
  --color-danger: #FF4E50;
}
```

**Gradient Usage** (for goal progress bars):
```css
.progress-bar-low {
  background: linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%);
}

.progress-bar-high {
  background: linear-gradient(90deg, #FF8C42 0%, #F59E0B 100%);
}

.progress-bar-complete {
  background: linear-gradient(90deg, #10B981 0%, #059669 100%);
}
```

---

### Spatial Design & Layout

**Layout Principles**:
1. **Asymmetric Balance**: Break away from perfect center alignment
2. **Breathing Room**: Generous whitespace around task cards (min 24px gaps)
3. **Visual Hierarchy**: Large type for "Today" (48px), medium for goals (32px), comfortable for tasks (20px)
4. **Focal Point**: Today's task list dominates (60% viewport), goals sidebar (40%)

**Today View Layout Structure**:
```
┌─────────────────────────────────────────────────────────┐
│  Header (Today · April 15, 2026)                    [☰]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────┐│
│  │   INCOMPLETE TASKS      │  │   GOAL PROGRESS      ││
│  │   (60% width)           │  │   (40% width)        ││
│  │                         │  │                      ││
│  │  □ Task 1 [Orange]      │  │  ▓▓▓▓▓▓▓▓▒▒ 75%      ││
│  │  □ Task 2 [Orange]      │  │  Yearly: Learn Code ││
│  │  □ Task 3 [Amber]       │  │                      ││
│  │                         │  │  ▓▓▓▓▓▒▒▒▒▒ 45%      ││
│  │  ─────────────────      │  │  Monthly: Ship v2   ││
│  │  ✓ You completed 4 today│  │                      ││
│  │     (click to expand)   │  │                      ││
│  └─────────────────────────┘  └──────────────────────┘│
│                                                          │
│                                             [+] Floating │
└─────────────────────────────────────────────────────────┘
```

**Card Design**:
- Border-radius: `16px` (rounded, friendly)
- Shadow: `0 4px 24px rgba(0, 0, 0, 0.25)` (elevated, tactile)
- Padding: `24px` (spacious, comfortable)
- Border: `2px solid` with status color on left edge

---

### Motion & Animation

**Animation Philosophy**: Satisfying, purposeful, never gratuitous. Every animation should reinforce the feeling of progress and achievement.

**Key Animations**:

1. **Task Completion** (400ms):
```css
@keyframes task-complete {
  0% { opacity: 1; transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { opacity: 0.7; transform: scale(0.98); }
}
```

2. **Goal Progress Bar Fill** (800ms ease-out):
```css
@keyframes progress-fill {
  from { width: 0%; }
  to { width: var(--target-width); }
}
```

3. **Floating + Button Pulse** (2s infinite):
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7); }
  50% { box-shadow: 0 0 0 16px rgba(255, 107, 53, 0); }
}
```

4. **Page Load Stagger** (tasks appear one by one):
```css
.task-card:nth-child(1) { animation-delay: 100ms; }
.task-card:nth-child(2) { animation-delay: 200ms; }
.task-card:nth-child(3) { animation-delay: 300ms; }

@keyframes slide-up-fade {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
```

5. **Achievement Celebration** (on goal completion):
- Confetti burst from goal card (using canvas-confetti library)
- Card scale pulse + glow effect
- Success sound (optional, 150ms chime)

**Performance Considerations**:
- Use `transform` and `opacity` only (GPU accelerated)
- Prefer CSS animations over JS where possible
- Respect `prefers-reduced-motion` media query

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Visual Details & Atmosphere

**Background Treatment**:
```css
body {
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 107, 53, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
    linear-gradient(180deg, #1A1F3A 0%, #0F1419 100%);
}
```

**Card Glassmorphism** (subtle, not overpowering):
```css
.glass-card {
  background: rgba(45, 53, 97, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(250, 249, 246, 0.1);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
```

**Texture Overlay** (adds depth without distraction):
```css
.grain-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0.03;
  background-image: url('/noise-texture.png');
  mix-blend-mode: overlay;
}
```

**Button Styles**:
```css
.floating-action-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  box-shadow: 
    0 8px 32px rgba(255, 107, 53, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.25);
  transition: transform 150ms ease-out;
}

.floating-action-btn:hover {
  transform: scale(1.1);
  box-shadow: 
    0 12px 48px rgba(255, 107, 53, 0.6),
    0 4px 12px rgba(0, 0, 0, 0.3);
}

.floating-action-btn:active {
  transform: scale(0.95);
}
```

---

### Component-Specific Design

#### **Today's Task Card**
```tsx
// Visual Structure
<div className="task-card" style={{
  borderLeft: '4px solid var(--color-primary)',
  background: 'var(--color-bg-elevated)',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  gap: '16px',
  alignItems: 'flex-start'
}}>
  <Checkbox size="24px" color="var(--color-success)" />
  <div className="task-content">
    <h3 style={{ 
      fontFamily: 'var(--font-display)', 
      fontSize: '20px',
      color: 'var(--color-text-primary)'
    }}>
      Task Title
    </h3>
    <p style={{
      fontFamily: 'var(--font-body)',
      fontSize: '14px',
      color: 'var(--color-text-secondary)',
      marginTop: '4px'
    }}>
      Description text...
    </p>
    <div className="task-meta" style={{ marginTop: '12px' }}>
      <Badge color="var(--color-warning)">📅 Today</Badge>
      <Badge color="var(--color-info)">🎯 Goal Name</Badge>
    </div>
  </div>
</div>
```

#### **Goal Progress Card**
```tsx
<div className="goal-progress-card" style={{
  background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
  border: '1px solid rgba(250, 249, 246, 0.15)',
  borderRadius: '20px',
  padding: '24px'
}}>
  <div className="goal-header">
    <span className="goal-scope-badge">📅 Yearly</span>
    <span className="goal-percentage">75%</span>
  </div>
  <h4 style={{ 
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    margin: '12px 0'
  }}>
    Learn Full-Stack Development
  </h4>
  <div className="progress-bar-container">
    <div className="progress-bar" style={{
      width: '75%',
      height: '8px',
      background: 'linear-gradient(90deg, #FF6B35 0%, #FF8C42 100%)',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(255, 107, 53, 0.4)'
    }} />
  </div>
  <p className="goal-meta">12 of 16 tasks complete</p>
</div>
```

#### **Completed Tasks Summary**
```tsx
<button className="completed-summary" style={{
  width: '100%',
  background: 'rgba(16, 185, 129, 0.1)',
  border: '2px dashed rgba(16, 185, 129, 0.3)',
  borderRadius: '12px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  transition: 'all 200ms ease'
}}>
  <div className="completed-text">
    <span style={{ fontSize: '32px' }}>🎉</span>
    <span style={{ 
      fontFamily: 'var(--font-display)',
      fontSize: '18px',
      marginLeft: '12px'
    }}>
      You completed <strong>4 tasks</strong> today
    </span>
  </div>
  <ChevronDown size={20} />
</button>
```

---

### Accessibility Considerations

**Color Contrast**:
- All text meets WCAG AA (4.5:1 for body, 3:1 for large text)
- Orange primary (#FF6B35) on dark navy (#1A1F3A) = 7.2:1 ✓
- White text (#FAF9F6) on dark navy = 14.8:1 ✓

**Focus States**:
```css
*:focus-visible {
  outline: 3px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Screen Reader Support**:
- All interactive elements have aria-labels
- Progress bars include `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Loading states announce via `aria-live="polite"`

**Keyboard Navigation**:
- Tab order follows visual hierarchy
- Escape closes modals
- Enter/Space activate buttons and checkboxes
- Arrow keys navigate between tasks

---

### Design Tokens (CSS Variables)

```css
:root {
  /* Typography */
  --font-display: 'Sora', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  
  /* Font Sizes */
  --text-xs: 12px;
  --text-sm: 14px;
  --text-base: 16px;
  --text-lg: 20px;
  --text-xl: 24px;
  --text-2xl: 32px;
  --text-3xl: 48px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
  --shadow-md: 0 4px 24px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.35);
  --shadow-glow: 0 0 24px rgba(255, 107, 53, 0.4);
  
  /* Timing Functions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

---

### Implementation Priority

**Phase 1** (MVP Design - Week 1):
- ✅ Update color palette to warm energetic theme
- ✅ Implement Sora + DM Sans fonts
- ✅ Create Today view layout structure
- ✅ Basic task card styling with orange accent

**Phase 2** (Interaction Design - Week 2):
- ✅ Add task completion animation
- ✅ Implement progress bar animations
- ✅ Style floating + button with pulse effect
- ✅ Add staggered page load animation

**Phase 3** (Polish - Week 3-4):
- ✅ Add grain texture overlay
- ✅ Implement glassmorphism cards
- ✅ Create achievement celebration (confetti)
- ✅ Refine hover states and micro-interactions

---

## Priority Categories

### 🔴 HIGH VALUE - Quick Wins (Implement First)
These provide maximum user value with minimal development effort.

#### 1. Create "Today" View Component
**User Value**: ⭐⭐⭐⭐⭐  
**Dev Effort**: Low  
**Dependencies**: None

**What it does**:
- Shows incomplete tasks scheduled for today
- Displays "You completed X tasks today" summary
- Shows goal progress cards (Yearly/Monthly/Weekly)

**Why it's valuable**:
- Addresses primary user need: "What do I need to do today?"
- Reduces cognitive load by focusing on immediate priorities
- Provides motivation through visible achievements

---

#### 2. Add Floating + Button for Quick Task Creation
**User Value**: ⭐⭐⭐⭐⭐  
**Dev Effort**: Low  
**Dependencies**: None

**What it does**:
- Fixed position button always visible
- Opens simplified task creation (Title + Date only)
- Auto-schedules to today by default

**Why it's valuable**:
- Reduces task creation from 5+ clicks to 2 clicks
- Removes friction from most frequent user action
- Users can capture tasks without leaving current view

---

#### 3. Inline Task Completion with Live Goal Updates
**User Value**: ⭐⭐⭐⭐⭐  
**Dev Effort**: Low  
**Dependencies**: Today view component

**What it does**:
- Checkbox to mark task complete
- Goal progress bars update immediately
- Visual celebration (animation/confetti) on completion

**Why it's valuable**:
- Creates satisfying feedback loop
- Shows immediate impact of task completion on goals
- Motivates continued engagement

---

#### 4. Completed Tasks Summary (Collapsible)
**User Value**: ⭐⭐⭐⭐  
**Dev Effort**: Very Low  
**Dependencies**: Today view component

**What it does**:
- Shows count: "You completed 4 tasks today"
- Click to expand and see completed task list
- Collapses by default to save space

**Why it's valuable**:
- Provides sense of achievement without clutter
- Saves screen real estate
- Optional detail view for users who want it

---

### 🟡 MEDIUM VALUE - Foundation Builders (Implement Second)
These enable the new flow but require more structural changes.

#### 5. Restructure App Navigation
**User Value**: ⭐⭐⭐⭐  
**Dev Effort**: Medium  
**Dependencies**: Today view must exist first

**What it does**:
- Make "Today" view the default landing page (route: `/`)
- Add minimal top navigation: Home | Planner | Goals | Tasks
- Remove full-width tab system

**Why it's valuable**:
- Reduces navigation friction
- Makes primary action (completing today's tasks) default
- Keeps secondary actions accessible but not intrusive

**Implementation notes**:
- Modify `App.tsx` routing
- Keep existing pages (PlannerPage, GoalDetailsPage) intact
- Add new route for Today view as default

---

#### 6. Goal Progress Cards on Today View
**User Value**: ⭐⭐⭐⭐  
**Dev Effort**: Medium  
**Dependencies**: Today view component

**What it does**:
- Show 3 categories: Yearly Goals | Monthly Goals | Weekly Goals
- Display progress bars for each goal
- Click goal card → Navigate to goal details
- Update progress when task is completed

**Why it's valuable**:
- Connects daily tasks to bigger picture
- Shows "why" behind today's work
- Motivates through visible progress

**Implementation notes**:
- Filter goals by scope and current period
- Use existing `GoalCard` component with modified layout
- Real-time progress updates via context refresh

---

#### 7. Streamline Task Creation Modal
**User Value**: ⭐⭐⭐⭐  
**Dev Effort**: Low-Medium  
**Dependencies**: Floating + button

**What it does**:
- Simplified form: Title (required), Date (defaults to today)
- Advanced options collapsed: Description, Size, Goal linking
- "Create & Add Another" option for batch creation

**Why it's valuable**:
- Reduces friction for quick task capture
- Power users can still access advanced options
- Supports batch task creation workflow

**Implementation notes**:
- Modify `AddTaskModal.tsx`
- Use progressive disclosure pattern
- Maintain existing validation

---

### 🟢 LOW VALUE - Nice to Have (Implement Last)
These are polish and enhancements after core flow is solid.

#### 8. Task Detail Click-Through
**User Value**: ⭐⭐⭐  
**Dev Effort**: Very Low  
**Dependencies**: Today view component

**What it does**:
- Click task title → Open task detail modal
- Edit task inline without navigation
- Close modal returns to Today view

**Why it's valuable**:
- Allows quick task edits
- Keeps user in primary workflow
- Already mostly implemented (reuse existing modal)

---

#### 9. Goal Detail Click-Through
**User Value**: ⭐⭐⭐  
**Dev Effort**: Low  
**Dependencies**: Goal progress cards on Today view

**What it does**:
- Click goal progress card → Navigate to goal details page
- Back button returns to Today view
- Shows full goal hierarchy and linked tasks

**Why it's valuable**:
- Provides context for goal progress
- Enables quick goal management
- Leverages existing GoalDetailsPage

---

#### 10. Achievement Animations
**User Value**: ⭐⭐⭐  
**Dev Effort**: Low  
**Dependencies**: Inline task completion

**What it does**:
- Confetti or celebratory animation on task completion
- Subtle progress bar animation on goal update
- Sound effect (optional, user preference)

**Why it's valuable**:
- Makes completion feel rewarding
- Increases user satisfaction
- Creates positive habit loop

---

#### 11. Weekly Goal Support (Currently Not Implemented)
**User Value**: ⭐⭐  
**Dev Effort**: High  
**Dependencies**: Backend schema changes

**What it does**:
- Add "WEEKLY" scope to goals (currently only Yearly/Monthly/Standalone)
- Filter and display weekly goals on Today view
- Track weekly progress separately

**Why it's valuable**:
- Fills gap in goal hierarchy
- Matches user mental model (week is common planning unit)
- Provides mid-term goal tracking

**Implementation notes**:
- Requires database migration
- Update API to support WEEKLY scope
- Modify goal filtering logic throughout app

---

## Implementation Roadmap

### Phase 1: MVP Today View (Week 1)
**Goal**: Users can see today's tasks and mark them complete

- [ ] Create `TodayPage.tsx` component
- [ ] Fetch and display tasks scheduled for today
- [ ] Add task completion checkboxes
- [ ] Show "X completed today" summary
- [ ] Make Today view the landing page (`/` route)

**Success Metric**: Users can complete daily tasks without navigating away

---

### Phase 2: Quick Task Creation (Week 1-2)
**Goal**: Reduce task creation friction

- [ ] Add floating + button component
- [ ] Simplify AddTaskModal (Title + Date only, advanced collapsed)
- [ ] Default scheduled date to today
- [ ] Test task creation flow (target: 2 clicks)

**Success Metric**: Task creation time reduced by 50%

---

### Phase 3: Goal Progress Integration (Week 2)
**Goal**: Show impact of task completion on goals

- [ ] Add goal progress cards to Today view
- [ ] Filter goals by period (Yearly/Monthly)
- [ ] Connect task completion to goal progress refresh
- [ ] Add click-through to goal details

**Success Metric**: Users can see goal progress update immediately after task completion

---

### Phase 4: Navigation Restructure (Week 3)
**Goal**: Minimize navigation overhead

- [ ] Add minimal top navigation (Home | Planner | Goals | Tasks)
- [ ] Remove full-width tab system
- [ ] Ensure all pages accessible from nav
- [ ] Add user menu (profile, logout)

**Success Metric**: 70% reduction in tab switching

---

### Phase 5: Polish & Enhancements (Week 4)
**Goal**: Improve user experience details

- [ ] Add completion animations
- [ ] Implement collapsible completed tasks section
- [ ] Add task/goal detail click-throughs
- [ ] Improve mobile responsiveness
- [ ] User testing and iteration

**Success Metric**: User satisfaction score improvement

---

### Phase 6: Advanced Features (Future)
**Goal**: Add weekly goals and advanced workflows

- [ ] Design WEEKLY goal scope (database schema)
- [ ] Backend API for weekly goals
- [ ] Frontend filtering and display
- [ ] Migration script for existing data

**Success Metric**: Users adopt weekly goal planning

---

## Technical Implementation Notes

### Files to Modify

**High Priority**:
- `apps/web/src/App.tsx` - Update routing, make Today view default
- `apps/web/src/pages/TodayPage.tsx` - NEW FILE - Main today view
- `apps/web/src/components/modals/AddTaskModal.tsx` - Simplify form
- `apps/web/src/components/Tasks/TaskCard.tsx` - Add inline completion

**Medium Priority**:
- `apps/web/src/components/Goals/GoalCard.tsx` - Compact version for Today view
- `apps/web/src/contexts/TaskContext.tsx` - Ensure real-time updates
- `apps/web/src/contexts/GoalContext.tsx` - Ensure real-time updates

**Low Priority**:
- `apps/web/src/components/shared/FloatingActionButton.tsx` - NEW FILE
- `apps/web/src/components/shared/AchievementAnimation.tsx` - NEW FILE

---

### Data Flow Requirements

**Real-time Updates**:
1. User checks task complete → `TaskContext.toggleComplete()`
2. Context updates local state AND calls API
3. API marks task complete AND recalculates goal progress
4. Context refreshes goal data via `GoalContext.fetchGoals()`
5. Goal progress cards re-render with new percentages

**Performance Considerations**:
- Cache today's tasks in context (avoid repeated API calls)
- Debounce goal progress recalculation (if multiple tasks completed rapidly)
- Optimistic UI updates (show checkmark immediately, rollback on error)

---

## Success Metrics

### Efficiency Metrics
- **Task completion time**: Target 3 seconds (from finding task to checking it off)
- **Task creation time**: Target 15 seconds (from clicking + to task saved)
- **Context switches**: Target <2 per session (vs. current ~8)

### User Satisfaction Metrics
- **Daily active engagement**: Target 80% of users check Today view daily
- **Task completion rate**: Target 70% of scheduled tasks completed
- **Feature adoption**: Target 90% of users use floating + button within first week

### Technical Metrics
- **Page load time**: Today view loads in <1 second
- **API calls**: Reduce by 40% through better caching
- **Mobile usability**: 90%+ of task completions successful on mobile

---

## Risk Mitigation

### Technical Risks
- **Data consistency**: Ensure goal progress updates atomically with task completion
- **Performance**: Monitor API load with real-time updates
- **Browser compatibility**: Test floating button and animations across browsers

### User Experience Risks
- **Change resistance**: Provide "Classic View" toggle during transition period
- **Feature discovery**: Add onboarding tooltip highlighting floating + button
- **Data loss**: Ensure all existing features remain accessible after restructure

---

## Rollback Plan

If new flow causes issues:
1. Keep old tab-based view available via route `/classic`
2. Add toggle in user menu: "Use new Today view" (default: on)
3. Monitor analytics for user preference
4. Iterate based on feedback before full deprecation

---

## Open Questions

1. Should completed tasks stay visible on Today view after refresh, or only show during current session?
2. Should floating + button open full modal or inline quick-add form?
3. How many goal progress cards to show? (All vs. top 3 in progress vs. user-selected)
4. Should Today view show overdue tasks from previous days?
5. What happens if user has no tasks scheduled for today? (Empty state with suggestions?)

---

## Appendix: User Flow Diagrams

### Current Flow (Task Creation + Completion)
```
Open App → Click Tasks Tab → Click + New Task → Fill 6 fields → 
Save → Click Planner Tab → Drag task to date → Go back to Tasks → 
Check off task → Click Goals Tab → See progress
```
**Total: 11 steps, 3+ context switches**

---

### New Flow (Task Creation + Completion)
```
Open App (lands on Today) → Click floating + → Enter title → 
Hit Enter → Task appears in Today list → Check off task → 
Goal progress updates on same page
```
**Total: 4 steps, 0 context switches**

---

## Conclusion

This phased approach allows you to:
1. **Start small** with Today view MVP (Phase 1)
2. **Validate quickly** with real users (Phases 2-3)
3. **Iterate safely** without breaking existing functionality
4. **Scale gradually** to full vision (Phases 4-6)

Each phase delivers standalone value while building toward the complete user experience redesign.
