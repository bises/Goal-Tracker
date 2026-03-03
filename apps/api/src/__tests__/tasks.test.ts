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
  getUserEmail: jest.fn((req) => req.auth?.payload?.email),
  getUserName: jest.fn((req) => req.auth?.payload?.name),
}));

// Mock userService
jest.mock('../services/userService');

// Mock Prisma client with shared mock functions
jest.mock('../prisma', () => {
  const mockTaskFunctions = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalFunctions = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockGoalTaskFunctions = {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
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
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
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

const mockTask = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  size: 1,
  isCompleted: false,
  scheduledDate: '2024-01-15',
  userId: '1',
  priority: 'MEDIUM',
  category: 'WORK',
  parentTaskId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  goalTasks: [],
  parentTask: null,
  subTasks: [],
};

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  // Setup default ensureUser mock
  (ensureUser as jest.Mock).mockResolvedValue(mockUser);
});

describe('GET /api/tasks', () => {
  it('should return all tasks for authenticated user', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTask]);
    (prisma.task.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/api/tasks').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Test Task');
    expect(ensureUser).toHaveBeenCalled();
  });

  it('should filter tasks by status=pending', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTask]);
    (prisma.task.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/api/tasks?status=pending').expect(200);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isCompleted: false,
        }),
      })
    );
  });

  it('should filter tasks by date', async () => {
    (prisma.task.findMany as jest.Mock).mockResolvedValue([mockTask]);
    (prisma.task.count as jest.Mock).mockResolvedValue(1);

    const response = await request(app).get('/api/tasks?date=2024-01-15').expect(200);

    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          scheduledDate: expect.objectContaining({
            gte: expect.any(Date),
            lt: expect.any(Date),
          }),
        }),
      })
    );
  });
});

describe('POST /api/tasks', () => {
  it('should create a new task', async () => {
    (prisma.task.create as jest.Mock).mockResolvedValue({ ...mockTask, id: 'new-task-id' });
    (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockTask);

    const response = await request(app)
      .post('/api/tasks')
      .send({
        title: 'New Task',
        description: 'New Description',
        scheduledDate: '2024-01-15',
      })
      .expect(201);

    expect(response.body.title).toBe('Test Task');
    expect(prisma.task.create).toHaveBeenCalled();
  });

  it('should return 400 if title is missing', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        description: 'Task without title',
      })
      .expect(400);

    expect(response.body).toHaveProperty('error');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('should update an existing task', async () => {
    const updatedTask = { ...mockTask, title: 'Updated Task' };
    (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
    (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

    const response = await request(app)
      .put('/api/tasks/1')
      .send({
        title: 'Updated Task',
      })
      .expect(200);

    expect(response.body.title).toBe('Updated Task');
    expect(prisma.task.update).toHaveBeenCalled();
  });

  it('should return 404 if task not found', async () => {
    (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
    await request(app).put('/api/tasks/999').send({ title: 'Updated Title' }).expect(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('should delete an existing task', async () => {
    (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);
    (prisma.task.delete as jest.Mock).mockResolvedValue(mockTask);
    (prisma.goalTask.findMany as jest.Mock).mockResolvedValue([]);

    await request(app).delete('/api/tasks/1').expect(204);
  });

  it('should return 404 if task not found', async () => {
    (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);

    await request(app).delete('/api/tasks/999').expect(404);
  });
});
