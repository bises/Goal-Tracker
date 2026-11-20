#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config.ts
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
import_dotenv.default.config({ path: import_path.default.resolve(__dirname, "../.env") });
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), "apps/mcp/.env") });
if (process.env.GOAL_TRACKER_ALLOW_INSECURE_TLS === "true") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}
var V1_READ_SCOPES = "openid profile email offline_access read:goals read:tasks read:calendar";
function getProfileConfig(profileArg) {
  const profileName = (profileArg || process.env.GOAL_TRACKER_PROFILE || "production").toLowerCase();
  if (profileName !== "development" && profileName !== "production") {
    throw new Error(
      `Invalid profile: '${profileName}'. Allowed profiles are 'development' or 'production'.`
    );
  }
  const baseDir = import_path.default.join(import_os.default.homedir(), ".goal-tracker");
  const credentialsPath = import_path.default.join(baseDir, `auth-${profileName}.json`);
  const lockPath = import_path.default.join(baseDir, `auth-${profileName}.lock`);
  if (profileName === "development") {
    const apiUrl2 = process.env.GOAL_TRACKER_DEV_API_URL || process.env.GOAL_TRACKER_API_URL || "http://localhost:3000";
    return {
      profile: "development",
      apiUrl: apiUrl2,
      auth0Domain: process.env.AUTH0_DOMAIN || "bises.auth0.com",
      auth0ClientId: process.env.AUTH0_DEV_CLIENT_ID || "DEDICATED_DEV_CLIENT_ID",
      auth0Audience: process.env.AUTH0_DEV_AUDIENCE || "https://goal-tracker-api-dev",
      auth0Scopes: V1_READ_SCOPES,
      baseDir,
      credentialsPath,
      lockPath
    };
  }
  const apiUrl = process.env.GOAL_TRACKER_PROD_API_URL || process.env.GOAL_TRACKER_API_URL || "https://jbhouse.tail6c5f41.ts.net:3001";
  if (!apiUrl.startsWith("https://") && process.env.NODE_ENV !== "test" && !process.env.GOAL_TRACKER_INSECURE_TEST) {
    throw new Error(
      `Transport security violation: Production profile API URL must use HTTPS (received '${apiUrl}'). Plain HTTP is prohibited for production.`
    );
  }
  return {
    profile: "production",
    apiUrl,
    auth0Domain: process.env.AUTH0_DOMAIN || "bises.auth0.com",
    auth0ClientId: process.env.AUTH0_CLIENT_ID || "DEDICATED_PROD_CLIENT_ID",
    auth0Audience: process.env.AUTH0_AUDIENCE || "https://goal-tracker-api",
    auth0Scopes: V1_READ_SCOPES,
    baseDir,
    credentialsPath,
    lockPath
  };
}

// src/server.ts
var import_mcp = require("@modelcontextprotocol/sdk/server/mcp.js");
var import_stdio = require("@modelcontextprotocol/sdk/server/stdio.js");

// src/auth/tokenManager.ts
var import_fs2 = __toESM(require("fs"));
var import_path3 = __toESM(require("path"));

