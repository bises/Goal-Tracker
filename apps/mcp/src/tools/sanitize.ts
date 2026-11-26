/**
 * Sanitizes untrusted user strings (goal titles, task descriptions, notes)
 * to prevent prompt injection and terminal escaping.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return input === null || input === undefined ? '' : String(input);
  }

  // 1. Strip ASCII control characters (\x00-\x08, \x0B-\x1F, \x7F) preserving \t and \n
  let sanitized = input.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, '');

  // 2. Escape prompt-injection delimiter tokens commonly used across LLMs
  sanitized = sanitized
    .replace(/<\|system\|>/gi, '\\<|system|\\>')
    .replace(/<\|user\|>/gi, '\\<|user|\\>')
    .replace(/<\|assistant\|>/gi, '\\<|assistant|\\>')
    .replace(/\[INST\]/gi, '\\[INST\\]')
    .replace(/\[\/INST\]/gi, '\\[/INST\\]')
    .replace(/<\/system>/gi, '\\<\\/system\\>')
    .replace(/<system>/gi, '\\<system\\>');

  return sanitized;
}

/**
 * Recursively sanitize strings in objects or arrays.
 */
export function sanitizeData<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeString(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = sanitizeData(value);
    }
    return result as T;
  }
  return data;
}

/**
 * Ensures write operations are explicitly opted into via GOAL_TRACKER_ALLOW_WRITES=true.
 * Protects headless agents from performing unintended database mutations.
 */
export function checkWritesAllowed(profile: string): { isError: true; content: [{ type: 'text'; text: string }] } | null {
  if (process.env.GOAL_TRACKER_ALLOW_WRITES !== 'true') {
    return formatErrorResult(
      new Error('Write operations disabled in headless mode. Set GOAL_TRACKER_ALLOW_WRITES=true to enable.'),
      profile
    );
  }
  return null;
}

/**
 * Format tool error responses according to the MCP specification.
 */
export function formatErrorResult(err: any, profile: string) {
  let message = err?.message || 'An unknown error occurred';
  if (err?.cause?.message) {
    message = `${message}: ${err.cause.message}`;
  }
  if (err?.name === 'AuthRequiredError') {
    message = `Authentication required. Stored credentials for profile '${profile}' are missing or expired. Run 'pnpm mcp:login --profile ${profile}' in your terminal to authenticate.`;
  }

  return {
    isError: true,
    content: [
      {
        type: 'text' as const,
        text: sanitizeString(message),
      },
    ],
  };
}

/**
 * Format tool success responses according to the MCP specification.
 */
export function formatSuccessResult(text: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: sanitizeString(text),
      },
    ],
  };
}
