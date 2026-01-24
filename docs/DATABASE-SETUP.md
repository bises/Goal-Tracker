# Database Setup Options

You have an existing PostgreSQL instance running in a Docker container (for Immich). Here are your options:

---

## ✅ Option 1: Share PostgreSQL Container (Recommended)

**Your Situation:**

- PostgreSQL is running in `immich_postgres` container
- On `immich-net` Docker network
- Not exposing ports (only accessible within Docker network)

**Pros:**

- Better resource usage (one Postgres instance)
- Centralized database management
- Easier backups (one place)
- Less memory/CPU overhead

**Cons:**

- Services share the same network
- Need to create a database in the shared Postgres

### Setup Steps:

#### 1. Create Database in Immich PostgreSQL Container

```bash
# Connect to the running postgres container
docker exec -it immich_postgres psql -U ${DB_USERNAME} -d ${DB_DATABASE_NAME}

# Create database and user for Goal Tracker
CREATE DATABASE goaltracker;
CREATE USER goaltracker_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE goaltracker TO goaltracker_user;

# Grant schema permissions (PostgreSQL 15+)
\c goaltracker
GRANT ALL ON SCHEMA public TO goaltracker_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO goaltracker_user;
\q
```

Or as a one-liner:

```bash
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "CREATE DATABASE goaltracker;"
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "CREATE USER goaltracker_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "GRANT ALL PRIVILEGES ON DATABASE goaltracker TO goaltracker_user;"
docker exec -it immich_postgres psql -U ${DB_USERNAME} -d goaltracker -c "GRANT ALL ON SCHEMA public TO goaltracker_user;"
```

#### 2. Update `.env` on Server

```env
# Docker Hub Configuration
DOCKER_USERNAME=your_dockerhub_username

# Connect to immich_postgres container (use container name as hostname)
DATABASE_URL=postgresql://goaltracker_user:your_secure_password@immich_postgres:5432/goaltracker

# API Configuration
PORT=3000

# Web Configuration
VITE_API_URL=http://YOUR_SERVER_IP:3000
```

**Important:** Use `immich_postgres` as the hostname (the container name), not `localhost`!

#### 3. Use the Shared Network Docker Compose

```bash
cd ~/goal-tracker

# Download the shared network compose file
wget https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/docker-compose.shared-network.yml -O docker-compose.yml

# Or copy from repo:
cp docker-compose.shared-network.yml docker-compose.yml

# Start services (will connect to immich-net)
docker compose up -d
```

#### 4. Verify Network Connection

```bash
# Check that Goal Tracker containers are on immich-net
docker network inspect immich-net

# You should see:
# - immich_postgres
# - goal-tracker-api
# - goal-tracker-web (if it joins the network)

# Test database connection
docker compose exec api sh -c "npx prisma db pull"
```

#### 5. Run Migrations

```bash
# One-time migration setup
docker compose run --rm api npx prisma migrate deploy
```

---

## Option 2: Expose PostgreSQL Port (Alternative)

If you want to keep networks separate, expose the postgres port:

### Update Immich docker-compose.yml:

```yaml
database:
  container_name: immich_postgres
  image: ghcr.io/immich-app/postgres:14-vectorchord0.4.3-pgvectors0.2.0
  ports:
    - '5432:5432' # Add this line
  # ... rest of config
```

Then use `localhost:5432` in your DATABASE_URL:

```env
DATABASE_URL=postgresql://goaltracker_user:password@localhost:5432/goaltracker
```

And use `docker-compose.external-db.yml` for Goal Tracker.

**Note:** This exposes Postgres to your network, which may not be desired for security reasons.

---

## Option 3: Use Separate PostgreSQL in Docker (Current Setup)

| Shared Postgres Container | Expose Postgres Port | Separate Docker Postgres |
| ------------------------- | -------------------- | ------------------------ | ------------------ |
| **Resource Usage**        | ✅ Lower             | ✅ Lower                 | ⚠️ Higher (+200MB) |
| **Isolation**             | ⚠️ Shared network    | ⚠️ Shared                | ✅ Complete        |
| **Security**              | ✅ Internal only     | ⚠️ Port exposed          | ✅ Internal only   |
| **Management**            | ✅ Centralized       | ✅ Centralized           | ⚠️ Separate        |
| **Backups**               | ✅ One place         | ✅ One place             | ⚠️ Two places      |
| **Setup Complexity**      | ⚠️ Medium            | ⚠️ Medium                | ✅ Easy            |
| **Network Access**        | Docker network       | Host + Docker            | Docker network     |

---

## Recommendation for Your Setup

Since your PostgreSQL is in a Docker container **without exposed ports**, I recommend **Option 1: Share PostgreSQL Container**.

**Why:**

1. ✅ No port exposure needed (more secure)
2. ✅ Better resource usage (single Postgres)
3. ✅ Docker networks handle communication
4. ✅ One backup location
5. ✅ No RAM/CPU overhead for second Postgres

