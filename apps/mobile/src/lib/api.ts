import type { Goal, Task } from "@goal-tracker/shared";

// TODO: Replace with actual API URL from environment/config
const API_URL = "http://localhost:3001/api";

let getAccessToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenProvider = (
  provider: () => Promise<string | null>
) => {
  getAccessToken = provider;
};

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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
        headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to get auth token:", e);
    }
  }

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      body.error ?? `Request failed with status ${response.status}`
    );
  }

  return response;
};

export const api = {
  // Goals
  async getGoals(): Promise<Goal[]> {
    const res = await authenticatedFetch(`${API_URL}/goals`);
    const json = await res.json();
    return json.data;
  },

  async getGoal(id: string): Promise<Goal> {
    const res = await authenticatedFetch(`${API_URL}/goals/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json.data;
  },

  // Tasks
  async getTasks(params?: Record<string, string>): Promise<Task[]> {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    const res = await authenticatedFetch(`${API_URL}/tasks${query}`);
    const json = await res.json();
    return json.data;
  },

  async getTask(id: string): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`);
    const json = await res.json();
    return json.data;
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await authenticatedFetch(`${API_URL}/tasks/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.data;
  },
};
