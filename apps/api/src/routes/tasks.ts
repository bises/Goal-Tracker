import { parseDateOnly } from '@goal-tracker/shared';
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, validateJWT } from '../middleware/auth';
import { prisma } from '../prisma';
import { recalculateGoalProgress } from '../services/goalProgressService';
import { ensureUser } from '../services/userService';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateJWT, requireAuth);

// Helper function to include goals with tasks
const taskWithGoals = {
  goalTasks: {
    include: {
      goal: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
  parentTask: {
    select: {
      id: true,
      title: true,
    },
  },
  subTasks: {
    select: {
      id: true,
      title: true,
      isCompleted: true,
    },
  },
};

// GET /api/tasks - Get all tasks with optional filtering and pagination
router.get('/', async (req, res) => {
  try {
    const user = await ensureUser(req);

    // Extract query parameters
    const {
      status, // 'completed' | 'pending'
      page,
      limit,
      month, // Format: YYYY-MM
      date, // Format: YYYY-MM-DD
      unscheduled, // 'true' — return only tasks with no scheduledDate
    } = req.query;

    // Build where clause
    const where: Prisma.TaskWhereInput = {
      userId: user.id,
    };

    // Filter by completion status
    if (status === 'completed') {
      where.isCompleted = true;
    } else if (status === 'pending') {
      where.isCompleted = false;
    }

    // Filter unscheduled tasks (no scheduledDate)
    if (unscheduled === 'true') {
      where.scheduledDate = null;
    }
    // Filter by specific date
    else if (date && typeof date === 'string') {
      const [year, monthNum, day] = date.split('-');
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum) - 1, parseInt(day)));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum) - 1, parseInt(day) + 1));

      where.scheduledDate = {
        gte: startDate,
        lt: endDate,
      };
    }
    // Filter by month (if date is not provided)
    else if (month && typeof month === 'string') {
      const [year, monthNum] = month.split('-');
      const startDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum) - 1, 1));
      const endDate = new Date(Date.UTC(parseInt(year), parseInt(monthNum), 1));

      where.scheduledDate = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Determine ordering: scheduledDate ASC with nulls last, then createdAt DESC
    const orderBy: Prisma.TaskOrderByWithRelationInput[] = [
      { scheduledDate: { sort: 'asc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];

    // If pagination params provided, use pagination
    if (page && limit) {
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      // Get total count for pagination metadata
      const total = await prisma.task.count({ where });

      // Get paginated tasks
      const tasks = await prisma.task.findMany({
        relationLoadStrategy: 'join',
        where,
        select: {
          id: true,
          title: true,
          description: true,
          size: true,
          isCompleted: true,
          completedAt: true,
          scheduledDate: true,
          priority: true,
          category: true,
          scheduledTime: true,
          estimatedDurationMinutes: true,
          estimatedCompletionDate: true,
          customData: true,
          createdAt: true,
          updatedAt: true,
          parentTaskId: true,
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          goalTasks: {
            select: {
              goal: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          subTasks: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      });

      return res.json({
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    }

    // Default: Return all tasks (backward compatible)
    const tasks = await prisma.task.findMany({
      relationLoadStrategy: 'join',
      where,
      select: {
        id: true,
        title: true,
        description: true,
        size: true,
        isCompleted: true,
        completedAt: true,
        scheduledDate: true,
        priority: true,
        category: true,
        scheduledTime: true,
        estimatedDurationMinutes: true,
        estimatedCompletionDate: true,
        customData: true,
        createdAt: true,
        updatedAt: true,
        parentTaskId: true,
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        goalTasks: {
          select: {
            goal: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
          },
        },
      },
      orderBy,
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id - Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      relationLoadStrategy: 'join',
      select: {
        id: true,
        title: true,
        description: true,
        size: true,
        isCompleted: true,
        scheduledDate: true,
        customData: true,
        createdAt: true,
        updatedAt: true,
        parentTaskId: true,
        parentTask: {
          select: {
            id: true,
            title: true,
          },
        },
        goalTasks: {
          select: {
            goal: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        subTasks: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks - Create task
router.post('/', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const {
      title,
      description,
      size = 1,
      scheduledDate,
      goalIds = [],
      parentTaskId,
      customData,
      priority,
      category,
      scheduledTime,
      estimatedDurationMinutes,
      estimatedCompletionDate,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify all goals belong to the user
      if (goalIds.length > 0) {
        const goalCount = await tx.goal.count({
          where: {
            id: { in: goalIds },
            userId: user.id,
          },
        });
        if (goalCount !== goalIds.length) {
          throw new Error('One or more goals not found or access denied');
        }
      }

      // Verify parent task belongs to user if provided
      if (parentTaskId) {
        const parentTask = await tx.task.findFirst({
          where: { id: parentTaskId, userId: user.id },
        });
        if (!parentTask) {
          throw new Error('Parent task not found or access denied');
        }
      }

      // Create the task
      // Parse YYYY-MM-DD string for date-only field
      let parsedScheduledDate = null;
      if (scheduledDate) {
        parsedScheduledDate = parseDateOnly(scheduledDate);
      }
      let parsedEstimatedCompletionDate = null;
      if (estimatedCompletionDate) {
        parsedEstimatedCompletionDate = parseDateOnly(estimatedCompletionDate);
      }
      const newTask = await tx.task.create({
        data: {
          title,
          description,
          size: parseInt(size),
          scheduledDate: parsedScheduledDate,
          parentTaskId: parentTaskId || null,
          customData,
          userId: user.id,
          priority: priority || null,
          category: category || null,
          scheduledTime: scheduledTime || null,
          estimatedDurationMinutes: estimatedDurationMinutes || null,
          estimatedCompletionDate: parsedEstimatedCompletionDate,
          goalTasks: {
            create: goalIds.map((goalId: string) => ({
              goal: {
                connect: {
                  id: goalId,
                },
              },
            })),
          },
        },
      });

      // Update progress for each parent goal atomically
      if (goalIds.length > 0) {
        for (const goalId of goalIds) {
          await recalculateGoalProgress(goalId, tx);
        }
      }

      // Fetch the task with relations
      return await tx.task.findUnique({
        where: { id: newTask.id },
        select: {
          id: true,
          title: true,
          description: true,
          size: true,
          isCompleted: true,
          scheduledDate: true,
          customData: true,
          createdAt: true,
          updatedAt: true,
          parentTaskId: true,
          parentTask: {
            select: {
              id: true,
              title: true,
            },
          },
          goalTasks: {
            select: {
              goal: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          subTasks: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
            },
          },
        },
      });
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task (no longer handles goal linking)
router.put('/:id', async (req, res) => {
  try {
    const user = await ensureUser(req);

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const {
      title,
      description,
      size,
      scheduledDate,
      parentTaskId,
      customData,
      isCompleted,
      priority,
      category,
      scheduledTime,
      estimatedDurationMinutes,
      estimatedCompletionDate,
    } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (size !== undefined) updateData.size = parseInt(size);
    if (scheduledDate !== undefined) {
      // Parse YYYY-MM-DD string for date-only field
      let parsedDate = null;
      if (scheduledDate) {
        parsedDate = parseDateOnly(scheduledDate);
      }
      updateData.scheduledDate = parsedDate;
    }
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId || null;
    if (customData !== undefined) updateData.customData = customData;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }
    if (priority !== undefined) updateData.priority = priority || null;
    if (category !== undefined) updateData.category = category || null;
    if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime || null;
    if (estimatedDurationMinutes !== undefined)
      updateData.estimatedDurationMinutes = estimatedDurationMinutes || null;
    if (estimatedCompletionDate !== undefined) {
      let parsedDate = null;
      if (estimatedCompletionDate) {
        parsedDate = parseDateOnly(estimatedCompletionDate);
      }
      updateData.estimatedCompletionDate = parsedDate;
    }

    const task = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.task.update({
        where: { id: req.params.id },
        data: updateData,
        include: taskWithGoals,
      });

      if (isCompleted !== undefined && isCompleted !== existingTask.isCompleted) {
        for (const gt of updated.goalTasks) {
          await recalculateGoalProgress(gt.goalId, tx);
        }
      }

      return updated;
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    const user = await ensureUser(req);
    const { goalIds = [] } = req.body;

    // Fetch task state first to know if we need to decrease currentValue
    const existingTask = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      select: { isCompleted: true, size: true },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Find linked goals BEFORE deleting the task to prevent cascade delete race condition
      const links = await tx.goalTask.findMany({
        where: { taskId: req.params.id },
        select: { goalId: true },
      });
      const effectiveGoalIds = goalIds && goalIds.length > 0 ? goalIds : links.map((l) => l.goalId);

      // Delete the task (cascades to GoalTask)
      await tx.task.delete({
        where: { id: req.params.id },
      });

      // Recalculate progress atomically for all affected goals
      for (const goalId of effectiveGoalIds) {
        await recalculateGoalProgress(goalId, tx);
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/complete - Toggle completion
router.post('/:id/complete', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      include: {
        goalTasks: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const toggledCompleted = !task.isCompleted;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update task completion state
      await tx.task.update({
        where: { id: req.params.id },
        data: {
          isCompleted: toggledCompleted,
          completedAt: toggledCompleted ? new Date() : null,
        },
      });

      // Atomically recalculate progress for linked goals (also updates parents)
      for (const gt of task.goalTasks) {
        await recalculateGoalProgress(gt.goalId, tx);

        // Log a progress entry for traceability
        await tx.progress.create({
          data: {
            goalId: gt.goalId,
            value: toggledCompleted ? 1 : -1,
            note: `Task "${task.title}" ${toggledCompleted ? 'completed' : 'reopened'}`,
            date: new Date(),
          },
        });
      }
    });

    const updatedTask = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskWithGoals,
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ error: 'Failed to toggle task completion' });
  }
});

// GET /api/tasks/scheduled/:date - Get tasks for date
router.get('/scheduled/:date', async (req, res) => {
  try {
    const user = await ensureUser(req);
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: taskWithGoals,
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tasks' });
  }
});

// GET /api/tasks/unscheduled - Get unscheduled tasks
router.get('/unscheduled/list', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        scheduledDate: null,
        isCompleted: false,
      },
      include: taskWithGoals,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching unscheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch unscheduled tasks' });
  }
});

// POST /api/tasks/:id/link-goal - Link task to a goal
router.post('/:id/link-goal', async (req, res) => {
  try {
    const user = await ensureUser(req);
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify task belongs to user
      const task = await tx.task.findFirst({
        where: { id: req.params.id, userId: user.id },
      });
      if (!task) {
        throw new Error('Task not found or access denied');
      }

      // Verify goal belongs to user
      const goal = await tx.goal.findFirst({
        where: { id: goalId, userId: user.id },
        select: { targetValue: true },
      });
      if (!goal) {
        throw new Error('Goal not found or access denied');
      }

      // Check if link already exists
      const existing = await tx.goalTask.findFirst({
        where: { taskId: req.params.id, goalId },
      });

      if (existing) {
        throw new Error('Task is already linked to this goal');
      }

      // Create the link
      await tx.goalTask.create({
        data: { goalId, taskId: req.params.id },
      });

      // Recalculate goal progress atomically
      await recalculateGoalProgress(goalId, tx);
    });

    // Return updated task
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskWithGoals,
    });

    res.json(task);
  } catch (error: any) {
    console.error('Error linking task to goal:', error);
    res.status(500).json({ error: error.message || 'Failed to link task to goal' });
  }
});

// POST /api/tasks/:id/unlink-goal - Unlink task from a goal
router.post('/:id/unlink-goal', async (req, res) => {
  try {
    const user = await ensureUser(req);
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify task belongs to user
      const task = await tx.task.findFirst({
        where: { id: req.params.id, userId: user.id },
        select: { isCompleted: true, size: true },
      });
      if (!task) {
        throw new Error('Task not found or access denied');
      }

      // Verify goal belongs to user and fetch its properties
      const goal = await tx.goal.findFirst({
        where: { id: goalId, userId: user.id },
        select: { targetValue: true, currentValue: true },
      });
      if (!goal) {
        throw new Error('Goal not found or access denied');
      }

      // Delete the link
      const deleted = await tx.goalTask.deleteMany({
        where: { taskId: req.params.id, goalId },
      });

      if (deleted.count === 0) {
        throw new Error('Task is not linked to this goal');
      }

      // Recalculate goal progress atomically
      await recalculateGoalProgress(goalId, tx);
    });

    // Return updated task
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskWithGoals,
    });

    res.json(task);
  } catch (error: any) {
    console.error('Error unlinking task from goal:', error);
    res.status(500).json({ error: error.message || 'Failed to unlink task from goal' });
  }
});

// POST /api/tasks/:id/schedule - Schedule or unschedule a task
router.post('/:id/schedule', async (req, res) => {
  try {
    const user = await ensureUser(req);
    const { scheduledDate } = req.body;

    // Verify task belongs to user
    const existingTask = await prisma.task.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    // Parse YYYY-MM-DD string as local date (not UTC)
    let parsedDate = null;
    if (scheduledDate) {
      const [year, month, day] = scheduledDate.split('-').map(Number);
      parsedDate = new Date(year, month - 1, day);
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        scheduledDate: parsedDate,
      },
      include: taskWithGoals,
    });

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error scheduling task:', error);
    res.status(500).json({ error: 'Failed to schedule task' });
  }
});

export default router;
