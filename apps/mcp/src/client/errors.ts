export class AuthRequiredError extends Error {
  public readonly profile: string;

  constructor(profile: string, message?: string) {
    super(
      message ||
        `Authentication required. Stored credentials for profile '${profile}' are missing or expired. Run 'pnpm --filter @goal-tracker/mcp login --profile ${profile}' in your terminal to authenticate.`
    );
    this.name = 'AuthRequiredError';
    this.profile = profile;
    Object.setPrototypeOf(this, AuthRequiredError.prototype);
  }
}

export class GoalTrackerApiError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;
  public readonly responseBody: any;

  constructor(statusCode: number, endpoint: string, responseBody: any, message?: string) {
    const errorDetail =
      typeof responseBody === 'object' && responseBody !== null
        ? responseBody.error || responseBody.message || JSON.stringify(responseBody)
        : String(responseBody);
    super(message || `Goal Tracker API error (${statusCode}) at ${endpoint}: ${errorDetail}`);
    this.name = 'GoalTrackerApiError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, GoalTrackerApiError.prototype);
  }
}

export class RedirectBlockedError extends Error {
  public readonly origin: string;
  public readonly redirectTarget?: string;

  constructor(origin: string, redirectTarget?: string) {
    super(
      `Redirect blocked: authenticated request to origin '${origin}' attempted to redirect${
        redirectTarget ? ` to '${redirectTarget}'` : ''
      }. Redirects on authenticated API routes are prohibited.`
    );
    this.name = 'RedirectBlockedError';
    this.origin = origin;
    this.redirectTarget = redirectTarget;
    Object.setPrototypeOf(this, RedirectBlockedError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
