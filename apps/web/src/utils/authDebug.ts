/**
 * Authentication Debug Utilities
 * Use these functions to monitor and troubleshoot authentication issues
 */

/**
 * Check if tokens are stored in localStorage
 */
export const checkStoredTokens = () => {
  const authState = localStorage.getItem('@@auth0spajs@@');
  if (!authState) {
    console.warn('⚠️ No Auth0 state found in localStorage');
    return null;
  }

  try {
    const parsed = JSON.parse(authState);
    const keys = Object.keys(parsed);
    console.log('📦 Auth0 cache keys:', keys);

    // Log details about each cached entry (without exposing full tokens)
    keys.forEach((key) => {
      const entry = parsed[key];
      console.log(`  🔑 ${key}:`, {
        hasAccessToken: !!entry.body?.access_token,
        hasRefreshToken: !!entry.body?.refresh_token,
        hasIdToken: !!entry.body?.id_token,
        expiresAt: entry.body?.expires_at,
      });
    });

    return parsed;
  } catch (e) {
    console.error('❌ Failed to parse Auth0 cache:', e);
    return null;
  }
};

/**
 * Check token expiration
 */
export const checkTokenExpiration = () => {
  const authState = checkStoredTokens();
  if (!authState) return null;

  const keys = Object.keys(authState);
  const expirationInfo = keys.map((key) => {
    const entry = authState[key];
    const expiresAt = entry.body?.expires_at;
    if (!expiresAt) return null;

    const expirationDate = new Date(expiresAt * 1000);
    const now = new Date();
    const isExpired = now > expirationDate;
    const timeUntilExpiry = expirationDate.getTime() - now.getTime();
    const hoursUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60 * 60));

    return {
      key,
      expirationDate,
      isExpired,
      hoursUntilExpiry,
    };
  });

  expirationInfo.forEach((info) => {
    if (!info) return;
    if (info.isExpired) {
      console.error(`❌ Token ${info.key} EXPIRED on ${info.expirationDate}`);
    } else {
      console.log(`✅ Token ${info.key} expires in ${info.hoursUntilExpiry} hours`);
    }
  });

  return expirationInfo;
};

/**
 * Clear Auth0 cache (use for debugging only!)
 */
export const clearAuthCache = () => {
  if (localStorage.getItem('@@auth0spajs@@')) {
    localStorage.removeItem('@@auth0spajs@@');
    console.warn('🗑️  Cleared Auth0 cache from localStorage');
  }
};

/**
 * Display full authentication status
 */
export const displayAuthStatus = () => {
  console.group('🔐 Authentication Status');
  console.log('Current time:', new Date().toISOString());
  checkStoredTokens();
  checkTokenExpiration();
  console.groupEnd();
};

/**
 * Monitor Auth0 silent authentication attempts
 */
export const setupAuthMonitoring = () => {
  // Hook into fetch to monitor API calls
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    const [url] = args;
    if (typeof url === 'string' && url.includes('oauth')) {
      console.log(`🔄 Auth0 request: ${url}`);
    }
    return originalFetch.apply(this, args);
  };

  console.log('✅ Auth monitoring enabled');
};