// src/auth/tokenStore.ts
var import_fs = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var import_os2 = __toESM(require("os"));
var import_child_process = require("child_process");
var TokenStore = class {
  /**
   * Ensure directory exists with restricted permissions (0700 on POSIX).
   */
  static ensureDirectory(dirPath) {
    if (!import_fs.default.existsSync(dirPath)) {
      import_fs.default.mkdirSync(dirPath, { recursive: true, mode: 448 });
      this.restrictPermissions(dirPath, true);
    }
  }
  /**
   * Apply filesystem permission restrictions (0600/0700 on POSIX, icacls on Windows).
   */
  static restrictPermissions(filePath, isDirectory = false) {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    try {
      if (process.platform === "win32") {
        const username = import_os2.default.userInfo().username;
        if (username) {
          const perm = isDirectory ? `${username}:(OI)(CI)F` : `${username}:F`;
          (0, import_child_process.execFileSync)("icacls", [filePath, "/inheritance:r", "/grant:r", perm], {
            stdio: "ignore",
            windowsHide: true
          });
        }
      } else {
        import_fs.default.chmodSync(filePath, isDirectory ? 448 : 384);
      }
    } catch {
    }
  }
  /**
   * Read stored tokens from disk. Returns null if file does not exist or is invalid.
   */
  static readTokens(credentialsPath) {
    if (!import_fs.default.existsSync(credentialsPath)) {
      return null;
    }
    try {
      const raw = import_fs.default.readFileSync(credentialsPath, "utf8");
      if (!raw || raw.trim().length === 0) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  /**
   * Atomically write tokens to disk using PID-tagged temporary file replacement.
   */
  static writeTokens(credentialsPath, tokens) {
    const dir = import_path2.default.dirname(credentialsPath);
    this.ensureDirectory(dir);
    const tmpPath = `${credentialsPath}.tmp.${process.pid}.${Date.now()}`;
    const payload = JSON.stringify(tokens, null, 2);
    import_fs.default.writeFileSync(tmpPath, payload, { mode: 384, encoding: "utf8" });
    try {
      import_fs.default.renameSync(tmpPath, credentialsPath);
    } catch (err) {
      if (process.platform === "win32") {
        try {
          if (import_fs.default.existsSync(credentialsPath)) {
            import_fs.default.unlinkSync(credentialsPath);
          }
          import_fs.default.renameSync(tmpPath, credentialsPath);
        } catch {
          import_fs.default.copyFileSync(tmpPath, credentialsPath);
          if (import_fs.default.existsSync(tmpPath)) {
            import_fs.default.unlinkSync(tmpPath);
          }
        }
      } else {
        throw err;
      }
    }
    this.restrictPermissions(credentialsPath, false);
  }
  /**
   * Delete credentials file if it exists.
   */
  static clearTokens(credentialsPath) {
    try {
      if (import_fs.default.existsSync(credentialsPath)) {
        import_fs.default.unlinkSync(credentialsPath);
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }
};

// src/client/errors.ts
var AuthRequiredError = class _AuthRequiredError extends Error {
  constructor(profile, message) {
    super(
      message || `Authentication required. Stored credentials for profile '${profile}' are missing or expired. Run 'pnpm --filter @goal-tracker/mcp login --profile ${profile}' in your terminal to authenticate.`
    );
    this.name = "AuthRequiredError";
    this.profile = profile;
    Object.setPrototypeOf(this, _AuthRequiredError.prototype);
  }
};
var GoalTrackerApiError = class _GoalTrackerApiError extends Error {
  constructor(statusCode, endpoint, responseBody, message) {
    const errorDetail = typeof responseBody === "object" && responseBody !== null ? responseBody.error || responseBody.message || JSON.stringify(responseBody) : String(responseBody);
    super(message || `Goal Tracker API error (${statusCode}) at ${endpoint}: ${errorDetail}`);
    this.name = "GoalTrackerApiError";
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseBody = responseBody;
    Object.setPrototypeOf(this, _GoalTrackerApiError.prototype);
  }
};
var RedirectBlockedError = class _RedirectBlockedError extends Error {
  constructor(origin, redirectTarget) {
    super(
      `Redirect blocked: authenticated request to origin '${origin}' attempted to redirect${redirectTarget ? ` to '${redirectTarget}'` : ""}. Redirects on authenticated API routes are prohibited.`
    );
    this.name = "RedirectBlockedError";
    this.origin = origin;
    this.redirectTarget = redirectTarget;
    Object.setPrototypeOf(this, _RedirectBlockedError.prototype);
  }
};

// src/auth/tokenManager.ts
var TokenManager = class {
  constructor(config) {
    this.cachedTokens = null;
    this.config = config;
  }
  /**
   * Acquire exclusive file lock using atomic 'wx' flag with stale-lock detection and exponential jitter.
   */
  async acquireLock(timeoutMs = 1e4) {
    const lockPath = this.config.lockPath;
    const startTime = Date.now();
    TokenStore.ensureDirectory(import_path3.default.dirname(lockPath));
    while (Date.now() - startTime < timeoutMs) {
      try {
        const fd = import_fs2.default.openSync(lockPath, "wx");
        const lockPayload = JSON.stringify({
          pid: process.pid,
          timestamp: Date.now()
        });
        import_fs2.default.writeFileSync(fd, lockPayload, "utf8");
        return { fd, path: lockPath };
      } catch (err) {
        if (err.code === "EEXIST") {
          this.checkAndRecoverStaleLock(lockPath);
          const delay = 80 + Math.floor(Math.random() * 70);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw err;
        }
      }
    }
    throw new Error(
      `Timeout acquiring lock for profile '${this.config.profile}' after ${timeoutMs}ms.`
    );
  }
  /**
   * Stale lock recovery: breaks lock if PID is dead or timestamp is older than 30s.
   */
  checkAndRecoverStaleLock(lockPath) {
    try {
      if (!import_fs2.default.existsSync(lockPath)) return;
      const content = import_fs2.default.readFileSync(lockPath, "utf8");
      const data = JSON.parse(content);
      const ageMs = Date.now() - (data.timestamp || 0);
      let isDead = false;
      if (data.pid) {
        try {
          process.kill(data.pid, 0);
        } catch (e) {
          if (e.code === "ESRCH") {
            isDead = true;
          }
        }
      }
      if (ageMs > 15e3 && isDead || ageMs > 3e4) {
        console.error(
          `[MCP:auth] Stale lock detected (pid: ${data.pid}, age: ${Math.round(
            ageMs / 1e3
          )}s). Recovering...`
        );
        import_fs2.default.unlinkSync(lockPath);
      }
    } catch {
    }
  }
  /**
   * Release exclusive lock safely.
   */
  releaseLock(lock) {
    try {
      import_fs2.default.closeSync(lock.fd);
    } catch {
    }
    try {
      if (import_fs2.default.existsSync(lock.path)) {
        import_fs2.default.unlinkSync(lock.path);
      }
    } catch {
    }
  }
  /**
   * Check if a token record is valid (not expired, with 60-second safety margin).
   */
  isTokenFresh(tokens) {
    if (!tokens || !tokens.accessToken || !tokens.expiresAt) return false;
    return Date.now() < tokens.expiresAt - 6e4;
  }
  /**
   * Retrieve a valid access token. Handles in-memory cache, in-lock re-read, and Auth0 refresh rotation.
   */
  async getValidAccessToken() {
    if (this.isTokenFresh(this.cachedTokens)) {
      return this.cachedTokens.accessToken;
    }
    const lock = await this.acquireLock();
    try {
      const diskTokens = TokenStore.readTokens(this.config.credentialsPath);
      if (this.isTokenFresh(diskTokens)) {
        this.cachedTokens = diskTokens;
        return diskTokens.accessToken;
      }
      if (!diskTokens || !diskTokens.refreshToken) {
        this.cachedTokens = null;
        throw new AuthRequiredError(this.config.profile);
      }
      const newTokens = await this.refreshTokensWithAuth0(diskTokens.refreshToken);
      TokenStore.writeTokens(this.config.credentialsPath, newTokens);
      this.cachedTokens = newTokens;
      return newTokens.accessToken;
    } finally {
      this.releaseLock(lock);
    }
  }
  /**
   * Exchange refresh token with Auth0 Token endpoint.
   */
  async refreshTokensWithAuth0(refreshToken) {
    const tokenEndpoint = `https://${this.config.auth0Domain}/oauth/token`;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.auth0ClientId,
      refresh_token: refreshToken
    });
    let res;
    try {
      res = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        redirect: "error"
      });
    } catch (err) {
      throw new Error(`Network failure during Auth0 token refresh: ${err.message}`);
    }
    if (!res.ok) {
      let errPayload = {};
      try {
        errPayload = await res.json();
      } catch {
      }
      if (res.status === 400 || errPayload.error === "invalid_grant") {
        TokenStore.clearTokens(this.config.credentialsPath);
        this.cachedTokens = null;
        throw new AuthRequiredError(
          this.config.profile,
          `Auth0 refresh token revoked or expired (${errPayload.error_description || errPayload.error || "invalid_grant"}). Please re-authenticate.`
        );
      }
      throw new Error(
        `Auth0 token refresh failed (${res.status}): ${errPayload.error_description || errPayload.error || res.statusText}`
      );
    }
    const data = await res.json();
    const newTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      // Preserve if not rotated
      expiresAt: Date.now() + data.expires_in * 1e3,
      scope: data.scope || this.config.auth0Scopes,
      tokenType: data.token_type || "Bearer",
      updatedAt: Date.now()
    };
    return newTokens;
  }
  /**
   * Save initial tokens (invoked by Device Code flow upon login).
   */
  async saveTokens(tokens) {
    const lock = await this.acquireLock();
    try {
      TokenStore.writeTokens(this.config.credentialsPath, tokens);
      this.cachedTokens = tokens;
    } finally {
      this.releaseLock(lock);
    }
  }
  /**
   * Perform logout: deletes disk credentials and purges in-memory cache under mutex.
   */
  async logout() {
    const lock = await this.acquireLock();
    try {
      TokenStore.clearTokens(this.config.credentialsPath);
      this.cachedTokens = null;
    } finally {
      this.releaseLock(lock);
    }
  }
  /**
   * Get cached or stored tokens without refresh (for status inspection).
   */
  getStoredTokens() {
    if (this.cachedTokens) return this.cachedTokens;
    this.cachedTokens = TokenStore.readTokens(this.config.credentialsPath);
    return this.cachedTokens;
  }
};

