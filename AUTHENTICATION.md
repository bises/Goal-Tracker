# Authentication Guide

Complete guide for Auth0 authentication integration in Goal Tracker.

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
cd ../web && pnpm install

# 2. Configure environment
# Create .env files in both apps/api and apps/web
# See Configuration section below

# 3. Run database migration
cd apps/api
npx prisma generate && npx prisma migrate dev

# 4. Start services
# Terminal 1 - API
cd apps/api && pnpm run dev

# Terminal 2 - Web
cd apps/web && pnpm run dev
```

---

## 📦 Prerequisites

- ☐ Auth0 account (free tier works)
- ☐ PostgreSQL database is running
- ☐ Node.js and pnpm installed

---

## 🔧 Setup Steps

### Step 1: Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications** → **Applications**
3. Click **Create Application**
4. Configure:
   - **Name**: Goal Tracker
   - **Application Type**: Single Page Application
5. Click **Create**

### Step 2: Configure Auth0 Application Settings

In your application settings:

1. **Application URIs**:
   - **Allowed Callback URLs**:
     ```
     http://localhost:5173/callback,https://yourdomain.com/callback
     ```
   - **Allowed Logout URLs**:
     ```
     http://localhost:5173/login,https://yourdomain.com/login
     ```
   - **Allowed Web Origins**:
     ```
     http://localhost:5173,https://yourdomain.com
     ```

2. **Cross-Origin Authentication**: Enable
3. **Token Endpoint Authentication Method**: None (for SPA)
4. Click **Save Changes**

### Step 3: Create Auth0 API

1. Navigate to **Applications** → **APIs**
2. Click **Create API**
3. Configure:
   - **Name**: Goal Tracker API
   - **Identifier**: `https://api.goaltracker.com` (or your API URL)
   - **Signing Algorithm**: RS256
4. Click **Create**

### Step 4: Configure API Permissions (Optional)

In your API settings, you can define custom scopes:

- Go to **Permissions** tab
- Add scopes like: `read:goals`, `write:goals`, `read:tasks`, `write:tasks`
- For now, the basic `openid profile email` scopes are sufficient

### Step 5: Note Down Configuration Values

From Auth0 Dashboard, collect these values:

**From Application Settings**:

- Domain: `your-tenant.auth0.com`
- Client ID: `xxxxxxxxxxxxxxxxxxxx`

**From API Settings**:

- API Identifier (Audience): `https://api.goaltracker.com`

### Step 6: Configure Backend Environment

Create `apps/api/.env`:

```env
# Auth0 Configuration
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.goaltracker.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/goaltracker

# Server
PORT=3000
```

### Step 7: Configure Frontend Environment

Create `apps/web/.env` or `apps/web/.env.local`:

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://api.goaltracker.com

# API URL
VITE_API_URL=http://localhost:3000/api
```

### Step 8: Install Dependencies

```bash
# Backend dependencies (already installed)
cd apps/api
pnpm install

# Frontend dependencies (already installed)
cd apps/web
pnpm install
```

### Step 9: Run Database Migration

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev
```

### Step 10: Start Development Servers

```bash
# Terminal 1 - API
cd apps/api
pnpm run dev

# Terminal 2 - Web
cd apps/web
pnpm run dev
```

---

## 🔑 Configuration

### Backend Environment Variables (.env)

```env
# Auth0 Configuration
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.goaltracker.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/goaltracker

# Server
PORT=3000
NODE_ENV=development
```

### Frontend Environment Variables (.env)

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=AbCdEf123456
VITE_AUTH0_AUDIENCE=https://api.goaltracker.com

# API URL
VITE_API_URL=http://localhost:3000/api
```

---

## 🧪 Testing Authentication

### Test 1: Frontend Login Flow

1. Open browser to `http://localhost:5173`
2. You should be redirected to Auth0 login
3. Create an account or sign in
4. You should be redirected back to `/callback` then to home page

### Test 2: Protected API Endpoint

In browser dev tools, you should see API calls with Bearer token:

```bash
# From browser console
fetch('http://localhost:3000/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth0_token') }
})
```

**Expected**:

```json
{
  "id": "...",
  "sub": "auth0|...",
  "email": "user@example.com",
  "name": "Test User",
  "createdAt": "..."
}
```

### Test 3: Verify User Was Created

```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM \"User\";"
```

**Expected**: Your test user should appear with Auth0 sub

### Test 4: Test Goals Endpoint

```bash
# Use the token from Auth0
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/goals
```

**Expected**: Empty array `[]` or your existing goals

### Validate Token

Go to https://jwt.io and paste your token. Verify:

- `iss` matches `https://your-tenant.auth0.com/`
- `aud` matches your API audience
- `exp` (expiration) is in the future
- `sub` (user ID) exists (format: `auth0|...`)

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

✅ **JWT Validation**: All tokens validated against Auth0's JWKS endpoint using industry-standard library
✅ **User Auto-Provisioning**: Users automatically created on first login (just-in-time provisioning)
✅ **Data Isolation**: All data queries filtered by authenticated user ID
✅ **Ownership Verification**: All mutations verify resource ownership
✅ **Cascade Delete Protection**: User deletion cascades to goals and tasks
✅ **Zero Trust**: Every request validated, every resource ownership checked
✅ **Fail Secure**: Missing auth = 401, missing resource = 404
✅ **Performance**: Indexed userId fields, optimized queries

