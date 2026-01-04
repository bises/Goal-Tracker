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
        const { title, description, type, targetValue, frequencyTarget, frequencyType, endDate, stepSize, period, customDataLabel } = req.body;

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
                endDate: calculatedEndDate,
                stepSize: stepSize || 1,
                period: period || 'CUSTOM',
                customDataLabel
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
        const { title, description, targetValue, frequencyTarget, frequencyType, endDate, period, customDataLabel } = req.body;

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
                period,
                customDataLabel
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

export default router;
