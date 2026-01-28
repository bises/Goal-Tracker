# Authentication Guide

Complete guide for Authentik authentication integration in Goal Tracker.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Setup Steps](#-setup-steps)
- [Configuration](#-configuration)
- [Testing](#-testing-authentication)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)
- [File Structure](#-file-structure)

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd apps/api && pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Authentik values

# 3. Run migration
npx prisma generate && npx prisma migrate dev

# 4. Start API
pnpm run dev
```

---

## 📦 Prerequisites

- ☐ Authentik server is configured and accessible
- ☐ You have admin access to Authentik
- ☐ PostgreSQL database is running
- ☐ Node.js and pnpm installed

---

## 🔧 Setup Steps

### Step 1: Configure Authentik Provider

In Authentik Admin Panel:

1. Navigate to **Applications** → **Providers**
2. Click **Create** → **OAuth2/OpenID Provider**
3. Configure the provider:
   - **Name**: Goal Tracker API
   - **Authentication flow**: default-authentication-flow
   - **Authorization flow**: default-provider-authorization-explicit-consent
   - **Client type**: Confidential
   - **Client ID**: (auto-generated or custom)
   - **Client Secret**: (note this down for frontend)
   - **Redirect URIs**:
     - `http://localhost:5173/callback` (development)
     - `https://yourdomain.com/callback` (production)
   - **Signing Key**: Select or create RS256 key
   - **JWT Algorithm**: RS256 (recommended)
   - **Scopes**: `openid`, `email`, `profile`

4. Click **Create**
5. Note down these values:

   ```
   Client ID: _____________________
   Client Secret: _____________________
   Issuer URL: _____________________
   JWKS URI: _____________________
   ```

6. Create an **Application** and bind the provider
7. Test the provider works (use Authentik's test feature)

### Step 2: Install Dependencies

```bash
cd apps/api
pnpm install
```

This installs:

- `express-oauth2-jwt-bearer` (v1.6.0) - Industry-standard JWT validation for Express
- `jwks-rsa` (v3.1.0) - JSON Web Key Set handling for public key retrieval

### Step 3: Configure API Environment

1. Copy environment template:

   ```bash
   cd apps/api
   cp .env.example .env
   ```

2. Edit `.env` with your Authentik values:

   ```env
   AUTHENTIK_ISSUER=https://auth.yourdomain.com/application/o/goal-tracker/
   AUTHENTIK_AUDIENCE=your-actual-client-id
   AUTHENTIK_JWKS_URI=https://auth.yourdomain.com/application/o/goal-tracker/jwks/
   ```

3. Verify database URL is correct in `.env`

### Step 4: Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev
```

This creates:

- User table with fields: `id`, `sub` (Authentik user ID), `email`, `name`
- `userId` foreign key in Goal table with cascade delete
- `userId` foreign key in Task table with cascade delete
- Indexes for performance: `sub`, `email`, `userId`

**Verify in database**:

```sql
-- Check User table exists
SELECT * FROM "User" LIMIT 1;

-- Check userId columns exist
\d "Goal"
\d "Task"
```

### Step 5: Data Migration (If Needed)

If you have existing goals/tasks without userId:

```sql
-- Option 1: Assign all existing data to first user
UPDATE "Goal" SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

UPDATE "Task" SET "userId" = (SELECT id FROM "User" LIMIT 1)
WHERE "userId" IS NULL;

-- Option 2: Delete existing data and start fresh
DELETE FROM "Goal";
DELETE FROM "Task";
```

### Step 6: Start the API

```bash
# Development mode
pnpm run dev

# Or with Docker
docker-compose up api
```

**Expected output**:

```
HTTP Server running on port 3000
```

---

## 🔑 Configuration

### Required Environment Variables

```env
# Authentik Configuration
AUTHENTIK_ISSUER=https://auth.domain.com/application/o/app-slug/
AUTHENTIK_AUDIENCE=your-client-id
AUTHENTIK_JWKS_URI=https://auth.domain.com/application/o/app-slug/jwks/

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/goaltracker

# Server
PORT=3000
```

**Get these from**: Authentik Admin → Applications → Providers → Your Provider

---

## 🧪 Testing Authentication

### Test 1: Health Check (No Auth Required)

```bash
curl http://localhost:3000/health
```

**Expected**: `{"status":"OK","version":"1.0.0","timestamp":"..."}`

### Test 2: Protected Endpoint Without Token

```bash
curl http://localhost:3000/api/auth/me
```

**Expected**: `401 Unauthorized`

### Test 3: Get Token from Authentik

**Option A - Using curl:**

```bash
curl -X POST https://auth.domain.com/application/o/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=testuser&password=testpass&client_id=YOUR_CLIENT_ID&client_secret=YOUR_SECRET"
```

**Option B - Using browser:**

1. Go to your Authentik domain
2. Log in with a test user
3. Use browser dev tools to capture the access token

### Test 4: Protected Endpoint With Token

```bash
# Replace YOUR_TOKEN with actual token from Authentik
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/auth/me
```

**Expected**:

```json
{
  "id": "...",
  "sub": "...",
  "email": "user@example.com",
  "name": "Test User",
  "createdAt": "..."
}
```

### Test 5: Verify User Was Created

```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM \"User\";"
```

**Expected**: Your test user should appear in the table

### Test 6: Test Goals Endpoint

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/goals
```

**Expected**: Empty array `[]` (or your existing goals if migrated)

### Validate Token

Go to https://jwt.io and paste your token. Verify:

- `iss` matches `AUTHENTIK_ISSUER`
- `aud` matches `AUTHENTIK_AUDIENCE`
- `exp` (expiration) is in the future
- `sub` (user ID) exists
- `email` claim exists

---

## 📡 API Endpoints

### Public

- `GET /health` - Health check (no auth required)

### Authentication

- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout (client-side token cleanup)

### Protected (All require `Authorization: Bearer <token>`)

**Goals Routes**:

- `GET /api/goals` - List user's goals
- `GET /api/goals/:id` - Get specific goal (ownership verified)
- `POST /api/goals` - Create goal (auto-assigns userId)
- `PUT /api/goals/:id` - Update goal (ownership verified)
- `POST /api/goals/:id/progress` - Add progress (ownership verified)
- `DELETE /api/goals/:id` - Delete goal (ownership verified)
- `GET /api/goals/tree` - Get goal hierarchy (user-filtered)
- `GET /api/goals/scope/:scope` - Get goals by scope (user-filtered)
- `POST /api/goals/:id/bulk-tasks` - Create tasks (ownership verified)
- `POST /api/goals/:id/complete` - Complete goal (ownership verified)
- `POST /api/goals/:id/uncomplete` - Uncomplete goal (ownership verified)
- `GET /api/goals/:id/tasks` - Get goal tasks (ownership verified)
- `GET /api/goals/:id/activities` - Get progress activities (ownership verified)

**Tasks Routes**:

- `GET /api/tasks` - List user's tasks
- `GET /api/tasks/:id` - Get specific task (ownership verified)
- `POST /api/tasks` - Create task (auto-assigns userId, verifies goals)
- `PUT /api/tasks/:id` - Update task (ownership verified)
- `DELETE /api/tasks/:id` - Delete task (ownership verified)
- `POST /api/tasks/:id/complete` - Toggle completion (ownership verified)
- `GET /api/tasks/scheduled/:date` - Get tasks for date (user-filtered)
- `GET /api/tasks/unscheduled/list` - Get unscheduled tasks (user-filtered)
- `POST /api/tasks/:id/link-goal` - Link to goal (both verified)
- `POST /api/tasks/:id/unlink-goal` - Unlink from goal (both verified)
- `POST /api/tasks/:id/schedule` - Schedule task (ownership verified)

**Calendar Routes**:

- `GET /api/calendar/tasks` - Get tasks for date range (user-filtered)
- `GET /api/calendar/goals` - Get goals for date range (user-filtered)

---

## 🔒 Security Features

✅ **JWT Validation**: All tokens validated against Authentik's JWKS endpoint using industry-standard library (Auth0)
✅ **User Auto-Provisioning**: Users automatically created on first login (just-in-time provisioning)
✅ **Data Isolation**: All data queries filtered by authenticated user ID
✅ **Ownership Verification**: All mutations verify resource ownership
✅ **Cascade Delete Protection**: User deletion cascades to goals and tasks
✅ **Zero Trust**: Every request validated, every resource ownership checked
✅ **Fail Secure**: Missing auth = 401, missing resource = 404
✅ **Performance**: Indexed userId fields, optimized queries

---

## 🔄 Authentication Flow

1. **User logs in via Authentik** (handled by frontend)
2. **Frontend receives JWT token** from Authentik
3. **Frontend sends token** in Authorization header: `Bearer <token>`
4. **API validates token** using express-oauth2-jwt-bearer
5. **API extracts user claims** (sub, email, name)
6. **API ensures User record exists** (creates if first login)
7. **API processes request** with userId context
8. **API returns filtered data** for authenticated user only

---

## 🔍 Troubleshooting

### Common Issues

#### "Cannot find module 'express-oauth2-jwt-bearer'"

**Solution**: Run `pnpm install` in `apps/api`

#### "Property 'user' does not exist on type 'PrismaClient'"

**Solution**: Run `npx prisma generate` to regenerate Prisma client

#### 401 Unauthorized with valid-looking token

**Solutions**:

- Verify `AUTHENTIK_ISSUER` matches token's `iss` claim exactly
- Verify `AUTHENTIK_AUDIENCE` matches token's `aud` claim
- Check token hasn't expired (decode at jwt.io)
- Ensure JWKS endpoint is accessible from API server

#### "Missing required auth configuration"

**Solution**: Set all `AUTHENTIK_*` variables in `.env` and restart API

#### Token validation fails with JWKS errors

**Solutions**:

- Verify `AUTHENTIK_JWKS_URI` is correct and accessible
- Check Authentik signing key is RS256
- Ensure API server can reach Authentik server (network/firewall)

#### 500 Internal Server Error

**Solutions**:

- Check API logs for details
- Verify database connection
- Ensure User table exists (run migrations)

#### Token expired

**Solution**: Get a new token from Authentik

#### Wrong ISSUER/AUDIENCE

**Solution**: Check .env values match Authentik configuration

#### Token malformed

**Solution**: Check Authorization header format: `Bearer <token>`

---

## 📋 File Structure

```
apps/api/src/
├── config/
│   └── auth.ts              # Auth configuration (JWKS, issuer, audience)
├── middleware/
│   └── auth.ts              # JWT validation middleware
├── services/
│   └── userService.ts       # User management (auto-provisioning)
├── routes/
│   ├── auth.ts              # Auth endpoints (/api/auth/*)
│   ├── goals.ts             # Protected goal routes
│   ├── tasks.ts             # Protected task routes
│   └── calendar.ts          # Protected calendar routes
└── index.ts                 # Main app with routes

apps/api/prisma/
└── schema.prisma            # User, Goal, Task models with relationships
```

---

## ✅ Verification Checklist

Complete integration checklist:

- [ ] Can log in via Authentik
- [ ] Token is received and stored by client
- [ ] API `/auth/me` returns user info
- [ ] Can create goals (automatically assigned to user)
- [ ] Can view only own goals
- [ ] Can create tasks linked to own goals
- [ ] Cannot access other users' data
- [ ] Logout clears session
- [ ] User record created automatically on first login
- [ ] Each user sees only their own data
- [ ] All CRUD operations work with authentication
- [ ] No data leakage between users
- [ ] Error messages are clear and helpful

---

## 🎯 Next Steps

1. ✅ API authentication implemented
2. ⬜ Frontend Authentik integration
3. ⬜ Token refresh implementation
4. ⬜ Production HTTPS setup
5. ⬜ CORS configuration for production
6. ⬜ Set up proper logging/monitoring
7. ⬜ Create additional test users in Authentik

---

## 📚 Additional Resources

- [express-oauth2-jwt-bearer docs](https://github.com/auth0/node-oauth2-jwt-bearer)
- [Authentik Provider docs](https://goauthentik.io/docs/providers/oauth2/)
- [JWT.io](https://jwt.io) - Token validation and debugging

---

## 🆘 Need Help?

1. Check this guide's troubleshooting section
2. Review API logs for specific errors
3. Verify Authentik provider configuration
4. Test token at jwt.io
5. Check database for User table and userId columns

---

## 🔐 Security Notes

- Always use HTTPS in production
- Keep client secrets secure (never commit to version control)
- Tokens should be short-lived (configure in Authentik)
- Implement token refresh on the frontend
- Use environment-specific `.env` files (don't use same tokens for dev/prod)
- Configure proper CORS for production domain
- Monitor authentication logs
- Regularly rotate signing keys in Authentik
