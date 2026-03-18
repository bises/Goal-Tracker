import type { Goal, PaginatedTasksResponse, Task } from '@goal-tracker/shared';

// TODO: Replace with actual API URL from environment/config
const API_URL = 'http://localhost:3001/api';

let getAccessToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenProvider = (provider: () => Promise<string | null>) => {
  getAccessToken = provider;
};

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

  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Failed to get auth token:', e);
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }

  return response;
};

// --- Goals API ---

export const goalsApi = {
  async fetchGoals(): Promise<Goal[]> {
    const res = await authenticatedFetch(`${API_URL}/goals`);
    const json = await res.json();
    return json.data;
  },

  async getGoal(id: string): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json.data;
  },

  async createGoal(data: Partial<Goal>): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
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
    return json.data;
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
    return json.data;
  },

  async getTask(id: string): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json.data;
  },

  async createTask(data: Partial<Task> & { goalIds?: string[] }): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
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
    return json.data;
  },

  async getScheduledTasks(date: string): Promise<Task[]> {
    const res = await authenticatedFetch(`${API_URL}/tasks/scheduled/${encodeURIComponent(date)}`);
    const json = await res.json();
    return json.data;
  },

  async getUnscheduledTasks(): Promise<Task[]> {
    const res = await authenticatedFetch(`${API_URL}/tasks/unscheduled/list`);
    const json = await res.json();
    return json.data;
  },
};
