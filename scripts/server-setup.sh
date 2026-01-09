#!/bin/bash

# Goal Tracker Deployment Script
# This script helps set up the initial deployment on your Ubuntu server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Goal Tracker Server Setup Script${NC}"
echo "======================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please don't run as root${NC}"
   exit 1
fi

# Set deployment directory (customize this)
DEPLOY_DIR="${HOME}/goal-tracker"

echo -e "\n${YELLOW}Step 1: Installing dependencies...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
    echo -e "${YELLOW}⚠️  Please log out and back in for Docker permissions to take effect${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker compose version &> /dev/null; then
    echo "Docker Compose not found. It should come with Docker."
    exit 1
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

echo -e "\n${YELLOW}Step 2: Setting up deployment directory...${NC}"

# Create deployment directory
if [ ! -d "$DEPLOY_DIR" ]; then
    mkdir -p "$DEPLOY_DIR"
    echo -e "${GREEN}✅ Created directory: $DEPLOY_DIR${NC}"
else
    echo -e "${GREEN}✅ Directory already exists: $DEPLOY_DIR${NC}"
fi

cd "$DEPLOY_DIR"

echo -e "\n${YELLOW}Step 3: Setting up environment variables...${NC}"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Docker Hub Configuration
DOCKER_USERNAME=your_dockerhub_username

# Database Configuration
POSTGRES_USER=user
POSTGRES_PASSWORD=change_this_secure_password
POSTGRES_DB=goaltracker
DATABASE_URL=postgresql://user:change_this_secure_password@postgres:5432/goaltracker

# API Configuration
PORT=3000

# Web Configuration (Use your server's public IP or domain)
VITE_API_URL=http://YOUR_SERVER_IP:3000
EOL
    
    # Also create docker-compose.prod.yml
    cat > docker-compose.yml << 'EOL'
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
      - postgres_data:/var/lib/postgresql/data
    networks:
      - goal-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-user}"]
      interval: 10s
      timeout: 5s
      retries: 5

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
      postgres:
        condition: service_healthy
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
EOL
    echo -e "${GREEN}✅ Configuration files created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your actual values!${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

echo -e "\n${YELLOW}Step 4: Setting up SSH key for GitHub Actions...${NC}"
echo "To allow GitHub Actions to deploy, you need to:"
echo "1. Generate an SSH key pair on this server (if not already done):"
echo "   ssh-keygen -t ed25519 -C 'github-actions' -f ~/.ssh/github_actions"
echo ""
echo "2. Add the public key to authorized_keys:"
echo "   cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys"
echo ""
echo "3. Add the private key to GitHub Secrets:"
echo "   cat ~/.ssh/github_actions"
echo "   Copy the output and add it as SSH_PRIVATE_KEY secret in GitHub"
echo ""

echo -e "\n${YELLOW}Step 5: Initial deployment...${NC}"
read -p "Do you want to pull and start the application now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if .env is configured
    if grep -q "YOUR_SERVER_IP" .env || grep -q "your_dockerhub_username" .env; then
        echo -e "${RED}❌ Please configure .env file first!${NC}"
        echo "Edit the following values in .env:"
        echo "  - DOCKER_USERNAME"
        echo "  - POSTGRES_PASSWORD"
        echo "  - VITE_API_URL"
        exit 1
    fi
    
    source .env
    
    echo "🔑 Logging into Docker Hub..."
    read -sp "Enter Docker Hub password: " DOCKER_PASSWORD
    echo
    echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    
    echo "📥 Pulling images from DDocker Hub username and passwords"
echo "2. Configure GitHub Secrets (see DEPLOYMENT.md)"
echo "3. Push to main branch to trigger automatic deployment"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop: docker compose down"
echo "  - Restart: docker compose restart"
echo "  - Pull latest: docker compose pull && docker compose up -
    
    echo "🗄️ Running database migrations..."
    docker run --rm --network goal-tracker_goal-net \
      -e DATABASE_URL="$DATABASE_URL" \
      ${DOCKER_USERNAME}/goal-tracker-api:latest \
      sh -c "npx prisma migrate deploy"
    
    echo -e "\n${GREEN}✅ Deployment completed!${NC}"
    echo "Application is running at:"
    echo "  - Web: http://localhost:5173"
    echo "  - API: http://localhost:3000"
    echo ""
    docker compose ps
fi

echo -e "\n${GREEN}🎉 Setup completed!${NC}"
echo "======================================"
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Configure GitHub Secrets (see DEPLOYMENT.md)"
echo "3. Push to main branch to trigger automatic deployment"
echo ""
echo "Useful commands:"
echo "  - View logs: docker compose logs -f"
echo "  - Stop: docker compose down"
echo "  - Restart: docker compose restart"
echo "  - Update: git pull && docker compose up -d --build"
