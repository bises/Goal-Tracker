import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

const computeGoalView = (goal: any) => {
    const goalTasks = goal.goalTasks || [];
    const totalSize = goalTasks.reduce((acc: number, gt: any) => acc + (gt.task?.size || 1), 0);
    const completedSize = goalTasks
        .filter((gt: any) => gt.task?.isCompleted)
        .reduce((acc: number, gt: any) => acc + (gt.task?.size || 1), 0);
    const totalCount = goalTasks.length;
    const completedCount = goalTasks.filter((gt: any) => gt.task?.isCompleted).length;

    const taskProgress = totalSize > 0 ? (completedSize / totalSize) * 100 : 0;
    const manualProgress = goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;

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
                        scope: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                },
                goalTasks: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                isCompleted: true,
                                size: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(goals.map(computeGoalView));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});

// Create a new goal
router.post('/', async (req, res) => {
    try {
        const { title, description, type, targetValue, frequencyTarget, frequencyType, endDate, stepSize, customDataLabel, parentId, scope, progressMode } = req.body;

        const goal = await prisma.goal.create({
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
                scope: scope || 'STANDALONE'
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
        const { title, description, targetValue, frequencyTarget, frequencyType, endDate, customDataLabel, parentId, scope, progressMode } = req.body;

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
                progressMode
            }
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
                        title: true
                    }
                },
                parent: {
                    select: {
                        id: true,
                        title: true,
                        scope: true
                    }
                },
                goalTasks: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                title: true,
                                isCompleted: true,
                                size: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
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
        const createdTasks = await prisma.$transaction(
            tasks.map((task: any) =>
                prisma.task.create({
                    data: {
                        title: task.title,
                        scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : null,
                        size: task.size || 1,
                        isCompleted: false,
                        goalTasks: {
                            create: {
                                goalId: id
                            }
                        }
                    },
                    include: {
                        goalTasks: {
                            include: {
                                goal: {
                                    select: {
                                        id: true,
                                        title: true
                                    }
                                }
                            }
                        }
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

export default router;
