# Quick Start: Deploy with Docker Hub

## Summary

This setup uses **GitHub Actions + Docker Hub** for deployment. No Git needed on your server!

## What You Need

1. **Docker Hub Account** (free): [hub.docker.com](https://hub.docker.com)
2. **Ubuntu Server** with Docker installed
3. **GitHub Repository** with your code

---

## Step 1: Setup Docker Hub

```bash
# Create account at hub.docker.com
# Note your username (e.g., "myusername")
```

---

## Step 2: Setup Ubuntu Server

```bash
# Install Docker (on your Ubuntu server)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker

# Create deployment directory
mkdir -p ~/goal-tracker
cd ~/goal-tracker

# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key (you'll need this for GitHub)
cat ~/.ssh/github_actions
```

---

## Step 3: Configure Server Files

Create `.env` file on your server:

```bash
cd ~/goal-tracker
nano .env
```

Add this content (replace placeholders):

```env
DOCKER_USERNAME=your_dockerhub_username
POSTGRES_USER=user
POSTGRES_PASSWORD=change_this_password
POSTGRES_DB=goaltracker
DATABASE_URL=postgresql://user:change_this_password@postgres:5432/goaltracker
PORT=3000
VITE_API_URL=http://YOUR_SERVER_IP:3000
```

Create `docker-compose.yml`:

```bash
nano docker-compose.yml
```

Paste this:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: goal-tracker-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - goal-net

  api:
    image: ${DOCKER_USERNAME}/goal-tracker-api:latest
    container_name: goal-tracker-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: ${DATABASE_URL}
      PORT: ${PORT}
    depends_on:
      - postgres
    networks:
      - goal-net

  web:
    image: ${DOCKER_USERNAME}/goal-tracker-web:latest
    container_name: goal-tracker-web
    restart: unless-stopped
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: ${VITE_API_URL}
    depends_on:
      - api
    networks:
      - goal-net

networks:
  goal-net:
    driver: bridge

volumes:
  postgres_data:
```

---

## Step 4: Configure GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these 6 secrets:

| Secret Name | Value |
|-------------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password or token |
| `SSH_PRIVATE_KEY` | Output from `cat ~/.ssh/github_actions` |
| `SERVER_HOST` | Your server IP (e.g., `192.168.1.100`) |
| `SERVER_USER` | Your username on Ubuntu (e.g., `ubuntu`) |
| `DATABASE_URL` | `postgresql://user:password@postgres:5432/goaltracker` |

---

## Step 5: Deploy!

```bash
# Push to main branch
git add .
git commit -m "Setup deployment"
git push origin main
```

Watch the deployment in GitHub → **Actions** tab!

---

## What Happens?

1. ✅ GitHub Actions builds your Docker images
2. ✅ Pushes images to Docker Hub
3. ✅ SSH into your server
4. ✅ Pulls images from Docker Hub
5. ✅ Runs database migrations
6. ✅ Starts containers

---

## Access Your App

- **Web UI:** `http://YOUR_SERVER_IP:5173`
- **API:** `http://YOUR_SERVER_IP:3000`

---

## Useful Commands

```bash
# On your server
cd ~/goal-tracker

# View running containers
docker compose ps

# View logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Pull latest & restart
docker compose pull && docker compose up -d
```

---

## Troubleshooting

### Can't connect to Docker Hub?
```bash
# Login manually
docker login
```

### Containers not starting?
```bash
# Check logs
docker compose logs

# Check .env file
cat .env
```

### SSH issues?
```bash
# Test SSH from GitHub
ssh -i ~/.ssh/github_actions user@server-ip
```

---

## Next Steps

- ✅ Setup HTTPS with Nginx + Let's Encrypt
- ✅ Setup automatic backups for database
- ✅ Configure monitoring (optional)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed documentation.
