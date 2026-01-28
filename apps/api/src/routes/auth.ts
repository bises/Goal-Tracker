import { Router } from 'express';
import { requireAuth, validateJWT } from '../middleware/auth';
import { ensureUser } from '../services/userService';

const router = Router();

/**
 * GET /api/auth/me
 * Returns current authenticated user information
 */
router.get('/me', validateJWT, requireAuth, async (req, res) => {
  try {
    const user = await ensureUser(req);

    res.json({
      id: user.id,
      sub: user.sub,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user information',
    });
  }
});

/**
 * POST /api/auth/logout
 * Handle logout (client should also clear tokens)
 */
router.post('/logout', (req, res) => {
  // In a stateless JWT setup, logout is primarily handled client-side
  // This endpoint can be used for any server-side cleanup if needed
  res.json({ message: 'Logged out successfully' });
});

export default router;
