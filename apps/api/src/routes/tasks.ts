import { Router } from 'express';
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
      include: taskWithGoals,
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
      include: taskWithGoals,
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

    const task = await prisma.task.create({
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
      include: taskWithGoals,
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      size,
      scheduledDate,
      goalIds,
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

    // Handle goalIds separately if provided
    if (goalIds !== undefined) {
      // Delete existing goal associations
      await prisma.goalTask.deleteMany({
        where: { taskId: req.params.id },
      });

      // Create new goal associations
      if (goalIds.length > 0) {
        await prisma.goalTask.createMany({
          data: goalIds.map((goalId: string) => ({
            goalId,
            taskId: req.params.id,
          })),
        });
      }

      // Refetch task with updated goals
      const updatedTask = await prisma.task.findUnique({
        where: { id: req.params.id },
        include: taskWithGoals,
      });

      return res.json(updatedTask);
    }

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: req.params.id },
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

    await prisma.$transaction(async (tx) => {
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

export default router;
