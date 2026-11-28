import request from 'supertest';
import app from '../app';
import { prisma } from '../prisma';
import { ensureUser } from '../services/userService';

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  validateJWT: jest.fn((req, res, next) => {
    req.auth = {
      payload: {
        sub: 'auth0|test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        nickname: 'testuser',
      },
    };
    next();
  }),
  requireAuth: jest.fn((req, res, next) => next()),
  requireScope: jest.fn(() => (req: any, res: any, next: any) => next()),
  getUserId: jest.fn((req) => req.auth?.payload?.sub || 'auth0|test-user-id'),
}));

// Mock userService
jest.mock('../services/userService');

// Mock Prisma client with shared mock functions
jest.mock('../prisma', () => {
  const mockGoalFunctions = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockTaskFunctions = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalTaskFunctions = {
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  };

  const mockProgressFunctions = {
    create: jest.fn(),
    deleteMany: jest.fn(),
  };

  return {
    prisma: {
      $transaction: jest.fn((callback) =>
        callback({
          $queryRaw: jest.fn(),
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
      user: {
        findUnique: jest.fn(),
      },
    },
  };
});

const mockUser = {
  id: '1',
  sub: 'auth0|test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGoal = {
  id: '1',
  title: 'Test Goal',
  description: 'Test Goal Description',
  type: 'TOTAL_TARGET',
  targetValue: 100,
  currentValue: 0,
  scope: 'YEARLY',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  userId: '1',
  parentId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  goalTasks: [],
  children: [],
  parent: null,
  progress: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  (ensureUser as jest.Mock).mockResolvedValue(mockUser);
});

describe('GET /api/goals', () => {
  it('should return all goals for authenticated user', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    const response = await request(app).get('/api/goals').expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Test Goal');
    expect(ensureUser).toHaveBeenCalled();
  });

  it('should filter goals by completed status', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    const response = await request(app).get('/api/goals?completed=true').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isMarkedComplete: true }),
      })
    );
    expect(response.body).toHaveLength(1);
  });

  it('should filter goals by status=completed', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    await request(app).get('/api/goals?status=completed').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isMarkedComplete: true }),
      })
    );
  });

  it('should filter goals by status=active', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    await request(app).get('/api/goals?status=active').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isMarkedComplete: false }),
      })
    );
  });

  it('should return all goals when status=all', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    await request(app).get('/api/goals?status=all').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isMarkedComplete: undefined }),
      })
    );
  });

  it('should filter goals by scope', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    await request(app).get('/api/goals?scope=WEEKLY').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ scope: 'WEEKLY' }),
      })
    );
  });
});

describe('POST /api/goals', () => {
  it('should create a new goal', async () => {
    (prisma.goal.create as jest.Mock).mockResolvedValue({ ...mockGoal, id: 'new-goal-id' });
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.progress.create as jest.Mock).mockResolvedValue({
      id: 'progress-1',
      goalId: 'new-goal-id',
      date: new Date(),
      value: 0,
    });
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .post('/api/goals')
      .send({
        title: 'New Goal',
        description: 'New Goal Description',
        scope: 'YEARLY',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
      })
      .expect(200);

    expect(response.body.title).toBe('Test Goal');
    expect(prisma.goal.create).toHaveBeenCalled();
  });

  it('should return 500 if title is missing due to Prisma error', async () => {
    // Simulate Prisma error when title is missing
    (prisma.goal.create as jest.Mock).mockRejectedValue(new Error('Prisma validation error'));

    const response = await request(app)
      .post('/api/goals')
      .send({
        description: 'Goal without title',
      })
      .expect(500);

    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/goals/:id', () => {
  it('should update an existing goal', async () => {
    const updatedGoal = { ...mockGoal, title: 'Updated Goal' };
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.update as jest.Mock).mockResolvedValue(updatedGoal);
    (prisma.goalTask.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.task.count as jest.Mock).mockResolvedValue(0);

    const response = await request(app)
      .put('/api/goals/1')
      .send({
        title: 'Updated Goal',
      })
      .expect(200);

    expect(response.body.title).toBe('Updated Goal');
    expect(prisma.goal.update).toHaveBeenCalled();
  });

  it('should return 404 if goal not found', async () => {
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(null);
    await request(app).put('/api/goals/999').send({ title: 'Updated Title' }).expect(404);
  });
});

