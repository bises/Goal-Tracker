# Mobile App Deployment Guide

## Overview

The mobile app uses **Expo Application Services (EAS)** for deployment, which provides:

- **EAS Update**: Over-the-air (OTA) updates for JavaScript/TypeScript changes
- **EAS Build**: Cloud-based native builds for iOS and Android app stores

## GitHub Actions Workflows

### 1. Deploy Mobile (`deploy-mobile.yml`)

**Triggers:**

- On push to `main` when mobile app files change
- Manual workflow dispatch with profile selection

**What it does:**

- **Test Job**: Runs linting on mobile app code
- **Deploy Job**: Publishes OTA update using EAS Update
- **Build Job** (manual only): Creates native builds for iOS/Android

**Deployment Flow:**

```
Push to main → Test → Publish OTA Update → Done
Manual trigger → Test → Publish OTA Update + Build Native Apps
```

### 2. Full Deployment (`deploy.yml`)

Includes mobile deployment as part of the full deployment workflow.

### 3. CI (`ci.yml`)

Tests mobile app on pull requests when mobile files change.

## Required GitHub Secrets

Add these secrets to your GitHub repository (`Settings → Secrets and variables → Actions`):

### `EXPO_TOKEN`

**Required for:** EAS authentication

**How to get it:**

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Create token: `eas build:configure`
4. Or get from: https://expo.dev/accounts/[your-account]/settings/access-tokens

## EAS Configuration

### File: `apps/mobile/eas.json`

**Profiles:**

- **development**: For internal testing with dev client
- **preview**: Internal distribution (APK for Android, TestFlight for iOS)
- **production**: App store builds

**Update Channels:**

- `development`: Alpha/dev builds
- `preview`: Beta builds
- `production`: Production releases

## Deployment Types

### 1. OTA Updates (Automatic on Push)

**Use for:**

- Bug fixes
- UI changes
- New features (JS/TS only)
- No native code changes

**Process:**

```bash
# Automatic via GitHub Actions on push to main
# Or manually:
cd apps/mobile
eas update --branch production
```

**Limitations:**

- Cannot change native dependencies
- Cannot modify app.json significantly
- Cannot update SDK version

### 2. Native Builds (Manual Trigger)

**Use for:**

- Adding native modules
- Changing Expo SDK version
- Updating app.json (icons, splash, etc.)
- First-time app store submission

**Process:**

```bash
# Via GitHub Actions (manual trigger)
# Or locally:
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production
```

**Submit to stores:**

```bash
eas submit --platform ios
eas submit --platform android
```

## Workflow Triggers

### Automatic Deployment

Push to `main` with changes in:

- `apps/mobile/**`
- `packages/shared/**`
- `pnpm-lock.yaml`

### Manual Deployment

1. Go to **Actions** → **Deploy Mobile**
2. Click **Run workflow**
3. Select profile (development/preview/production)
4. Click **Run workflow**

Manual runs will:

- Publish OTA update
- Build native apps for iOS and Android

## Environment Variables

### Build-time Variables

Set in `eas.json` under each profile's `env` field:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.goaltracker.app"
  }
}
```

## First-Time Setup

### 1. Create Expo Account

```bash
npx expo login
```

### 2. Configure EAS

```bash
cd apps/mobile
eas build:configure
```

### 3. Create Development Build (Optional)

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 4. Create Production Build

```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 5. Submit to App Stores

**iOS (App Store):**

```bash
eas submit --platform ios
```

**Android (Google Play):**

```bash
eas submit --platform android
```

## Update Strategies

### Minor Updates (OTA)

- Push to `main`
- GitHub Actions publishes update automatically
- Users receive update on next app launch

### Major Updates (Native Build)

1. Update `version` in `app.json`
2. Run workflow manually or use EAS CLI
3. Submit to app stores
4. Users update via store

## Testing Deployments

### Preview Channel (Beta Testing)

```bash
# GitHub Actions manual trigger with 'preview' profile
# Or:
cd apps/mobile
eas update --branch preview
eas build --profile preview --platform ios
```

### Development Channel

```bash
cd apps/mobile
eas update --branch development
```

## Monitoring

### Check Update Status

```bash
eas update:list --branch production
```

### Check Build Status

```bash
eas build:list --platform all
```

### View Build Logs

```bash
eas build:view [BUILD_ID]
```

## Troubleshooting

### Build Fails

- Check EAS build logs in Expo dashboard
- Verify `eas.json` configuration
- Ensure all native dependencies are compatible

### OTA Update Not Received

- Check update channel matches the build
- Verify `EXPO_TOKEN` secret is set
- Ensure app version matches update constraints

### GitHub Actions Fails

- Verify `EXPO_TOKEN` secret exists and is valid
- Check workflow logs for specific errors
- Ensure pnpm dependencies install correctly

## Best Practices

1. **Always test OTA updates** in preview channel before production
2. **Increment version** in `app.json` for native builds
3. **Use semantic versioning**: `major.minor.patch`
4. **Create release notes** in GitHub releases
5. **Monitor Expo dashboard** after deployments
6. **Test on physical devices** before app store submission

## Links

- [Expo Dashboard](https://expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Update Documentation](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
