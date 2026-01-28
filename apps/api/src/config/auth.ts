import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication configuration for JWT validation with Authentik OIDC.
 *
 * This file provides:
 * - Configuration values loaded from environment variables
 * - Startup validation to ensure required auth settings are configured
 *
 * The actual JWT verification logic is in middleware/auth.ts
 */

export const authConfig = {
  // Authentik OIDC issuer URL (e.g., https://auth.yourdomain.com/application/o/goal-tracker/)
  issuer: process.env.AUTHENTIK_ISSUER || '',

  // JWKS URI for fetching public keys
  jwksUri: process.env.AUTHENTIK_JWKS_URI || '',

  // Expected audience (usually the client ID)
  audience: process.env.AUTHENTIK_AUDIENCE || '',

  // Token issuer
  tokenIssuer: process.env.AUTHENTIK_TOKEN_ISSUER || process.env.AUTHENTIK_ISSUER || '',
};

export const validateAuthConfig = () => {
  const required = ['issuer', 'audience'];
  const missing = required.filter((key) => !authConfig[key as keyof typeof authConfig]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required auth configuration: ${missing.join(', ')}. ` +
        `Please set the following environment variables: ${missing.map((k) => `AUTHENTIK_${k.toUpperCase()}`).join(', ')}`
    );
  }
};
