# Contributing to Goal Tracker

Thank you for your interest in contributing to Goal Tracker! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **pnpm** installed
- **Git** for version control
- **Docker** (optional, for testing production builds)
- Familiarity with **TypeScript**, **React**, and **Express.js**

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/YOUR_USERNAME/goal-tracker.git
   cd goal-tracker
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Set Up Database**

   ```bash
   cd apps/api
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   pnpm prisma migrate dev
   ```

4. **Start Development Servers**

   ```bash
   # From root directory
   pnpm dev
   ```

   This starts:
   - Web UI: http://localhost:5174
   - API: http://localhost:3000

## 📝 Code Style

### Formatting

We use **Prettier** for consistent code formatting:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### TypeScript Guidelines

- Use explicit type annotations for function parameters and return types
- Avoid `any` - use `unknown` or proper types
- Prefer interfaces for object shapes, types for unions/aliases
- Enable strict mode in new code

### React Best Practices

- Functional components with hooks only
- Use TypeScript for prop types (no PropTypes)
- Extract reusable logic into custom hooks
- Keep components focused and single-purpose

### File Organization

```
src/
├── components/
│   ├── Goals/         # Goal-specific components
│   ├── Tasks/         # Task-specific components
│   ├── shared/        # Reusable components
│   └── ui/            # shadcn/ui components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── pages/             # Top-level page components
└── utils/             # Helper functions
```

## 🔀 Workflow

### Branching Strategy

- `main` - Production-ready code
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `docs/what-changed` - Documentation updates

### Making Changes

1. **Create a Branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Your Changes**
   - Write clear, concise code
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Your Changes**

   ```bash
   pnpm build  # Ensure builds succeed
   # Manual testing in browser
   ```

4. **Commit Your Changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   We prefer [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `refactor:` Code refactoring
   - `style:` Formatting changes
   - `test:` Adding tests
   - `chore:` Maintenance tasks

5. **Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   ```
   Then open a Pull Request on GitHub.

## 🎯 What to Work On

### Good First Issues

Look for issues labeled `good first issue` - these are:

- Well-defined scope
- Clear acceptance criteria
- Minimal dependencies on other work
- Good for learning the codebase

### High-Impact Areas

See [docs/REFACTORING-CHECKLIST.md](docs/REFACTORING-CHECKLIST.md) for prioritized improvements:

#### 🔴 High Priority

- Modal/Dialog wrapper duplication
- Date utility consolidation
- Form input styling consistency
- Error handling patterns

#### 🟡 Medium Priority

- React Query migration
- TypeScript strict mode
- Component library expansion
- Testing infrastructure

#### 🟢 Low Priority / Nice-to-Have

- Performance optimizations
- Accessibility improvements
- Additional features

### Mobile UX Improvements

See [docs/UX-UI-AUDIT.md](docs/UX-UI-AUDIT.md) for detailed mobile usability issues:

- Calendar touch interactions
- Modal keyboard handling
- Horizontal scrolling problems
- Touch target sizing

## 🧪 Testing

### Manual Testing Checklist

When making changes, verify:

- [ ] Feature works in Chrome/Firefox/Safari
- [ ] Responsive design works on mobile (use DevTools device emulation)
- [ ] No console errors or warnings
- [ ] Database migrations run successfully (if schema changed)
- [ ] API endpoints return expected data
- [ ] Forms validate correctly

### Future: Automated Testing

We're planning to add:

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests

Want to help set this up? See checklist item `G. Testing Setup`.

## 📐 Database Changes

### Creating Migrations

```bash
cd apps/api

# Create a new migration
pnpm prisma migrate dev --name describe_your_change

# Example: Add new field to Goal model
pnpm prisma migrate dev --name add_color_to_goal
```

### Migration Guidelines

- Make migrations backward-compatible when possible
- Test migrations on a copy of production data
- Document breaking changes in PR description
- Consider data migration scripts for existing records

### Schema Best Practices

- Use descriptive field names
- Add indexes for frequently queried fields
- Use enums for fixed sets of values
- Document complex relationships with comments

## 🐛 Reporting Bugs

### Before Submitting

1. **Search existing issues** - your bug might already be reported
2. **Reproduce the bug** - ensure it's consistent
3. **Check latest version** - bug might be fixed in `main`

### Bug Report Template

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**

1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Environment**

- OS: [e.g., Ubuntu 22.04, macOS 14, Windows 11]
- Browser: [e.g., Chrome 120, Firefox 121]
- Version: [commit hash or release version]

**Screenshots**
If applicable, add screenshots

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature ideas! Please:

1. **Check existing issues** - feature might be planned
2. **Explain the use case** - why is this needed?
3. **Propose a solution** - how might it work?
4. **Consider alternatives** - are there other approaches?

Open a discussion or issue with the `enhancement` label.

## 📚 Documentation

### What Needs Documentation

- New features or APIs
- Complex algorithms or business logic
- Setup/deployment changes
- Breaking changes or migrations

### Documentation Locations

- **User-facing guides**: `docs/` directory
- **Code comments**: Inline for complex logic
- **API documentation**: JSDoc comments in code
- **README.md**: High-level overview and quick start

### Writing Style

- Clear and concise language
- Step-by-step instructions with examples
- Screenshots for UI-related docs
- Code examples with syntax highlighting

## 🤝 Code Review

### As an Author

- Keep PRs focused and reasonably sized
- Write clear PR descriptions explaining changes
- Respond to feedback constructively
- Update PR based on review comments

### As a Reviewer

- Be respectful and constructive
- Focus on code quality, not personal preferences
- Ask questions rather than making demands
- Approve when satisfied, even if not perfect

### Review Checklist

- [ ] Code follows project style guidelines
- [ ] Changes are well-tested
- [ ] Documentation is updated
- [ ] No unnecessary dependencies added
- [ ] Performance considerations addressed
- [ ] Security implications considered

## 🏗️ Architecture Guidelines

### Monorepo Structure

- **apps/api**: Backend Express.js server
- **apps/web**: Frontend React application
- **packages/shared**: Shared utilities and types

### Adding Dependencies

- Use `pnpm add` in the appropriate workspace
- Justify new dependencies in PR
- Prefer well-maintained packages
- Check bundle size impact for frontend deps

### State Management

Currently using React Context. Migration to React Query planned (see checklist).

### API Design

- RESTful conventions
- Consistent error responses
- Input validation with clear messages
- Appropriate HTTP status codes

## 🎁 Recognition

Contributors will be:

- Listed in release notes
- Mentioned in README acknowledgments
- Added to GitHub contributors list

Significant contributions may earn you:

- Commit access to the repository
- Mention in blog posts or social media
- Invitation to maintainer team

## 📞 Getting Help

- **Questions?** Open a GitHub Discussion
- **Stuck?** Comment on your PR or issue
- **Ideas?** Start a discussion in Ideas category

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Goal Tracker! 🎉
