# 🎯 Goal Tracker

> A modern, self-hosted goal tracking and task management system built with TypeScript, React, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-green.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Overview

Goal Tracker is a comprehensive personal productivity system that combines goal management with task planning. Track yearly, monthly, and weekly goals while managing daily tasks in an integrated calendar view. Built as a monorepo with separate API and web applications, it's designed for easy self-hosting via Docker.

### ✨ Key Features

- **🎯 Hierarchical Goal System**: Create yearly goals with monthly/weekly sub-goals
- **✅ Task Management**: Separate task entities with size estimation and scheduling
- **📅 Integrated Planner**: Calendar view combining goals and tasks
- **📊 Progress Tracking**: Multiple modes (task-based, manual, habit tracking)
- **🔗 Goal-Task Linking**: Many-to-many relationships between goals and tasks
- **📱 PWA Support**: Install as a standalone app on any device
- **🐳 Docker Deployment**: Complete containerized stack with GitHub Actions CI/CD
- **🌐 Network Flexible**: Works with shared PostgreSQL or dedicated instances

---

## 🚀 Quick Start

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 18+** and **pnpm** (for local development)
- **PostgreSQL 15** (or use Docker container)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/goal-tracker.git
cd goal-tracker

# Create environment file
cp .env.example .env
# Edit .env with your settings

# Start all services
docker compose up -d

# Access the application
# Web UI: http://localhost:5137
# API: http://localhost:3000
```

### Option 2: Local Development

```bash
# Install dependencies
pnpm install

# Set up database
cd apps/api
cp .env.example .env
# Configure DATABASE_URL in .env

# Run migrations
pnpm prisma migrate dev

# Start development servers (from root)
pnpm dev

# Access at:
# Web: http://localhost:5174
# API: http://localhost:3000
```

---

## 📁 Project Structure

```
goal-tracker/
├── apps/
│   ├── api/              # Express.js REST API
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       └── services/ # Business logic
│   └── web/              # React + Vite frontend
│       └── src/
│           ├── components/  # React components
│           ├── contexts/    # State management
│           ├── pages/       # Route pages
│           └── utils/       # Helper functions
├── packages/
│   └── shared/           # Shared utilities & types
├── scripts/              # Deployment scripts
└── docker-compose.yml    # Docker configuration
```

---

## 🛠️ Technology Stack

| Layer           | Technology                         |
| --------------- | ---------------------------------- |
| **Frontend**    | React 18, TypeScript, TailwindCSS  |
| **Backend**     | Node.js, Express, Prisma ORM       |
| **Database**    | PostgreSQL 15                      |
| **Build Tools** | Vite, pnpm workspaces              |
| **DevOps**      | Docker, GitHub Actions, Docker Hub |
| **UI Library**  | shadcn/ui, Radix UI                |

---

## 🎨 Core Concepts

### Goals vs Tasks

**Goals** are long-term objectives with measurable progress:

- Types: Total Target, Frequency, Habit
- Scopes: Yearly, Monthly, Weekly, Standalone
- Progress Modes: Task-based, Manual Total, Habit tracking
- Example: "Read 12 books this year" (Yearly, Total Target)

**Tasks** are actionable work items:

- Can be linked to multiple goals
- Have size estimation (in days)
- Schedule on specific dates
- Example: "Read Chapter 1 of Atomic Habits" (size: 1 day)

### Progress Tracking

1. **Task-Based**: Progress calculated from completed linked tasks
2. **Manual Total**: Directly increment progress (e.g., pages read)
3. **Habit**: Binary completion tracking

---

## 📱 Features in Detail

### Calendar Planner

- Month/Week/Day views
- Drag-and-drop task scheduling
- Unscheduled tasks sidebar
- Long-press to reschedule
- Visual progress indicators

### Bulk Operations

- Generate multiple tasks from naming patterns
- Example: "Chapter {1-15}" creates 15 chapter tasks
- Link all tasks to parent goal

### Goal Hierarchy

- Parent-child relationships
- Roll-up progress calculations
- Cascade delete support

### PWA Support

- Offline-capable
- Install on mobile/desktop
- Service worker caching
- Auto-update notifications

---

## 🚢 Deployment

### Production Deployment with GitHub Actions

**Setup Steps:**

1. **Docker Hub Account**: Create account at [hub.docker.com](https://hub.docker.com)

2. **Configure GitHub Secrets**:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub access token
   - `SSH_PRIVATE_KEY`: Server SSH key (generate with `ssh-keygen`)
   - `SERVER_HOST`: Your server IP/hostname
   - `SERVER_USER`: SSH username
   - `DATABASE_URL`: PostgreSQL connection string

3. **Server Setup**:

   ```bash
   # Run automated setup script
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/goal-tracker/main/scripts/server-setup.sh | bash
   ```

4. **Deploy**:
   ```bash
   # Push to main branch triggers deployment
   git push origin main
   ```

**Deployment Flow:**

1. GitHub Actions builds Docker images
2. Images pushed to Docker Hub
3. Server pulls images via SSH
4. Database migrations run automatically
5. Services restart with zero downtime

### Database Options

#### Shared PostgreSQL (Recommended for existing Postgres users)

```bash
# Create database in existing Postgres container
docker exec -it your_postgres psql -U postgres
CREATE DATABASE goaltracker;
CREATE USER goaltracker_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE goaltracker TO goaltracker_user;
```

Update `.env`:

```env
DATABASE_URL=postgresql://goaltracker_user:secure_password@postgres_container:5432/goaltracker
```

Use `docker-compose.shared-network.yml` to join existing network.

#### Dedicated PostgreSQL

Use default `docker-compose.yml` - includes PostgreSQL container.

### HTTPS with Tailscale

```bash
# Copy Tailscale certificates
sudo cp /var/lib/tailscale/certs/YOUR_HOST.ts.net.crt /var/lib/tailscale/certs/cert.crt
sudo cp /var/lib/tailscale/certs/YOUR_HOST.ts.net.key /var/lib/tailscale/certs/cert.key

