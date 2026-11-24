import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { authConfig } from '../config/auth';

// Define the expected JWT payload structure from Auth0
interface AuthPayload {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  [key: string]: any;
}

/**
 * JWT validation middleware using express-oauth2-jwt-bearer
 * Validates JWT tokens from Auth0 and extracts user claims
 */
export const validateJWT = auth({
  issuerBaseURL: authConfig.issuer,
  audience: authConfig.audience,
});

/**
 * Middleware to ensure user is authenticated
 * Use this after validateJWT to require authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const payload = req.auth?.payload as AuthPayload | undefined;
  if (!payload?.sub) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  }
  next();
};

/**
 * Middleware to ensure request token contains required OAuth scopes.
 * Preserves backward compatibility for legacy web SPA and mobile clients
 * that do not yet request granular scopes.
 */
export const requireScope = (requiredScopes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = req.auth?.payload as AuthPayload | undefined;
    const rawScope = (payload?.scope as string) || '';
    const grantedScopes = new Set(rawScope.split(' ').filter(Boolean));

    // If the token does not contain any colon-delimited custom permissions (legacy tokens from web/mobile),
    // allow access to prevent breaking production web and Android clients.
    const hasCustomScopes = rawScope.includes(':');
    if (!hasCustomScopes) {
      return next();
    }

    const missingScopes = requiredScopes.filter((s) => !grantedScopes.has(s));
    if (missingScopes.length > 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Missing required scope(s): ${missingScopes.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Helper to get user ID (sub claim) from authenticated request
 */
export const getUserId = (req: Request): string => {
  const payload = req.auth?.payload as AuthPayload | undefined;
  if (!payload?.sub) {
    throw new Error('User not authenticated');
  }
  return payload.sub;
};

/**
 * Helper to get user email from authenticated request
 */
export const getUserEmail = (req: Request): string | undefined => {
  const payload = req.auth?.payload as AuthPayload | undefined;
  return payload?.email;
};

/**
 * Helper to get user name from authenticated request
 */
export const getUserName = (req: Request): string | undefined => {
  const payload = req.auth?.payload as AuthPayload | undefined;
  return payload?.name || payload?.nickname;
};
