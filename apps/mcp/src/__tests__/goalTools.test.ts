import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGoalTools } from '../tools/goals';
import { GoalTrackerApiClient } from '../client/apiClient';
import { z } from 'zod';

describe('Goal Tools (list_goals status & scope filtering)', () => {
  let mockApiClient: jest.Mocked<GoalTrackerApiClient>;
  let tools: Map<string, any>;
  const originalWriteSetting = process.env.GOAL_TRACKER_ALLOW_WRITES;

  afterEach(() => {
    if (originalWriteSetting === undefined) delete process.env.GOAL_TRACKER_ALLOW_WRITES;
    else process.env.GOAL_TRACKER_ALLOW_WRITES = originalWriteSetting;
  });

  beforeEach(() => {
    process.env.GOAL_TRACKER_ALLOW_WRITES = 'true';
    tools = new Map();
    const fakeServer = {
      tool: jest.fn((name, description, schema, handler) => {
        tools.set(name, { description, schema, handler });
      }),
    } as unknown as McpServer;

    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      getProfile: jest.fn().mockReturnValue('development'),
    } as unknown as jest.Mocked<GoalTrackerApiClient>;

    registerGoalTools(fakeServer, mockApiClient);
  });

  it('should pass status=active and filter out completed goals', async () => {
    const listGoals = tools.get('list_goals');
    expect(listGoals).toBeDefined();

    mockApiClient.get.mockResolvedValueOnce([
      { id: 'g1', title: 'Active Goal', isMarkedComplete: false, scope: 'WEEKLY' },
      { id: 'g2', title: 'Completed Goal', isMarkedComplete: true, scope: 'WEEKLY' },
    ]);

    const result = await listGoals.handler({ status: 'active', scope: 'WEEKLY' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/goals', {
      status: 'active',
      scope: 'WEEKLY',
    });

    const text = result.content[0].text;
    expect(text).toContain('Active Goal');
    expect(text).not.toContain('Completed Goal');
    expect(text).toContain('1 found');
  });

  it('should pass status=completed and return only completed goals', async () => {
    const listGoals = tools.get('list_goals');

    mockApiClient.get.mockResolvedValueOnce([
      { id: 'g1', title: 'Active Goal', isMarkedComplete: false, scope: 'MONTHLY' },
      { id: 'g2', title: 'Completed Goal', isMarkedComplete: true, scope: 'MONTHLY' },
    ]);

    const result = await listGoals.handler({ status: 'completed', scope: 'MONTHLY' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/goals', {
      status: 'completed',
      scope: 'MONTHLY',
    });

    const text = result.content[0].text;
    expect(text).toContain('Completed Goal');
    expect(text).not.toContain('Active Goal');
    expect(text).toContain('1 found');
  });

  it('should pass status=all and retain both active and completed goals', async () => {
    const listGoals = tools.get('list_goals');

    mockApiClient.get.mockResolvedValueOnce([
      { id: 'g1', title: 'Active Goal', isMarkedComplete: false, scope: 'YEARLY' },
      { id: 'g2', title: 'Completed Goal', isMarkedComplete: true, scope: 'YEARLY' },
    ]);

    const result = await listGoals.handler({ status: 'all', scope: 'YEARLY' });
    expect(mockApiClient.get).toHaveBeenCalledWith('/api/goals', {
      status: 'all',
      scope: 'YEARLY',
    });

    const text = result.content[0].text;
    expect(text).toContain('Active Goal');
    expect(text).toContain('Completed Goal');
    expect(text).toContain('2 found');
  });

  it('forwards a fixed completed-subgoal target when updating a goal', async () => {
    const goalId = '00000000-0000-4000-8000-000000000001';
    mockApiClient.put.mockResolvedValueOnce({
      id: goalId,
      title: 'Read books',
      scope: 'YEARLY',
      currentValue: 8,
      targetValue: 12,
    });
    const tool = tools.get('update_goal');
    const args = z.object(tool.schema).parse({ goalId, progressMode: 'COMPLETED_SUBGOALS', targetValue: 12 });

    const response = await tool.handler(args);

    expect(mockApiClient.put).toHaveBeenCalledWith(`/api/goals/${goalId}`, {
      progressMode: 'COMPLETED_SUBGOALS',
      targetValue: 12,
    });
    expect(response.content[0].text).toContain('8/12');
  });

  it('create_goal should call POST /api/goals', async () => {
    const createGoal = tools.get('create_goal');
    expect(createGoal).toBeDefined();

    mockApiClient.post.mockResolvedValueOnce({
      id: 'g-new',
      title: 'New App Project',
      scope: 'YEARLY',
      targetValue: 3,
    });

    const res = await createGoal.handler({
      title: 'New App Project',
      scope: 'YEARLY',
      targetValue: 3,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/goals', {
      title: 'New App Project',
      scope: 'YEARLY',
      type: 'TOTAL_TARGET',
      targetValue: 3,
    });
    expect(res.content[0].text).toContain('New App Project');
  });

  it('complete_goal should call POST /api/goals/:id/complete', async () => {
    const completeGoal = tools.get('complete_goal');
    expect(completeGoal).toBeDefined();

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      updatedGoal: { id: 'g1', title: 'Audio Books' },
    });

    const res = await completeGoal.handler({
      goalId: 'g1',
      isCompleted: true,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/goals/g1/complete', {});
    expect(res.content[0].text).toContain('Audio Books');
    expect(res.content[0].text).toContain('marked completed');
  });

  it('create_goal should reject write when GOAL_TRACKER_ALLOW_WRITES is false or unset', async () => {
    delete process.env.GOAL_TRACKER_ALLOW_WRITES;
    const createGoal = tools.get('create_goal');
    expect(createGoal).toBeDefined();

    const res = await createGoal.handler({
      title: 'Blocked Goal',
    });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Write operations disabled in headless mode');
    expect(mockApiClient.post).not.toHaveBeenCalled();
  });

  it.each(['create_goal', 'update_goal', 'complete_goal'])(
    '%s blocks disabled writes before dispatch', async (name) => {
      for (const setting of [undefined, 'false', 'TRUE']) {
        if (setting === undefined) delete process.env.GOAL_TRACKER_ALLOW_WRITES;
        else process.env.GOAL_TRACKER_ALLOW_WRITES = setting;
        const result = await tools.get(name).handler({ goalId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944', title: 'Synthetic' });
        expect(result.isError).toBe(true);
        expect(mockApiClient.post).not.toHaveBeenCalled();
      }
    }
  );

  it('goal schemas accept supported domain values and reject unsupported scopes and types', () => {
    const createSchema = z.object(tools.get('create_goal').schema);
    expect(createSchema.safeParse({ title: 'Synthetic', scope: 'WEEKLY', type: 'TOTAL_TARGET' }).success).toBe(true);
    expect(createSchema.safeParse({ title: 'Synthetic', scope: 'DAILY' }).success).toBe(false);
    for (const type of ['BOOLEAN', 'COMPLETION_TARGET', 'HABIT']) {
      expect(createSchema.safeParse({ title: 'Synthetic', type }).success).toBe(false);
    }
    const updateSchema = z.object(tools.get('update_goal').schema);
    expect(updateSchema.safeParse({ goalId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944', scope: 'DAILY' }).success).toBe(false);
  });
});
