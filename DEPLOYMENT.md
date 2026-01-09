# GitHub Actions Deployment to Local Ubuntu Server

This guide explains how to deploy the Goal-Tracker application to your local Ubuntu server using GitHub Actions with Docker Hub.

## Architecture Overview

This deployment uses a **Docker Hub approach**:
1. 🏗️ GitHub Actions builds Docker images
2. 📤 Images are pushed to Docker Hub
3. 📥 Server pulls pre-built images
4. 🚀 Server runs containers

**Benefits:**
- ✅ No Git needed on server
- ✅ Faster deployments (pre-built images)
- ✅ More secure (server only needs Docker)
- ✅ Easier rollbacks

## Prerequisites

- Ubuntu server with SSH access
- Docker installed on the server (Git NOT required!)
- Docker Hub account (free tier works fine)
- GitHub repository for your project

## Setup Instructions

### 1. Docker Hub Account

1. Create a free account at [hub.docker.com](https://hub.docker.com)
2. Note your username - you'll need it for configuration

### 2. Server Setup

Run the setup script on your Ubuntu server:

```bash
# Download the setup script
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts/server-setup.sh
chmod +x server-setup.sh
./server-setup.sh
```

Or manually set up:

```bash
# Install Docker (Git NOT needed!)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker  # Activate group without logout

# Create deployment directory
mkdir -p ~/goal-tracker
cd ~/goal-tracker

# Download docker-compose.yml from your repo or create it manually
# (S3e docker-compose.prod.yml in the repo)
```

### 2. SSH Key Configuration

Generate an SSH key pair for GitHub Actions to use:

```bash
# On your Ubuntu server
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions

# Add the public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Display the private key (you'll need this for GitHub)
cat ~/.ssh/github_actions
```

**Important:** Copy the entire private key output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### 4. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `DOCKER_USERNAME` | Your Docker Hub username | Used to push/pull images |
| `DOCKER_PASSWORD` | Your Docker Hub password/token | Authentication for Docker Hub |
| `SSH_PRIVATE_KEY` | Content from `~/.ssh/github_actions` | Private SSH key for server access |
| `SERVER_HOST` | Your server's IP or hostname | e.g., `192.168.1.100` |
| `SERVER_USER` | Your Ubuntu username | e.g., `ubuntu` or your username |
| `DATABASE_URL` | Database connection string | e.g., `postgresql://user:password@postgres:5432/goaltracker` |

**No5. Server:** You can create a Docker Hub access token (recommended) instead of using your password:
- Go to Docker Hub → Account Settings → Security → New Access Token

### 4. Environment Configuration

Create a `.env` file on your server (in the deployment directory):

```bash
cd ~/goal-tracker
nano .env
```

Addocker Hub Configuration
DOCKER_USERNAME=your_dockerhub_username

# Database Configuration
POSTGRES_USER=user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=goaltracker
DATABASE_URL=postgresql://user:YOUR_SECURE_PASSWORD@postgres:5432/goaltracker

# API Configuration
PORT=3000

# Web Configuration (Use your server's public IP or domain)
PORT=3000

# We6 Configuration
VITE_API_URL=http://YOUR_SERVER_IP:3000
The `docker-compose.prod.yml` file is configured to pull images from Docker Hub.

On your server, create `docker-compose.yml` (or copy from the repo):

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: goal-tracker-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-goaltracker}
    ports:
      - "5434:5432"
    volumes:
    7 - postgres_data:/var/lib/postgresql/data
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
      PORT: ${PORT:-3000}
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
  goaBuild Docker images for API and Web
2. ✅ Push images to Docker Hub
3. ✅ Connect to your server via SSH
4. ✅ Pull latest images from Docker Hub
  postgres_data:
    restart: unless-stopped
    # ... other config

  web:
    restart: unless-stopped
    # ... other config
```

### 6. Firewall Configuration (Optional but Recommended)

If you have UFW enabled:

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow application ports
sudo ufw allow 3000/tcp  # API
sudo ufw allow 5173/tcp  # Web (or 80/443 for production)

# Enable firewall
sudo ufw enable
```

## Deployment Process

### Automatic Deployment

Once configured, the application automatically deploys when you push to the `main` branch:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

GitHub Actions will:
1. ✅ Connect to your server via SSH
2. ✅ Pull the latest code
3. ✅ Stop existing containers
4. ✅ Build new Docker images
5. ✅ Run database migrations
6. ✅ Start containers
7. ✅ Perform health checks

##Pull latest images and restart
docker compose pull
docker compose up -d

# View images
docker images | grep goal-tracker

# Run migrations manually
docker run --rm --network goal-tracker_goal-net \
  -e DATABASE_URL="postgresql://user:password@postgres:5432/goaltracker" \
  YOUR_DOCKERHUB_USERNAME/goal-tracker-api:latest \
  sh -c "npx prisma migrate deploy"
3. Select **Deploy to Ubuntu Server** workflow
4. Click **Run workflow**
5. Select the branch and click **Run workflow**

## Monitoring and Maintenance

### View Deployment Logs

Check the GitHub Actions logs:
1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Expand the job steps to see detailed logs

### Server-Side Commands

SSH into your server and use these commands:

```bash
cd ~/goal-tracker

# View running containers
docker compose ps

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f api
docker compose logs -f web

# Restart services
docker compose restart

# Stop services
docker compose down

# Update manually
git pull
docker compose up -d --build

# Run migrations manually
docker compose exec api npx prisma migrate deploy
```

## Troubleshooting

### SSH Connection Issues

```bash
# Test SSH connection from your local machine
ssh -i ~/.ssh/github_actions USER@SERVER_HOST

# Check SSH service on server
sudo systemctl status ssh

# Check authorized_keys permissions
ls -la ~/.ssh/authorized_keys  # Should be -rw-------
```

### Docker Permission Issues

```bash
# Add your user to docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
# Or run: newgrp docker
```

### Container Failures

```bash
# Check container status
docker compose ps

# View container logs
docker compose logs --tail=100

# Rebuild specific service
docker compose up -d --build api

# Remove all containers and start fresh
docker compose down -v
docker compose up -d --build
```

### Database Migration Issues

```bash
# Check migration status
docker compose exec api npx prisma migrate status

# Reset database (WARNING: deletes all data)
docker compose exec api npx prisma migrate reset

# Deploy pending migrations
docker compose exec api npx prisma migrate deploy
```

## Security Recommendations

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Use Strong Keys**: Generate strong SSH keys
3. **Limit SSH Access**: Consider using key-based authentication only
4. **Firewall**: Enable and configure UFW
5. **HTTPS**: Set up Nginx reverse proxy with SSL certificates (Let's Encrypt)
6. **Secrets**: Never commit `.env` files or secrets to Git
7. **Regular Updates**: Keep Docker, system packages, and dependencies updated

## Production Improvements

For production deployments, consider:

1. **Reverse Proxy**: Use Nginx or Traefik
2. **SSL/TLS**: Set up HTTPS with Let's Encrypt
3. **Domain Name**: Use a proper domain instead of IP
4. **Monitoring**: Add monitoring tools (Prometheus, Grafana)
5. **Backups**: Implement automatic database backups
6. **Logging**: Centralized logging with ELK stack or similar
7. **Secrets Management**: Use Docker secrets or vault
8. **CI/CD**: Add testing stages before deployment

## Example Production Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Web app
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Review server-side logs: `docker compose logs`
3. Verify all secrets are correctly configured
4. Ensure SSH connectivity from GitHub to your server
5. Check firewall and network settings

## Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