// src/client/apiClient.ts
var GoalTrackerApiClient = class {
  constructor(config, tokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
  }
  async get(endpoint, query) {
    return this.request(endpoint, { method: "GET", query });
  }
  async post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body });
  }
  async put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body });
  }
  async request(endpoint, options = {}) {
    const accessToken = await this.tokenManager.getValidAccessToken();
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const baseUrl = this.config.apiUrl.replace(/\/+$/, "");
    const url = new URL(`${baseUrl}${cleanEndpoint}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== void 0 && value !== null) {
          url.searchParams.append(key, String(value));
        }
      }
    }
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...options.headers
    };
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const timeoutMs = options.timeoutMs || 1e4;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url.toString(), {
        method: options.method || "GET",
        headers,
        body: options.body ? JSON.stringify(options.body) : void 0,
        signal: controller.signal,
        redirect: "manual"
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location") || void 0;
        throw new RedirectBlockedError(this.config.apiUrl, location);
      }
      if (!res.ok) {
        let errorBody = null;
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
      if (res.status === 204) {
        return {};
      }
      const data = await res.json();
      return data;
    } catch (err) {
      if (err instanceof RedirectBlockedError || err instanceof GoalTrackerApiError) {
        throw err;
      }
      if (err.name === "AbortError") {
        throw new Error(`Goal Tracker API request to ${endpoint} timed out after ${timeoutMs}ms.`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }
  getProfile() {
    return this.config.profile;
  }
  getApiUrl() {
    return this.config.apiUrl;
  }
};

// src/tools/goals.ts
var import_zod = require("zod");

// src/tools/sanitize.ts
function sanitizeString(input) {
  if (typeof input !== "string") {
    return input === null || input === void 0 ? "" : String(input);
  }
  let sanitized = input.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, "");
  sanitized = sanitized.replace(/<\|system\|>/gi, "\\<|system|\\>").replace(/<\|user\|>/gi, "\\<|user|\\>").replace(/<\|assistant\|>/gi, "\\<|assistant|\\>").replace(/\[INST\]/gi, "\\[INST\\]").replace(/\[\/INST\]/gi, "\\[/INST\\]").replace(/<\/system>/gi, "\\<\\/system\\>").replace(/<system>/gi, "\\<system\\>");
  return sanitized;
}
function formatErrorResult(err, profile) {
  let message = err?.message || "An unknown error occurred";
  if (err?.cause?.message) {
    message = `${message}: ${err.cause.message}`;
  }
  if (err?.name === "AuthRequiredError") {
    message = `Authentication required. Stored credentials for profile '${profile}' are missing or expired. Run 'pnpm mcp:login --profile ${profile}' in your terminal to authenticate.`;
  }
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: sanitizeString(message)
      }
    ]
  };
}
function formatSuccessResult(text) {
  return {
    content: [
      {
        type: "text",
        text: sanitizeString(text)
      }
    ]
  };
}

// src/tools/goals.ts
function registerGoalTools(server, apiClient) {
  server.tool(
    "list_goals",
    "List active goals with hierarchical structure, scope, and progress metrics",
    {
      scope: import_zod.z.enum(["YEARLY", "MONTHLY", "WEEKLY", "STANDALONE"]).optional().describe("Filter by goal scope"),
      status: import_zod.z.enum(["active", "completed", "all"]).optional().default("active").describe("Filter by status"),
      startDate: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().describe("Start date range"),
      endDate: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().describe("End date range")
    },
    async ({ scope, status, startDate, endDate }) => {
      try {
        const query = {};
        if (status === "completed") query.completed = "true";
        if (scope) query.scope = scope;
        if (startDate) query.startDate = startDate;
        if (endDate) query.endDate = endDate;
        const rawGoals = await apiClient.get("/api/goals", query);
        let goals = Array.isArray(rawGoals) ? rawGoals : rawGoals?.goals || [];
        if (status === "active") {
          goals = goals.filter((g) => !g.isMarkedComplete);
        }
        if (goals.length === 0) {
          return formatSuccessResult(`No goals found matching criteria (status: ${status}${scope ? `, scope: ${scope}` : ""}).`);
        }
        const rows = goals.map((g) => {
          const title = sanitizeString(g.title);
          const gScope = g.scope || "STANDALONE";
          const type = g.type || "TASK_COUNT";
          const progress = `${g.currentValue ?? 0}/${g.targetValue ?? 0}`;
          const isDone = g.isMarkedComplete ? "\u2713 Completed" : "In Progress";
          const parent = g.parent?.title ? sanitizeString(g.parent.title) : "-";
          return `| \`${g.id}\` | ${title} | ${gScope} | ${type} | ${progress} | ${isDone} | ${parent} |`;
        });
        const table = [
          `### Goal Tracker - Goals (${goals.length} found)`,
          "",
          "| ID | Title | Scope | Type | Progress | Status | Parent |",
          "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
          ...rows
        ].join("\n");
        return formatSuccessResult(table);
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
  server.tool(
    "get_goal",
    "Get detailed goal information including child goals, linked tasks, and progress details",
    {
      goalId: import_zod.z.string().uuid("Invalid goal ID format").describe("Goal UUID")
    },
    async ({ goalId }) => {
      try {
        const goal = await apiClient.get(`/api/goals/${goalId}`);
        if (!goal) {
          return formatSuccessResult(`Goal '${goalId}' not found.`);
        }
        const lines = [
          `## Goal: ${sanitizeString(goal.title)}`,
          `- **ID**: \`${goal.id}\``,
          `- **Scope**: ${goal.scope || "STANDALONE"}`,
          `- **Type**: ${goal.type || "TASK_COUNT"}`,
          `- **Status**: ${goal.isMarkedComplete ? "Completed" : "Active"}`,
          `- **Progress**: ${goal.currentValue ?? 0} / ${goal.targetValue ?? 0}`
        ];
        if (goal.description) {
          lines.push(`- **Description**: ${sanitizeString(goal.description)}`);
        }
        if (goal.parent) {
          lines.push(`- **Parent Goal**: ${sanitizeString(goal.parent.title)} (\`${goal.parent.id}\`)`);
        }
        if (goal.children && goal.children.length > 0) {
          lines.push("", "### Child Goals:");
          for (const c of goal.children) {
            lines.push(`- ${sanitizeString(c.title)} (\`${c.id}\`) - ${c.isMarkedComplete ? "Completed" : "Active"}`);
          }
        }
        if (goal.goalTasks && goal.goalTasks.length > 0) {
          lines.push("", "### Linked Tasks:");
          for (const gt of goal.goalTasks) {
            const t = gt.task;
            if (t) {
              const status = t.isCompleted ? "\u2713" : "\u25CB";
              lines.push(`- [${status}] ${sanitizeString(t.title)} (\`${t.id}\`)`);
            }
          }
        }
        return formatSuccessResult(lines.join("\n"));
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}

// src/tools/tasks.ts
var import_zod2 = require("zod");
function registerTaskTools(server, apiClient) {
  server.tool(
    "list_tasks",
    "List tasks filtered by date, month, completion status, or unscheduled state",
    {
      status: import_zod2.z.enum(["completed", "pending", "all"]).optional().default("all").describe("Filter by task completion state"),
      date: import_zod2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional().describe("Filter by exact scheduled date (YYYY-MM-DD)"),
      month: import_zod2.z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM").optional().describe("Filter by month (YYYY-MM)"),
      unscheduled: import_zod2.z.boolean().optional().describe("When true, returns only unscheduled tasks"),
      page: import_zod2.z.number().int().min(1).optional().default(1).describe("Page number for pagination"),
      limit: import_zod2.z.number().int().min(1).max(50).optional().default(50).describe("Max items to return (1-50)")
    },
    async ({ status, date, month, unscheduled, page, limit }) => {
      try {
        const query = {
          page,
          limit
        };
        if (status && status !== "all") query.status = status;
        if (date) query.date = date;
        if (month) query.month = month;
        if (unscheduled !== void 0) query.unscheduled = unscheduled;
        const res = await apiClient.get("/api/tasks", query);
        const tasks = Array.isArray(res) ? res : res?.tasks || [];
        const pagination = res?.pagination;
        if (tasks.length === 0) {
          return formatSuccessResult(
            `No tasks found matching criteria (status: ${status}${date ? `, date: ${date}` : ""}${unscheduled ? ", unscheduled" : ""}).`
          );
        }
        const rows = tasks.map((t) => {
          const check = t.isCompleted ? "\u2713" : "\u25CB";
          const title = sanitizeString(t.title);
          const sched = t.scheduledDate ? t.scheduledDate.substring(0, 10) : "Unscheduled";
          const priority = t.priority || "MEDIUM";
          const category = t.category ? sanitizeString(t.category) : "-";
          const goals = (t.goalTasks || []).map((gt) => sanitizeString(gt.goal?.title || "Goal")).join(", ") || "-";
          return `| \`${t.id}\` | [${check}] | ${title} | ${sched} | ${priority} | ${category} | ${goals} |`;
        });
        const headerLines = [
          `### Goal Tracker - Tasks (${tasks.length} displayed${pagination ? `, page ${pagination.page}/${pagination.totalPages}` : ""})`,
          "",
          "| ID | State | Title | Scheduled | Priority | Category | Linked Goals |",
          "| :--- | :---: | :--- | :--- | :--- | :--- | :--- |",
          ...rows
        ];
        return formatSuccessResult(headerLines.join("\n"));
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
  server.tool(
    "get_task",
    "Get detailed information for a specific task including description, parent task, subtasks, and linked goals",
    {
      taskId: import_zod2.z.string().uuid("Invalid task ID format").describe("Task UUID")
    },
    async ({ taskId }) => {
      try {
        const task = await apiClient.get(`/api/tasks/${taskId}`);
        if (!task) {
          return formatSuccessResult(`Task '${taskId}' not found.`);
        }
        const lines = [
          `## Task: ${sanitizeString(task.title)}`,
          `- **ID**: \`${task.id}\``,
          `- **Status**: ${task.isCompleted ? "Completed" : "Pending"}`,
          `- **Scheduled Date**: ${task.scheduledDate ? task.scheduledDate.substring(0, 10) : "None"}`,
          `- **Scheduled Time**: ${task.scheduledTime || "None"}`,
          `- **Priority**: ${task.priority || "MEDIUM"}`,
          `- **Category**: ${task.category ? sanitizeString(task.category) : "None"}`,
          `- **Size / Weight**: ${task.size || 1}`
        ];
        if (task.description) {
          lines.push(`- **Description**: ${sanitizeString(task.description)}`);
        }
        if (task.parentTask) {
          lines.push(`- **Parent Task**: ${sanitizeString(task.parentTask.title)} (\`${task.parentTask.id}\`)`);
        }
        if (task.subTasks && task.subTasks.length > 0) {
          lines.push("", "### Subtasks:");
          for (const st of task.subTasks) {
            lines.push(`- [${st.isCompleted ? "\u2713" : "\u25CB"}] ${sanitizeString(st.title)} (\`${st.id}\`)`);
          }
        }
        if (task.goalTasks && task.goalTasks.length > 0) {
          lines.push("", "### Linked Goals:");
          for (const gt of task.goalTasks) {
            const g = gt.goal;
            if (g) {
              lines.push(`- ${sanitizeString(g.title)} (\`${g.id}\`)`);
            }
          }
        }
        return formatSuccessResult(lines.join("\n"));
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}

// src/tools/calendar.ts
var import_zod3 = require("zod");
function registerCalendarTools(server, apiClient) {
  server.tool(
    "get_calendar_agenda",
    "Fetch daily scheduled tasks and commitments for a calendar date range",
    {
      startDate: import_zod3.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").describe("Start date (YYYY-MM-DD)"),
      endDate: import_zod3.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").describe("End date (YYYY-MM-DD)"),
      includeUnscheduled: import_zod3.z.boolean().optional().default(false).describe("Include unassigned tasks"),
      parentGoalId: import_zod3.z.string().uuid().optional().describe("Filter by specific parent goal ID")
    },
    async ({ startDate, endDate, includeUnscheduled, parentGoalId }) => {
      try {
        const query = {
          startDate,
          endDate,
          includeUnscheduled: includeUnscheduled ? "true" : void 0,
          parentGoalId
        };
        const res = await apiClient.get("/api/calendar/tasks", query);
        const scheduledTasks = res?.tasks || [];
        const unscheduledTasks = res?.unscheduledTasks || [];
        if (scheduledTasks.length === 0 && unscheduledTasks.length === 0) {
          return formatSuccessResult(`No scheduled tasks found between ${startDate} and ${endDate}.`);
        }
        const groupedByDate = /* @__PURE__ */ new Map();
        for (const task of scheduledTasks) {
          const dateKey = task.scheduledDate ? task.scheduledDate.substring(0, 10) : "Unscheduled";
          if (!groupedByDate.has(dateKey)) {
            groupedByDate.set(dateKey, []);
          }
          groupedByDate.get(dateKey).push(task);
        }
        const lines = [
          `### Calendar Agenda (${startDate} to ${endDate})`,
          `Total scheduled tasks: ${scheduledTasks.length}`,
          ""
        ];
        const sortedDates = Array.from(groupedByDate.keys()).sort();
        for (const date of sortedDates) {
          lines.push(`#### ${date}`);
          const tasksOnDate = groupedByDate.get(date);
          for (const t of tasksOnDate) {
            const check = t.isCompleted ? "x" : " ";
            const time = t.scheduledTime ? `[${t.scheduledTime}] ` : "";
            const goals = (t.goalTasks || []).map((gt) => sanitizeString(gt.goal?.title || "")).filter(Boolean).join(", ");
            const goalTag = goals ? ` *(Goal: ${goals})*` : "";
            lines.push(`- [${check}] ${time}${sanitizeString(t.title)} (\`${t.id}\`)${goalTag}`);
          }
          lines.push("");
        }
        if (unscheduledTasks.length > 0) {
          lines.push("#### Unscheduled Tasks");
          for (const t of unscheduledTasks) {
            const check = t.isCompleted ? "x" : " ";
            lines.push(`- [${check}] ${sanitizeString(t.title)} (\`${t.id}\`)`);
          }
        }
        return formatSuccessResult(lines.join("\n"));
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}

// src/tools/system.ts
function registerSystemTools(server, apiClient) {
  server.tool(
    "get_system_status",
    "Check API health, active profile, connected backend URL, and authenticated user identity",
    {},
    async () => {
      try {
        const profile = apiClient.getProfile();
        const apiUrl = apiClient.getApiUrl();
        let healthData = { status: "unknown" };
        try {
          const res = await fetch(`${apiUrl.replace(/\/+$/, "")}/health`, { redirect: "error" });
          if (res.ok) {
            healthData = await res.json();
          }
        } catch (hErr) {
          healthData = { status: "unreachable", error: hErr.message };
        }
        const userData = await apiClient.get("/api/auth/me");
        const lines = [
          "### Goal Tracker - System Status",
          `- **Profile**: \`${profile}\``,
          `- **Backend API URL**: \`${apiUrl}\``,
          `- **API Health**: \`${healthData.status}\`${healthData.timestamp ? ` (checked at ${healthData.timestamp})` : ""}`,
          "",
          "#### Authenticated User",
          `- **User ID**: \`${userData.id}\``,
          `- **Auth0 Sub**: \`${userData.sub}\``,
          `- **Name**: ${sanitizeString(userData.name || "N/A")}`,
          `- **Email**: ${sanitizeString(userData.email || "N/A")}`
        ];
        return formatSuccessResult(lines.join("\n"));
      } catch (err) {
        return formatErrorResult(err, apiClient.getProfile());
      }
    }
  );
}

// src/server.ts
function protectStdout() {
  const originalLog = console.log;
  console.log = (...args) => {
    console.error(...args);
  };
}
function createMcpServer(config) {
  const server = new import_mcp.McpServer({
    name: "goal-tracker",
    version: "1.0.0"
  });
  const tokenManager = new TokenManager(config);
  const apiClient = new GoalTrackerApiClient(config, tokenManager);
  registerGoalTools(server, apiClient);
  registerTaskTools(server, apiClient);
  registerCalendarTools(server, apiClient);
  registerSystemTools(server, apiClient);
  return { server, tokenManager, apiClient };
}
async function runStdioServer(config) {
  protectStdout();
  const { server } = createMcpServer(config);
  const transport = new import_stdio.StdioServerTransport();
  console.error(`[MCP] Goal Tracker MCP server starting in stdio mode (profile: ${config.profile})...`);
  await server.connect(transport);
  console.error(`[MCP] Connected over stdio transport. Ready for tool requests.`);
  const cleanup = () => {
    console.error("[MCP] Server shutting down.");
    process.exit(0);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

// src/auth/deviceFlow.ts
var DeviceFlow = class {
  constructor(config, tokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
  }
  async login() {
    console.error(`[MCP:login] Initiating Device Authorization Flow for profile '${this.config.profile}'...`);
    const deviceCodeData = await this.requestDeviceCode();
    const verificationUrl = deviceCodeData.verification_uri_complete || deviceCodeData.verification_uri;
    console.error("");
    console.error("============================================================");
    console.error("       Goal Tracker MCP - Device Authentication             ");
    console.error("============================================================");
    console.error(` Profile:          ${this.config.profile}`);
    console.error(` User Code:        ${deviceCodeData.user_code}`);
    console.error(` Verification URL: ${verificationUrl}`);
    console.error("============================================================");
    console.error("Opening browser automatically...");
    try {
      const openModule = await import("open");
      const openFn = openModule.default || openModule;
      await openFn(verificationUrl);
    } catch {
      console.error("(Could not automatically launch browser. Please open the URL manually above.)");
    }
    console.error("Waiting for authorization in browser...");
    const tokens = await this.pollForToken(deviceCodeData);
    await this.tokenManager.saveTokens(tokens);
    console.error("");
    console.error(`[MCP:login] Authentication successful! Tokens saved for profile '${this.config.profile}'.`);
    return tokens;
  }
  async requestDeviceCode() {
    const endpoint = `https://${this.config.auth0Domain}/oauth/device/code`;
    const params = new URLSearchParams({
      client_id: this.config.auth0ClientId,
      scope: this.config.auth0Scopes,
      audience: this.config.auth0Audience
    });
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      redirect: "error"
    });
    if (!res.ok) {
      let errText = "";
      try {
        const json = await res.json();
        errText = json.error_description || json.error || res.statusText;
      } catch {
        errText = await res.text();
      }
      throw new Error(`Failed to initiate device authorization (${res.status}): ${errText}`);
    }
    return await res.json();
  }
  async pollForToken(deviceCodeData) {
    const tokenEndpoint = `https://${this.config.auth0Domain}/oauth/token`;
    let pollInterval = (deviceCodeData.interval || 5) * 1e3;
    const expiresAt = Date.now() + deviceCodeData.expires_in * 1e3;
    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      const params = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code: deviceCodeData.device_code,
        client_id: this.config.auth0ClientId
      });
      let res;
      try {
        res = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
          redirect: "error"
        });
      } catch (err) {
        console.error(`[MCP:auth] Warning: transient network error during polling: ${err.message}`);
        continue;
      }
      if (res.ok) {
        const data = await res.json();
        if (!data.refresh_token) {
          throw new Error(
            "Auth0 did not return a refresh token. Ensure Allow Offline Access is enabled on the API and client."
          );
        }
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1e3,
          scope: data.scope || this.config.auth0Scopes,
          tokenType: data.token_type || "Bearer",
          updatedAt: Date.now()
        };
      }
      let errJson = {};
      try {
        errJson = await res.json();
      } catch {
      }
      const error = errJson.error;
      if (error === "authorization_pending") {
        continue;
      } else if (error === "slow_down") {
        pollInterval += 5e3;
        continue;
      } else if (error === "expired_token") {
        throw new Error("Device code expired. Please restart login.");
      } else if (error === "access_denied") {
        throw new Error("Authorization was cancelled or denied by the user.");
      } else {
        throw new Error(
          `Authentication failed (${res.status}): ${errJson.error_description || error || res.statusText}`
        );
      }
    }
    throw new Error("Device code authorization timed out. Please restart login.");
  }
};

// src/index.ts
function printHelp() {
  console.error(`
Goal Tracker MCP Server & CLI

Usage:
  goal-tracker-mcp [command] [options]

Commands:
  stdio                     Run MCP server in stdio mode (default)
  login                     Authenticate interactively using Auth0 Device Authorization
  logout                    Clear stored credentials and session
  status                    Inspect local authentication and profile state

Options:
  --profile, -p <name>      Environment profile ('development' | 'production', default: 'production')
  --help, -h                Show this help message
`);
}
async function main() {
  const args = process.argv.slice(2);
  let profileArg;
  let command = "stdio";
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (arg === "--profile" || arg === "-p") {
      profileArg = args[++i];
    } else if (arg.startsWith("--profile=")) {
      profileArg = arg.split("=")[1];
    } else if (!arg.startsWith("-")) {
      command = arg;
    }
  }
  const config = getProfileConfig(profileArg);
  const tokenManager = new TokenManager(config);
  switch (command) {
    case "login": {
      const flow = new DeviceFlow(config, tokenManager);
      await flow.login();
      process.exit(0);
      break;
    }
    case "logout": {
      console.error(`[MCP] Logging out from profile '${config.profile}'...`);
      await tokenManager.logout();
      console.error(`[MCP] Credentials cleared for profile '${config.profile}'.`);
      process.exit(0);
      break;
    }
    case "status": {
      const tokens = tokenManager.getStoredTokens();
      console.error("============================================================");
      console.error("            Goal Tracker MCP - Profile Status               ");
      console.error("============================================================");
      console.error(` Profile:          ${config.profile}`);
      console.error(` Backend API URL:  ${config.apiUrl}`);
      console.error(` Auth0 Domain:     ${config.auth0Domain}`);
      console.error(` Auth0 Audience:   ${config.auth0Audience}`);
      console.error(` Credentials File: ${config.credentialsPath}`);
      console.error("------------------------------------------------------------");
      if (tokens) {
        const isFresh = tokenManager.isTokenFresh(tokens);
        const expDate = new Date(tokens.expiresAt).toLocaleString();
        console.error(` Status:           Authenticated (${isFresh ? "Valid" : "Expired"})`);
        console.error(` Token Expiration: ${expDate}`);
        console.error(` Scopes Granted:   ${tokens.scope}`);
      } else {
        console.error(" Status:           Unauthenticated (no stored credentials found)");
        console.error(` Login command:    pnpm mcp:login --profile ${config.profile}`);
      }
      console.error("============================================================");
      process.exit(0);
      break;
    }
    case "stdio":
    default: {
      await runStdioServer(config);
      break;
    }
  }
}
main().catch((err) => {
  console.error("[MCP:fatal]", err instanceof Error ? err.message : err);
  process.exit(1);
});
//# sourceMappingURL=index.js.map