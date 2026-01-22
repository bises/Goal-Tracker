# Refactoring & Upgrades Checklist

## 🔴 HIGH PRIORITY

### 1. Modal/Dialog Wrapper Duplication

- [x] Migrate AddGoalModal.tsx to use shared Modal component
- [x] Migrate EditGoalModal.tsx to use shared Modal component
- [x] Migrate AddProgressModal.tsx to use shared Modal component
- [x] Migrate LinkTasksModal.tsx to use shared Modal component
- [x] Migrate BulkTaskModal.tsx to use shared Modal component
- [x] Remove duplicate fixed-position wrapper code
- [x] Ensure all modals use consistent styling

### 2. Date Utility Duplication

- [x] Create `packages/shared/src/utils/dateUtils.ts`
- [x] Move parseDateOnly and formatDateOnly to shared package
- [x] Standardize on UTC-based parsing
- [x] Update backend imports to use shared utils
- [x] Update frontend imports to use shared utils
- [x] Remove duplicate `parseLocalDate` from web utils
- [x] Remove duplicate `dateToLocalString` from TaskContext.tsx
- [x] Remove duplicate `dateToLocalString` from EditGoalModal.tsx
- [x] Add tests for date utilities

## 🟡 MEDIUM PRIORITY

### 3. Form Input Styling Duplication

- [ ] Create `components/ui/form-field.tsx` component
- [ ] Add FormField component props interface
- [ ] Refactor AddGoalModal to use FormField
- [ ] Refactor EditGoalModal to use FormField
- [ ] Refactor AddTaskModal to use FormField
- [ ] Refactor AddProgressModal to use FormField
- [ ] Refactor BulkTaskModal to use FormField
- [ ] Refactor LinkTasksModal to use FormField

### 4. API Response Array Wrapping Pattern

- [ ] Create `fetchJSON` wrapper function in api.ts
- [ ] Create `fetchArray` wrapper function in api.ts
- [ ] Refactor `fetchGoals` to use fetchArray
- [ ] Refactor `getGoalActivities` to use fetchArray
- [ ] Refactor `fetchTasks` to use fetchArray
- [ ] Refactor `getGoalTree` to use fetchArray
- [ ] Refactor `getGoalsByScope` to use fetchArray
- [ ] Add proper error handling to fetch wrappers

### 5. Goal/Task Selection UI Duplication

- [ ] Create `SelectableList` component
- [ ] Create `SelectableListItem` sub-component
- [ ] Add generic props interface for SelectableList
- [ ] Refactor AddTaskModal goal selection to use SelectableList
- [ ] Refactor LinkTasksModal task selection to use SelectableList
- [ ] Add loading and empty states to SelectableList

### 6. Context Pattern Duplication

- [ ] Create `createEntityContext` generic factory function
- [ ] Define EntityAPI interface
- [ ] Refactor GoalContext to use createEntityContext
- [ ] Refactor TaskContext to use createEntityContext
- [ ] Test CRUD operations work correctly
- [ ] Ensure type safety is maintained

### 7. Inline Styles vs CSS Classes

- [ ] Audit all components for inline styles
- [ ] Replace inline display/flex styles with Tailwind classes
- [ ] Replace inline margin/padding styles with Tailwind classes
- [ ] Replace inline color styles with Tailwind classes
- [ ] Replace inline typography styles with Tailwind classes
- [ ] Update design-system.css if needed for custom styles
- [ ] Remove unused inline styles

### 8. Progress Calculation Logic Duplication

- [ ] Create `packages/shared/src/utils/progressCalculator.ts`
- [ ] Extract `calculateGoalProgress` function
- [ ] Extract task-based progress logic
- [ ] Extract manual progress logic
- [ ] Update backend to use shared progress calculator
- [ ] Update frontend to use shared progress calculator (if applicable)
- [ ] Add unit tests for progress calculations

### 9. Error Handling Pattern

