import { Goal, GoalTasksResponse, Task } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type TaskPayload = Partial<Task> & { goalIds?: string[] };

export const api = {
  fetchGoals: async (): Promise<Goal[]> => {
    const res = await fetch(`${API_URL}/goals`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getGoal: async (goalId: string): Promise<Goal> => {
    const res = await fetch(`${API_URL}/goals/${goalId}`);
    return res.json();
  },

  createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
    const res = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    return res.json();
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
    const res = await fetch(`${API_URL}/goals/${goalId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  updateProgress: async (goalId: string, value: number, note?: string, customData?: string) => {
    const res = await fetch(`${API_URL}/goals/${goalId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        value,
        note,
        date: new Date().toISOString(),
        customData,
      }),
    });
    return res.json();
  },

  deleteGoal: async (goalId: string) => {
    await fetch(`${API_URL}/goals/${goalId}`, {
      method: 'DELETE',
    });
  },

  // Hierarchy endpoints
  getGoalTree: async () => {
    const res = await fetch(`${API_URL}/goals/tree`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  getGoalsByScope: async (scope: string) => {
    const res = await fetch(`${API_URL}/goals/scope/${scope}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  bulkCreateTasks: async (
    parentId: string,
    tasks: Array<{ title: string; scheduledDate?: string; size?: number }>
  ) => {
    const res = await fetch(`${API_URL}/goals/${parentId}/bulk-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks }),
    });
    return res.json();
  },

  completeGoal: async (goalId: string) => {
    const res = await fetch(`${API_URL}/goals/${goalId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  uncompleteGoal: async (goalId: string) => {
    const res = await fetch(`${API_URL}/goals/${goalId}/uncomplete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  getGoalTasks: async (goalId: string): Promise<GoalTasksResponse> => {
    const res = await fetch(`${API_URL}/goals/${goalId}/tasks`);
    return res.json();
  },

  getGoalActivities: async (goalId: string) => {
    const res = await fetch(`${API_URL}/goals/${goalId}/activities`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },
};

export const taskApi = {
  fetchTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  createTask: async (task: TaskPayload): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return res.json();
  },

  updateTask: async (id: string, updates: TaskPayload): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  deleteTask: async (id: string, goalIds: string[] = []) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalIds }),
    });
  },

  toggleComplete: async (id: string): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },

  getScheduledTasks: async (date: string): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks/scheduled/${date}`);
    return res.json();
  },

  getUnscheduledTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${API_URL}/tasks/unscheduled/list`);
    return res.json();
  },

  linkGoal: async (taskId: string, goalId: string): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${taskId}/link-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId }),
    });
    return res.json();
  },

  unlinkGoal: async (taskId: string, goalId: string): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${taskId}/unlink-goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalId }),
    });
    return res.json();
  },

  scheduleTask: async (taskId: string, scheduledDate: string | null): Promise<Task> => {
    const res = await fetch(`${API_URL}/tasks/${taskId}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledDate }),
    });
    const data = await res.json();
    return data.task;
  },
};

export const calendarApi = {
  fetchCalendarTasks: async (
    startDate: string,
    endDate: string,
    includeUnscheduled = false,
    parentGoalId?: string
  ) => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeUnscheduled: includeUnscheduled.toString(),
    });

    if (parentGoalId) {
      params.append('parentGoalId', parentGoalId);
    }

    const res = await fetch(`${API_URL}/calendar/tasks?${params}`);
    return res.json();
  },

  fetchCalendarGoals: async (startDate: string, endDate: string, scope?: string) => {
    const params = new URLSearchParams({ startDate, endDate });

    if (scope) {
      params.append('scope', scope);
    }

    const res = await fetch(`${API_URL}/calendar/goals?${params}`);
    return res.json();
  },
};
