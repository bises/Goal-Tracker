---
name: frontend-design

description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## Mobile-First Design Principles

When building for mobile (PWA or responsive), follow these research-backed principles. Sources: NN/g, GOV.UK GDS, Smashing Magazine, Luke Wroblewski, UXPin.

### Forms & Input

- **Minimize fields ruthlessly** — every extra field increases abandonment. Only ask what's required to complete the action. Collect optional data later.
- **One thing per page** (GOV.UK pattern) — each screen should contain one question or one decision. Merge screens only after user testing proves it's safe.
- **Single-column layout** — no side-by-side fields on mobile. Vertical flow matches natural scrolling.
- **Labels above fields** — not inside (placeholder-only labels lose context when typing). Floating labels are acceptable.
- **Avoid dropdowns** (Luke Wroblewski) — use segmented controls, radio groups, or button inputs instead. Dropdowns require multiple taps and hide options. Only use as last resort.
- **Match keyboard to input type** — `type="email"`, `type="tel"`, `type="number"`, `type="date"` etc.
- **Inline validation** — validate on blur, not on every keystroke. "Reward early, punish late."
- **Finger-friendly targets** — minimum 48x48dp touch targets with 8dp spacing between them (Material Design).
- **Prefill and autofill** — use smart defaults, history, and device features (GPS, camera) to minimize typing.
- **Protect user data** — persist form values locally until submission so accidental navigation doesn't lose work.

### Progressive Disclosure

- **Show only what's needed now** — defer secondary/advanced options to expandable sections or subsequent screens.
- **Group related fields** (Gestalt proximity) — if a form has 6+ fields, chunk into logical sections with whitespace separation.
- **Easy questions first, hard questions last** — builds momentum and commitment (Cialdini's consistency principle).
- **Quick-capture pattern** — for frequent actions (task creation, note-taking), show only 1-2 essential fields in a bottom sheet. Let users save immediately, then expand to full detail on a separate screen.

### Bottom Sheets (NN/g Guidelines)

- **Short interactions only** — don't put complex multi-step flows inside bottom sheets. Users accidentally swipe-dismiss when scrolling long content.
- **Never stack bottom sheets** — don't spawn a sheet from a sheet. If you need depth, navigate to a full page.
- **Always include a visible X/Close button** — don't rely solely on the drag handle (swipe ambiguity).
- **Modal sheets cap at 50% screen height initially** — allow pull-up to expand. Full page for complex editing.
- **Support Back button/gesture for dismissal** — users expect it, especially on Android.

### Wizards vs. Forms (NN/g)

- **Wizards are for infrequent or unfamiliar processes** (onboarding, setup, checkout). They become annoying for repeated tasks.
- **Forms are better for frequent, repeated actions** — lower interaction cost (fewer clicks/taps).
- **If using a wizard**: show a clear step indicator, enforce sequential order, allow exit + save state, make each step self-sufficient (no info from other steps needed).
- **Consider dynamic forms** — show/hide fields based on user input within a single page rather than splitting into wizard steps.

### General Mobile UX (UXPin 9 Principles)

- **Make it easy** — break big tasks into small steps. Minimize cognitive load. Don't hide important information.
- **Predictable navigation** — follow platform conventions (iOS HIG, Material Design). 3-click rule for reaching any feature. Save user progress.
- **Follow basic laws** — X in top-right closes, Save at bottom, light input field borders. Don't reinvent established patterns.
- **Prioritized page design** — use visual weight (font size, contrast, whitespace) to direct attention. Most important content first.
- **Brand consistency** — same patterns, colors, and interactions across all screens.
- **Minimize input** — don't ask for setup info upfront. Prefill where possible. Make non-essential fields optional.
- **Fast loading** — show skeleton/loading states immediately. Progressive content loading.
- **Optimize for diverse devices** — proper spacing, scale to 4" phones through 12" tablets. Test both orientations.
- **Design for humans** — 16px+ font minimum. Don't rely on color alone (color blindness). Support screen readers. Accessible touch targets.

### Keyboard-Aware Mobile Design

- **Bottom sheets with forms must handle virtual keyboard** — the keyboard covers ~40-50% of screen on mobile.
- **Compact mode when keyboard open** — reduce header/footer padding, shrink buttons, hide non-essential chrome (drag handles, decorative elements).
- **Keep action buttons visible** — never hide Save/Cancel when keyboard is open. Make them compact but tappable.
- **Auto-scroll focused input into view** — use `scrollIntoView({ block: 'center' })` on focus events.
- **Prevent unwanted auto-focus** — use `onOpenAutoFocus={(e) => e.preventDefault()}` on overlays/drawers to prevent keyboard from opening on the wrong field.
- **Android vs iOS differences** — Android shrinks `window.innerHeight` when keyboard opens; iOS keeps it fixed but shrinks `visualViewport`. Handle both.
