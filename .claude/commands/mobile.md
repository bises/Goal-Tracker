---
description: React Native mobile migration workflow for converting PWA components to native equivalents
---

# Mobile Migration

Select a task to begin:

## 1. Migration Status

Check current progress against the migration plan.

## 2. Migrate a Component

Convert a specific web component to React Native.

## 3. Setup Mobile Project

Initialize the Expo project in `apps/mobile/`.

## 4. Shared Code Extraction

Move reusable code from `apps/web/` to `packages/shared/`.

---

**Respond with the number (1-4) or task name.**

## Instructions

**Option 1: Migration Status**

- Read `docs/REACT-NATIVE-MIGRATION-GUIDE.md`
- Check if `apps/mobile/` exists
- List which web components have mobile equivalents
- Report phase progress (1-5)

**Option 2: Migrate a Component**

- Invoke the `migration-planner` agent
- Ask which component to migrate
- Read the web source, produce native equivalent
- Handle: div→View, span→Text, onClick→onPress, CSS→NativeWind
- Save to `apps/mobile/` following Expo Router conventions

**Option 3: Setup Mobile Project**

- Follow `docs/REACT-NATIVE-MIGRATION-GUIDE.md` Phase 1
- Initialize Expo 53 project in `apps/mobile/`
- Configure NativeWind v4, Expo Router v4
- Set up react-native-auth0
- Wire up shared packages

**Option 4: Shared Code Extraction**

- Identify shareable code (types, utils, API client, date helpers)
- Move to `packages/shared/src/`
- Update imports in `apps/web/`
- Ensure `apps/mobile/` can consume the same packages
