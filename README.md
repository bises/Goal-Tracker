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
# Web UI: http://localhost:5173
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
# Web: http://localhost:5173
# API: http://localhost:3000
```

---

## 📁 Project Structure

```
goal-tracker/
├── apps/
│   ├── api/              # Express.js REST API
│   │   ├── prisma/       # Database schema & migrations
│   │   └── src/          # Route handlers & services
│   └── web/              # React + Vite frontend
│       └── src/          # Components, pages, hooks
├── packages/shared/      # Shared utilities & types
├── scripts/              # Deployment helpers
├── docs/                 # Documentation
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
| **DevOps**      | Docker, GitHub Actions             |
| **UI Library**  | shadcn/ui, Radix UI                |

---

## 📱 Core Concepts

### Goals vs Tasks

**Goals** are long-term objectives with measurable progress:
- Yearly, Monthly, Weekly, or Standalone scopes
- Progress modes: Task-based, Manual Total, or Habit tracking
- Example: "Read 12 books this year"

**Tasks** are actionable work items:
- Can link to multiple goals
- Have size estimation (in days)
- Schedule on specific dates
- Example: "Read Chapter 1" (size: 1 day)

### Progress Tracking Methods

1. **Task-Based**: Progress calculated from completed linked tasks
2. **Manual Total**: Directly increment progress amount
3. **Habit**: Binary completion tracking (done or not done)

---

## 🚢 Deployment

### Quick Deploy (GitHub Actions)

**Setup:**

1. Create Docker Hub account and GitHub secrets:
   - `DOCKER_USERNAME`, `DOCKER_PASSWORD`
   - `SSH_PRIVATE_KEY`, `SERVER_HOST`, `SERVER_USER`
   - `DATABASE_URL`

2. Run server setup script:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/goal-tracker/main/scripts/server-setup.sh | bash
   ```

3. Push to main branch - deployment starts automatically

### Local Deployment

```bash
# Build Docker images
docker compose -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.prod.yml up -d
```

### Database Configuration

**Option A: Dedicated PostgreSQL** (default)
```bash
# Use included PostgreSQL container
docker compose up -d
```

**Option B: Shared PostgreSQL** (existing database)
```bash
# Use docker-compose.shared-network.yml
docker compose -f docker-compose.shared-network.yml up -d
```

---

## 🔧 Configuration

### Environment Variables

**API (`apps/api/.env`)**:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/goaltracker
AUTH0_ISSUER=https://your-auth0-domain/
AUTH0_AUDIENCE=https://your-api-audience
```

**Web (`apps/web/.env`)**:
```env
VITE_API_URL=http://localhost:3000/api
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience
```

### Database Migrations

```bash
cd apps/api

# Create new migration
pnpm prisma migrate dev --name migration_name

# Check status
pnpm prisma migrate status

# View data UI
pnpm prisma studio
```

---

## 📚 Documentation

- [Quick Start](docs/QUICK-START.md) - Get started in 5 minutes
- [Deployment Guide](docs/DEPLOYMENT.md) - Production setup details
- [Database Setup](docs/DATABASE-SETUP.md) - PostgreSQL options
- [HTTPS Setup](docs/HTTPS-SETUP.md) - SSL with Tailscale
- [Code Style](docs/CODE-STYLE.md) - Formatting conventions
- [PWA Setup](docs/PWA-SETUP.md) - Progressive Web App config
- [Architecture Notes](docs/IMPLEMENTATION-PLAN.md) - Design decisions

> **For authentication implementation details**, see [`.copilot-instructions.md`](.copilot-instructions.md)

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Core CRUD operations
- [x] Calendar planner with drag-and-drop
- [x] Goal hierarchy & progress rollup
- [x] Bulk task creation
- [x] Docker deployment
- [x] GitHub Actions CI/CD
- [x] PWA support

### 🚧 Planned
- [ ] React Query migration
- [ ] TypeScript strict mode
- [ ] Component library extraction
- [ ] Testing suite (Vitest + RTL)
- [ ] Advanced search & filtering
- [ ] Mobile UX improvements

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** with conventional messages
4. **Push** and open a Pull Request

### Code Standards

```bash
# Format code
pnpm format

# Check types
pnpm type-check

# Run linter
pnpm lint

# Build
pnpm build
```

---

## 🔒 Security

- **Self-hosted**: No cloud dependencies
- **Single-user**: Designed for personal use
- **Network**: Run behind VPN/firewall for extra security
- **HTTPS**: Optional but recommended with Tailscale

For security issues: security@example.com

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Thanks

Built with [shadcn/ui](https://ui.shadcn.com/), [Prisma](https://www.prisma.io/), [Tailwind CSS](https://tailwindcss.com/), [React](https://reactjs.org/), and [Vite](https://vitejs.dev/)

---

<div align="center">

**[⬆ Back to Top](#-goal-tracker)**

Made with ❤️ for productivity enthusiasts

</div>
