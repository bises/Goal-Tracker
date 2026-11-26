import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerGoalTools } from '../tools/goals';
import { GoalTrackerApiClient } from '../client/apiClient';

describe('Goal Tools (list_goals status & scope filtering)', () => {
  let mockApiClient: jest.Mocked<GoalTrackerApiClient>;
  let tools: Map<string, any>;

  beforeEach(() => {
    tools = new Map();
    const fakeServer = {
      tool: jest.fn((name, description, schema, handler) => {
        tools.set(name, { description, schema, handler });
      }),
    } as unknown as McpServer;

    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
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
});