# Update .env
echo "USE_HTTPS=true" >> .env

# Redeploy
docker compose -f docker-compose.prod.yml up -d
```

Access at: `https://YOUR_HOST.ts.net:3001`

---

## 🔧 Configuration

### Environment Variables

**API (`apps/api/.env`)**:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/goaltracker
PORT=3000
USE_HTTPS=false
SSL_CERT_PATH=/certs/cert.crt
SSL_KEY_PATH=/certs/cert.key
```

**Web (`apps/web/.env`)**:

```env
VITE_API_URL=http://localhost:3000/api
```

### Database Migrations

```bash
# Development: Create new migration
cd apps/api
pnpm prisma migrate dev --name description

# Production: Apply migrations
pnpm prisma migrate deploy

# Reset database (DESTRUCTIVE)
pnpm prisma migrate reset
```

### Code Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

---

## 🗺️ Development Roadmap

### ✅ Completed

- [x] Core goal and task CRUD operations
- [x] Calendar planner with drag-and-drop
- [x] Goal hierarchy with progress rollup
- [x] Bulk task creation
- [x] Docker deployment setup
- [x] GitHub Actions CI/CD
- [x] PWA support
- [x] Database migration system
- [x] Shared utilities package

### 🚧 In Progress

- [ ] Mobile UI improvements (touch targets, responsive layouts)
- [ ] Form validation with Zod schemas
- [ ] Context refactoring (reduce duplication)
- [ ] Date utility consolidation

### 📋 Planned Features

#### High Priority

- [ ] **React Query Migration**: Replace context-based state with TanStack Query
- [ ] **TypeScript Strict Mode**: Enable full type safety
- [ ] **Component Library**: Shared form fields and modals
- [ ] **Error Handling**: Unified error boundary system
- [ ] **API Client Class**: Type-safe API wrapper

#### Medium Priority

- [ ] **Testing Suite**: Vitest + React Testing Library
- [ ] **Mobile UX Overhaul**: Bottom sheets, better touch interactions
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Search & Filter**: Advanced task/goal search
- [ ] **Data Export**: JSON/CSV export functionality

#### Low Priority

- [ ] **Collaboration**: Multi-user support
- [ ] **Notifications**: Email/push reminders
- [ ] **Analytics**: Progress insights and charts
- [ ] **Themes**: Dark/light mode customization
- [ ] **Integrations**: Calendar sync, API webhooks

### 🐛 Known Issues

- Calendar horizontal scrolling on mobile needs improvement
- Modal forms blocked by mobile keyboard
- Unscheduled tasks bar difficult to interact on touch devices
- Long-press detection conflicts with scroll gestures

See [UX/UI Audit](docs/UX-UI-AUDIT.md) for detailed analysis.

---

## 🤝 Contributing

Contributions are welcome! This project follows standard open-source practices.

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Code Style

- **Format**: Prettier with 2-space indents, single quotes
- **Linting**: ESLint for TypeScript/React best practices
- **Commits**: Conventional Commits format preferred
- **Types**: Explicit type annotations, avoid `any`

Run before committing:

```bash
pnpm format      # Auto-format code
pnpm build       # Ensure builds succeed
```

### Areas for Contribution

- **🐛 Bug Fixes**: Check [Issues](https://github.com/YOUR_USERNAME/goal-tracker/issues)
- **📱 Mobile UX**: Improve touch interactions and responsive design
- **♿ Accessibility**: Add ARIA labels, keyboard navigation
- **📚 Documentation**: Tutorials, guides, API docs
- **🧪 Testing**: Unit tests, integration tests, E2E tests
- **🌍 Internationalization**: Multi-language support

---

## 📖 Documentation

### User Guides

- [Quick Start Guide](docs/QUICK-START.md) - Get started in 5 minutes
- [Deployment Guide](docs/DEPLOYMENT.md) - Production setup with Docker
- [Database Setup](docs/DATABASE-SETUP.md) - PostgreSQL configuration options

### Technical Documentation

- [Code Style Guide](docs/CODE-STYLE.md) - Formatting and conventions
- [Migration Guide](docs/MIGRATIONS.md) - Database migration strategies
- [PWA Setup](docs/PWA-SETUP.md) - Progressive Web App configuration
- [HTTPS Setup](docs/HTTPS-SETUP.md) - SSL/TLS with Tailscale

### Development

- [Refactoring Checklist](docs/REFACTORING-CHECKLIST.md) - Planned improvements
- [Implementation Plan](docs/IMPLEMENTATION-PLAN.md) - Feature architecture
- [UX/UI Audit](docs/UX-UI-AUDIT.md) - Mobile usability analysis

---

## 🏗️ Architecture Decisions

### Monorepo Structure

- **Why**: Share types, utilities, and configuration
- **Tool**: pnpm workspaces for efficient dependency management
- **Benefit**: Type safety across API and web boundaries

### Prisma ORM

- **Why**: Type-safe database access with migrations
- **Benefit**: Auto-generated TypeScript types from schema
- **Trade-off**: Less control than raw SQL, but faster development

### Docker Hub Deployment

- **Why**: Pre-built images reduce server build time
- **Benefit**: Faster deployments, easier rollbacks
- **Alternative**: GitHub Container Registry also supported

### Separate Tasks from Goals

- **Why**: Different mental models (objectives vs actions)
- **Benefit**: Clearer UI, more flexible linking
- **Implementation**: [See migration plan](docs/IMPLEMENTATION-PLAN.md)

---

## 🔒 Security

### Self-Hosting Considerations

- **Authentication**: Not implemented - designed for single-user self-hosting
- **Network Security**: Recommended to run behind VPN (Tailscale) or firewall
- **HTTPS**: Optional but recommended for production
- **Database**: Use strong passwords, restrict network access

### Reporting Issues

For security vulnerabilities, email: security@example.com (do not open public issues)

---

## 📊 Performance

### Optimizations Applied

- React lazy loading for route components
- Database indexes on frequently queried fields
- Service worker caching for offline support
- Vite code splitting and tree shaking

### Benchmarks

- **First Load**: ~2MB JavaScript bundle
- **API Response Time**: <50ms average (local network)
- **Database Queries**: Optimized with Prisma `relationJoins`

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful React components
- [Prisma](https://www.prisma.io/) for excellent ORM and migrations
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for modern dev experience

---

## 📞 Support & Community

- **Documentation**: Full guides in `/docs` folder
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/goal-tracker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/goal-tracker/discussions)
- **Email**: support@example.com

---

## 🔗 Related Projects

- [Actual Budget](https://actualbudget.com/) - Self-hosted budgeting
- [Vikunja](https://vikunja.io/) - Task management
- [Monica](https://www.monicahq.com/) - Personal relationship management
- [Obsidian](https://obsidian.md/) - Note-taking with linking

---

## 📈 Project Stats

- **Started**: January 2026
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Deployment**: Docker + GitHub Actions
- **License**: MIT

---

<div align="center">

**[⬆ Back to Top](#-goal-tracker)**

Made with ❤️ for productivity enthusiasts

</div>
