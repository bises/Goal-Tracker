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

// Mock Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    goal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

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

  it('should filter goals by scope', async () => {
    (prisma.goal.findMany as jest.Mock).mockResolvedValue([mockGoal]);

    const response = await request(app).get('/api/goals?scope=YEARLY').expect(200);

    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scope: 'YEARLY',
        }),
      })
    );
  });
});

describe('POST /api/goals', () => {
  it('should create a new goal', async () => {
    (prisma.goal.create as jest.Mock).mockResolvedValue(mockGoal);

    const response = await request(app)
      .post('/api/goals')
      .send({
        title: 'New Goal',
        description: 'New Goal Description',
        scope: 'YEARLY',
        periodStart: '2024-01-01',
        periodEnd: '2024-12-31',
      })
      .expect(201);

    expect(response.body.title).toBe('Test Goal');
    expect(prisma.goal.create).toHaveBeenCalled();
  });

  it('should return 400 if title is missing', async () => {
    const response = await request(app)
      .post('/api/goals')
      .send({
        description: 'Goal without title',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/goals/:id', () => {
  it('should update an existing goal', async () => {
    const updatedGoal = { ...mockGoal, title: 'Updated Goal' };
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.update as jest.Mock).mockResolvedValue(updatedGoal);

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

    await request(app).put('/api/goals/999').send({ title: 'Updated Title' }).expect(404);
  });
});

describe('DELETE /api/goals/:id', () => {
  it('should delete an existing goal', async () => {
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(mockGoal);
    (prisma.goal.delete as jest.Mock).mockResolvedValue(mockGoal);

    await request(app).delete('/api/goals/1').expect(200);

    expect(prisma.goal.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  it('should return 404 if goal not found', async () => {
    (prisma.goal.findUnique as jest.Mock).mockResolvedValue(null);

    await request(app).delete('/api/goals/999').expect(404);
  });
});
