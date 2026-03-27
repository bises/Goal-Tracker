# Deployment Approval Setup

The CI/CD pipeline now supports **independent manual approval** for each app (API, Web, Mobile) before deployment.

## How It Works

### Workflow Flow

```
Push/PR → All Tests Run (API, Web, Mobile, Lint, TypeCheck)
          ↓
          Tests Pass
          ↓
    ┌─────┴─────┬─────────┐
    ↓           ↓         ↓
🔒 API      🔒 Web    🔒 Mobile
   Approval    Approval  Approval
    ↓           ↓         ↓
   Deploy      Deploy    Deploy
```

**Each app has its own approval gate** - you can approve API without approving Web, or vice versa!

### Environments

#### Preview (for PRs):

- `api-preview` - API preview deployments
- `web-preview` - Web preview deployments
- `mobile-preview` - Mobile OTA preview updates

#### Production (for main branch):

- `api-production` - API production deployments
- `web-production` - Web production deployments
- `mobile-production` - Mobile OTA production updates

---

## Setup GitHub Environment Protection Rules

### 1. Create 6 Environments

Go to your GitHub repository → **Settings** → **Environments**

Create each of these environments with protection rules:

#### Preview Environments (for PRs)

**1. `api-preview`**

- Required reviewers: Add yourself
- Deployment branches: All branches
- Wait timer: (Optional) 0-5 minutes

**2. `web-preview`**

- Required reviewers: Add yourself
- Deployment branches: All branches
- Wait timer: (Optional) 0-5 minutes

**3. `mobile-preview`**

- Required reviewers: Add yourself
- Deployment branches: All branches
- Wait timer: (Optional) 0-5 minutes

#### Production Environments (for main)

**4. `api-production`**

- Required reviewers: Add senior team members
- Deployment branches: **Selected branches** → `main` only
- Wait timer: (Optional) 5-15 minutes cooldown

**5. `web-production`**

- Required reviewers: Add senior team members
- Deployment branches: **Selected branches** → `main` only
- Wait timer: (Optional) 5-15 minutes cooldown

**6. `mobile-production`**

- Required reviewers: Add senior team members
- Deployment branches: **Selected branches** → `main` only
- Wait timer: (Optional) 5-15 minutes cooldown

---

## How to Selectively Approve Deployments

When tests pass, you'll see **separate approval requests** for each app that changed:

### Example: Only API and Mobile changed

After tests pass, you'll see:

```
⏸️ Deploy API to Preview - Waiting for approval
⏸️ Deploy Mobile to Preview - Waiting for approval
✅ Deploy Web to Preview - Skipped (no changes)
```

**You can approve each independently:**

1. **Approve only API** → API deploys, Mobile still waiting
2. **Review Mobile changes** → Then approve Mobile
3. **Web doesn't deploy** → No changes detected

---

## Approval Workflow Examples

### Example 1: Preview Deploy - Approve Selectively

```bash
# Make API and Web changes
git checkout -b feat/update-endpoints
# ... make changes to API and Web ...
git push origin feat/update-endpoints

# Open PR on GitHub
# → All tests run (API ✅, Web ✅, Mobile ✅)
# → 3 approval gates appear:
#   - Deploy API to Preview (waiting)
#   - Deploy Web to Preview (waiting)
#   - Deploy Mobile to Preview (skipped - no changes)

# You review and approve:
# ✅ Approve API first → API deploys immediately
# ⏸️ Wait 30 minutes to review Web changes
# ✅ Approve Web later → Web deploys
```

### Example 2: Production Deploy - Staggered Rollout

```bash
# Merge PR to main
git checkout main && git pull

# → All tests run
# → 3 approval gates for production:
#   - Deploy API to Production (waiting)
#   - Deploy Web to Production (waiting)
#   - Deploy Mobile to Production (waiting)

# Staged deployment:
# 1. ✅ Approve API first → Backend goes live
# 2. Test API for 15 minutes
# 3. ✅ Approve Web → Frontend goes live with new API
# 4. Monitor for issues
# 5. ✅ Approve Mobile → Push OTA update to users
```

---

## Deployment Strategy Options

### Strategy 1: Deploy All Together

Approve all apps at once (API → Web → Mobile in rapid succession)

- **Pros**: Fast, simple
- **Cons**: Higher risk if something breaks

### Strategy 2: Staged Rollout (Recommended)

Approve apps one at a time with monitoring between

- **Pros**: Catch issues early, rollback easier
- **Cons**: Takes more time

### Strategy 3: Selective Deployment

Deploy only what changed or what you trust

- **Pros**: Maximum control
- **Cons**: Apps might be out of sync temporarily

---

## How to Approve/Reject

### From GitHub UI

1. Go to **Actions** tab
2. Click on the running workflow
3. See **"Review pending deployments"** button
4. Click **"Review deployments"**
5. **Select which environments to approve**:
   - ✅ `api-preview`
   - ✅ `mobile-preview`
   - ❌ `web-preview` (leave unchecked to skip)
6. Add optional comment
7. Click **"Approve and deploy"**

### From Pull Request

Approval requests also appear directly on the PR:

- PR page → **"View deployment requests"**
- Click → Approve individually

---

## Required Secrets (Repository or Environment Level)

### Repository Secrets (shared across all environments)

- `GITHUB_TOKEN` (auto-provided by GitHub)
- `EXPO_TOKEN` - Expo access token for mobile deploys

### Production Environment Secrets (override repository secrets)

- `VITE_API_URL` - Production API URL
- `SERVER_HOST` - Production server address
- `SERVER_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH key for deployment
- `TS_OAUTH_CLIENT_ID` - Tailscale OAuth client
- `TS_OAUTH_SECRET` - Tailscale OAuth secret

---

## FAQ

### Q: Can I approve just Mobile deploy without API/Web?

**A:** Yes! Each app is independent. If only Mobile changed, only Mobile will ask for approval.

### Q: What if I only want to deploy API but not Web?

**A:** Simply approve the `api-production` deployment and leave `web-production` waiting (or reject it).

### Q: Can different people approve different apps?

**A:** Yes! You can configure different reviewers for each environment. For example:

- Backend team → `api-production`
- Frontend team → `web-production`
- Mobile team → `mobile-production`

### Q: What happens if tests fail for one app?

**A:** Only passing apps will show deployment approvals. Failed apps won't have a deployment step.

### Q: Can I auto-approve preview deploys but require approval for production?

**A:** Yes! Remove protection rules from preview environments but keep them on production environments.

### Q: How do I cancel a deployment that's waiting?

**A:** Click "Review deployments" → Select the environment → Click "Reject"

---

## Troubleshooting

### "Deployment skipped" when app changed

- Check that tests passed for that app
- Verify the path filter in `changes` job detected the changes
- Look at workflow logs for conditional evaluation

### Multiple approval requests for same app

- This means the workflow ran multiple times
- Cancel old workflow runs if they're outdated

### Can't find "Review deployments" button

- Ensure you're a collaborator with write access
- Check that environment protection rules are configured
- Refresh the Actions page

---

## Next Steps

1. ✅ Set up environments with protection rules (above)
2. ✅ Add required secrets to production environment
3. ✅ Test with a dummy PR
4. ✅ Approve and verify preview deployment
5. ✅ Test production deployment from main branch

**You're all set!** 🚀 Every deployment now requires explicit approval.