- [ ] Create `utils/errorHandler.ts`
- [ ] Implement `handleAPIError` function
- [ ] Add error logging utility
- [ ] Refactor GoalContext error handling
- [ ] Refactor TaskContext error handling
- [ ] Refactor all modal error handling
- [ ] Add error boundary component
- [ ] Implement user-friendly error messages

## 🚀 UPGRADES

### A. TypeScript Strictness

- [ ] Enable `strict: true` in tsconfig.base.json
- [ ] Enable `noUncheckedIndexedAccess` in tsconfig
- [ ] Enable `noImplicitReturns` in tsconfig
- [ ] Enable `noFallthroughCasesInSwitch` in tsconfig
- [ ] Fix all type errors from strict mode
- [ ] Add missing type annotations
- [ ] Remove any `any` types

### B. React Query / TanStack Query

- [ ] Install @tanstack/react-query
- [ ] Set up QueryClientProvider
- [ ] Create query keys factory
- [ ] Migrate GoalContext to use React Query
- [ ] Migrate TaskContext to use React Query
- [ ] Implement optimistic updates
- [ ] Add query invalidation logic
- [ ] Remove old context state management

### C. Zod Schema Validation

- [ ] Install zod
- [ ] Create `packages/shared/src/schemas/` directory
- [ ] Define Goal schema
- [ ] Define Task schema
- [ ] Define Progress schema
- [ ] Add schema validation to API routes (backend)
- [ ] Add schema validation to forms (frontend)
- [ ] Replace manual validation with Zod

### D. Barrel Exports

- [ ] Create `apps/web/src/components/index.ts`
- [ ] Create `apps/web/src/contexts/index.ts`
- [ ] Create `apps/web/src/utils/index.ts`
- [ ] Create `apps/api/src/routes/index.ts`
- [ ] Create `packages/shared/src/index.ts`
- [ ] Update imports across the codebase
- [ ] Remove deep relative imports

### E. API Client Class

- [ ] Create APIClient class
- [ ] Implement base request methods (get, post, put, delete)
- [ ] Organize endpoints into namespaces (goals, tasks, calendar)
- [ ] Add request/response interceptors
- [ ] Migrate all api.ts functions to APIClient
- [ ] Update all API consumers to use new client
- [ ] Add retry logic for failed requests

### F. Shared Types Package

- [ ] Create `packages/shared/src/types/goal.ts`
- [ ] Create `packages/shared/src/types/task.ts`
- [ ] Create `packages/shared/src/types/progress.ts`
- [ ] Create `packages/shared/src/types/index.ts` with barrel exports
- [ ] Move Goal type to shared package
- [ ] Move Task type to shared package
- [ ] Move Progress type to shared package
- [ ] Update backend imports
- [ ] Update frontend imports
- [ ] Remove duplicate type definitions

### G. Testing Setup

- [ ] Install Vitest for unit tests
- [ ] Install React Testing Library
- [ ] Set up test configuration
- [ ] Add tests for date utilities
- [ ] Add tests for progress calculations
- [ ] Add tests for API client
- [ ] Add tests for context providers
- [ ] Add component tests for key components

## 🟢 LOW PRIORITY / NICE-TO-HAVE

### Additional Improvements

- [ ] Add ESLint rules for consistent code style
- [ ] Set up Husky for pre-commit hooks
- [ ] Add Prettier pre-commit formatting
- [ ] Implement request caching strategy
- [ ] Add request debouncing for search/filter
- [ ] Optimize bundle size analysis
- [ ] Add loading skeletons for better UX
- [ ] Implement proper accessibility (ARIA labels)
- [ ] Add keyboard navigation support
- [ ] Create Storybook for component documentation
- [ ] Add end-to-end tests with Playwright
- [ ] Set up CI/CD pipeline
- [ ] Add code coverage reporting
- [ ] Implement feature flags system
- [ ] Add performance monitoring

## 📝 Notes

- Focus on HIGH PRIORITY items first for maximum impact
- Test thoroughly after each major refactor
- Commit frequently with descriptive messages
- Update documentation as you go
- Consider backward compatibility for API changes
- Review with team before major architectural changes

---

**Last Updated**: January 21, 2026
