import { ProfileConfig } from '../config';
import { TokenManager } from '../auth/tokenManager';
import { GoalTrackerApiError, RedirectBlockedError } from './errors';

export interface RequestOptions {
  method?: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: any;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export class GoalTrackerApiClient {
  private config: ProfileConfig;
  private tokenManager: TokenManager;

  constructor(config: ProfileConfig, tokenManager: TokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
  }

  public async get<T>(endpoint: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', query });
  }

  public async post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  public async put<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const baseUrl = this.config.apiUrl.replace(/\/+$/, '');
    const url = new URL(`${baseUrl}${cleanEndpoint}`);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...options.headers,
    };

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const timeoutMs = options.timeoutMs || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Use redirect: 'manual' to explicitly intercept and prohibit redirects on authenticated endpoints
      const res = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        redirect: 'manual',
      });

      // Intercept redirects (301, 302, 307, 308)
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location') || undefined;
        throw new RedirectBlockedError(this.config.apiUrl, location);
      }

      if (!res.ok) {
        let errorBody: any = null;
        try {
          errorBody = await res.json();
        } catch {
          try {
            errorBody = await res.text();
          } catch {
            errorBody = res.statusText;
          }
        }
        throw new GoalTrackerApiError(res.status, endpoint, errorBody);
      }

      // 204 No Content
      if (res.status === 204) {
        return {} as T;
      }

      const data = await res.json();
      return data as T;
    } catch (err: any) {
      if (err instanceof RedirectBlockedError || err instanceof GoalTrackerApiError) {
        throw err;
      }
      if (err.name === 'AbortError') {
        throw new Error(`Goal Tracker API request to ${endpoint} timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public getProfile(): string {
    return this.config.profile;
  }

  public getApiUrl(): string {
    return this.config.apiUrl;
  }
}
