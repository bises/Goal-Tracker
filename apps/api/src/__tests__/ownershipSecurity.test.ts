import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { ensureUser } from '../services/userService';

// Mock auth middleware to allow dynamic payload injection
let mockAuthPayload: any = {
  sub: 'auth0|user-a',
  email: 'user-a@example.com',
  name: 'User A',
};

jest.mock('../middleware/auth', () => ({
  validateJWT: jest.fn((req, res, next) => {
    req.auth = { payload: mockAuthPayload };
    next();
  }),
  requireAuth: jest.fn((req, res, next) => next()),
  requireScope: jest.requireActual('../middleware/auth').requireScope,
  getUserId: jest.fn((req) => req.auth?.payload?.sub || 'auth0|user-a'),
  getUserEmail: jest.fn((req) => req.auth?.payload?.email),
  getUserName: jest.fn((req) => req.auth?.payload?.name),
}));

jest.mock('../services/userService');

// Mock Prisma
jest.mock('../prisma', () => {
  const mockGoalFunctions = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockTaskFunctions = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalTaskFunctions = {
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  const mockProgressFunctions = {
    create: jest.fn(),
    deleteMany: jest.fn(),
  };

  return {
    prisma: {
      $transaction: jest.fn((callback) =>
        callback({
          goal: mockGoalFunctions,
          task: mockTaskFunctions,
          goalTask: mockGoalTaskFunctions,
          progress: mockProgressFunctions,
        })
      ),
      goal: mockGoalFunctions,
      task: mockTaskFunctions,
      goalTask: mockGoalTaskFunctions,
      progress: mockProgressFunctions,
    },
  };
});

describe('Ownership & Security Verification', () => {
  const userA = { id: 1, sub: 'auth0|user-a', email: 'user-a@example.com' };
  const userB = { id: 2, sub: 'auth0|user-b', email: 'user-b@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthPayload = {
      sub: 'auth0|user-a',
      email: 'user-a@example.com',
      name: 'User A',
    };
    (ensureUser as jest.Mock).mockResolvedValue(userA);
  });

  describe('DELETE /api/goals/:id Cross-User Protection', () => {
    it('should halt and return 404 when goal does not belong to the caller, deleting nothing', async () => {
      // Simulate User B attempting to delete User A's goal
      (ensureUser as jest.Mock).mockResolvedValue(userB);
      mockAuthPayload = { sub: 'auth0|user-b', email: 'user-b@example.com' };

      // Goal belongs to User A (userId: 1), so findFirst for User B returns null
      (prisma.goal.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app).delete('/api/goals/goal-owned-by-user-a').expect(404);

      expect(res.body.error).toMatch(/Goal not found or access denied/i);
      // Verify NO deletions were executed
      expect(prisma.goal.delete).not.toHaveBeenCalled();
      expect(prisma.progress.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('Hierarchy Ownership & Reparenting Isolation', () => {
    it('should reject reparenting a goal to another user goal with 400', async () => {
      // User B trying to reparent their goal to User A's goal
      (ensureUser as jest.Mock).mockResolvedValue(userB);
      mockAuthPayload = { sub: 'auth0|user-b' };

      // Existing goal for User B
      (prisma.goal.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'goal-b', userId: 2, title: 'User B Goal' }) // existingGoal check
        .mockResolvedValueOnce(null); // validateParentGoal check for parentId (User A's goal not found for User B)

      const res = await request(app)
        .put('/api/goals/goal-b')
        .send({ parentId: 'goal-a-owned-by-user-1' })
        .expect(400);

      expect(res.body.error).toMatch(/Parent goal not found or access denied/i);
      expect(prisma.goal.update).not.toHaveBeenCalled();
    });

    it('should reject a goal parenting itself with 400', async () => {
      (prisma.goal.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'goal-1',
        userId: 1,
        title: 'Goal 1',
      });

      const res = await request(app)
        .put('/api/goals/goal-1')
        .send({ parentId: 'goal-1' })
        .expect(400);

      expect(res.body.error).toMatch(/Goal cannot be its own parent/i);
    });

    it('should reject cyclic goal hierarchies with 400', async () => {
      // Goal 1 is parent of Goal 2. User tries to set Goal 1's parent to Goal 2.
      (prisma.goal.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'goal-1', userId: 1, title: 'Goal 1' }) // existingGoal check
        .mockResolvedValueOnce({ id: 'goal-2', parentId: 'goal-1', userId: 1 }) // target parent is goal-2
        .mockResolvedValueOnce({ id: 'goal-1', parentId: null, userId: 1 }); // ancestor of goal-2 is goal-1!

      const res = await request(app)
        .put('/api/goals/goal-1')
        .send({ parentId: 'goal-2' })
        .expect(400);

      expect(res.body.error).toMatch(/Cyclic goal hierarchy detected/i);
      expect(prisma.goal.update).not.toHaveBeenCalled();
    });

    it('should reject reparenting a task to another user task with 400', async () => {
      (ensureUser as jest.Mock).mockResolvedValue(userB);
      mockAuthPayload = { sub: 'auth0|user-b' };

      (prisma.task.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'task-b', userId: 2, title: 'Task B' }) // existingTask check
        .mockResolvedValueOnce(null); // validateParentTask check (parent not found for user B)

      const res = await request(app)
        .put('/api/tasks/task-b')
        .send({ parentTaskId: 'task-a-owned-by-user-1' })
        .expect(400);

      expect(res.body.error).toMatch(/Parent task not found or access denied/i);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('Scope & Permission Enforcement (Read-Only vs Write)', () => {
    it('should reject write operations with 403 when token only has read scopes', async () => {
      // Dedicated v1 MCP token with read-only scopes
      mockAuthPayload = {
        sub: 'auth0|user-a',
        scope: 'openid profile email read:goals read:tasks read:calendar',
      };

      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'Unauthorized Task' })
        .expect(403);

      expect(res.body.error).toBe('Forbidden');
      expect(res.body.message).toMatch(/Missing required scope/i);
    });

    it('should allow read operations when token has read scopes', async () => {
      mockAuthPayload = {
        sub: 'auth0|user-a',
        scope: 'openid profile email read:goals read:tasks',
      };
      (prisma.goal.findMany as jest.Mock).mockResolvedValue([]);

      await request(app).get('/api/goals').expect(200);
    });

    it('should allow legacy web/mobile tokens without colon-scopes to pass through', async () => {
      // Legacy Web token
      mockAuthPayload = {
        sub: 'auth0|user-a',
        scope: 'openid profile email offline_access',
      };
      (prisma.goal.findMany as jest.Mock).mockResolvedValue([]);

      await request(app).get('/api/goals').expect(200);
    });
  });
});
