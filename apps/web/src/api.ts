import { Goal, GoalTasksResponse, PaginatedTasksResponse, Progress, Task } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type TaskPayload = Partial<Task> & { goalIds?: string[] };

// Type for paginated activities response
interface PaginatedActivitiesResponse {
  activities: Progress[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Store the getAccessToken function to be set by the Auth0 context
let getAccessToken: (() => Promise<string>) | null = null;

export const setAuthTokenProvider = (provider: () => Promise<string>) => {
  getAccessToken = provider;
};

// Centralized response handler with error extraction
const handleResponse = async <T>(res: Response): Promise<T> => {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const error = await res.json();
        throw new Error(error.message || error.error || `Request failed: ${res.status}`);
      } catch (e) {
        // If JSON parsing fails, fall through to generic error
        if (e instanceof Error && e.message.includes('Request failed:')) {
          throw e;
        }
      }
    }
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
};

// Custom fetch wrapper with automatic auth header injection (HTTP Interceptor)
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Merge headers with auth token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Copy existing headers
  if (options.headers) {
    const existingHeaders = new Headers(options.headers);
    existingHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  }

  // Get Auth0 access token
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (e) {
      // Token retrieval failed - abort request
      throw new Error(`Failed to get auth token: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Make the request with injected headers
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export const api = {
  fetchGoals: async (): Promise<Goal[]> => {
    const res = await authenticatedFetch(`${API_URL}/goals`);
    const data = await handleResponse<Goal[]>(res);
    return Array.isArray(data) ? data : [];
  },

  getGoal: async (goalId: string): Promise<Goal> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}`);
    return handleResponse<Goal>(res);
  },

  createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
    const res = await authenticatedFetch(`${API_URL}/goals`, {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return handleResponse<Goal>(res);
  },

  updateGoal: async (goalId: string, updates: Partial<Goal>): Promise<Goal> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<Goal>(res);
  },

  updateProgress: async (
    goalId: string,
    value: number,
    note?: string,
    customData?: string
  ): Promise<{ success: boolean; progress: unknown }> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}/progress`, {
      method: 'POST',
      body: JSON.stringify({
        value,
        note,
        date: new Date().toISOString(),
        customData,
      }),
    });
    return handleResponse<{ success: boolean; progress: unknown }>(res);
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Failed to delete goal: ${res.status}`);
    }
  },

  // Hierarchy endpoints
  getGoalTree: async (): Promise<Goal[]> => {
    const res = await authenticatedFetch(`${API_URL}/goals/tree`);
    const data = await handleResponse<Goal[]>(res);
    return Array.isArray(data) ? data : [];
  },

  getGoalsByScope: async (scope: string): Promise<Goal[]> => {
    const res = await authenticatedFetch(`${API_URL}/goals/scope/${scope}`);
    const data = await handleResponse<Goal[]>(res);
    return Array.isArray(data) ? data : [];
  },

  bulkCreateTasks: async (
    parentId: string,
    tasks: Array<{ title: string; scheduledDate?: string; size?: number }>
  ): Promise<{ success: boolean; tasks: Task[] }> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${parentId}/bulk-tasks`, {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    });
    return handleResponse<{ success: boolean; tasks: Task[] }>(res);
  },

  completeGoal: async (goalId: string): Promise<Goal> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}/complete`, {
      method: 'POST',
    });
    return handleResponse<Goal>(res);
  },

  uncompleteGoal: async (goalId: string): Promise<Goal> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}/uncomplete`, {
      method: 'POST',
    });
    return handleResponse<Goal>(res);
  },

  getGoalTasks: async (goalId: string): Promise<GoalTasksResponse> => {
    const res = await authenticatedFetch(`${API_URL}/goals/${goalId}/tasks`);
    return handleResponse<GoalTasksResponse>(res);
  },

  getGoalActivities: async (
    goalId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedActivitiesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_URL}/goals/${goalId}/activities?${queryString}`
      : `${API_URL}/goals/${goalId}/activities`;
    const res = await authenticatedFetch(url);
    return handleResponse<PaginatedActivitiesResponse>(res);
  },
};

export type { PaginatedActivitiesResponse, PaginatedTasksResponse };

export const taskApi = {
  fetchTasks: async (params?: {
    status?: 'pending' | 'completed';
    page?: number;
    limit?: number;
    month?: string;
    date?: string;
    unscheduled?: boolean;
  }): Promise<Task[] | PaginatedTasksResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.month) queryParams.append('month', params.month);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.unscheduled) queryParams.append('unscheduled', 'true');

    const url = queryParams.toString()
      ? `${API_URL}/tasks?${queryParams.toString()}`
      : `${API_URL}/tasks`;

    const res = await authenticatedFetch(url);
    const data = await handleResponse<Task[] | PaginatedTasksResponse>(res);

    // Check if the response is paginated (has tasks and pagination properties)
    if (data && typeof data === 'object' && 'tasks' in data && 'pagination' in data) {
      // Return paginated response if pagination params were explicitly provided
      if (params?.page || params?.limit) {
        return data;
      }
      // If no pagination params provided, extract just the tasks array
      return data.tasks;
    }

    // Otherwise return array for backward compatibility
    return Array.isArray(data) ? data : [];
  },

  createTask: async (task: TaskPayload): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
    return handleResponse<Task>(res);
  },

  updateTask: async (id: string, updates: TaskPayload): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return handleResponse<Task>(res);
  },

  deleteTask: async (id: string, goalIds: string[] = []): Promise<void> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ goalIds }),
    });
    if (!res.ok) {
      throw new Error(`Failed to delete task: ${res.status}`);
    }
  },

  toggleComplete: async (id: string): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${id}/complete`, {
      method: 'POST',
    });
    return handleResponse<Task>(res);
  },

  getScheduledTasks: async (date: string): Promise<Task[]> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/scheduled/${date}`);
    return handleResponse<Task[]>(res);
  },

  getUnscheduledTasks: async (): Promise<Task[]> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/unscheduled/list`);
    return handleResponse<Task[]>(res);
  },

  linkGoal: async (taskId: string, goalId: string): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${taskId}/link-goal`, {
      method: 'POST',
      body: JSON.stringify({ goalId }),
    });
    return handleResponse<Task>(res);
  },

  unlinkGoal: async (taskId: string, goalId: string): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${taskId}/unlink-goal`, {
      method: 'POST',
      body: JSON.stringify({ goalId }),
    });
    return handleResponse<Task>(res);
  },

  scheduleTask: async (taskId: string, scheduledDate: string | null): Promise<Task> => {
    const res = await authenticatedFetch(`${API_URL}/tasks/${taskId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({ scheduledDate }),
    });
    const data = await handleResponse<{ task: Task }>(res);
    return data.task;
  },
};

export const calendarApi = {
  fetchCalendarTasks: async (
    startDate: string,
    endDate: string,
    includeUnscheduled = false,
    parentGoalId?: string
  ): Promise<Task[]> => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      includeUnscheduled: includeUnscheduled.toString(),
    });

    if (parentGoalId) {
      params.append('parentGoalId', parentGoalId);
    }

    const res = await authenticatedFetch(`${API_URL}/calendar/tasks?${params}`);
    return handleResponse<Task[]>(res);
  },

  fetchCalendarGoals: async (
    startDate: string,
    endDate: string,
    scope?: string
  ): Promise<Goal[]> => {
    const params = new URLSearchParams({ startDate, endDate });

    if (scope) {
      params.append('scope', scope);
    }

    const res = await authenticatedFetch(`${API_URL}/calendar/goals?${params}`);
    return handleResponse<Goal[]>(res);
  },
};
