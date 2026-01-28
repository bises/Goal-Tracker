import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, validateJWT } from '../middleware/auth';
import { prisma } from '../prisma';
import { CompletionService } from '../services/completionService';
import { ensureUser } from '../services/userService';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateJWT, requireAuth);

// Lazy-initialize the completion service to avoid circular dependency issues
let completionService: CompletionService;
const getCompletionService = () => {
  if (!completionService) {
    completionService = new CompletionService(prisma);
  }
  return completionService;
};

const computeGoalView = (goal: any) => {
  const goalTasks = goal.goalTasks || [];
  const children = goal.children || [];

  // Calculate direct task progress
  let totalSize = goalTasks.reduce((acc: number, gt: any) => acc + (gt.task?.size || 1), 0);
  let completedSize = goalTasks
    .filter((gt: any) => gt.task?.isCompleted)
    .reduce((acc: number, gt: any) => acc + (gt.task?.size || 1), 0);
  let totalCount = goalTasks.length;
  let completedCount = goalTasks.filter((gt: any) => gt.task?.isCompleted).length;

  // If goal has children, include their task progress
  if (children.length > 0 && goal.progressMode === 'TASK_BASED') {
    // Recursively calculate child task totals
    for (const child of children) {
      const childTasks = child.goalTasks || [];
      const childTotalSize = childTasks.reduce(
        (acc: number, gt: any) => acc + (gt.task?.size || 1),
        0
      );
      const childCompletedSize = childTasks
        .filter((gt: any) => gt.task?.isCompleted)
        .reduce((acc: number, gt: any) => acc + (gt.task?.size || 1), 0);

      totalSize += childTotalSize;
      completedSize += childCompletedSize;
      totalCount += childTasks.length;
      completedCount += childTasks.filter((gt: any) => gt.task?.isCompleted).length;
    }
  }

  const taskProgress = totalSize > 0 ? (completedSize / totalSize) * 100 : 0;
  const manualProgress = goal.targetValue
    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
    : 0;

  let percentComplete = manualProgress;
  if (goal.progressMode === 'TASK_BASED') {
    percentComplete = taskProgress;
  }

  return {
    ...goal,
    progressSummary: {
      mode: goal.progressMode,
      percentComplete,
      taskTotals: {
        totalCount,
        completedCount,
        totalSize,
        completedSize,
      },
      manualTotals: {
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
      },
    },
  };
};

