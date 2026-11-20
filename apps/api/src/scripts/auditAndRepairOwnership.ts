import dotenv from 'dotenv';
import { prisma } from '../prisma';
import { recalculateGoalProgress } from '../services/goalProgressService';

dotenv.config();

/**
 * Audit and repair script for database ownership integrity.
 *
 * Checks:
 * 1. Goal parent-child hierarchy across different users:
 *    If Goal.userId != parentGoal.userId, sets parentId = null.
 * 2. Task parent-subtask hierarchy across different users:
 *    If Task.userId != parentTask.userId, sets parentTaskId = null.
 * 3. GoalTask associations across different users:
 *    If Goal.userId != Task.userId, removes the GoalTask link and recalculates affected goal progress.
 */
export async function auditAndRepairOwnership() {
  console.log('🔍 Starting ownership and hierarchy audit...');

  let repairedGoals = 0;
  let repairedTasks = 0;
  let repairedGoalTasks = 0;

  // 1. Audit Goal parent-child relationships
  const goalsWithParents = await prisma.goal.findMany({
    where: { parentId: { not: null } },
    select: {
      id: true,
      title: true,
      userId: true,
      parentId: true,
      parent: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
    },
  });

  for (const g of goalsWithParents) {
    if (g.parent && g.userId !== g.parent.userId) {
      console.warn(
        `⚠️ Found cross-user goal hierarchy: Goal "${g.title}" (user ${g.userId}) has parent "${g.parent.title}" (user ${g.parent.userId}). Unlinking parent.`
      );
      await prisma.goal.update({
        where: { id: g.id },
        data: { parentId: null },
      });
      repairedGoals++;
    }
  }

  // 2. Audit Task parent-subtask relationships
  const tasksWithParents = await prisma.task.findMany({
    where: { parentTaskId: { not: null } },
    select: {
      id: true,
      title: true,
      userId: true,
      parentTaskId: true,
      parentTask: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
    },
  });

  for (const t of tasksWithParents) {
    if (t.parentTask && t.userId !== t.parentTask.userId) {
      console.warn(
        `⚠️ Found cross-user task hierarchy: Task "${t.title}" (user ${t.userId}) has parent task "${t.parentTask.title}" (user ${t.parentTask.userId}). Unlinking parent task.`
      );
      await prisma.task.update({
        where: { id: t.id },
        data: { parentTaskId: null },
      });
      repairedTasks++;
    }
  }

  // 3. Audit GoalTask associations
  const goalTasks = await prisma.goalTask.findMany({
    select: {
      id: true,
      goalId: true,
      taskId: true,
      goal: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
      task: {
        select: {
          id: true,
          title: true,
          userId: true,
        },
      },
    },
  });

  const affectedGoalIds = new Set<string>();

  for (const gt of goalTasks) {
    if (gt.goal && gt.task && gt.goal.userId !== gt.task.userId) {
      console.warn(
        `⚠️ Found cross-user GoalTask link: Goal "${gt.goal.title}" (user ${gt.goal.userId}) linked to Task "${gt.task.title}" (user ${gt.task.userId}). Removing link.`
      );
      await prisma.goalTask.delete({
        where: { id: gt.id },
      });
      affectedGoalIds.add(gt.goalId);
      repairedGoalTasks++;
    }
  }

  // Recalculate progress for any affected goals
  for (const goalId of affectedGoalIds) {
    await prisma.$transaction(async (tx) => {
      await recalculateGoalProgress(goalId, tx);
    });
  }

  console.log('✅ Ownership audit and repair complete!');
  console.log(`Summary:
  - Repaired cross-user goals: ${repairedGoals}
  - Repaired cross-user tasks: ${repairedTasks}
  - Removed cross-user GoalTask links: ${repairedGoalTasks}
  - Recalculated affected goals: ${affectedGoalIds.size}`);

  return { repairedGoals, repairedTasks, repairedGoalTasks, affectedGoals: affectedGoalIds.size };
}

if (require.main === module) {
  auditAndRepairOwnership()
    .catch((err) => {
      console.error('❌ Failed to run ownership audit:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
