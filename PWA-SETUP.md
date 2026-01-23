# PWA (Progressive Web App) Setup Guide

Your Goal Tracker app is now installable as a Progressive Web App! 🎉

## What's Been Added

### 1. PWA Plugin Configuration

- Installed `vite-plugin-pwa` package
- Configured in `vite.config.ts` with automatic service worker generation
- Added offline caching for assets, fonts, and API calls

### 2. Web App Manifest

- Created `/public/manifest.json` with app metadata
- Defines app name, colors, icons, and display mode
- Linked in `index.html`

### 3. App Icons

- Added 192x192 icon (`/public/icon-192.png`)
- Added 512x512 icon (`/public/icon-512.png`)
- Note: These are placeholder icons - replace with your actual app logo

### 4. Service Worker

- Automatically generated during build
- Handles offline caching
- Caches fonts from Google Fonts
- Caches API responses (5 minute TTL)
- Auto-updates when new version is available

## How to Test

### Development Mode

1. Start the dev server: `pnpm run dev`
2. Open Chrome/Edge browser
3. Navigate to `http://localhost:5174` (or the port shown in terminal)
4. Look for the install icon in the address bar (⊕ or ↓)
5. Click to install the app

### Production Mode

1. Build the app: `cd apps/web && pnpm run build`
2. Preview the build: `pnpm run preview`
3. Open in browser and test install functionality

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS & macOS) - with limitations
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ Opera

## Features Enabled

✅ **Install Prompt** - Users can install from browser
✅ **Offline Mode** - Basic caching of assets
✅ **App Icon** - Appears in app drawer/start menu
✅ **Standalone Mode** - Runs without browser UI
✅ **Auto-Updates** - Service worker updates automatically
✅ **Font Caching** - Google Fonts cached for offline use
✅ **API Caching** - Network-first strategy with 5min cache

## Next Steps

### 1. Replace Icons

Replace the placeholder icons with your actual app logo:

- Design icons at 192x192 and 512x512 pixels
- Use PNG format with transparency
- Place in `/public/` directory
- Icons should be simple and recognizable at small sizes

### 2. Customize Theme Colors

Edit `manifest.json` to match your brand:

```json
{
  "theme_color": "#4f46e5", // Browser toolbar color
  "background_color": "#ffffff" // Splash screen color
}
```

### 3. Add Screenshots (Optional)

Add app screenshots to manifest for better install prompt:

```json
{
  "screenshots": [
    {
      "src": "/screenshot1.png",
      "sizes": "1280x720",
      "type": "image/png"
    }
  ]
}
```

### 4. Configure Caching Strategy

Adjust caching in `vite.config.ts` based on your needs:

- **CacheFirst**: Good for fonts, images (use cached version)
- **NetworkFirst**: Good for API calls (try network, fallback to cache)
- **StaleWhileRevalidate**: Good for frequently updated content

### 5. Test on Mobile

- Deploy to a server with HTTPS
- Test install on iOS Safari and Android Chrome
- Verify app appears in app drawer
- Test offline functionality

## Deployment Considerations

### HTTPS Required

- Service workers require HTTPS in production
- Local development (localhost) works without HTTPS
- Your Docker setup should already handle this

### Update the API URL

If your API URL changes in production, update the caching pattern in `vite.config.ts`:

```typescript
urlPattern: /^https:\/\/your-api-domain\.com\/api\/.*/i,
```

### Build Process

The service worker is automatically generated during build:

```bash
pnpm run build
```

This creates:

- `dist/sw.js` - Service worker
- `dist/manifest.webmanifest` - Optimized manifest
- `dist/registerSW.js` - Registration script

## Troubleshooting

### Install Button Not Showing

- Clear browser cache and reload
- Check that manifest is properly linked in HTML
- Verify HTTPS (in production)
- Check browser console for errors

### Service Worker Not Registering

- Check browser DevTools > Application > Service Workers
- Look for registration errors in console
- Ensure no other service workers are registered
- Try unregistering and re-registering

### Updates Not Working

- Service worker updates on navigation
- May need to close all tabs and reopen
- Can force update via DevTools > Application > Service Workers

### Testing Offline Mode

1. Open DevTools > Network
2. Check "Offline" checkbox
3. Reload page - should still work
4. Cached API calls should be available

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://web.dev/add-manifest/)

## Current Status

✅ PWA configured and ready to use
✅ Service worker auto-generated on build
✅ Install prompt available in Chrome/Edge
✅ Basic offline caching enabled
⚠️ Using placeholder icons - replace with actual logo
⚠️ Test thoroughly on mobile devices before production
