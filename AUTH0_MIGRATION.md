# Auth0 Migration Summary

## ✅ Changes Completed

### Backend Changes (apps/api)

1. **Configuration** ([config/auth.ts](apps/api/src/config/auth.ts))
   - Updated to use Auth0 environment variables (`AUTH0_ISSUER`, `AUTH0_AUDIENCE`)
   - Removed Authentik-specific JWKS URI configuration
   - Simplified to required Auth0 parameters only

2. **Middleware** ([middleware/auth.ts](apps/api/src/middleware/auth.ts))
   - Updated JWT validation to work with Auth0
   - Changed `preferred_username` to `nickname` field for Auth0 compatibility
   - No package changes needed (express-oauth2-jwt-bearer works with Auth0)

3. **Environment Configuration**
   - Updated [.env.example](apps/api/.env.example) with Auth0 variables
   - Required variables:
     - `AUTH0_ISSUER` - Your Auth0 tenant URL (e.g., `https://your-tenant.auth0.com/`)
     - `AUTH0_AUDIENCE` - Your API identifier from Auth0

### Frontend Changes (apps/web)

1. **Main Entry** ([main.tsx](apps/web/src/main.tsx))
   - Replaced `react-oidc-context` with `@auth0/auth0-react`
   - Changed `AuthProvider` to `Auth0Provider`
   - Updated configuration structure for Auth0

2. **App Component** ([App.tsx](apps/web/src/App.tsx))
   - Replaced `useAuth` hook with `useAuth0`
   - Updated to use Auth0's methods: `getAccessTokenSilently`, `logout`, `loginWithRedirect`
   - Added Auth token provider setup for API calls
   - Updated user object access pattern (`user.name` vs `auth.user?.profile?.name`)

3. **API Client** ([api.ts](apps/web/src/api.ts))
   - Completely refactored token retrieval mechanism
   - Removed session storage token parsing
   - Implemented `setAuthTokenProvider` function for Auth0 token injection
   - Uses `getAccessTokenSilently()` from Auth0 SDK

4. **Login Page** ([pages/LoginPage.tsx](apps/web/src/pages/LoginPage.tsx))
   - Updated to use `useAuth0` hook
   - Changed `signinRedirect()` to `loginWithRedirect()`
   - Updated button text from "Sign In with Authentik" to "Sign In with Auth0"

5. **Callback Page** ([pages/CallbackPage.tsx](apps/web/src/pages/CallbackPage.tsx))
   - Simplified to use Auth0's automatic callback handling
   - Updated to use `useAuth0` hook

6. **Protected Route** ([components/shared/ProtectedRoute.tsx](apps/web/src/components/shared/ProtectedRoute.tsx))
   - Updated to use `useAuth0` hook
   - Changed authentication check methods

7. **Package Management**
   - ✅ Installed `@auth0/auth0-react`
   - ✅ Removed `react-oidc-context`
   - ✅ Removed `oidc-client-ts`

8. **Environment Configuration**
   - Updated [.env.example](apps/web/.env.example) with Auth0 variables
   - Required variables:
     - `VITE_AUTH0_DOMAIN` - Your Auth0 domain (e.g., `your-tenant.auth0.com`)
     - `VITE_AUTH0_CLIENT_ID` - Your Auth0 application client ID
     - `VITE_AUTH0_AUDIENCE` - Your API identifier

### Documentation

1. **Authentication Guide** ([AUTHENTICATION.md](AUTHENTICATION.md))
   - Completely rewritten for Auth0
   - Updated setup instructions
   - Updated configuration examples
   - Updated troubleshooting guide
   - Added Auth0-specific testing procedures

## 📋 Required Setup Steps

### 1. Create Auth0 Account & Application

1. Sign up at [auth0.com](https://auth0.com) (free tier available)
2. Create a new **Single Page Application**
3. Create a new **API**
4. Configure Allowed Callback URLs: `http://localhost:5173/callback, https://yourdomain.com/callback`
5. Configure Allowed Logout URLs: `http://localhost:5173/login, https://yourdomain.com/login`
6. Configure Allowed Web Origins: `http://localhost:5173, https://yourdomain.com`

### 2. Configure Environment Variables

**Backend (apps/api/.env)**:

```env
AUTH0_ISSUER=https://your-tenant.auth0.com/
AUTH0_AUDIENCE=https://api.goaltracker.com
DATABASE_URL=postgresql://user:password@localhost:5432/goaltracker
PORT=3000
```

**Frontend (apps/web/.env)**:

```env
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your_client_id_here
VITE_AUTH0_AUDIENCE=https://api.goaltracker.com
VITE_API_URL=http://localhost:3000/api
```

### 3. Install Dependencies

Frontend dependencies are already installed. If needed:

```bash
cd apps/web
pnpm install
```

### 4. Test the Application

```bash
# Terminal 1 - Start API
cd apps/api
pnpm run dev

# Terminal 2 - Start Web
cd apps/web
pnpm run dev
```

Visit `http://localhost:5173` and test login flow.

## 🔍 Key Differences: Authentik vs Auth0

| Feature       | Authentik              | Auth0                                     |
| ------------- | ---------------------- | ----------------------------------------- |
| Provider Type | Self-hosted OIDC       | Managed OAuth2/OIDC                       |
| Package       | `react-oidc-context`   | `@auth0/auth0-react`                      |
| Configuration | Authority + JWKS URI   | Domain + Audience                         |
| Token Storage | Manual session storage | Built-in SDK management                   |
| User Fields   | `preferred_username`   | `nickname`                                |
| Logout        | `signoutRedirect()`    | `logout({ logoutParams: {...} })`         |
| Login         | `signinRedirect()`     | `loginWithRedirect()`                     |
| Token Refresh | Manual                 | Automatic with `getAccessTokenSilently()` |

## 🎯 Benefits of Auth0

- ✅ Zero infrastructure to maintain
- ✅ Built-in security features
- ✅ Automatic token refresh
- ✅ Social login providers ready
- ✅ MFA support out of the box
- ✅ Better developer experience
- ✅ Comprehensive dashboard
- ✅ Free tier for development

## ⚠️ Migration Notes

1. **No Database Changes Required** - The User table structure remains the same
2. **Token Format Changes** - Auth0 tokens have different `sub` format (e.g., `auth0|123` instead of UUID)
3. **Existing Users** - Users will need to create new accounts in Auth0 (data migration not automatic)
4. **Token Expiry** - Auth0 handles token refresh automatically via the SDK

## 📚 Additional Resources

- [Auth0 React Quickstart](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 Node.js API](https://auth0.com/docs/quickstart/backend/nodejs/interactive)
- [Complete Authentication Guide](AUTHENTICATION.md)

## ✅ Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Login redirects to Auth0
- [ ] After login, redirects back to app
- [ ] User profile displays correctly
- [ ] API calls include Bearer token
- [ ] Goals and tasks can be created
- [ ] Logout works correctly
- [ ] Protected routes are secure
