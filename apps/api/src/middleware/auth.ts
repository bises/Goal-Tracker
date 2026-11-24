import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { authConfig, isTrustedLegacyClient } from '../config/auth';

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
    const clientId = (payload?.azp || payload?.client_id) as string | undefined;

    // Fail-closed backward compatibility:
    // Only verified trusted legacy Web/Mobile client IDs are permitted to bypass custom scope checks
    // if their tokens lack colon-delimited custom permissions.
    // Dedicated MCP client tokens, unidentified callers, and untrusted clients MUST possess all required scopes.
    const hasCustomScopes = rawScope.includes(':');
    if (!hasCustomScopes && isTrustedLegacyClient(clientId)) {
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
