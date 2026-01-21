# Database Migration Strategies

## Current Setup: Three-Layer Safety ✅

Your deployment now has **three options** for handling migrations safely:

### Option 1: Automatic on API Startup (Recommended) ✅

**How it works:**

- The API container runs migrations automatically on startup
- Implemented via `entrypoint.sh` in the Dockerfile
- Zero configuration needed

**Pros:**

- ✅ Simplest approach
- ✅ Works on first deployment
- ✅ Self-healing (container restart runs migrations)

**Cons:**

- ⚠️ Slight delay on container startup
- ⚠️ Multiple API instances might race (use locking)

**Files:**

- [apps/api/entrypoint.sh](apps/api/entrypoint.sh)
- [apps/api/Dockerfile](apps/api/Dockerfile)

---

### Option 2: During GitHub Actions Deployment ✅

**How it works:**

- GitHub Actions runs migrations before starting services
- Database starts first, then migrations run, then services start

**Pros:**

- ✅ Explicit control over migration timing
- ✅ Clear logs in GitHub Actions
- ✅ Fails deployment if migrations fail

**Cons:**

- ⚠️ Requires database to be accessible during deployment
- ⚠️ Downtime if migration takes long

**Implementation:**
Already configured in [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

```yaml
# Start database first
docker compose up -d postgres

# Wait for it to be ready
until docker compose exec -T postgres pg_isready; do sleep 2; done

# Run migrations
docker compose run --rm api sh -c "npx prisma migrate deploy"

# Start all services
docker compose up -d
```

---

### Option 3: Manual Migrations

**How it works:**

- SSH into server and run migrations manually
- Full control over timing

**Pros:**

- ✅ Complete control
- ✅ Can test migrations first
- ✅ Safest for production

**Cons:**

- ⚠️ Manual step required
- ⚠️ Easy to forget

**Commands:**

```bash
# SSH into your server
ssh user@your-server

cd ~/goal-tracker

# Run migrations
docker compose run --rm api npx prisma migrate deploy

# Or if containers are running
docker compose exec api npx prisma migrate deploy
```

---

## Recommended Approach by Environment

### Development

✅ **Option 1** (Automatic) - Fast iteration, self-healing

### Staging/Testing

✅ **Option 2** (GitHub Actions) - Automated but visible

### Production (Small Scale)

✅ **Option 1** (Automatic) + monitoring

### Production (Large Scale)

✅ **Option 3** (Manual) - Maximum control and safety

---

## Current Configuration

Your setup uses **BOTH Option 1 AND Option 2** for safety:

1. **GitHub Actions** attempts migrations during deployment
2. **API container** runs migrations on startup (backup)

This means:

- ✅ Migrations always run when needed
- ✅ Self-healing if GitHub Actions fails
- ✅ Zero-downtime possible

---

## Migration Best Practices

### 1. Always Test Migrations First

```bash
# On your development machine
npx prisma migrate dev --name descriptive_name

# Review the generated SQL
cat prisma/migrations/*/migration.sql

# Test it thoroughly before pushing
```

### 2. Backup Before Major Migrations

```bash
# On server
docker compose exec postgres pg_dump -U user goaltracker > backup.sql

# Restore if needed
docker compose exec -T postgres psql -U user goaltracker < backup.sql
```

### 3. Monitor Migration Logs

```bash
# During deployment (GitHub Actions logs)
# Or on server:
docker compose logs -f api

# Look for:
# "🔄 Running database migrations..."
# "Migration completed successfully"
```

### 4. Handle Long-Running Migrations

For migrations that take > 30 seconds:

```yaml
# In docker-compose.yml, add healthcheck delay
api:
  healthcheck:
    start_period: 60s # Wait 60s before checking health
```

### 5. Handle Failed Migrations

```bash
# Check migration status
docker compose exec api npx prisma migrate status

# Mark migration as applied (if you fixed manually)
docker compose exec api npx prisma migrate resolve --applied "migration_name"

# Rollback (reset database - DESTRUCTIVE!)
docker compose exec api npx prisma migrate reset
```

---

## Troubleshooting

### Migration Fails During Deployment

**Problem:** GitHub Actions fails at migration step

**Solution:**

```bash
# SSH into server
ssh user@your-server
cd ~/goal-tracker

# Check database status
docker compose exec postgres pg_isready

# Check what migrations are pending
docker compose run --rm api npx prisma migrate status

# Run migration manually
docker compose run --rm api npx prisma migrate deploy

# Check logs
docker compose logs postgres
docker compose logs api
```

### Container Restarts Repeatedly

**Problem:** API container keeps restarting

**Possible cause:** Migration failing on startup

**Solution:**

```bash
# Check logs
docker compose logs api

# Temporarily disable auto-migration by commenting out in entrypoint.sh
# Then run migration manually
docker compose run --rm api npx prisma migrate deploy

# Once successful, re-enable auto-migration
```

### Multiple API Instances Race Condition

**Problem:** Running multiple API containers causes migration conflicts

**Solution:** Use Prisma migration locking or run migrations separately:

```yaml
# docker-compose.yml - separate migration service
services:
  migrate:
    image: ${DOCKER_USERNAME}/goal-tracker-api:latest
    command: npx prisma migrate deploy
    environment:
      DATABASE_URL: ${DATABASE_URL}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - goal-net

  api:
    # Remove entrypoint.sh, go back to CMD
    # This service only starts after migrate completes
    depends_on:
      migrate:
        condition: service_completed_successfully
```

---

## Advanced: Zero-Downtime Migrations

For production systems requiring zero downtime:

### Strategy 1: Backward Compatible Migrations

1. Make schema changes that don't break old code
2. Deploy new code
3. Run migrations
4. Deploy code that uses new schema

### Strategy 2: Blue-Green Deployment

1. Run new version with old schema
2. Once healthy, run migrations
3. Switch traffic to new version

### Strategy 3: Read Replica Pattern

1. Keep read replicas during migration
2. Run migration on primary
3. Wait for replication
4. Switch application

---

## Quick Reference

```bash
# Check migration status
docker compose exec api npx prisma migrate status

# Run pending migrations
docker compose exec api npx prisma migrate deploy

# View migration history
docker compose exec api npx prisma migrate history

# Generate migration (development)
npx prisma migrate dev --name add_new_field

# Create migration without applying
npx prisma migrate dev --create-only

# Reset database (DESTRUCTIVE - development only!)
docker compose exec api npx prisma migrate reset
```

---

## Summary

Your current setup:

- ✅ Automatic migrations on API startup (safest)
- ✅ GitHub Actions runs migrations during deployment (visible)
- ✅ Manual option available for production control

**No additional configuration needed** - migrations will run automatically! 🎉
