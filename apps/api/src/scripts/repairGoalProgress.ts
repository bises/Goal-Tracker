import dotenv from 'dotenv';
import { prisma } from '../prisma';
import { recalculateGoalProgress } from '../services/goalProgressService';

dotenv.config();

/**
 * One-time repair script to heal corrupted currentValue / targetValue in existing databases.
 * Iterates through all goals and recalculates correct values from actual relational data.
 */
async function repairAllGoals() {
  console.log('🔄 Starting goal progress data repair...');

  const goals = await prisma.goal.findMany({
    select: {
      id: true,
      title: true,
      currentValue: true,
      targetValue: true,
      parentId: true,
    },
  });

  console.log(`Found ${goals.length} goals to inspect.`);

  let repairedCount = 0;

  for (const g of goals) {
    const oldCurrent = g.currentValue;
    const oldTarget = g.targetValue;

    await prisma.$transaction(async (tx) => {
      await recalculateGoalProgress(g.id, tx);
    });

    const updated = await prisma.goal.findUnique({
      where: { id: g.id },
      select: { currentValue: true, targetValue: true },
    });

    if (updated && (updated.currentValue !== oldCurrent || updated.targetValue !== oldTarget)) {
      console.log(
        `  ✅ Repaired "${g.title}" (${g.id}): was ${oldCurrent}/${oldTarget} -> now ${updated.currentValue}/${updated.targetValue}`
      );
      repairedCount++;
    }
  }

  console.log(
    `🎉 Goal progress repair complete! Repaired ${repairedCount} of ${goals.length} goals.`
  );
}

repairAllGoals()
  .catch((err) => {
    console.error('❌ Failed to repair goals:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