describe('DELETE /api/goals/:id', () => {
  it('should delete an existing goal', async () => {
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.delete as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.progress.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });
    (prisma.goalTask.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    await request(app).delete('/api/goals/1').expect(200);

    expect(prisma.goal.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should return 404 if goal not found or access denied', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(null);

    await request(app).delete('/api/goals/999').expect(404);
    expect(prisma.goal.delete).not.toHaveBeenCalled();
  });
});

describe('fixed completed-subgoal targets', () => {
  const fixedGoal = {
    ...mockGoal,
    progressMode: 'COMPLETED_SUBGOALS',
    targetValue: 12,
    currentValue: 8,
    isMarkedComplete: false,
  };

  it.each([undefined, 0, -1, 1.5, '12', null])('rejects an invalid target of %p', async (targetValue) => {
    await request(app)
      .post('/api/goals')
      .send({ title: 'Read 12 books', progressMode: 'COMPLETED_SUBGOALS', targetValue })
      .expect(400);
    expect(prisma.goal.create).not.toHaveBeenCalled();
  });

  it('creates a fixed target before any books have been chosen', async () => {
    (prisma.goal.create as jest.Mock).mockResolvedValue({ ...fixedGoal, currentValue: 0 });
    await request(app)
      .post('/api/goals')
      .send({ title: 'Read 12 books', scope: 'YEARLY', progressMode: 'COMPLETED_SUBGOALS', targetValue: 12 })
      .expect(200);
    expect(prisma.goal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ progressMode: 'COMPLETED_SUBGOALS', targetValue: 12 }),
    });
  });

  it('provides the Android list with fixed-target progress and preserves ordinary list entries', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([fixedGoal, { ...mockGoal, id: 'ordinary' }]);

    const response = await request(app).get('/api/goals').expect(200);

    expect(response.body[0].progressSummary.percentComplete).toBeCloseTo(800 / 12);
    expect(response.body[0].progressSummary.manualTotals).toEqual({ currentValue: 8, targetValue: 12 });
    expect(response.body[0].progressSummary.taskTotals).toBeUndefined();
    expect(response.body[1].progressSummary).toBeUndefined();
  });

  it('returns yearly progress based on books even when all linked chapter tasks are complete', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue({
      ...fixedGoal,
      children: [{ isMarkedComplete: true, goalTasks: [{ task: { id: 'chapter-1', isCompleted: true } }] }],
    });

    const response = await request(app).get('/api/goals/1').expect(200);
    expect(response.body.progressSummary.percentComplete).toBeCloseTo(800 / 12);
    expect(response.body.progressSummary.manualTotals).toEqual({ currentValue: 8, targetValue: 12 });
  });

  it('switches an existing goal to 12 books and returns its recalculated progress', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue({ ...mockGoal, progressMode: 'AUTOMATIC' });
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue({ ...fixedGoal, isMarkedComplete: true });
    (prisma.goal.count as jest.Mock).mockResolvedValue(8);
    (prisma.goal.update as jest.Mock).mockResolvedValue(fixedGoal);
    (prisma.goal.findUniqueOrThrow as jest.Mock).mockResolvedValue(fixedGoal);

    const response = await request(app)
      .put('/api/goals/1')
      .send({ progressMode: 'COMPLETED_SUBGOALS', targetValue: 12 })
      .expect(200);

    expect(prisma.goal.update).toHaveBeenLastCalledWith({
      where: { id: '1' },
      data: { currentValue: 8, isMarkedComplete: false },
    });
    expect(response.body).toMatchObject({ targetValue: 12, currentValue: 8, isMarkedComplete: false });
  });

  it('rejects manually marking the yearly goal complete at 8 of 12', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(fixedGoal);
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(fixedGoal);

    const response = await request(app).post('/api/goals/1/complete').expect(409);
    expect(response.body.error).toMatch(/complete more subgoals/i);
    expect(prisma.goal.update).not.toHaveBeenCalled();
  });

  it('allows marking the yearly goal complete once it reaches 12 of 12', async () => {
    const reachedGoal = { ...fixedGoal, currentValue: 12 };
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(reachedGoal);
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(reachedGoal);
    (prisma.goal.update as jest.Mock).mockResolvedValue({ ...reachedGoal, isMarkedComplete: true });

    await request(app).post('/api/goals/1/complete').expect(200);
    expect(prisma.goal.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { isMarkedComplete: true } });
  });

  it('rejects manual progress increments', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(fixedGoal);
    (prisma.goal.findUniqueOrThrow as jest.Mock).mockResolvedValue(fixedGoal);

    await request(app).post('/api/goals/1/progress').send({ value: 1 }).expect(409);
    expect(prisma.progress.create).not.toHaveBeenCalled();
  });
});
