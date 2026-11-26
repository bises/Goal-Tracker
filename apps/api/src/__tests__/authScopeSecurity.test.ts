import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { ensureUser } from '../services/userService';
import { authConfig } from '../config/auth';

let mockAuthPayload: any = null;

jest.mock('../middleware/auth', () => {
  const original = jest.requireActual('../middleware/auth');
  return {
    ...original,
    validateJWT: jest.fn((req, res, next) => {
      if (mockAuthPayload) {
        req.auth = { payload: mockAuthPayload };
      }
      next();
    }),
    requireAuth: jest.fn((req, res, next) => {
      if (!req.auth?.payload?.sub) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Valid authentication token required' });
      }
      next();
    }),
    getUserId: jest.fn(() => mockAuthPayload?.sub || 'auth0|test-user'),
    getUserEmail: jest.fn(() => 'test@example.com'),
    getUserName: jest.fn(() => 'Test User'),
  };
});

jest.mock('../services/userService');

jest.mock('../prisma', () => {
  const mockPrisma: any = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    goal: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), delete: jest.fn(), update: jest.fn() },
    task: { findMany: jest.fn().mockResolvedValue([]), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    progress: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }), create: jest.fn() },
    goalTask: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
  };
  mockPrisma.$transaction = jest.fn((cb: any) => cb(mockPrisma));
  return { prisma: mockPrisma };
});

describe('Auth Scope Security & Client Identity Enforcement (requireScope)', () => {
  const mockUser = { id: 1, sub: 'auth0|test-user' };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUser as jest.Mock).mockResolvedValue(mockUser);
    authConfig.legacyClientIds = ['trusted-legacy-web-client', 'trusted-legacy-mobile-client'];
  });

  it('should REJECT MCP client tokens with only OIDC scopes attempting to write (403 Forbidden)', async () => {
    // Dedicated MCP client token without write:tasks scope
    mockAuthPayload = {
      sub: 'auth0|test-user',
      azp: 'dedicated-mcp-client-id',
      scope: 'openid profile email offline_access', // No colon-delimited custom permissions
    };

    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Unauthorized Task' })
      .expect(403);

    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toMatch(/Missing required scope\(s\): write:tasks/i);
  });

  it('should REJECT MCP token with read:goals attempting to DELETE /api/goals/:id (403 Forbidden)', async () => {
    mockAuthPayload = {
      sub: 'auth0|test-user',
      azp: 'dedicated-mcp-client-id',
      scope: 'openid profile email read:goals offline_access',
    };

    const res = await request(app)
      .delete('/api/goals/goal-1')
      .expect(403);

    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toMatch(/Missing required scope\(s\): write:goals/i);
  });

  it('should ALLOW MCP token with read:goals to execute GET /api/goals (200 OK)', async () => {
    mockAuthPayload = {
      sub: 'auth0|test-user',
      azp: 'dedicated-mcp-client-id',
      scope: 'openid profile email read:goals offline_access',
    };

    const res = await request(app)
      .get('/api/goals')
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('should ALLOW explicitly trusted legacy Web client tokens lacking custom scopes (backward compatibility)', async () => {
    mockAuthPayload = {
      sub: 'auth0|test-user',
      azp: 'trusted-legacy-web-client',
      scope: 'openid profile email', // Legacy web token without colon scopes
    };

    (prisma.goal.findFirst as jest.Mock).mockResolvedValue({ id: 'goal-1', userId: 1 });
    (prisma.goal.delete as jest.Mock).mockResolvedValue({ id: 'goal-1' });

    await request(app)
      .delete('/api/goals/goal-1')
      .expect(200);

    expect(prisma.goal.delete).toHaveBeenCalled();
  });

  it('should FAIL CLOSED when client identity is missing (no azp or client_id)', async () => {
    mockAuthPayload = {
      sub: 'auth0|test-user',
      scope: 'openid profile email', // No azp, no custom scope
    };

    const res = await request(app)
      .delete('/api/goals/goal-1')
      .expect(403);

    expect(res.body.error).toBe('Forbidden');
    expect(res.body.message).toMatch(/Missing required scope\(s\): write:goals/i);
  });

  it('should FAIL CLOSED when client identity is untrusted', async () => {
    mockAuthPayload = {
      sub: 'auth0|test-user',
      azp: 'untrusted-third-party-client',
      scope: 'openid profile email',
    };

    const res = await request(app)
      .delete('/api/goals/goal-1')
      .expect(403);

    expect(res.body.error).toBe('Forbidden');
  });
});
