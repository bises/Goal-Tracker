import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTaskTools } from '../tools/tasks';
import { GoalTrackerApiClient } from '../client/apiClient';

describe('Task Tools (v2 Write & Batch Tools)', () => {
  let mockApiClient: jest.Mocked<GoalTrackerApiClient>;
  let tools: Map<string, any>;

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
      delete: jest.fn(),
      getProfile: jest.fn().mockReturnValue('development'),
    } as unknown as jest.Mocked<GoalTrackerApiClient>;

    registerTaskTools(fakeServer, mockApiClient);
  });

  it('create_task should call POST /api/tasks and return success', async () => {
    const createTask = tools.get('create_task');
    expect(createTask).toBeDefined();

    mockApiClient.post.mockResolvedValueOnce({
      id: 'task-123',
      title: 'Read book chapter',
      priority: 'HIGH',
      scheduledDate: '2026-11-25T00:00:00.000Z',
    });

    const res = await createTask.handler({
      title: 'Read book chapter',
      priority: 'HIGH',
      scheduledDate: '2026-11-25',
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/tasks', {
      title: 'Read book chapter',
      priority: 'HIGH',
      scheduledDate: '2026-11-25',
    });
    expect(res.content[0].text).toContain('Read book chapter');
    expect(res.content[0].text).toContain('task-123');
  });

  it('set_task_completion should call POST /api/tasks/:id/set-completion', async () => {
    const setTask = tools.get('set_task_completion');
    expect(setTask).toBeDefined();

    mockApiClient.post.mockResolvedValueOnce({
      id: 'task-123',
      title: 'Test Task',
      isCompleted: true,
    });

    const res = await setTask.handler({
      taskId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
      isCompleted: true,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/tasks/b75cc3f2-53b1-4e1f-96a1-b5396c5be944/set-completion',
      { isCompleted: true }
    );
    expect(res.content[0].text).toContain('✓ Completed');
  });

  it('batch_set_task_completion should fall back to loop if batch endpoint returns 404', async () => {
    const batchTool = tools.get('batch_set_task_completion');
    expect(batchTool).toBeDefined();

    // Batch endpoint 404s
    mockApiClient.post
      .mockRejectedValueOnce({ status: 404, message: 'Not found' })
      .mockResolvedValueOnce({ id: 't1', title: 'Task 1', isCompleted: true })
      .mockResolvedValueOnce({ id: 't2', title: 'Task 2', isCompleted: true });

    const res = await batchTool.handler({
      taskIds: [
        'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
        '5ba6cfaa-a9e3-469c-ae36-b3e2ff884619',
      ],
      isCompleted: true,
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/api/tasks/batch-set-completion', {
      taskIds: [
        'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
        '5ba6cfaa-a9e3-469c-ae36-b3e2ff884619',
      ],
      isCompleted: true,
    });
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/tasks/b75cc3f2-53b1-4e1f-96a1-b5396c5be944/set-completion',
      { isCompleted: true }
    );
    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/api/tasks/5ba6cfaa-a9e3-469c-ae36-b3e2ff884619/set-completion',
      { isCompleted: true }
    );
    expect(res.content[0].text).toContain('Successfully completed 2 task(s)');
  });

  it('batch_set_task_completion should report partial batch failures with succeeded and failed IDs', async () => {
    const batchTool = tools.get('batch_set_task_completion');
    expect(batchTool).toBeDefined();

    mockApiClient.post
      .mockRejectedValueOnce({ status: 404, message: 'Batch route not found' }) // batch endpoint fallback
      .mockResolvedValueOnce({ id: 't1', title: 'Task 1', isCompleted: true }) // task 1 succeeds
      .mockRejectedValueOnce(new Error('Connection dropped on task 2')); // task 2 fails

    const res = await batchTool.handler({
      taskIds: [
        'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
        '5ba6cfaa-a9e3-469c-ae36-b3e2ff884619',
      ],
      isCompleted: true,
    });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Partial batch completion failure: 1 succeeded, 1 failed');
    expect(res.content[0].text).toContain('b75cc3f2-53b1-4e1f-96a1-b5396c5be944');
    expect(res.content[0].text).toContain('5ba6cfaa-a9e3-469c-ae36-b3e2ff884619');
  });

  it('list_tasks by goalId should apply date, status, and pagination filters', async () => {
    const listTasks = tools.get('list_tasks');
    expect(listTasks).toBeDefined();

    mockApiClient.get.mockResolvedValueOnce({
      id: 'g-1',
      title: 'Test Goal',
      goalTasks: [
        { task: { id: 't1', title: 'Task 1', isCompleted: false, scheduledDate: '2026-11-26T00:00:00.000Z' } },
        { task: { id: 't2', title: 'Task 2', isCompleted: false, scheduledDate: '2026-11-27T00:00:00.000Z' } },
        { task: { id: 't3', title: 'Task 3', isCompleted: true, scheduledDate: '2026-11-26T00:00:00.000Z' } },
        { task: { id: 't4', title: 'Task 4', isCompleted: false, scheduledDate: null } },
      ],
    });

    // Query for pending tasks scheduled for 2026-11-26, limit 1
    const res = await listTasks.handler({
      goalId: '11111111-1111-1111-1111-111111111111',
      status: 'pending',
      date: '2026-11-26',
      limit: 1,
      page: 1,
    });

    expect(res.content[0].text).toContain('Task 1');
    expect(res.content[0].text).not.toContain('Task 2');
    expect(res.content[0].text).not.toContain('Task 3');
    expect(res.content[0].text).not.toContain('Task 4');
    expect(res.content[0].text).toContain('1 displayed, page 1/1');
  });

  it('delete_task should require confirm: true', async () => {
    const deleteTool = tools.get('delete_task');
    expect(deleteTool).toBeDefined();

    const res = await deleteTool.handler({
      taskId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
      confirm: false,
    });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('confirm: true');
    expect(mockApiClient.delete).not.toHaveBeenCalled();
  });

  it('delete_task should reject write when GOAL_TRACKER_ALLOW_WRITES is false or unset even with confirm: true', async () => {
    delete process.env.GOAL_TRACKER_ALLOW_WRITES;
    const deleteTool = tools.get('delete_task');
    expect(deleteTool).toBeDefined();

    const res = await deleteTool.handler({
      taskId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
      confirm: true,
    });

    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('Write operations disabled in headless mode');
    expect(mockApiClient.delete).not.toHaveBeenCalled();
  });

  it('delete_task should call DELETE /api/tasks/:id when confirmed and writes allowed', async () => {
    const deleteTool = tools.get('delete_task');

    mockApiClient.delete.mockResolvedValueOnce({});

    const res = await deleteTool.handler({
      taskId: 'b75cc3f2-53b1-4e1f-96a1-b5396c5be944',
      confirm: true,
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith(
      '/api/tasks/b75cc3f2-53b1-4e1f-96a1-b5396c5be944'
    );
    expect(res.content[0].text).toContain('permanently deleted');
  });
});
