import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { ensureUser } from '../services/userService';

jest.mock('../middleware/auth', () => ({
  validateJWT: jest.fn((req, res, next) => {
    req.auth = {
      payload: {
        sub: 'auth0|test-user',
        email: 'test@example.com',
        scope: 'read:tasks write:tasks',
      },
    };
    next();
  }),
  requireAuth: jest.fn((req, res, next) => next()),
  requireScope: jest.requireActual('../middleware/auth').requireScope,
  getUserId: jest.fn(() => 'auth0|test-user'),
  getUserEmail: jest.fn(() => 'test@example.com'),
  getUserName: jest.fn(() => 'Test User'),
}));

jest.mock('../services/userService');
jest.mock('../services/goalProgressService', () => ({
  recalculateGoalProgress: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../prisma', () => {
  const mockTaskFunctions = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalFunctions = {
    findFirst: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalTaskFunctions = {
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };

  return {
    prisma: {
      $transaction: jest.fn((callback) =>
        callback({
          task: mockTaskFunctions,
          goal: mockGoalFunctions,
          goalTask: mockGoalTaskFunctions,
        })
      ),
      task: mockTaskFunctions,
      goal: mockGoalFunctions,
      goalTask: mockGoalTaskFunctions,
    },
  };
});

describe('Task Routes Zod Validation & Normalized Error Responses (Issue #3)', () => {
  const mockUser = { id: 1, sub: 'auth0|test-user' };
  const mockTask = {
    id: 'task-1',
    title: 'Valid Task',
    description: 'Description',
    size: 1,
    isCompleted: false,
    userId: 1,
    goalTasks: [],
    subTasks: [],
    parentTask: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('POST /api/tasks (create task validation)', () => {
    it('returns 400 with VALIDATION_ERROR envelope when title is missing', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          description: 'No title provided',
        })
        .expect(400);

      expect(res.body).toEqual({
        errorCode: 'VALIDATION_ERROR',
        message: 'Title is required',
        error: 'Title is required',
        details: expect.arrayContaining([
          expect.objectContaining({
            path: 'title',
            message: 'Title is required',
          }),
        ]),
      });
    });

    it('returns 400 with VALIDATION_ERROR when title is an empty string', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: '   ',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('title');
    });

    it('returns 400 when scheduledDate is not YYYY-MM-DD', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Clean Garage',
          scheduledDate: '15-01-2026',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('scheduledDate');
      expect(res.body.details[0].message).toMatch(/YYYY-MM-DD/);
    });

    it('returns 400 when priority is invalid enum value', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Priority Task',
          priority: 'SUPER_URGENT',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('priority');
    });

    it('returns 400 when category is invalid enum value', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Categorized Task',
          category: 'NOT_A_CATEGORY',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('category');
    });

    it('returns 400 when scheduledTime is invalid format', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Time Task',
          scheduledTime: '25:99',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('scheduledTime');
    });

    it('successfully creates task on valid payload', async () => {
      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Valid Task',
          description: 'A valid description',
          priority: 'HIGH',
          category: 'WORK',
          scheduledDate: '2026-12-01',
          scheduledTime: '14:30',
        })
        .expect(201);

      expect(res.body.title).toBe('Valid Task');
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe('PUT /api/tasks/:id (update task validation)', () => {
    it('returns 400 when title is an empty string', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);

      const res = await request(app)
        .put('/api/tasks/task-1')
        .send({
          title: '  ',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('title');
    });

    it('returns 400 when estimatedCompletionDate is invalid', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);

      const res = await request(app)
        .put('/api/tasks/task-1')
        .send({
          estimatedCompletionDate: 'invalid-date',
        })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('estimatedCompletionDate');
    });

    it('returns 404 with normalized NOT_FOUND envelope when task does not exist', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/tasks/non-existent-task')
        .send({
          title: 'New Title',
        })
        .expect(404);

      expect(res.body).toEqual({
        errorCode: 'NOT_FOUND',
        message: 'Task not found or access denied',
        error: 'Task not found or access denied',
      });
    });
  });

  describe('POST /api/tasks/:id/set-completion validation', () => {
    it('returns 400 with VALIDATION_ERROR envelope when isCompleted is missing', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({})
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.message).toBe('Field isCompleted (boolean) is required');
      expect(res.body.error).toBe('Field isCompleted (boolean) is required');
      expect(res.body.details[0].path).toBe('isCompleted');
    });

    it('returns 400 with VALIDATION_ERROR when isCompleted is a string', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: 'true' })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.message).toBe('Field isCompleted (boolean) is required');
      expect(res.body.details[0].path).toBe('isCompleted');
    });

    it('returns 400 with VALIDATION_ERROR when isCompleted is a number', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: 1 })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('isCompleted');
    });

    it('allows valid completion request to succeed', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
      (prisma.task.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({
        ...mockTask,
        isCompleted: true,
      });

      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: true })
        .expect(200);

      expect(res.body.isCompleted).toBe(true);
    });
  });

  describe('POST /api/tasks/:id/link-goal & unlink-goal validation', () => {
    it('returns 400 when linking without goalId', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/link-goal')
        .send({})
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('goalId');
    });

    it('returns 400 when unlinking without goalId', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/unlink-goal')
        .send({ goalId: '' })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('goalId');
    });
  });

  describe('POST /api/tasks/:id/schedule validation', () => {
    it('returns 400 when scheduledDate is malformed', async () => {
      const res = await request(app)
        .post('/api/tasks/task-1/schedule')
        .send({ scheduledDate: '2026/12/01' })
        .expect(400);

      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].path).toBe('scheduledDate');
    });
  });

  describe('Unexpected Error Handling (HTTP 500 Normalization)', () => {
    it('normalizes unexpected 500 errors and suppresses stack traces in response', async () => {
      (prisma.task.findFirst as jest.Mock).mockRejectedValueOnce(
        new Error('Database disk I/O hardware failure: connection reset by peer at /var/lib/db')
      );

      const res = await request(app)
        .get('/api/tasks/task-1')
        .expect(500);

      expect(res.body).toEqual({
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        error: 'Internal server error',
      });

      // Crucial: no stack trace or internal database error message leaked to client
      expect(res.body).not.toHaveProperty('stack');
      expect(JSON.stringify(res.body)).not.toContain('Database disk I/O hardware failure');
    });
  });
});
