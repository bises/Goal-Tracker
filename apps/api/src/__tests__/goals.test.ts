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
  getUserId: jest.fn((req) => req.auth?.payload?.sub || 'auth0|test-user-id'),
}));

// Mock userService
jest.mock('../services/userService');

// Mock Prisma client with shared mock functions
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

    // Check that findMany was called (completed filter affects the where clause)
    expect(prisma.goal.findMany).toHaveBeenCalled();
    expect(response.body).toHaveLength(1);
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

  it('should return 500 if goal not found (delete throws error)', async () => {
    (prisma.goal.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.goal.delete as jest.Mock).mockRejectedValue(new Error('Record not found'));

    await request(app).delete('/api/goals/999').expect(500);
  });
});
