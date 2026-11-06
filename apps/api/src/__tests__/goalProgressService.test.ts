import { recalculateGoalProgress } from '../services/goalProgressService';

describe('recalculateGoalProgress', () => {
  let mockTx: any;

  beforeEach(() => {
    mockTx = {
      goal: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
  });

  it('correctly calculates total and completed tasks without exceeding targetValue', async () => {
    const goalId = 'goal-1';
    const mockGoal = {
      id: goalId,
      parentId: null,
      goalTasks: [
        { task: { id: 'task-1', isCompleted: true, size: 2 } },
        { task: { id: 'task-2', isCompleted: true, size: 3 } },
        { task: { id: 'task-3', isCompleted: false, size: 1 } },
      ],
      children: [],
    };

    mockTx.goal.findUnique.mockResolvedValue(mockGoal);

    await recalculateGoalProgress(goalId, mockTx);

    expect(mockTx.goal.update).toHaveBeenCalledWith({
      where: { id: goalId },
      data: {
        targetValue: 3,
        currentValue: 2,
      },
    });
  });

  it('deduplicates tasks shared between parent goal and child goal (prevents Issue #14 bug)', async () => {
    const parentGoalId = 'parent-goal-1';
    // Shared task-1 is linked to BOTH parent and child
    const sharedTask = { id: 'task-1', isCompleted: true, size: 1 };
    const task2 = { id: 'task-2', isCompleted: true, size: 1 };
    const task3 = { id: 'task-3', isCompleted: false, size: 1 };

    const mockParentGoal = {
      id: parentGoalId,
      parentId: null,
      goalTasks: [{ task: sharedTask }],
      children: [
        {
          id: 'child-goal-1',
          goalTasks: [
            { task: sharedTask }, // duplicate reference
            { task: task2 },
            { task: task3 },
          ],
        },
      ],
    };

    mockTx.goal.findUnique.mockResolvedValue(mockParentGoal);

    await recalculateGoalProgress(parentGoalId, mockTx);

    // There are only 3 unique tasks (task-1, task-2, task-3), 2 completed.
    // Without deduplication, completed would have been 3, total 4.
    expect(mockTx.goal.update).toHaveBeenCalledWith({
      where: { id: parentGoalId },
      data: {
        targetValue: 3,
        currentValue: 2,
      },
    });
  });

  it('recursively updates parent goal when child goal is updated', async () => {
    const childGoalId = 'child-goal-1';
    const parentGoalId = 'parent-goal-1';

    const mockChildGoal = {
      id: childGoalId,
      parentId: parentGoalId,
      goalTasks: [{ task: { id: 'task-1', isCompleted: true, size: 1 } }],
      children: [],
    };

    const mockParentGoal = {
      id: parentGoalId,
      parentId: null,
      goalTasks: [],
      children: [
        {
          id: childGoalId,
          goalTasks: [{ task: { id: 'task-1', isCompleted: true, size: 1 } }],
        },
      ],
    };

    mockTx.goal.findUnique
      .mockResolvedValueOnce(mockChildGoal)
      .mockResolvedValueOnce(mockParentGoal);

    await recalculateGoalProgress(childGoalId, mockTx);

    expect(mockTx.goal.update).toHaveBeenCalledTimes(2);
    expect(mockTx.goal.update).toHaveBeenNthCalledWith(1, {
      where: { id: childGoalId },
      data: { targetValue: 1, currentValue: 1 },
    });
    expect(mockTx.goal.update).toHaveBeenNthCalledWith(2, {
      where: { id: parentGoalId },
      data: { targetValue: 1, currentValue: 1 },
    });
  });

  it('derives progress from child goals if no tasks exist anywhere in hierarchy', async () => {
    const parentGoalId = 'parent-goal-1';
    const mockParentGoal = {
      id: parentGoalId,
      parentId: null,
      goalTasks: [],
      children: [
        { id: 'child-1', isMarkedComplete: true, goalTasks: [] },
        { id: 'child-2', isMarkedComplete: false, goalTasks: [] },
        { id: 'child-3', isMarkedComplete: true, goalTasks: [] },
      ],
    };

    mockTx.goal.findUnique.mockResolvedValue(mockParentGoal);

    await recalculateGoalProgress(parentGoalId, mockTx);

    expect(mockTx.goal.update).toHaveBeenCalledWith({
      where: { id: parentGoalId },
      data: {
        targetValue: 3,
        currentValue: 2,
      },
    });
  });
});
