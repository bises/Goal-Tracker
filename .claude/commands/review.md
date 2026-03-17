---
description: Review code changes for quality, security, performance, and project convention compliance before committing
---

# Code Review

Select a review scope:

## 1. Review Staged Changes

Review all currently staged (`git add`) changes.

## 2. Review Branch Changes

Review all changes on the current branch compared to main.

## 3. Review Specific Files

Review specific files provided by the user.

## 4. Pre-Commit Checklist

Run the full pre-commit quality checklist (types, lint, tests).

---

**Respond with the number (1-4) or task name.**

## Instructions

**Option 1: Review Staged Changes**

- Run `git diff --cached --name-only` to get staged files
- Invoke the `code-reviewer` agent on those files

**Option 2: Review Branch Changes**

- Run `git diff main...HEAD --name-only` to get branch changes
- Invoke the `code-reviewer` agent on those files

**Option 3: Review Specific Files**

- Ask user for file paths
- Invoke the `code-reviewer` agent on those files

**Option 4: Pre-Commit Checklist**

- Run `pnpm run type-check` — report any TypeScript errors
- Run `pnpm run lint` — report any linting issues
- Run `pnpm --filter api test` — report test results
- Run `pnpm --filter web test` — report test results
- Summarize pass/fail status for each check
