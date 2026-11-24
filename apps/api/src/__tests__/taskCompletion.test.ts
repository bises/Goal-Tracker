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
    update: jest.fn(),
  };

  const mockProgressFunctions = {
    create: jest.fn(),
  };

  const mockGoalTaskFunctions = {};

  return {
    prisma: {
      $transaction: jest.fn((callback) =>
        callback({
          task: mockTaskFunctions,
          progress: mockProgressFunctions,
          goalTask: mockGoalTaskFunctions,
        })
      ),
      task: mockTaskFunctions,
      progress: mockProgressFunctions,
    },
  };
});

describe('Task Completion API (Idempotent set-completion & legacy complete)', () => {
  const mockUser = { id: 1, sub: 'auth0|test-user' };

  beforeEach(() => {
    jest.clearAllMocks();
    (ensureUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('POST /api/tasks/:id/set-completion', () => {
    it('should reject non-boolean isCompleted with 400', async () => {
      await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: 'yes' })
        .expect(400);

      await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({})
        .expect(400);
    });

    it('should return 404 if task not found or access denied', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/tasks/task-999/set-completion')
        .send({ isCompleted: true })
        .expect(404);

      expect(res.body.error).toMatch(/Task not found or access denied/i);
    });

    it('should be IDEMPOTENT: returning current state without update if already completed', async () => {
      const alreadyCompletedTask = {
        id: 'task-1',
        title: 'Already Done',
        isCompleted: true,
        userId: 1,
        goalTasks: [{ goalId: 'goal-1', taskId: 'task-1' }],
      };

      (prisma.task.findFirst as jest.Mock).mockResolvedValue(alreadyCompletedTask);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(alreadyCompletedTask);

      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: true })
        .expect(200);

      expect(res.body.isCompleted).toBe(true);
      // In-transaction update and progress creation must NOT be called on retry
      expect(prisma.task.update).not.toHaveBeenCalled();
      expect(prisma.progress.create).not.toHaveBeenCalled();
    });

    it('should update task and log progress when transitioning from incomplete to completed', async () => {
      const pendingTask = {
        id: 'task-1',
        title: 'Finish Feature',
        isCompleted: false,
        userId: 1,
        goalTasks: [{ goalId: 'goal-1', taskId: 'task-1' }],
      };

      const completedTask = {
        ...pendingTask,
        isCompleted: true,
      };

      (prisma.task.findFirst as jest.Mock).mockResolvedValue(pendingTask);
      (prisma.task.update as jest.Mock).mockResolvedValue(completedTask);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(completedTask);
      (prisma.progress.create as jest.Mock).mockResolvedValue({ id: 'prog-1' });

      const res = await request(app)
        .post('/api/tasks/task-1/set-completion')
        .send({ isCompleted: true })
        .expect(200);

      expect(res.body.isCompleted).toBe(true);
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'task-1' },
          data: expect.objectContaining({ isCompleted: true }),
        })
      );
      expect(prisma.progress.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          goalId: 'goal-1',
          value: 1,
        }),
      });
    });
  });

  describe('POST /api/tasks/:id/complete (Legacy Toggle Wrapper)', () => {
    it('should toggle an incomplete task to completed', async () => {
      const pendingTask = {
        id: 'task-1',
        title: 'Legacy Toggle',
        isCompleted: false,
        userId: 1,
        goalTasks: [],
      };

      const completedTask = { ...pendingTask, isCompleted: true };

      (prisma.task.findFirst as jest.Mock).mockResolvedValue(pendingTask);
      (prisma.task.update as jest.Mock).mockResolvedValue(completedTask);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(completedTask);

      const res = await request(app)
        .post('/api/tasks/task-1/complete')
        .expect(200);

      expect(res.body.isCompleted).toBe(true);
      expect(prisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isCompleted: true }),
        })
      );
    });
  });
});
