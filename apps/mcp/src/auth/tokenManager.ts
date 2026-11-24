import fs from 'fs';
import path from 'path';
import { ProfileConfig } from '../config';
import { TokenStore, StoredTokens } from './tokenStore';
import { AuthRequiredError } from '../client/errors';

export class TokenManager {
  private config: ProfileConfig;
  private cachedTokens: StoredTokens | null = null;

  constructor(config: ProfileConfig) {
    this.config = config;
  }

  /**
   * Acquire exclusive file lock using atomic 'wx' flag with stale-lock detection and exponential jitter.
   */
  public async acquireLock(timeoutMs = 10000): Promise<{ fd: number; path: string }> {
    const lockPath = this.config.lockPath;
    const startTime = Date.now();
    TokenStore.ensureDirectory(path.dirname(lockPath));

    while (Date.now() - startTime < timeoutMs) {
      try {
        const fd = fs.openSync(lockPath, 'wx');
        const lockPayload = JSON.stringify({
          pid: process.pid,
          timestamp: Date.now(),
        });
        fs.writeFileSync(fd, lockPayload, 'utf8');
        return { fd, path: lockPath };
      } catch (err: any) {
        if (err.code === 'EEXIST') {
          // Lock already held. Inspect for stale lock
          this.checkAndRecoverStaleLock(lockPath);

          // Sleep with jitter (80ms - 150ms)
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
  private checkAndRecoverStaleLock(lockPath: string): void {
    try {
      if (!fs.existsSync(lockPath)) return;

      const content = fs.readFileSync(lockPath, 'utf8');
      const data = JSON.parse(content);
      const ageMs = Date.now() - (data.timestamp || 0);

      let isDead = false;
      if (data.pid) {
        try {
          process.kill(data.pid, 0); // 0 doesn't kill; checks if process exists
        } catch (e: any) {
          if (e.code === 'ESRCH') {
            isDead = true;
          }
        }
      }

      if ((ageMs > 15000 && isDead) || ageMs > 30000) {
        console.error(
          `[MCP:auth] Stale lock detected (pid: ${data.pid}, age: ${Math.round(
            ageMs / 1000
          )}s). Recovering...`
        );
        fs.unlinkSync(lockPath);
      }
    } catch {
      // Ignore JSON parse or race condition errors
    }
  }

  /**
   * Release exclusive lock safely.
   */
  public releaseLock(lock: { fd: number; path: string }): void {
    try {
      fs.closeSync(lock.fd);
    } catch {
      // Ignore if already closed
    }

    try {
      if (fs.existsSync(lock.path)) {
        fs.unlinkSync(lock.path);
      }
    } catch {
      // Ignore if unlinked
    }
  }

  /**
   * Check if a token record is valid (not expired, with 60-second safety margin).
   */
  public isTokenFresh(tokens: StoredTokens | null): boolean {
    if (!tokens || !tokens.accessToken || !tokens.expiresAt) return false;
    // 60-second safety window
    return Date.now() < tokens.expiresAt - 60_000;
  }

  /**
   * Retrieve a valid access token. Handles in-memory cache, in-lock re-read, and Auth0 refresh rotation.
   */
  public async getValidAccessToken(): Promise<string> {
    // 1. In-memory check
    if (this.isTokenFresh(this.cachedTokens)) {
      return this.cachedTokens!.accessToken;
    }

    // 2. Acquire lock
    const lock = await this.acquireLock();
    try {
      // 3. In-lock re-read from disk (peer process may have refreshed while we waited)
      const diskTokens = TokenStore.readTokens(this.config.credentialsPath);

      if (this.isTokenFresh(diskTokens)) {
        this.cachedTokens = diskTokens;
        return diskTokens!.accessToken;
      }

      // If no stored credentials exist or no refresh token
      if (!diskTokens || !diskTokens.refreshToken) {
        this.cachedTokens = null;
        throw new AuthRequiredError(this.config.profile);
      }

      // 4. Perform Auth0 refresh token exchange
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
  private async refreshTokensWithAuth0(refreshToken: string): Promise<StoredTokens> {
    const tokenEndpoint = `https://${this.config.auth0Domain}/oauth/token`;
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.auth0ClientId,
      refresh_token: refreshToken,
    });

    let res: Response;
    try {
      res = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        redirect: 'error',
      });
    } catch (err: any) {
      throw new Error(`Network failure during Auth0 token refresh: ${err.message}`);
    }

    if (!res.ok) {
      let errPayload: any = {};
      try {
        errPayload = await res.json();
      } catch {
        // non-json
      }

      if (res.status === 400 || errPayload.error === 'invalid_grant') {
        // Refresh token revoked, expired, or reuse detected. Clear local storage.
        TokenStore.clearTokens(this.config.credentialsPath);
        this.cachedTokens = null;
        throw new AuthRequiredError(
          this.config.profile,
          `Auth0 refresh token revoked or expired (${errPayload.error_description || errPayload.error || 'invalid_grant'}). Please re-authenticate.`
        );
      }

      throw new Error(
        `Auth0 token refresh failed (${res.status}): ${errPayload.error_description || errPayload.error || res.statusText}`
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      token_type?: string;
      scope?: string;
    };

    const newTokens: StoredTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Preserve if not rotated
      expiresAt: Date.now() + data.expires_in * 1000,
      scope: data.scope || this.config.auth0Scopes,
      tokenType: data.token_type || 'Bearer',
      updatedAt: Date.now(),
    };

    return newTokens;
  }

  /**
   * Save initial tokens (invoked by Device Code flow upon login).
   */
  public async saveTokens(tokens: StoredTokens): Promise<void> {
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
  public async logout(): Promise<void> {
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
  public getStoredTokens(): StoredTokens | null {
    if (this.cachedTokens) return this.cachedTokens;
    this.cachedTokens = TokenStore.readTokens(this.config.credentialsPath);
    return this.cachedTokens;
  }
}
