# Code Formatting & Style Guide

## Overview

This project uses **Prettier** for code formatting and **EditorConfig** for editor settings. This ensures consistent code style across all developers regardless of their personal VS Code settings.

## Required VS Code Extensions

Install these recommended extensions (VS Code will prompt you):

- **Prettier** (`esbenp.prettier-vscode`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **EditorConfig** (`editorconfig.editorconfig`)
- **Prisma** (`prisma.prisma`)

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. VS Code Configuration

The workspace settings in `.vscode/settings.json` will automatically:

- ✅ Use Prettier for formatting
- ✅ Format on save for TS/JS/JSON files
- ✅ Apply ESLint fixes on save
- ✅ Use LF line endings (Unix-style)
- ✅ Trim trailing whitespace

**Important:** Workspace settings **override** user settings, so all developers will have consistent formatting.

### 3. Format Your Code

```bash
# Format all files
pnpm format

# Check formatting without changing files
pnpm format:check
```

## How It Works

### Configuration Files

1. **`.vscode/settings.json`** - Workspace VS Code settings (overrides personal settings)
2. **`.editorconfig`** - Editor-agnostic formatting rules
3. **`.prettierrc`** - Prettier formatting configuration
4. **`.prettierignore`** - Files to exclude from formatting

### Formatting Rules

- **Indent:** 2 spaces (no tabs)
- **Quotes:** Single quotes for TS/JS, double for JSX
- **Semicolons:** Always
- **Line endings:** LF (Unix-style)
- **Print width:** 100 characters
- **Trailing commas:** ES5 compatible

## Git Workflow

### Before Committing

```bash
# Format your changes
pnpm format

# Or add a pre-commit hook (recommended)
```

### Pre-commit Hook (Optional)

Create `.husky/pre-commit` to auto-format staged files:

```bash
#!/bin/sh
pnpm format:check || (echo "❌ Code formatting check failed. Run 'pnpm format' to fix." && exit 1)
```

## Troubleshooting

### "Format on save not working"

1. Ensure Prettier extension is installed
2. Reload VS Code window (`Ctrl+Shift+P` → "Reload Window")
3. Check file type is supported (TS/JS/JSON/etc.)

### "Getting different formatting than teammates"

1. Pull latest code with config files
2. Run `pnpm install` to get Prettier version
3. Reload VS Code
4. Manually run `pnpm format` to normalize

### "My personal VS Code settings are ignored"

✅ **This is intentional!** Workspace settings override user settings to ensure team consistency. If you need to adjust formatting rules, propose changes to `.prettierrc`.

## Adding New Files/Formats

To format additional file types, update:

1. `.vscode/settings.json` - Add language-specific formatter
2. `.prettierrc` - Add file pattern support
3. Root `package.json` - Update format scripts

## Best Practices

✅ **DO:**

- Let Prettier handle formatting automatically
- Run `pnpm format` before committing
- Commit `.vscode/settings.json` and config files

❌ **DON'T:**

- Manually format code (let Prettier do it)
- Override workspace settings locally
- Commit files with inconsistent formatting

---

**Questions?** The formatting configuration is project-level and version-controlled. Discuss any changes with the team before modifying config files.
