# Theme Switcher Guide

## Quick Start

### Test New Design Locally

**Option 1: Browser Console** (instant, no restart)

```javascript
localStorage.setItem('goal-tracker-theme', 'revamp');
location.reload();
```

**Option 2: Environment Variable** (persistent)

```bash
# Create .env.local in apps/web/
echo "VITE_THEME=revamp" > apps/web/.env.local
pnpm dev
```

**Switch back to legacy:**

```javascript
localStorage.setItem('goal-tracker-theme', 'legacy');
location.reload();
```

---

## Color Schemes (Revamp Only)

Try both color options:

**Cyan** (tech-forward, energetic):

```javascript
localStorage.setItem('goal-tracker-color', 'cyan');
location.reload();
```

**Orange** (warm, achievement-focused):

```javascript
localStorage.setItem('goal-tracker-color', 'orange');
location.reload();
```

---

## Production Deployment

### Keep Legacy in Production

```bash
# .env.production
VITE_THEME=legacy
```

### Deploy Revamp When Ready

```bash
# .env.production
VITE_THEME=revamp
VITE_COLOR_SCHEME=cyan  # or orange
```

---

## Developer Tools

When running `pnpm dev`, these utilities are available in console:

```javascript
// Check current theme
window.themeUtils.getTheme(); // 'legacy' | 'revamp'
window.themeUtils.getColorScheme(); // 'cyan' | 'orange'

// Switch themes
window.themeUtils.setTheme('revamp');
window.themeUtils.setColorScheme('orange');

// Toggle between themes
window.themeUtils.toggleTheme();
```

---

## Using Theme Classes

**Same classes work with both themes!**

```tsx
// Before (hard-coded colors)
<div className="bg-slate-800 text-slate-100">

// After (theme-aware)
<div className="bg-bg-primary text-text-primary">
```

### Available Theme Classes

**Backgrounds:**

- `bg-bg-primary` - Main background
- `bg-bg-secondary` - Cards, containers
- `bg-bg-tertiary` - Hover states

**Text:**

- `text-text-primary` - Main text
- `text-text-secondary` - Subtext
- `text-text-tertiary` - Muted text

**Accent:**

- `text-accent` or `bg-accent` - Primary accent color
- `hover:bg-accent-hover` - Interactive elements

**Status:**

- `text-success` / `bg-success` - Completed, positive
- `text-warning` / `bg-warning` - In progress, caution
- `text-danger` / `bg-danger` - Overdue, errors

**Scope** (revamp only, gracefully degrades):

- `bg-scope-yearly` - Yellow
- `bg-scope-monthly` - Green
- `bg-scope-weekly` - Blue
- `bg-scope-standalone` - Purple

**Animations:**

- `duration-fast` - 200ms
- `duration-normal` - 300ms
- `duration-celebration` - 600ms
- `ease-out-expo` - Smooth deceleration
- `ease-bounce` - Bouncy animations
- `shadow-glow` - Accent color glow effect

---

## Migration Strategy

### Phase 1: Theme-Aware Components (Current)

- Both themes work side-by-side
- Use CSS variable classes for new components
- Old components still work with hard-coded Tailwind classes

### Phase 2: Gradual Migration (When Ready)

- Update one component at a time
- Replace `slate-800` → `bg-bg-primary`
- Test both themes after each update

### Phase 3: Full Revamp (Future)

- Set `VITE_THEME=revamp` in production
- Remove theme-legacy.css
- Clean up old hard-coded colors

---

## Testing Checklist

When testing revamp theme:

- [ ] Check on mobile (most important!)
- [ ] Test Today view task completion
- [ ] Verify goal progress animations
- [ ] Check confetti on goal completion
- [ ] Test both color schemes (cyan vs orange)
- [ ] Ensure unscheduled tasks bottom sheet works
- [ ] Verify calendar drag-and-drop still works
- [ ] Test all modals (add task, edit goal, etc.)

---

## Troubleshooting

**Theme not switching?**

- Check browser console for errors
- Clear cache: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Verify theme CSS files imported in main.tsx

**Colors look wrong?**

- Inspect element, check computed `--bg-primary` value
- Ensure `data-theme` attribute on `<html>` element
- Check if Tailwind classes use CSS variables

**Production shows revamp by mistake?**

- Check `.env.production` file
- Default is `legacy` if VITE_THEME not set
- Verify build artifact has correct env vars
