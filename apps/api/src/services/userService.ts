import { Request } from 'express';
import { getUserEmail, getUserId, getUserName } from '../middleware/auth';
import { prisma } from '../prisma';

/**
 * Service for managing user accounts
 * Handles user creation and lookup based on JWT claims from Authentik
 */

/**
 * Get or create user from authenticated request
 * This ensures a user record exists in the database for the authenticated user
 */
export const ensureUser = async (req: Request) => {
  const sub = getUserId(req);
  const email = getUserEmail(req);
  const name = getUserName(req);

  if (!email) {
    throw new Error('Email claim missing from JWT token');
  }

  // Try to find existing user by sub (Authentik user ID)
  let user = await prisma.user.findUnique({
    where: { sub },
  });

  // If user doesn't exist, create them
  if (!user) {
    user = await prisma.user.create({
      data: {
        sub,
        email,
        name,
      },
    });
  } else if (user.email !== email || user.name !== name) {
    // Update user info if email or name changed in Authentik
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
 * Get user by sub (Authentik user ID)
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
export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};
