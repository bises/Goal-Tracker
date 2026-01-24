# HTTPS Configuration Guide for Tailscale

## Overview
This application supports HTTPS using Tailscale certificates.

## Certificate Location
Tailscale certificates are typically stored at:
- Certificate: `/var/lib/tailscale/certs/YOUR_HOSTNAME.ts.net.crt`
- Private Key: `/var/lib/tailscale/certs/YOUR_HOSTNAME.ts.net.key`

## On Your Ubuntu Server

### 1. Verify Tailscale Certificates
```bash
sudo ls -la /var/lib/tailscale/certs/
```

### 2. Copy Certificates with Generic Names (Recommended)
```bash
sudo cp /var/lib/tailscale/certs/YOUR_HOSTNAME.ts.net.crt /var/lib/tailscale/certs/cert.crt
sudo cp /var/lib/tailscale/certs/YOUR_HOSTNAME.ts.net.key /var/lib/tailscale/certs/cert.key
sudo chmod 644 /var/lib/tailscale/certs/cert.crt
sudo chmod 600 /var/lib/tailscale/certs/cert.key
```

Replace `YOUR_HOSTNAME` with your actual Tailscale hostname.

### 3. Create/Update .env File
In your deployment directory (`~/goal-tracker/`), create or update `.env`:

```bash
cd ~/goal-tracker/
nano .env
```

Add or update these variables:
```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/goaltracker

# HTTPS Configuration
USE_HTTPS=true

# GitHub (if using GitHub Container Registry)
GITHUB_REPO_OWNER=your-github-username
```

### 4. Deploy/Redeploy Containers
```bash
cd ~/goal-tracker/
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Verify HTTPS is Working

**Test API:**
```bash
curl -k https://YOUR_HOSTNAME.ts.net:3001/health
```

**Test Web UI:**
```bash
curl -k https://YOUR_HOSTNAME.ts.net:5138/
```

## Accessing Your Application

- **Web UI (HTTPS):** `https://YOUR_HOSTNAME.ts.net:5138`
- **Web UI (HTTP):** `http://YOUR_HOSTNAME.ts.net:5137`
- **API (HTTPS):** `https://YOUR_HOSTNAME.ts.net:3001`
- **API (HTTP):** `http://YOUR_HOSTNAME.ts.net:3001`

## Update Frontend API URL

If you want the web UI to use HTTPS for API calls, you'll need to rebuild the web container with the HTTPS API URL:

### Option 1: Rebuild Locally
```bash
cd ~/goal-tracker/
docker build -t your-username/goal-tracker-web:latest \
  --build-arg VITE_API_URL=https://YOUR_HOSTNAME.ts.net:3001/api \
  -f apps/web/Dockerfile .
```

### Option 2: Update GitHub Secrets
Add a new secret `VITE_API_URL` with value `https://YOUR_HOSTNAME.ts.net:3001/api` and trigger a new deployment.

## Forcing HTTPS (Optional)

To redirect all HTTP traffic to HTTPS:

1. Edit `apps/web/nginx.conf`
2. Uncomment the redirect line in the HTTP server block:
   ```nginx
   return 301 https://$host$request_uri;
   ```
3. Rebuild and redeploy

## Certificate Renewal

Tailscale automatically handles certificate renewal. Your certificates will be updated automatically before they expire.

## Troubleshooting

### Certificates Not Found
```bash
# Check if certificates exist
sudo ls -la /var/lib/tailscale/certs/

# If missing, regenerate:
sudo tailscale cert YOUR_HOSTNAME.ts.net
```

### Permission Denied
```bash
# Fix certificate permissions
sudo chmod 644 /var/lib/tailscale/certs/cert.crt
sudo chmod 600 /var/lib/tailscale/certs/cert.key
```

### Container Can't Read Certificates
```bash
# Verify volume mount
docker inspect goal-tracker-api | grep -A 10 Mounts
docker inspect goal-tracker-web | grep -A 10 Mounts
```

### Check Container Logs
```bash
docker logs goal-tracker-api
docker logs goal-tracker-web
```
