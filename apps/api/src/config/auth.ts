import dotenv from 'dotenv';

dotenv.config();

/**
 * Authentication configuration for JWT validation with Auth0.
 *
 * This file provides:
 * - Configuration values loaded from environment variables
 * - Startup validation to ensure required auth settings are configured
 *
 * The actual JWT verification logic is in middleware/auth.ts
 */

export const authConfig = {
  // Auth0 issuer URL (e.g., https://your-tenant.auth0.com/)
  issuer: process.env.AUTH0_ISSUER || '',

  // Expected audience (your API identifier)
  audience: process.env.AUTH0_AUDIENCE || '',
};

export const validateAuthConfig = () => {
  const required = ['issuer', 'audience'];
  const missing = required.filter((key) => !authConfig[key as keyof typeof authConfig]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required auth configuration: ${missing.join(', ')}. ` +
        `Please set the following environment variables: ${missing.map((k) => `AUTH0_${k.toUpperCase()}`).join(', ')}`
    );
  }
};