# Start all services including postgres

docker compose --profile with-db up -d

````

---

## Comparison

| Feature | Existing PostgreSQL | Docker PostgreSQL |
|---------|-------------------|-------------------|
| **Resource Usage** | ✅ Lower | ⚠️ Higher |
| **Isolation** | ⚠️ Shared | ✅ Complete |
| **Management** | ✅ Centralized | ⚠️ Separate |
| **Backups** | ✅ One place | ⚠️ Two places |
| **Port Conflicts** | ✅ No issue | ⚠️ Possible (5432) |
| **Setup Complexity** | ⚠️ Medium | ✅ Easy |

---

## Recommendation

**Use existing PostgreSQL** because:
1. You're already running Postgres
2. Saves ~100-200MB RAM
3. One backup strategy
4. Production-grade Postgres likely already tuned

---Shared PostgreSQL Container (Recommended for your setup):
- Use: `docker-compose.shared-network.yml`
- API connects to `immich-net` network
- Uses `immich_postgres` container
- **DATABASE_URL:** `postgresql://user:pass@immich_postgres:5432/goaltracker`

### For Exposed PostgreSQL Port:
- Use: `docker-compose.external-db.yml`
- API uses host network
- **DATABASE_URL:** `postgresql://user:pass@localhost:5432/goaltracker`
- Requires exposing port 5432 in Immich compose

### For Separate Docker PostgreSQL:
- Use: `docker-compose.prod.yml` with `--profile with-db`
The workflow deployment steps remain the same regardless of which option you choose. The migration will work because the API container will be on the correct network and can access the database using the DATABASE_URL.

### Current Workflow (works for all options):
```yaml
echo "🗄️ Running database migrations..."
docker compose run --rm api sh -c "npx prisma migrate deploy"
````

The key is ensuring your `.env` file on the server has the correct `DATABASE_URL` for your chosen option.

**For Docker PostgreSQL:**

```yaml
echo "🗄️ Starting database..."
docker compose --profile with-db up -d postgres

echo "⏳ Waiting for database..."
until docker compose exec -T postgres pg_isready; do sleep 2; done

echo "🔄 Running migrations..."
docker compose run --rm api sh -c "npx prisma migrate deploy"
```

---

## Testing Connection

After setup, test the database connection:

```bash
# Test from API container
docker compose run --rm api sh -c "npx prisma db pull"

# Should show your schema without errors
```

---

## Backup Strategy

### Existing PostgreSQL:

````bash
# Backup all databases including Goal Tracker
sudo -u postgres pg_dumpall > /backup/all-databases.sql
Shared PostgreSQL Container:
```bash
# Backup from container
docker exec immich_postgres pg_dump -U ${DB_USERNAME} goaltracker > /backup/goaltracker.sql

# Or backup all databases
docker exec immich_postgres pg_dumpall -U ${DB_USERNAME} > /backup/all-databases.sql
````

### Separate

---

## Quick Decision Guide for Your Docker-Based Postgres

**Choose Shared PostgreSQL Container (Option 1) if:**

- ✅ You want to save resources (~200MB RAM)
- ✅ You don't want to expose Postgres port
- ✅ You're okay with services on same network
- ✅ You have a backup strategy in place

**Choose Expose Port (Option 2) if:**

- ✅ You want network isolation
- ✅ You're okay exposing Postgres port locally
- ✅ You want services on separate networks

**Choose Separate Docker Postgres (Option 3) if:**

- ✅ You want complete isolation
- ✅ You prefer self-contained setup
- ✅ RAM usage isn't a concern
- ✅ You might move Goal Tracker to another server

---

## My Recommendation for Your Setup

Since your Postgres is in Docker **without exposed ports**, use **Option 1** (Shared Container):

```bash
# 1. Create database in immich_postgres
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "CREATE DATABASE goaltracker;"
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "CREATE USER goaltracker_user WITH PASSWORD 'secure_pass';"
docker exec -it immich_postgres psql -U ${DB_USERNAME} -c "GRANT ALL PRIVILEGES ON DATABASE goaltracker TO goaltracker_user;"

# 2. Update .env
cd ~/goal-tracker
cat > .env << EOF
DOCKER_USERNAME=your_dockerhub_username
DATABASE_URL=postgresql://goaltracker_user:secure_pass@immich_postgres:5432/goaltracker
PORT=3000
VITE_API_URL=http://YOUR_SERVER_IP:3000
EOF

# 3. Use shared network compose
wget https://raw.githubusercontent.com/YOUR_USER/YOUR_REPO/main/docker-compose.shared-network.yml -O docker-compose.yml

# 4. Start services
docker compose up -d

# 5. Run migrations
docker compose run --rm api npx prisma migrate deploy

# 6. Verify connection
docker network inspect immich-net
# Should show: immich_postgres, goal-tracker-api, goal-tracker-web
```

Done! 🎉