// Get all goals
router.get('/', async (req, res) => {
  try {
    // Ensure user exists in database
    const user = await ensureUser(req);

    // Parse query parameters
    const includeCompleted = req.query.completed === 'true';
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);

    // Fetch goals with parent relationship using optimized join strategy
    const goals = await prisma.goal.findMany({
      relationLoadStrategy: 'join',
      where: {
        userId: user.id,
        isMarkedComplete: includeCompleted ? undefined : false,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        scope: true,
        progressMode: true,
        currentValue: true,
        targetValue: true,
        parentId: true,
        isMarkedComplete: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            title: true,
            scope: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(goals);
  } catch (error) {
    console.error('Failed to fetch goals:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get a single goal by ID with full details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await ensureUser(req);

    const goal = await prisma.goal.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        parent: {
          select: {
            id: true,
            title: true,
            scope: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            description: true,
            scope: true,
            progressMode: true,
            targetValue: true,
            currentValue: true,
            parentId: true,
            isMarkedComplete: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        goalTasks: {
          include: {
            task: true,
          },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    // Compute progress summary
    const goalWithView = computeGoalView(goal);
    res.json(goalWithView);
  } catch (error) {
    console.error('Failed to fetch goal:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create a new goal
router.post('/', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const {
      title,
      description,
      type,
      targetValue,
      frequencyTarget,
      frequencyType,
      endDate,
      stepSize,
      customDataLabel,
      parentId,
      scope,
      progressMode,
    } = req.body;

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If parentId is provided, verify parent belongs to user
      if (parentId) {
        const parent = await tx.goal.findFirst({
          where: { id: parentId, userId: user.id },
        });
        if (!parent) {
          throw new Error('Parent goal not found or access denied');
        }
      }

      // Create the goal first
      const goal = await tx.goal.create({
        data: {
          title,
          description,
          type,
          progressMode: progressMode || 'TASK_BASED',
          targetValue,
          frequencyTarget,
          frequencyType,
          endDate: endDate ? new Date(endDate) : null,
          stepSize: stepSize || 1,
          customDataLabel,
          parentId,
          scope: scope || 'STANDALONE',
          userId: user.id,
        },
      });

      // If this goal has a parent and this goal uses TASK_BASED progress,
      // then bump the parent's targetValue by 1 to reflect a new sub-goal unit.
      if (goal.parentId && goal.progressMode === 'TASK_BASED') {
        // Note: Using a read + set to safely handle null targetValue on parent
        const parent = await tx.goal.findUnique({
          where: { id: goal.parentId },
          select: { targetValue: true },
        });

        if (parent) {
          await tx.goal.update({
            where: { id: goal.parentId },
            data: {
              // If parent.targetValue is null, treat as 0 before incrementing
              targetValue: (parent.targetValue ?? 0) + 1,
            },
          });
        }

        // TODO: For MANUAL_TOTAL, consider whether adding a sub-goal should
        //       adjust parent's targetValue or remain manual-only.
        // TODO: For HABIT, define if sub-goals affect parent's target cadence
        //       or streak metrics before implementing similar adjustments.
      }

      return goal;
    });

    res.json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update a goal
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await ensureUser(req);

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found or access denied' });
    }

    const {
      title,
      description,
      targetValue,
      frequencyTarget,
      frequencyType,
      endDate,
      customDataLabel,
      parentId,
      scope,
      progressMode,
    } = req.body;

    const goal = await prisma.goal.update({
      where: { id },
      data: {
        title,
        description,
        targetValue,
        frequencyTarget,
        frequencyType,
        endDate: endDate ? new Date(endDate) : undefined,
        customDataLabel,
        parentId,
        scope,
        progressMode,
      },
    });

    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Update progress
router.post('/:id/progress', async (req, res) => {
  const { id } = req.params;
  const { value, note, date, customData } = req.body;

  try {
    const user = await ensureUser(req);

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found or access denied' });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create progress entry
      const progress = await tx.progress.create({
        data: {
          goalId: id,
          value,
          note,
          date: date ? new Date(date) : new Date(),
          customData,
        },
      });

      // Update goal current value
      const goal = await tx.goal.update({
        where: { id },
        data: {
          currentValue: { increment: value },
        },
      });

      return { progress, goal };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await ensureUser(req);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Look up the goal to capture parent and mode before deletion
      const goal = await tx.goal.findFirst({
        where: { id, userId: user.id },
        select: { parentId: true, progressMode: true },
      });

      // Delete related progress entries then the goal itself
      await tx.progress.deleteMany({ where: { goalId: id } });
      await tx.goal.delete({ where: { id } });

      // If this was a TASK_BASED child with a parent, decrement parent's targetValue
      if (goal?.parentId && goal.progressMode === 'TASK_BASED') {
        const parent = await tx.goal.findUnique({
          where: { id: goal.parentId },
          select: { targetValue: true },
        });

        if (parent) {
          const newTarget = Math.max(0, (parent.targetValue ?? 0) - 1);
          await tx.goal.update({
            where: { id: goal.parentId },
            data: { targetValue: newTarget },
          });
        }

        // TODO: Consider whether deleting a MANUAL_TOTAL child should
        //       adjust parent's targetValue or remain manual-only.
        // TODO: For HABIT mode, define if child deletion impacts target cadence
        //       or streak metrics before introducing adjustments.
      }
    });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Get hierarchical goal tree (top-level goals with nested children)
router.get('/tree', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const goals = await prisma.goal.findMany({
      where: {
        parentId: null,
        userId: user.id,
      }, // Only top-level goals
      include: {
        children: {
          include: {
            goalTasks: {
              include: {
                task: {
                  select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    size: true,
                  },
                },
              },
            },
            children: {
              include: {
                goalTasks: {
                  include: {
                    task: {
                      select: {
                        id: true,
                        title: true,
                        isCompleted: true,
                        size: true,
                      },
                    },
                  },
                },
                children: {
                  include: {
                    goalTasks: {
                      include: {
                        task: {
                          select: {
                            id: true,
                            title: true,
                            isCompleted: true,
                            size: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        progress: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goal tree' });
  }
});

// Get goals by scope
router.get('/scope/:scope', async (req, res) => {
  const { scope } = req.params;
  try {
    const user = await ensureUser(req);

    const goals = await prisma.goal.findMany({
      where: {
        scope: scope as any,
        userId: user.id,
      },
      include: {
        progress: {
          orderBy: { date: 'desc' },
          take: 5,
        },
        children: {
          include: {
            goalTasks: {
              include: {
                task: {
                  select: {
                    id: true,
                    title: true,
                    isCompleted: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
        parent: {
          select: {
            id: true,
            title: true,
            scope: true,
          },
        },
        goalTasks: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                isCompleted: true,
                size: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(goals.map(computeGoalView));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch goals by scope' });
  }
});

// Bulk create child tasks
router.post('/:id/bulk-tasks', async (req, res) => {
  const { id } = req.params;
  const { tasks } = req.body; // Array of { title, scheduledDate?, size? }

  try {
    const user = await ensureUser(req);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Verify goal belongs to user
      const existingGoal = await tx.goal.findFirst({
        where: { id, userId: user.id },
      });
      if (!existingGoal) {
        throw new Error('Goal not found or access denied');
      }

      // Create all tasks linked to the goal id
      const createdTasks = [] as any[];
      for (const task of tasks as any[]) {
        const created = await tx.task.create({
          data: {
            title: task.title,
            scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : null,
            size: task.size || 1,
            isCompleted: false,
            userId: user.id,
            goalTasks: {
              create: {
                goalId: id,
              },
            },
          },
          include: {
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
          },
        });
        createdTasks.push(created);
      }

      // If the goal is TASK_BASED, bump its targetValue by the number of tasks created
      const parentGoal = await tx.goal.findUnique({
        where: { id },
        select: { progressMode: true, targetValue: true },
      });

      if (parentGoal && parentGoal.progressMode === 'TASK_BASED') {
        await tx.goal.update({
          where: { id },
          data: {
            targetValue: (parentGoal.targetValue ?? 0) + createdTasks.length,
          },
        });
      }

      // TODO: For MANUAL_TOTAL/HABIT, define desired behavior before changing targetValue here.

      return createdTasks;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create bulk tasks' });
  }
});

// POST /api/goals/:id/complete - Mark goal as completed and update parent
router.post('/:id/complete', async (req, res) => {
  try {
    const user = await ensureUser(req);

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found or access denied' });
    }

    const result = await getCompletionService().completeGoal(req.params.id);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing goal:', error);
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

// POST /api/goals/:id/uncomplete - Mark goal as incomplete and update parent (decrement)
router.post('/:id/uncomplete', async (req, res) => {
  try {
    const user = await ensureUser(req);

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: user.id },
    });
    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found or access denied' });
    }

    const result = await getCompletionService().uncompleteGoal(req.params.id);

    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    console.error('Error marking goal incomplete:', error);
    res.status(500).json({ error: 'Failed to mark goal incomplete' });
  }
});

// GET /api/goals/:id/tasks - Fetch tasks and children for a specific goal
router.get('/:id/tasks', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const goal = await prisma.goal.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      select: {
        goalTasks: {
          select: {
            task: {
              select: {
                id: true,
                title: true,
                description: true,
                size: true,
                isCompleted: true,
                scheduledDate: true,
                completedAt: true,
              },
            },
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            description: true,
            scope: true,
            progressMode: true,
            targetValue: true,
            currentValue: true,
            parentId: true,
            isMarkedComplete: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('Failed to fetch goal tasks:', error);
    res.status(500).json({ error: 'Failed to fetch goal tasks' });
  }
});

// GET /api/goals/:id/activities - Fetch progress/activities for a specific goal
router.get('/:id/activities', async (req, res) => {
  try {
    const user = await ensureUser(req);

    const goal = await prisma.goal.findFirst({
      where: {
        id: req.params.id,
        userId: user.id,
      },
      select: {
        progress: {
          select: {
            id: true,
            date: true,
            value: true,
            note: true,
            customData: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal.progress);
  } catch (error) {
    console.error('Failed to fetch goal activities:', error);
    res.status(500).json({ error: 'Failed to fetch goal activities' });
  }
});

export default router;
