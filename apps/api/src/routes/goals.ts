import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// Get all goals
router.get('/', async (req, res) => {
    try {
        const goals = await prisma.goal.findMany({
            include: {
                progress: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                children: {
                    select: {
                        id: true,
                        title: true,
                        scope: true,
                        isCompleted: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create a new goal
router.post('/', async (req, res) => {
    try {
        const { title, description, type, targetValue, frequencyTarget, frequencyType, endDate, stepSize, period, customDataLabel, parentId, scope, scheduledDate } = req.body;

        let calculatedEndDate = endDate ? new Date(endDate) : null;
        let startDate = new Date();

        if (period === 'YEAR') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setFullYear(startDate.getFullYear() + 1);
        } else if (period === 'MONTH') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setMonth(startDate.getMonth() + 1);
        } else if (period === 'WEEK') {
            calculatedEndDate = new Date(startDate);
            calculatedEndDate.setDate(startDate.getDate() + 7);
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                type,
                targetValue,
                frequencyTarget,
                frequencyType,
                endDate: endDate ? new Date(endDate) : null,
                stepSize: stepSize || 1,
                customDataLabel,
                parentId,
                scope: scope || 'STANDALONE',
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null
            }
        });
        res.json(goal);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update a goal
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { title, description, targetValue, frequencyTarget, frequencyType, endDate, customDataLabel, parentId, scope, scheduledDate, isCompleted } = req.body;

        // Similar logic for endDate if period is updated, 
        // but typically edits to period might not shift dates unless requested.
        // For simplicity, we'll respect passed endDate or period logic if provided.
        // But usually editing a "Yearly" goal just changes the label or target. 
        // Let's assume user explicitly provides endDate if they want to change it.

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
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
                isCompleted,
                completedAt: isCompleted ? new Date() : undefined
            }
        });

        // If task is being marked complete and has a parent, increment parent's progress
        if (isCompleted && parentId) {
            const existingGoal = await prisma.goal.findUnique({ where: { id } });
            if (existingGoal && !existingGoal.isCompleted) {
                await prisma.goal.update({
                    where: { id: parentId },
                    data: {
                        currentValue: { increment: 1 }
                    }
                });
            }
        }

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
        const result = await prisma.$transaction(async (tx: any) => {
            // Create progress entry
            const progress = await tx.progress.create({
                data: {
                    goalId: id,
                    value,
                    note,
                    date: date ? new Date(date) : new Date(),
                    customData
                }
            });

            // Update goal current value
            const goal = await tx.goal.update({
                where: { id },
                data: {
                    currentValue: { increment: value }
                }
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
        await prisma.progress.deleteMany({ where: { goalId: id } });
        await prisma.goal.delete({ where: { id } });
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete goal' });
    }
});

// Get hierarchical goal tree (top-level goals with nested children)
router.get('/tree', async (req, res) => {
    try {
        const goals = await prisma.goal.findMany({
            where: { parentId: null }, // Only top-level goals
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true // 4 levels deep
                            }
                        }
                    }
                },
                progress: {
                    orderBy: { date: 'desc' },
                    take: 5
                }
            },
            orderBy: { createdAt: 'desc' }
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
        const goals = await prisma.goal.findMany({
            where: { scope: scope as any },
            include: {
                progress: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                children: {
                    select: {
                        id: true,
                        title: true,
                        isCompleted: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals by scope' });
    }
});

// Get goals scheduled for a specific date
router.get('/scheduled/:date', async (req, res) => {
    const { date } = req.params;
    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const goals = await prisma.goal.findMany({
            where: {
                scheduledDate: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                progress: {
                    orderBy: { date: 'desc' },
                    take: 5
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scheduled goals' });
    }
});

// Bulk create child tasks
router.post('/:id/bulk-tasks', async (req, res) => {
    const { id } = req.params;
    const { tasks } = req.body; // Array of { title, scheduledDate? }

    try {
        const createdTasks = await prisma.$transaction(
            tasks.map((task: any) =>
                prisma.goal.create({
                    data: {
                        title: task.title,
                        type: 'COMPLETION',
                        scope: 'DAILY',
                        parentId: id,
                        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : null,
                        isCompleted: false,
                        currentValue: 0,
                        stepSize: 1
                    }
                })
            )
        );

        res.json(createdTasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create bulk tasks' });
    }
});

// Get available unscheduled tasks
router.get('/available-tasks', async (req, res) => {
    const { scope, scheduled } = req.query;

    try {
        const goals = await prisma.goal.findMany({
            where: {
                scope: scope as any || 'DAILY',
                scheduledDate: scheduled === 'false' ? null : undefined,
                isCompleted: false
            },
            include: {
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(goals);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch available tasks' });
    }
});

export default router;
