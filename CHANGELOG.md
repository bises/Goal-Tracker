# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned

- React Query migration for better state management
- TypeScript strict mode enablement
- Mobile UX improvements
- Automated testing suite
- Component library consolidation

## [1.0.0] - 2026-01-24

### Added

- Initial release of Goal Tracker
- Hierarchical goal management system (Yearly, Monthly, Weekly, Standalone)
- Task management with scheduling and size estimation
- Goal-Task many-to-many relationships
- Calendar planner with Month/Week/Day views
- Drag-and-drop task scheduling
- Bulk task creation with naming patterns
- Progress tracking (Task-based, Manual Total, Habit modes)
- Docker Compose deployment setup
- GitHub Actions CI/CD pipeline
- Docker Hub integration
- PWA support with offline caching
- Service worker for auto-updates
- Database migration system with Prisma
- HTTPS support with Tailscale certificates
- Shared PostgreSQL option for existing databases
- Comprehensive documentation suite
- Monorepo structure with pnpm workspaces
- Shared utilities package
- Code formatting with Prettier
- Responsive design with TailwindCSS
- shadcn/ui component library integration

### Features

- **Goal Types**: Total Target, Frequency, Habit
- **Progress Modes**: Task-based calculation, Manual increments, Habit tracking
- **Calendar Views**: Month grid, Week view, Day list
- **Task Features**: Size estimation, completion tracking, scheduling, custom data
- **Goal Hierarchy**: Parent-child relationships with progress rollup
- **Deployment**: Docker, Docker Hub, GitHub Actions, self-hosted
- **Security**: HTTPS optional, VPN-friendly, database password protection

### Technical

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL 15
- **Deployment**: Docker, Docker Compose, GitHub Actions
- **State Management**: React Context (React Query migration planned)
- **Styling**: Tailwind CSS, shadcn/ui, Radix UI primitives
- **Build Tools**: Vite, pnpm workspaces, TypeScript 5

### Documentation

- Comprehensive README with quick start guide
- Deployment guide for production environments
- Database setup options (shared vs dedicated PostgreSQL)
- Code style guide with Prettier configuration
- Migration strategies documentation
- PWA setup guide
- HTTPS configuration with Tailscale
- UX/UI audit with mobile usability analysis
- Refactoring checklist for planned improvements
- Implementation plan for task/goal separation
- Contributing guide for open-source contributors

[Unreleased]: https://github.com/YOUR_USERNAME/goal-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/goal-tracker/releases/tag/v1.0.0
