import { Request } from 'express';
import { authConfig } from '../config/auth';
import { getUserEmail, getUserId, getUserName } from '../middleware/auth';
import { prisma } from '../prisma';

/**
 * Service for managing user accounts
 * Handles user creation and lookup based on JWT claims from Auth0
 */

// Auth0 userinfo response interface
interface Auth0UserInfo {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Fetch user profile information from Auth0 userinfo endpoint
 */
const fetchAuth0UserInfo = async (accessToken: string): Promise<Auth0UserInfo | null> => {
  try {
    // Extract the issuer domain from config
    const issuerUrl = authConfig.issuer;
    if (!issuerUrl) {
      console.warn('Auth0 issuer not configured, cannot fetch userinfo');
      return null;
    }

    const userInfoUrl = `${issuerUrl}userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn(`Auth0 userinfo request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as Auth0UserInfo;
  } catch (error) {
    console.error('Error fetching Auth0 userinfo:', error);
    return null;
  }
};

/**
 * Get existing user from authenticated request
 * Only requires sub claim from access token
 * Returns null if user doesn't exist in database
 */
export const getUser = async (req: Request) => {
  const sub = getUserId(req);

  return await prisma.user.findUnique({
    where: { sub },
  });
};

/**
 * Get or create user from authenticated request
 * This ensures a user record exists in the database for the authenticated user
 * Will fetch additional profile info from Auth0 if needed for user creation
 */
export const ensureUser = async (req: Request) => {
  const sub = getUserId(req);
  let email = getUserEmail(req);
  let name = getUserName(req);

  // Try to find existing user by sub (Auth0 user ID)
  let user = await prisma.user.findUnique({
    where: { sub },
  });

  // If user doesn't exist, create them
  if (!user) {
    // If email is missing from JWT, try to fetch from Auth0 userinfo
    if (!email) {
      console.log('Email missing from JWT, fetching from Auth0 userinfo...');
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const accessToken = authHeader.slice(7);
        const userInfo = await fetchAuth0UserInfo(accessToken);
        if (userInfo) {
          email = userInfo.email;
          name = name || userInfo.name || userInfo.nickname;
          console.log('Successfully fetched user info from Auth0:', { email, name });
        }
      }
    }

    user = await prisma.user.create({
      data: {
        sub,
        email: email || `user-${sub}@placeholder.local`, // Fallback to placeholder if still no email
        name: name || 'User',
      },
    });
  } else if (email && (user.email !== email || user.name !== name)) {
    // Update user info if email or name changed in Auth0 (only if email available)
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email,
        name,
      },
    });
  }

  return user;
};

/**
 * Get user by sub (Auth0 user ID)
 */
export const getUserBySub = async (sub: string) => {
  return await prisma.user.findUnique({
    where: { sub },
  });
};

/**
 * Get user by email
 */
export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Get user by internal ID
 */
export const getUserById = async (id: number) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
