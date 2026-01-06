import { PrismaClient } from '@prisma/client';

/**
 * Result type for completion service operations
 */
export interface CompletionResult {
  success: boolean;
  message: string;
  updatedGoal?: any;
}

/**
 * Service for handling atomic and idempotent goal completion operations
 */
export class CompletionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Mark a goal as completed with idempotency and atomic parent updates
   */
  async completeGoal(goalId: string): Promise<CompletionResult> {
    return await this.prisma.$transaction(async (tx) => {
      // Fetch the goal with parent info
      const goal = await tx.goal.findUnique({
        where: { id: goalId },
        select: {
          id: true,
          title: true,
          parentId: true,
          progressMode: true,
          isMarkedComplete: true,
        },
      });

      if (!goal) {
        return {
          success: false,
          message: 'Goal not found',
        };
      }

      // Check if already completed (idempotency)
      if (goal.isMarkedComplete) {
        // No-op: already completed
        return {
          success: true,
          message: 'Goal was already marked as completed (no-op)',
          updatedGoal: goal,
        };
      }

      // Mark this goal as completed
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          isMarkedComplete: true,
        },
      });

      // If goal has a parent, update parent's progress atomically
      if (goal.parentId) {
        const parentGoal = await tx.goal.findUnique({
          where: { id: goal.parentId },
          select: {
            progressMode: true,
            title: true,
            currentValue: true,
          },
        });

        if (parentGoal) {
          // For TASK_BASED or HABIT mode parents, increment the progress
          if (
            parentGoal.progressMode === 'TASK_BASED' ||
            parentGoal.progressMode === 'HABIT'
          ) {
            // Increment parent's currentValue
            await tx.goal.update({
              where: { id: goal.parentId },
              data: {
                currentValue: {
                  increment: 1,
                },
              },
            });

            // Log activity in parent goal
            await tx.progress.create({
              data: {
                goalId: goal.parentId,
                value: 1,
                note: `Subgoal "${goal.title}" marked as completed`,
                date: new Date(),
              },
            });
          }
        }
      }

      return {
        success: true,
        message: 'Goal marked as completed',
        updatedGoal,
      };
    });
  }

  /**
   * Mark a goal as incomplete with idempotency and atomic parent updates
   */
  async uncompleteGoal(goalId: string): Promise<CompletionResult> {
    return await this.prisma.$transaction(async (tx) => {
      // Fetch the goal with parent info
      const goal = await tx.goal.findUnique({
        where: { id: goalId },
        select: {
          id: true,
          title: true,
          parentId: true,
          progressMode: true,
          isMarkedComplete: true,
        },
      });

      if (!goal) {
        return {
          success: false,
          message: 'Goal not found',
        };
      }

      // Check if already not completed (idempotency)
      if (!goal.isMarkedComplete) {
        // No-op: already not completed
        return {
          success: true,
          message: 'Goal was already marked as incomplete (no-op)',
          updatedGoal: goal,
        };
      }

      // Mark this goal as incomplete
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          isMarkedComplete: false,
        },
      });

      // If goal has a parent, update parent's progress atomically
      if (goal.parentId) {
        const parentGoal = await tx.goal.findUnique({
          where: { id: goal.parentId },
          select: {
            progressMode: true,
            title: true,
            currentValue: true,
          },
        });

        if (parentGoal) {
          // For TASK_BASED or HABIT mode parents, decrement the progress
          if (
            parentGoal.progressMode === 'TASK_BASED' ||
            parentGoal.progressMode === 'HABIT'
          ) {
            // Decrement parent's currentValue, but never go negative
            const newParentValue = Math.max(0, (parentGoal.currentValue || 0) - 1);

            await tx.goal.update({
              where: { id: goal.parentId },
              data: {
                currentValue: newParentValue,
              },
            });

            // Log activity in parent goal
            await tx.progress.create({
              data: {
                goalId: goal.parentId,
                value: -1,
                note: `Subgoal "${goal.title}" marked as incomplete`,
                date: new Date(),
              },
            });
          }
        }
      }

      return {
        success: true,
        message: 'Goal marked as incomplete',
        updatedGoal,
      };
    });
  }
}
