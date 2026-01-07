import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

const router = Router();

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

// GET /api/tasks - Get all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
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
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
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
    const {
      title,
      description,
      size = 1,
      scheduledDate,
      goalIds = [],
      parentTaskId,
      customData,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create the task
      const newTask = await tx.task.create({
        data: {
          title,
          description,
          size: parseInt(size),
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
          parentTaskId: parentTaskId || null,
          customData,
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

      // Update target value for each parent goal (only for TASK_BASED)
      if (goalIds.length > 0) {
        for (const goalId of goalIds) {
          const parentGoal = await tx.goal.findUnique({
            where: { id: goalId },
            select: { progressMode: true, targetValue: true },
          });
          if (parentGoal && parentGoal.progressMode === 'TASK_BASED') {
            await tx.goal.update({
              where: { id: goalId },
              data: {
                targetValue: (parentGoal.targetValue ?? 0) + 1,
              },
            });
          }
          // TODO: Consider MANUAL_TOTAL & HABIT: should adding a task influence targets?
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
    const {
      title,
      description,
      size,
      scheduledDate,
      parentTaskId,
      customData,
      isCompleted,
    } = req.body;

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (size !== undefined) updateData.size = parseInt(size);
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    }
    if (parentTaskId !== undefined) updateData.parentTaskId = parentTaskId || null;
    if (customData !== undefined) updateData.customData = customData;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: updateData,
      include: taskWithGoals,
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
    const { goalIds = [] } = req.body;

    // Fetch task state first to know if we need to decrease currentValue
    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: { isCompleted: true, size: true },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const progressDelta = existingTask.isCompleted ? -1 * (existingTask.size || 1) : 0;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Delete the task
      await tx.task.delete({
        where: { id: req.params.id },
      });

      // Determine effective goalIds (fallback to DB lookup if not provided)
      let effectiveGoalIds: string[] = goalIds;
      if (!effectiveGoalIds || effectiveGoalIds.length === 0) {
        const links = await tx.goalTask.findMany({
          where: { taskId: req.params.id },
          select: { goalId: true },
        });
        effectiveGoalIds = links.map((l) => l.goalId);
      }

      // Adjust parent goals (only for TASK_BASED)
      for (const goalId of effectiveGoalIds) {
        const parentGoal = await tx.goal.findUnique({
          where: { id: goalId },
          select: { progressMode: true, targetValue: true, currentValue: true },
        });
        if (!parentGoal) continue;

        if (parentGoal.progressMode === 'TASK_BASED') {
          const newTarget = Math.max(0, (parentGoal.targetValue ?? 0) - 1);
          const newCurrent = progressDelta !== 0
            ? Math.max(0, (parentGoal.currentValue ?? 0) + progressDelta)
            : parentGoal.currentValue ?? 0;

          await tx.goal.update({
            where: { id: goalId },
            data: {
              targetValue: newTarget,
              currentValue: newCurrent,
            },
          });

          // Optional: log a negative progress entry to reflect deletion
          // Skipped for now; add if you want audit trail.
        }
        // TODO: Consider MANUAL_TOTAL & HABIT: should removing a task influence targets/progress?
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
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        goalTasks: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const toggledCompleted = !task.isCompleted;
    const effortDelta = (toggledCompleted ? 1 : -1) * (task.size || 1);

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update task completion state
      await tx.task.update({
        where: { id: req.params.id },
        data: {
          isCompleted: toggledCompleted,
          completedAt: toggledCompleted ? new Date() : null,
        },
      });

      // Apply progress updates to task-based goals only
      for (const gt of task.goalTasks) {
        const goal = await tx.goal.findUnique({
          where: { id: gt.goalId },
          select: { 
            title: true, 
            currentValue: true, 
            progressMode: true, 
            targetValue: true, 
            parentId: true,
            goalTasks: {
              include: { task: true }
            }
          },
        });

        if (!goal) continue;
        if (goal.progressMode !== 'TASK_BASED') continue;

        const newValue = Math.max(0, (goal.currentValue || 0) + effortDelta);

        await tx.goal.update({
          where: { id: gt.goalId },
          data: { currentValue: newValue },
        });

        // Log a progress entry for traceability
        await tx.progress.create({
          data: {
            goalId: gt.goalId,
            value: effortDelta,
            note: `Task "${task.title}" ${toggledCompleted ? 'completed' : 'reopened'}`,
            date: new Date(),
          },
        });

        // Check if goal is now completed and has a parent to update
        if (goal.parentId && toggledCompleted) {
          // Calculate goal completion percentage
          const goalTasks = goal.goalTasks || [];
          const totalSize = goalTasks.reduce((acc, gt) => acc + (gt.task?.size || 1), 0);
          const completedSize = goalTasks
            .filter((gt) => {
              // Count as completed if task was already completed or if it's the current task being marked complete
              return gt.taskId === req.params.id || gt.task?.isCompleted;
            })
            .reduce((acc, gt) => acc + (gt.task?.size || 1), 0);

          const percentComplete = totalSize > 0 ? (completedSize / totalSize) * 100 : 0;

          // If goal just reached 100% completion, update parent
          if (percentComplete >= 100) {
            const parentGoal = await tx.goal.findUnique({
              where: { id: goal.parentId },
              select: { progressMode: true, title: true },
            });

            if (parentGoal && parentGoal.progressMode === 'TASK_BASED') {
              // Add 1 progress unit to parent when subgoal completes
              await tx.goal.update({
                where: { id: goal.parentId },
                data: {
                  currentValue: {
                    increment: 1,
                  },
                },
              });

              // Log progress in parent goal
              await tx.progress.create({
                data: {
                  goalId: goal.parentId,
                  value: 1,
                  note: `Subgoal "${goal.title}" completed (all tasks done)`,
                  date: new Date(),
                },
              });
            }
          }
        }
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
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const tasks = await prisma.task.findMany({
      where: {
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
    const tasks = await prisma.task.findMany({
      where: {
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
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      // Increment goal's targetValue if TASK_BASED
      const goal = await tx.goal.findUnique({
        where: { id: goalId },
        select: { progressMode: true, targetValue: true },
      });

      if (goal && goal.progressMode === 'TASK_BASED') {
        await tx.goal.update({
          where: { id: goalId },
          data: { targetValue: (goal.targetValue ?? 0) + 1 },
        });
      }
      // TODO: Consider MANUAL_TOTAL & HABIT link effect on targets
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
    const { goalId } = req.body;

    if (!goalId) {
      return res.status(400).json({ error: 'goalId is required' });
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Fetch the task to check if it's completed
      const task = await tx.task.findUnique({
        where: { id: req.params.id },
        select: { isCompleted: true, size: true },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Delete the link
      const deleted = await tx.goalTask.deleteMany({
        where: { taskId: req.params.id, goalId },
      });

      if (deleted.count === 0) {
        throw new Error('Task is not linked to this goal');
      }

      // Update goal's targetValue and currentValue if TASK_BASED
      const goal = await tx.goal.findUnique({
        where: { id: goalId },
        select: { progressMode: true, targetValue: true, currentValue: true },
      });

      if (goal && goal.progressMode === 'TASK_BASED') {
        const newTargetValue = Math.max(0, (goal.targetValue ?? 0) - 1);
        
        // If task was completed, also decrement currentValue
        let newCurrentValue = goal.currentValue;
        if (task.isCompleted) {
          const progressDelta = task.size || 1;
          newCurrentValue = Math.max(0, newCurrentValue - progressDelta);
        }

        await tx.goal.update({
          where: { id: goalId },
          data: { 
            targetValue: newTargetValue,
            currentValue: newCurrentValue,
          },
        });
      }
      // TODO: Consider MANUAL_TOTAL & HABIT unlink effect on targets
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

export default router;