---

## 🔄 Authentication Flow

1. **User clicks "Sign In"** in the app
2. **Redirected to Auth0** Universal Login page
3. **User authenticates** with Auth0 (email/password, social, etc.)
4. **Auth0 redirects back** to `/callback` with authorization code
5. **Frontend exchanges code** for access token (handled by @auth0/auth0-react)
6. **Frontend stores token** and uses it for API calls
7. **API validates token** using express-oauth2-jwt-bearer
8. **API extracts user claims** (sub, email, name)
9. **API ensures User record exists** (creates if first login)
10. **API processes request** with userId context
11. **API returns filtered data** for authenticated user only

---

## 🔍 Troubleshooting

### Common Issues

#### "Cannot find module '@auth0/auth0-react'"

**Solution**: Run `pnpm install` in `apps/web`

#### "Property 'user' does not exist on type 'PrismaClient'"

**Solution**: Run `npx prisma generate` to regenerate Prisma client

#### 401 Unauthorized with valid-looking token

**Solutions**:

- Verify `AUTH0_ISSUER` matches token's `iss` claim exactly (must end with `/`)
- Verify `AUTH0_AUDIENCE` matches token's `aud` claim
- Check token hasn't expired (decode at jwt.io)
- Ensure JWKS endpoint is accessible from API server

#### "Missing required auth configuration"

**Solution**: Set all `AUTH0_*` variables in `.env` and restart services

#### Token validation fails with JWKS errors

**Solutions**:

- Verify Auth0 domain is correct and accessible
- Check network/firewall allows access to Auth0
- Ensure signing algorithm is RS256

#### "Audience is invalid" error

**Solution**: Verify the API audience in frontend matches the API identifier in Auth0

#### Login redirect loop

**Solutions**:

- Check callback URL is added to Auth0 app settings
- Verify Auth0 domain and client ID are correct
- Clear browser storage and try again

#### "Failed to fetch user" or similar errors

**Solutions**:

- Check Auth0 API permissions
- Ensure audience is configured in frontend
- Verify user has profile data in Auth0

#### CORS errors

**Solutions**:

- Verify web origin is added to Auth0 app settings
- Check API CORS configuration allows frontend origin

---

## 📋 File Structure

```
apps/api/src/
├── config/
│   └── auth.ts              # Auth0 configuration (issuer, audience)
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

apps/web/src/
├── main.tsx                 # Auth0Provider setup
├── App.tsx                  # Auth0 hooks usage
├── api.ts                   # Authenticated fetch wrapper
├── pages/
│   ├── LoginPage.tsx        # Login page with Auth0
│   └── CallbackPage.tsx     # OAuth callback handler
└── components/shared/
    └── ProtectedRoute.tsx   # Route protection component

apps/api/prisma/
└── schema.prisma            # User, Goal, Task models with relationships
```

---

## ✅ Verification Checklist

Complete integration checklist:

- [ ] Can log in via Auth0
- [ ] Token is received and stored by client
- [ ] API `/auth/me` returns user info
- [ ] Can create goals (automatically assigned to user)
- [ ] Can view only own goals
- [ ] Can create tasks linked to own goals
- [ ] Cannot access other users' data
- [ ] Logout redirects properly
- [ ] User record created automatically on first login
- [ ] Each user sees only their own data
- [ ] All CRUD operations work with authentication
- [ ] No data leakage between users
- [ ] Error messages are clear and helpful

---

## 🎯 Production Deployment

### Auth0 Settings for Production

1. Update **Allowed Callback URLs** to include production URL
2. Update **Allowed Logout URLs** to include production URL
3. Update **Allowed Web Origins** to include production domain
4. Consider enabling **Multi-Factor Authentication** in Auth0 Dashboard
5. Review **Password Strength** settings
6. Configure **Custom Domain** (optional but recommended)

### Environment Variables

Update production `.env` files with production values:

**Backend**:

```env
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.yourdomain.com
DATABASE_URL=postgresql://...
NODE_ENV=production
```

**Frontend**:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_production_client_id
VITE_AUTH0_AUDIENCE=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api
```

---

## 📚 Additional Resources

- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 Node.js API](https://auth0.com/docs/quickstart/backend/nodejs/interactive)
- [express-oauth2-jwt-bearer docs](https://github.com/auth0/node-oauth2-jwt-bearer)
- [JWT.io](https://jwt.io) - Token validation and debugging
- [Auth0 Dashboard](https://manage.auth0.com/)

---

## 🆘 Need Help?

1. Check this guide's troubleshooting section
2. Review browser console and API logs for specific errors
3. Verify Auth0 application configuration
4. Test token at jwt.io
5. Check Auth0 logs in Dashboard → Monitoring → Logs

---

## 🔐 Security Notes

- Always use HTTPS in production
- Keep client secrets secure (never commit to version control)
- Tokens should be short-lived (configure in Auth0 Dashboard)
- Token refresh is handled automatically by Auth0 SDK
- Use environment-specific `.env` files (don't use same tokens for dev/prod)
- Configure proper CORS for production domain
- Monitor authentication logs in Auth0 Dashboard
- Regularly review security settings in Auth0
