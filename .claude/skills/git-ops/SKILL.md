---
name: git-ops
description: Use this skill for git operations including creating branches, making commits with conventional messages, and creating pull requests. Trigger when user asks to "create a branch", "commit changes", "make a PR", or any git workflow task.
---

# Git Operations

## Workflow Routing

Match user request to workflow:

- **"create a branch"** → Create Branch workflow
- **"commit my changes"** → Make Commit workflow
- **"create a PR" / "make a PR"** → Create PR workflow
- **"commit and create a PR"** → Chain: Commit → PR
- **"branch, commit, and PR"** → Chain: Branch → Commit → PR

## Create Branch

```bash
# Fetch latest
git fetch origin main

# Create and switch to feature branch
git checkout -b <branch-type>/<description> origin/main
```

**Branch naming:**

- `feature/<description>` — New features
- `fix/<description>` — Bug fixes
- `refactor/<description>` — Code refactoring
- `chore/<description>` — Maintenance tasks

Examples: `feature/add-notifications`, `fix/goal-deletion-bug`, `refactor/task-context`

## Make Commit

```bash
# Stage changes
git add <files>

# Commit with conventional message
git commit -m "<type>: <description>"
```

**Commit types:**

- `Add` — New feature or file
- `Fix` — Bug fix
- `Update` — Modification to existing feature
- `Remove` — Deleted code or feature
- `Refactor` — Code restructuring without behavior change

**Rules:**

- Present tense: "Add task filtering" not "Added filtering"
- Start with verb
- Keep under 50 characters for subject line
- No period at end

## Create PR

```bash
# Push branch
git push -u origin <branch-name>

# Create PR via GitHub CLI (if available)
gh pr create --title "<title>" --body "<description>"
```

**PR description template:**

```markdown
## What

Brief description of changes.

## Why

Motivation/context for the change.

## Changes

- List of specific changes made

## Testing

- How this was tested
```

## Safety Rules

**CRITICAL:**

- Never commit directly to main
- Always create a branch first
- Never use `--force` push without explicit user approval
- Never use `--no-verify` to skip hooks
- Run `pnpm run type-check` before committing

## MCP Integrations

- **github MCP:** Use `mcp__github` for creating pull requests, listing branches, searching code, and managing issues

## Communication

Before executing each step, explain what you're about to do and why.
