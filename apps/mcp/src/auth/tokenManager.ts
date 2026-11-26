import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ProfileConfig } from '../config';
import { TokenStore, StoredTokens } from './tokenStore';
import { AuthRequiredError } from '../client/errors';

export interface FileLock {
  path: string;
  lockId: string;
  ownerPath: string;
}

export class TokenManager {
  private config: ProfileConfig;
  private cachedTokens: StoredTokens | null = null;
  private cachedMtimeMs: number | null = null;

  constructor(config: ProfileConfig) {
    this.config = config;
  }

  /**
   * Helper to get mtimeMs of credentials file on disk.
   */
  private getCredentialsMtime(): number | null {
    try {
      if (fs.existsSync(this.config.credentialsPath)) {
        return fs.statSync(this.config.credentialsPath).mtimeMs;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Claim a lock directory, verify its owner record, and recover abandoned owners.
   */
  public async acquireLock(timeoutMs = 10000): Promise<FileLock> {
    const lockPath = this.config.lockPath;
    const startTime = Date.now();
    TokenStore.ensureDirectory(path.dirname(lockPath));

    while (Date.now() - startTime < timeoutMs) {
      const lockId = crypto.randomUUID();
      const ownerName = `owner-${lockId}.json`;
      const ownerPath = path.join(lockPath, ownerName);
      let createdDirectory = false;
      try {
        fs.mkdirSync(lockPath, { mode: 0o700 });
        createdDirectory = true;
        const directory = fs.statSync(lockPath);
        const lockPayload = JSON.stringify({
          pid: process.pid,
          timestamp: Date.now(),
          lockId,
        });
        fs.writeFileSync(ownerPath, lockPayload, { flag: 'wx', mode: 0o600 });
        const current = fs.statSync(lockPath);
        const entries = fs.readdirSync(lockPath);
        // An interrupted initializer may resume after its abandoned directory was replaced.
        if (
          current.dev !== directory.dev ||
          current.ino !== directory.ino ||
          entries.length !== 1 ||
          entries[0] !== ownerName
        ) {
          throw Object.assign(new Error('Lock ownership changed during initialization'), {
            code: 'EEXIST',
          });
        }
        return { path: lockPath, lockId, ownerPath };
      } catch (err: any) {
        if (createdDirectory) {
          try {
            fs.unlinkSync(ownerPath);
          } catch {
            // Already removed or replaced.
          }
          try {
            fs.rmdirSync(lockPath);
          } catch {
            // Preserve any successor's nonempty directory.
          }
        }
        if (
          ['EEXIST', 'ENOTEMPTY', 'EPERM', 'EISDIR', 'ENOTDIR'].includes(err.code) &&
          fs.existsSync(lockPath)
        ) {
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
   * Stale lock recovery: breaks lock only if owning process is confirmed dead
   * or if a lock without a readable owner has been unchanged for 5 minutes.
   * Live processes preserve their lock exclusivity.
   */
  private checkAndRecoverStaleLock(lockPath: string): void {
    try {
      const lockStat = fs.statSync(lockPath);
      const isDirectory = lockStat.isDirectory();
      let ownerPath = lockPath;
      if (isDirectory) {
        const entries = fs.readdirSync(lockPath);
        if (entries.length === 0 && Date.now() - lockStat.mtimeMs > 300_000) {
          fs.rmdirSync(lockPath);
          return;
        }
        if (entries.length !== 1 || !/^owner-[\w-]+\.json$/.test(entries[0])) {
          return;
        }
        ownerPath = path.join(lockPath, entries[0]);
      }
      const snapshot = fs.statSync(ownerPath);
      const content = fs.readFileSync(ownerPath, 'utf8');
      let ownerPid: number | undefined;
      try {
        const data = JSON.parse(content);
        if (Number.isInteger(data?.pid) && data.pid > 0) {
          ownerPid = data.pid;
        }
      } catch {
        // Older clients can leave an empty or partial record if interrupted during creation.
      }
      const ageMs = Date.now() - snapshot.mtimeMs;

      let isDead = false;
      if (ownerPid !== undefined) {
        try {
          process.kill(ownerPid, 0); // 0 checks if process exists
        } catch (e: any) {
          if (e.code === 'ESRCH') {
            isDead = true;
          }
        }
      }

      // Live processes preserve their lock exclusivity.
      // Only recover a confirmed dead owner or an abandoned incomplete record.
      if (isDead || (ownerPid === undefined && ageMs > 300_000)) {
        const current = fs.statSync(ownerPath);
        if (
          current.dev !== snapshot.dev ||
          current.ino !== snapshot.ino ||
          current.mtimeMs !== snapshot.mtimeMs ||
          current.ctimeMs !== snapshot.ctimeMs ||
          fs.readFileSync(ownerPath, 'utf8') !== content
        ) {
          return;
        }
        console.error(
          `[MCP:auth] Stale lock detected (pid: ${ownerPid || 'none'}, dead: ${isDead}, age: ${Math.round(
            ageMs / 1000
          )}s). Recovering...`
        );
        try {
          // Remove only the observed owner's unique record. A successor has a different name.
          fs.unlinkSync(ownerPath);
          if (isDirectory) {
            // Never remove a successor's nonempty directory.
            fs.rmdirSync(lockPath);
          }
        } catch {
          // Ignore if unlinked concurrently
        }
      }
    } catch {
      // Another process may have already released or replaced this lock.
    }
  }

  /**
   * Release exclusive lock safely, checking ownership to avoid releasing a successor's lock.
   */
  public releaseLock(lock: FileLock): void {
    try {
      if (lock.ownerPath && fs.existsSync(lock.ownerPath)) {
        const content = fs.readFileSync(lock.ownerPath, 'utf8');
        const data = JSON.parse(content);
        // Only unlink if the lock file is still owned by this acquisition
        if (data.lockId === lock.lockId) {
          fs.unlinkSync(lock.ownerPath);
          fs.rmdirSync(lock.path);
        }
      }
    } catch {
      // Ignore if unlinked
    }
  }

  /**
   * Check if a token record is valid (not expired, with 60-second safety margin).
   */
  public isTokenFresh(tokens: StoredTokens | null): boolean {
    if (!tokens || !tokens.accessToken || !tokens.expiresAt || tokens.refreshPending) return false;
    // 60-second safety window
    return Date.now() < tokens.expiresAt - 60_000;
  }

  /**
   * Retrieve a valid access token. Handles in-memory cache, external logout/account change detection,
   * in-lock re-read, and Auth0 refresh rotation.
   */
  public async getValidAccessToken(): Promise<string> {
    // 1. Observe external logout or credential change
    const currentMtime = this.getCredentialsMtime();
    if (currentMtime === null) {
      // Credentials file was deleted on disk (e.g. by CLI logout)
      this.cachedTokens = null;
      this.cachedMtimeMs = null;
    } else if (this.cachedMtimeMs !== null && currentMtime !== this.cachedMtimeMs) {
      // Credentials file was modified externally (e.g. by CLI login to another account or concurrent refresh)
      this.cachedTokens = null;
      this.cachedMtimeMs = null;
    }

    // Fast-path: in-memory fresh tokens matching current disk generation
    if (this.isTokenFresh(this.cachedTokens)) {
      return this.cachedTokens!.accessToken;
    }

    // 2. Acquire lock
    const lock = await this.acquireLock();
    try {
      // 3. In-lock re-read from disk (peer process may have refreshed while we waited)
      const diskTokens = TokenStore.readTokens(this.config.credentialsPath);
      const diskMtime = this.getCredentialsMtime();

      if (this.isTokenFresh(diskTokens)) {
        this.cachedTokens = diskTokens;
        this.cachedMtimeMs = diskMtime;
        return diskTokens!.accessToken;
      }

      // If no stored credentials exist or no refresh token
      if (!diskTokens || !diskTokens.refreshToken) {
        this.cachedTokens = null;
        this.cachedMtimeMs = null;
        throw new AuthRequiredError(this.config.profile);
      }

      if (diskTokens.refreshPending) {
        // A previous process may have exchanged this token before it was interrupted.
        TokenStore.clearTokens(this.config.credentialsPath);
        this.cachedTokens = null;
        this.cachedMtimeMs = null;
        throw new AuthRequiredError(this.config.profile);
      }

      // 4. Perform Auth0 refresh token exchange
      // Persist before dispatch so a process crash cannot leave a replayable token behind.
      TokenStore.writeTokens(this.config.credentialsPath, { ...diskTokens, refreshPending: true });
      try {
        const newTokens = await this.refreshTokensWithAuth0(diskTokens.refreshToken);
        TokenStore.writeTokens(this.config.credentialsPath, newTokens);
        this.cachedTokens = newTokens;
        this.cachedMtimeMs = this.getCredentialsMtime();
        return newTokens.accessToken;
      } catch {
        // Auth0 may have consumed the token even when its response never arrived.
        TokenStore.clearTokens(this.config.credentialsPath);
        this.cachedTokens = null;
        this.cachedMtimeMs = null;
        throw new AuthRequiredError(this.config.profile);
      }
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
        signal: AbortSignal.timeout(15_000),
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
        this.cachedMtimeMs = null;
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
      this.cachedMtimeMs = this.getCredentialsMtime();
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
      this.cachedMtimeMs = null;
    } finally {
      this.releaseLock(lock);
    }
  }

  /**
   * Get cached or stored tokens without refresh (for status inspection).
   */
  public getStoredTokens(): StoredTokens | null {
    const currentMtime = this.getCredentialsMtime();
    if (currentMtime === null) {
      this.cachedTokens = null;
      this.cachedMtimeMs = null;
      return null;
    }
    if (this.cachedTokens && this.cachedMtimeMs === currentMtime) {
      return this.cachedTokens;
    }
    this.cachedTokens = TokenStore.readTokens(this.config.credentialsPath);
    this.cachedMtimeMs = currentMtime;
    return this.cachedTokens;
  }
}
