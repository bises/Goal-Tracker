import { Prisma, Task } from '@prisma/client';

// Serialize changes to the same goal without blocking the foreign-key checks for new subgoals.
export async function lockGoalProgress(
  goalId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Goal" WHERE id = ${goalId} FOR NO KEY UPDATE`;
}

/**
 * Atomically recalculates a goal's progress (currentValue & targetValue)
 * based on actual linked tasks and/or child goals.
 *
 * Guarantees:
 * 1. Automatic goal progress does not exceed its derived target
 * 2. Deduplicates tasks across parent and child goals
 * 3. Recursively updates parent goal if present
 */
export async function recalculateGoalProgress(
  goalId: string,
  tx: Prisma.TransactionClient,
  visitedGoalIds: Set<string> = new Set<string>()
): Promise<void> {
  if (!goalId || visitedGoalIds.has(goalId)) {
    return; // Prevent infinite loops in circular references
  }
  visitedGoalIds.add(goalId);

  // Lock before reading children so concurrent changes cannot publish stale totals.
  await lockGoalProgress(goalId, tx);

  // Fetch goal with direct tasks and children (including children's tasks)
  const goal = await tx.goal.findUnique({
    where: { id: goalId },
    include: {
      goalTasks: {
        include: {
          task: true,
        },
      },
      children: {
        include: {
          goalTasks: {
            include: {
              task: true,
            },
          },
        },
      },
    },
  });

  if (!goal) return;

  if (goal.progressMode === 'COMPLETED_SUBGOALS') {
    const currentValue = await tx.goal.count({
      where: { parentId: goalId, isMarkedComplete: true, userId: goal.userId },
    });
    await tx.goal.update({
      where: { id: goalId },
      data: {
        currentValue,
        ...(currentValue < (goal.targetValue ?? Infinity) ? { isMarkedComplete: false } : {}),
      },
    });
    if (goal.parentId) {
      await recalculateGoalProgress(goal.parentId, tx, visitedGoalIds);
    }
    return;
  }

  // Deduplicate tasks by task.id
  const taskMap = new Map<string, Task>();
  for (const gt of goal.goalTasks || []) {
    if (gt?.task?.id) {
      taskMap.set(gt.task.id, gt.task);
    }
  }

  // Also include tasks from children
  for (const child of goal.children || []) {
    for (const gt of child.goalTasks || []) {
      if (gt?.task?.id) {
        taskMap.set(gt.task.id, gt.task);
      }
    }
  }

  const uniqueTasks = Array.from(taskMap.values());

  if (uniqueTasks.length > 0) {
    const totalCount = uniqueTasks.length;
    const completedCount = uniqueTasks.filter((t) => t.isCompleted).length;

    await tx.goal.update({
      where: { id: goalId },
      data: {
        targetValue: totalCount,
        currentValue: completedCount,
      },
    });
  } else if ((goal.children || []).length > 0) {
    // If no tasks exist anywhere in hierarchy, progress is derived from completed sub-goals
    const totalCount = goal.children.length;
    const completedCount = goal.children.filter((c) => c.isMarkedComplete).length;

    await tx.goal.update({
      where: { id: goalId },
      data: {
        targetValue: totalCount,
        currentValue: completedCount,
      },
    });
  }

  // If this goal has a parent, also recalculate the parent goal's progress
  if (goal.parentId) {
    await recalculateGoalProgress(goal.parentId, tx, visitedGoalIds);
  }
}
