import type { Goal, PaginatedTasksResponse, Task } from '@goal-tracker/shared';
import { auth0Client } from './auth0';

// API URL - using Tailscale for cross-device access
const API_URL = 'https://jbhouse.tail6c5f41.ts.net:3001/api';

const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  try {
    // getCredentials auto-refreshes the access token via refresh token if expired
    const credentials = await auth0Client.credentialsManager.getCredentials();
    if (credentials?.accessToken) {
      headers['Authorization'] = `Bearer ${credentials.accessToken}`;
    }
  } catch (e) {
    console.error('[API] Failed to get credentials:', e);
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.error('[API] Request failed:', response.status, body);
      throw new Error(body.error ?? `Request failed with status ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('[API] Fetch error for', url, ':', error);
    throw error;
  }
};

// --- Goals API ---

export const goalsApi = {
  async fetchGoals(): Promise<Goal[]> {
    const res = await authenticatedFetch(`${API_URL}/goals`);
    const json = await res.json();
    // Backend returns goals directly as an array, not wrapped in {data: ...}
    return Array.isArray(json) ? json : json.data || [];
  },

  async getGoal(id: string): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json;
  },

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  },

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  },

  async deleteGoal(id: string): Promise<void> {
    await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async completeGoal(id: string): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
    });
    const json = await res.json();
    return json;
  },

  async updateProgress(id: string, value: number, note?: string): Promise<void> {
    await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}/progress`, {
      method: 'POST',
      body: JSON.stringify({ value, note }),
    });
  },
};

// --- Tasks API ---

export const tasksApi = {
  async fetchTasks(params?: Record<string, string>): Promise<PaginatedTasksResponse> {
    const query = params ? `?${new URLSearchParams(params)}` : '';
    const res = await authenticatedFetch(`${API_URL}/tasks${query}`);
    const json = await res.json();
    // Backend returns { tasks, pagination } directly when page/limit are provided
    return json;
  },

  async getTask(id: string): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json;
  },

  async createTask(data: Partial<Task> & { goalIds?: string[] }): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json;
  },

  async deleteTask(id: string): Promise<void> {
    await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async toggleComplete(id: string): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
    });
    const json = await res.json();
    // Backend returns the task directly, not wrapped in {data: ...}
    return json;
  },

  async getScheduledTasks(date: string): Promise<Task[]> {
    const res = await authenticatedFetch(`${API_URL}/tasks/scheduled/${encodeURIComponent(date)}`);
    const json = await res.json();
    // Backend returns tasks directly as an array, not wrapped in {data: ...}
    return Array.isArray(json) ? json : json.data || [];
  },

  async getUnscheduledTasks(): Promise<Task[]> {
    const res = await authenticatedFetch(`${API_URL}/tasks/unscheduled/list`);
    const json = await res.json();
    // Backend returns tasks directly as an array, not wrapped in {data: ...}
    return Array.isArray(json) ? json : json.data || [];
  },
};
