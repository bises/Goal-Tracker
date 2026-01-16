import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/calendar/tasks - Fetch tasks for calendar view
router.get('/tasks', async (req, res) => {
    try {
        const { startDate, endDate, includeUnscheduled, parentGoalId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        // Fetch scheduled tasks in range
        const whereClause: any = {
            scheduledDate: {
                gte: start,
                lte: end
            }
        };

        if (parentGoalId) {
            whereClause.goalTasks = {
                some: {
                    goalId: parentGoalId as string
                }
            };
        }

        const scheduledTasks = await prisma.task.findMany({
            where: whereClause,
            include: {
                goalTasks: {
                    include: {
                        goal: {
                            select: { id: true, title: true, scope: true }
                        }
                    }
                },
                parentTask: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { scheduledDate: 'asc' }
        });

        const response: any = {
            tasks: scheduledTasks
        };

        // Optionally include unscheduled tasks for drag-drop
        if (includeUnscheduled === 'true') {
            const unscheduledWhere: any = {
                scheduledDate: null,
                isCompleted: false
            };

            if (parentGoalId) {
                unscheduledWhere.goalTasks = {
                    some: {
                        goalId: parentGoalId as string
                    }
                };
            }

            const unscheduledTasks = await prisma.task.findMany({
                where: unscheduledWhere,
                include: {
                    goalTasks: {
                        include: {
                            goal: {
                                select: { id: true, title: true, scope: true }
                            }
                        }
                    },
                    parentTask: {
                        select: { id: true, title: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 50 // Limit unscheduled tasks
            });

            response.unscheduledTasks = unscheduledTasks;
        }

        res.json(response);
    } catch (error) {
        console.error('Error fetching calendar tasks:', error);
        res.status(500).json({ error: 'Failed to fetch calendar tasks' });
    }
});

// GET /api/calendar/goals - Fetch goals for calendar view
router.get('/goals', async (req, res) => {
    try {
        const { startDate, endDate, scope } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate are required' });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        const whereClause: any = {
            OR: [
                {
                    // Goal starts within range
                    startDate: {
                        gte: start,
                        lte: end
                    }
                },
                {
                    // Goal ends within range
                    endDate: {
                        gte: start,
                        lte: end
                    }
                },
                {
                    // Goal spans the entire range
                    AND: [
                        { startDate: { lte: start } },
                        {
                            OR: [
                                { endDate: { gte: end } },
                                { endDate: null }
                            ]
                        }
                    ]
                }
            ]
        };

        if (scope) {
            whereClause.scope = scope;
        }

        const goals = await prisma.goal.findMany({
            where: whereClause,
            include: {
                parent: {
                    select: { id: true, title: true, scope: true }
                },
                goalTasks: {
                    include: {
                        task: {
                            select: { id: true, title: true, isCompleted: true, size: true }
                        }
                    }
                }
            },
            orderBy: { startDate: 'asc' }
        });

        res.json({ goals });
    } catch (error) {
        console.error('Error fetching calendar goals:', error);
        res.status(500).json({ error: 'Failed to fetch calendar goals' });
    }
});

export default router;
