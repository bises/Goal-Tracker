# Migration Example: Converting a Component to Theme-Aware

## Before (Hard-coded Tailwind classes)

```tsx
// TaskCard.tsx - OLD
export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-cyan-500">
      <h3 className="text-slate-100 font-semibold">{task.title}</h3>
      <p className="text-slate-400 text-sm">{task.description}</p>

      <div className="flex gap-2 mt-2">
        <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded">
          Complete
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded">
          Edit
        </button>
      </div>

      {task.isCompleted && <div className="mt-2 text-green-500 text-sm">✓ Completed</div>}
    </div>
  );
}
```

---

## After (Theme-aware classes)

```tsx
// TaskCard.tsx - NEW (works with both legacy and revamp!)
export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-bg-secondary rounded-lg p-4 border-l-4 border-accent">
      <h3 className="text-text-primary font-semibold">{task.title}</h3>
      <p className="text-text-secondary text-sm">{task.description}</p>

      <div className="flex gap-2 mt-2">
        <button
          className="
          bg-accent hover:bg-accent-hover
          text-white px-3 py-1 rounded
          transition-colors duration-fast
        "
        >
          Complete
        </button>
        <button
          className="
          bg-bg-tertiary hover:bg-bg-tertiary/80
          text-text-secondary px-3 py-1 rounded
          transition-colors duration-fast
        "
        >
          Edit
        </button>
      </div>

      {task.isCompleted && <div className="mt-2 text-success text-sm">✓ Completed</div>}
    </div>
  );
}
```

---

## What Changed?

| Old Class           | New Class               | Why?                                 |
| ------------------- | ----------------------- | ------------------------------------ |
| `bg-slate-800`      | `bg-bg-secondary`       | Adapts to theme background           |
| `text-slate-100`    | `text-text-primary`     | Theme-aware text color               |
| `text-slate-400`    | `text-text-secondary`   | Muted text that works in both themes |
| `border-cyan-500`   | `border-accent`         | Uses theme accent color              |
| `bg-cyan-500`       | `bg-accent`             | Primary action uses accent           |
| `hover:bg-cyan-600` | `hover:bg-accent-hover` | Hover state from theme               |
| `bg-slate-700`      | `bg-bg-tertiary`        | Secondary button background          |
| `text-green-500`    | `text-success`          | Success color from theme             |

---

## Benefits

✅ **Component now works with both themes** - No code changes needed to switch
✅ **Respects user's color preference** - Cyan or Orange automatically
✅ **Future-proof** - If design system changes, component adapts
✅ **Consistent** - Uses standardized color tokens

---

## Testing

```javascript
// 1. Test with legacy theme
localStorage.setItem('goal-tracker-theme', 'legacy');
location.reload();
// Should look exactly like before

// 2. Test with revamp theme (cyan)
localStorage.setItem('goal-tracker-theme', 'revamp');
localStorage.setItem('goal-tracker-color', 'cyan');
location.reload();
// Should have new Achievement Engine aesthetic

// 3. Test with revamp theme (orange)
localStorage.setItem('goal-tracker-color', 'orange');
location.reload();
// Accent color should change to warm orange
```

---

## Migration Checklist

When updating a component:

- [ ] Replace `slate-*` with `bg-bg-*` or `text-text-*`
- [ ] Replace `cyan-*` with `accent` or `accent-hover`
- [ ] Replace `green-*` with `success`
- [ ] Replace `amber-*`/`yellow-*` with `warning`
- [ ] Replace `red-*` with `danger`
- [ ] Add `transition-colors duration-fast` for smooth theme switches
- [ ] Test component in **both themes** (legacy + revamp)
- [ ] Test **both color schemes** if using revamp (cyan + orange)
- [ ] Verify on mobile and desktop

---

## Gradual Migration Strategy

**Start with high-impact components:**

1. ✅ TaskCard (most visible)
2. ✅ GoalCard (most visible)
3. ✅ CalendarView
4. Navigation/Header
5. Modals
6. Forms
7. Buttons/shared components

**Leave for later:**

- Rarely-used pages
- Admin-only features
- Error pages

**Goal:** Get 80% visual consistency with 20% effort
