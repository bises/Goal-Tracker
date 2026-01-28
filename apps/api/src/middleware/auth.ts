import { NextFunction, Request, Response } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { authConfig } from '../config/auth';

// Define the expected JWT payload structure from Authentik
interface AuthPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  [key: string]: any;
}

/**
 * JWT validation middleware using express-oauth2-jwt-bearer
 * Validates JWT tokens from Authentik and extracts user claims
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
  return payload?.name || payload?.preferred_username;
};
