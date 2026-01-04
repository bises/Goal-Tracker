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
        const { title, description, type, targetValue, frequencyTarget, frequencyType, endDate } = req.body;
        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                type,
                targetValue,
                frequencyTarget,
                frequencyType,
                endDate: endDate ? new Date(endDate) : null,
            }
        });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create goal' });
    }
});

// Update progress
router.post('/:id/progress', async (req, res) => {
    const { id } = req.params;
    const { value, note, date } = req.body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create progress entry
            const progress = await tx.progress.create({
                data: {
                    goalId: id,
                    value,
                    note,
                    date: date ? new Date(date) : new Date()
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
