import { GoalScope, Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, requireScope, validateJWT } from '../middleware/auth';
import { prisma } from '../prisma';
import { CompletionService } from '../services/completionService';
import { lockGoalProgress, recalculateGoalProgress } from '../services/goalProgressService';
import { ensureUser } from '../services/userService';

const router = Router();

// Apply authentication middleware to all routes
router.use(validateJWT, requireAuth);

/**
 * Verifies that a target parent goal exists, belongs to the specified user,
 * and does not create a cycle in the goal hierarchy.
 */
export async function validateParentGoal(
  goalId: string | null,
  parentId: string,
  userId: number,
  tx: Prisma.TransactionClient | typeof prisma
): Promise<void> {
  if (goalId && parentId === goalId) {
    const error = new Error('Goal cannot be its own parent');
    (error as any).statusCode = 400;
    throw error;
  }

  const parent = await tx.goal.findFirst({
    where: { id: parentId, userId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    const error = new Error('Parent goal not found or access denied');
    (error as any).statusCode = 400;
    throw error;
  }

  if (goalId) {
    let currentAncestorId: string | null = parent.parentId;
    const visited = new Set<string>([goalId, parent.id]);

    while (currentAncestorId) {
      if (currentAncestorId === goalId) {
        const error = new Error('Cyclic goal hierarchy detected: target parent is a descendant of this goal');
        (error as any).statusCode = 400;
        throw error;
      }
      if (visited.has(currentAncestorId)) {
        break;
      }
      visited.add(currentAncestorId);

      const ancestor = await tx.goal.findFirst({
        where: { id: currentAncestorId, userId },
        select: { parentId: true },
      });
      currentAncestorId = ancestor?.parentId || null;
    }
  }
}

// Lazy-initialize the completion service to avoid circular dependency issues
let completionService: CompletionService;
const getCompletionService = () => {
  if (!completionService) {
    completionService = new CompletionService(prisma);
  }
  return completionService;
};

function validateProgressMode(progressMode: unknown, targetValue: unknown): void {
  if (
    progressMode !== undefined &&
    progressMode !== 'AUTOMATIC' &&
    progressMode !== 'COMPLETED_SUBGOALS'
  ) {
    throw Object.assign(new Error('Invalid goal progress mode'), { statusCode: 400 });
  }
  if (
    progressMode === 'COMPLETED_SUBGOALS' &&
    (typeof targetValue !== 'number' ||
      !Number.isInteger(targetValue) ||
      targetValue < 1 ||
      targetValue > 2147483647)
  ) {
    throw Object.assign(new Error('Completed-subgoal goals require a positive whole-number target'), {
      statusCode: 400,
    });
  }
}

function getSubgoalProgressPercent(goal: { currentValue: number; targetValue: number | null }): number {
  return goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
}

const computeGoalView = (goal: any) => {
  const goalTasks = goal.goalTasks || [];
  const children = goal.children || [];

  // Deduplicate tasks by task.id across direct tasks and children
  const taskMap = new Map<string, any>();
  for (const gt of goalTasks) {
    if (gt?.task?.id) {
      taskMap.set(gt.task.id, gt.task);
    }
  }

  for (const child of children) {
    const childTasks = child.goalTasks || [];
    for (const gt of childTasks) {
      if (gt?.task?.id) {
        taskMap.set(gt.task.id, gt.task);
      }
    }
  }

  const uniqueTasks = Array.from(taskMap.values());
  let totalCount = uniqueTasks.length;
  let completedCount = uniqueTasks.filter((t) => t.isCompleted).length;
  let totalSize = uniqueTasks.reduce((acc: number, t: any) => acc + (t.size || 1), 0);
  let completedSize = uniqueTasks
    .filter((t: any) => t.isCompleted)
    .reduce((acc: number, t: any) => acc + (t.size || 1), 0);

  // If no tasks exist in the hierarchy, but children exist, derive from children counts
  if (totalCount === 0 && children.length > 0) {
    totalCount = children.length;
    completedCount = children.filter((c: any) => c.isMarkedComplete).length;
    totalSize = totalCount;
    completedSize = completedCount;
  }

  const percentComplete =
    goal.progressMode === 'COMPLETED_SUBGOALS'
      ? getSubgoalProgressPercent(goal)
      : totalSize > 0
        ? (completedSize / totalSize) * 100
        : 0;

  return {
    ...goal,
    progressSummary: {
      type: goal.type,
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
router.get('/', requireScope(['read:goals']), async (req, res) => {
  try {
    // Ensure user exists in database (creates if new user)
    const user = await ensureUser(req);

    // Parse query parameters
    const statusQuery = req.query.status as string | undefined;
    const scopeQuery = req.query.scope as string | undefined;
    const completedQuery = req.query.completed;
    const includeCompletedQuery = req.query.includeCompleted === 'true';

    let isMarkedCompleteFilter: boolean | undefined = false; // default active only

    if (statusQuery === 'completed') {
      isMarkedCompleteFilter = true;
    } else if (statusQuery === 'active') {
      isMarkedCompleteFilter = false;
    } else if (statusQuery === 'all') {
      isMarkedCompleteFilter = undefined;
    } else if (includeCompletedQuery) {
      isMarkedCompleteFilter = undefined;
    } else if (completedQuery === 'true') {
      isMarkedCompleteFilter = true;
    } else if (completedQuery === 'false') {
      isMarkedCompleteFilter = false;
    }

    const validScopes = Object.values(GoalScope);
    const scopeFilter =
      scopeQuery && validScopes.includes(scopeQuery.toUpperCase() as GoalScope)
        ? (scopeQuery.toUpperCase() as GoalScope)
        : undefined;

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
        isMarkedComplete: isMarkedCompleteFilter,
        ...(scopeFilter ? { scope: scopeFilter } : {}),
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        scope: true,
        type: true,
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

    // The Android list reads progressSummary without making a goal detail request.
    res.json(
      goals.map((goal) =>
        goal.progressMode === 'COMPLETED_SUBGOALS'
          ? {
              ...goal,
              progressSummary: {
                percentComplete: getSubgoalProgressPercent(goal),
                manualTotals: { currentValue: goal.currentValue, targetValue: goal.targetValue },
              },
            }
          : goal
      )
    );
  } catch (error) {
    console.error('Failed to fetch goals:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get a single goal by ID with full details
router.get('/:id', requireScope(['read:goals']), async (req, res) => {
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
            progressMode: true,
          },
        },
        children: {
          select: {
            id: true,
            title: true,
            description: true,
            scope: true,
            type: true,
            progressMode: true,
            targetValue: true,
            currentValue: true,
            parentId: true,
            isMarkedComplete: true,
            createdAt: true,
            updatedAt: true,
            goalTasks: {
              include: {
                task: true,
              },
            },
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
    console.error('Failed to fetch goal:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

// Create a new goal
router.post('/', requireScope(['write:goals']), async (req, res) => {
  try {
    const user = await ensureUser(req);

    const {
      title,
      description,
      type,
      progressMode,
      targetValue,
      frequencyTarget,
      frequencyType,
      endDate,
      stepSize,
      customDataLabel,
      parentId,
      scope,
    } = req.body;

    validateProgressMode(progressMode, targetValue);

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // If parentId is provided, verify parent belongs to user and is cycle-free
      if (parentId) {
        await validateParentGoal(null, parentId, user.id, tx);
      }

      // Create the goal first
      const goal = await tx.goal.create({
        data: {
          title,
          description,
          type: type || 'TOTAL_TARGET',
          progressMode,
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

      // If this goal has a parent, atomically recalculate parent's progress
      if (goal.parentId) {
        await recalculateGoalProgress(goal.parentId, tx);
      }

      return goal;
    });

    res.json(created);
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update a goal
router.put('/:id', requireScope(['write:goals']), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await ensureUser(req);

    const {
      title,
      description,
      progressMode,
      targetValue,
      frequencyTarget,
      frequencyType,
      endDate,
      customDataLabel,
      parentId,
      scope,
    } = req.body;

    const goal = await prisma.$transaction(async (tx) => {
      let existingGoal = await tx.goal.findFirst({ where: { id, userId: user.id } });
      if (!existingGoal) {
        throw Object.assign(new Error('Goal not found or access denied'), { statusCode: 404 });
      }

      if (parentId !== undefined && parentId !== null) {
        await validateParentGoal(id, parentId, user.id, tx);
      }

      if (progressMode !== undefined || targetValue !== undefined || parentId !== undefined) {
        await lockGoalProgress(id, tx);
        existingGoal = await tx.goal.findFirst({ where: { id, userId: user.id } });
        if (!existingGoal) {
          throw Object.assign(new Error('Goal not found or access denied'), { statusCode: 404 });
        }
      }

      const nextMode = progressMode === undefined ? existingGoal.progressMode : progressMode;
      const modeChanged = nextMode !== existingGoal.progressMode;
      const nextTarget =
        targetValue === undefined && !modeChanged ? existingGoal.targetValue : targetValue;
      validateProgressMode(nextMode, nextTarget);

      const updated = await tx.goal.update({
        where: { id },
        data: {
          title,
          description,
          progressMode,
          targetValue,
          frequencyTarget,
          frequencyType,
          endDate: endDate ? new Date(endDate) : undefined,
          customDataLabel,
          parentId,
          scope,
          ...(progressMode === 'AUTOMATIC' && existingGoal.progressMode === 'COMPLETED_SUBGOALS'
            ? { currentValue: 0 }
            : {}),
        },
      });

      const recalculateSelf =
        modeChanged || (nextMode === 'COMPLETED_SUBGOALS' && targetValue !== undefined);
      if (recalculateSelf) {
        await recalculateGoalProgress(id, tx);
      }
      if (updated.parentId !== existingGoal.parentId) {
        const parentIds = [existingGoal.parentId, recalculateSelf ? null : updated.parentId];
        for (const parentId of parentIds.sort()) {
          if (parentId) {
            await recalculateGoalProgress(parentId, tx);
          }
        }
      }

      return recalculateSelf ? tx.goal.findUniqueOrThrow({ where: { id } }) : updated;
    });
    res.json(goal);
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// Update progress
router.post('/:id/progress', requireScope(['write:goals']), async (req, res) => {
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
      await lockGoalProgress(id, tx);
      const goalSettings = await tx.goal.findUniqueOrThrow({
        where: { id },
        select: { progressMode: true },
      });
      if (goalSettings.progressMode === 'COMPLETED_SUBGOALS') {
        throw Object.assign(new Error('Progress comes from completed subgoals'), { statusCode: 409 });
      }

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
  } catch (error: any) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete goal
router.delete('/:id', requireScope(['write:goals']), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await ensureUser(req);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Look up the goal to verify ownership and capture parent before deletion
      const goal = await tx.goal.findFirst({
        where: { id, userId: user.id },
        select: { id: true, parentId: true },
      });

      if (!goal) {
        const error = new Error('Goal not found or access denied');
        (error as any).statusCode = 404;
        throw error;
      }

      // Delete related progress entries then the goal itself
      await tx.progress.deleteMany({ where: { goalId: goal.id } });
      await tx.goal.delete({ where: { id: goal.id } });

      // If this was a child goal with a parent, atomically recalculate parent's progress
      if (goal.parentId) {
        await recalculateGoalProgress(goal.parentId, tx);
      }
    });
    res.json({ message: 'Goal deleted' });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return res.status(404).json({ error: error.message });
    }
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Get hierarchical goal tree (top-level goals with nested children)
router.get('/tree', requireScope(['read:goals']), async (req, res) => {
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
router.get('/scope/:scope', requireScope(['read:goals']), async (req, res) => {
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
router.post('/:id/bulk-tasks', requireScope(['write:goals']), async (req, res) => {
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

      // Recalculate goal progress atomically (also updates parent if present)
      await recalculateGoalProgress(id, tx);

      return createdTasks;
    });

    res.json(result);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to create bulk tasks' });
  }
});

// POST /api/goals/:id/complete - Mark goal as completed and update parent
router.post('/:id/complete', requireScope(['write:goals']), async (req, res) => {
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
      return res.status(result.statusCode ?? 404).json({ error: result.message });
    }

    res.json(result);
  } catch (error) {
    console.error('Error completing goal:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to complete goal' });
  }
});

// POST /api/goals/:id/uncomplete - Mark goal as incomplete and update parent (decrement)
router.post('/:id/uncomplete', requireScope(['write:goals']), async (req, res) => {
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
    console.error('Error marking goal incomplete:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to mark goal incomplete' });
  }
});

// GET /api/goals/:id/tasks - Fetch tasks and children for a specific goal
router.get('/:id/tasks', requireScope(['read:goals']), async (req, res) => {
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
            type: true,
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
    console.error('Failed to fetch goal tasks:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch goal tasks' });
  }
});

// GET /api/goals/:id/activities - Fetch progress/activities for a specific goal
router.get('/:id/activities', requireScope(['read:goals']), async (req, res) => {
  try {
    const user = await ensureUser(req);

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    const goalCheck = await prisma.goal.findFirst({
      where: { id: req.params.id, userId: user.id },
      select: { id: true },
    });

    if (!goalCheck) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const [activities, total] = await Promise.all([
      prisma.progress.findMany({
        where: { goalId: req.params.id },
        select: {
          id: true,
          date: true,
          value: true,
          note: true,
          customData: true,
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.progress.count({
        where: { goalId: req.params.id },
      }),
    ]);

    res.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch goal activities:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Failed to fetch goal activities' });
  }
});

export default router;
