import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp ms
  scope: string;
  tokenType: string;
  updatedAt: number;
}

export class TokenStore {
  /**
   * Ensure directory exists with restricted permissions (0700 on POSIX).
   */
  public static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o700 });
      this.restrictPermissions(dirPath, true);
    }
  }

  /**
   * Apply filesystem permission restrictions (0600/0700 on POSIX, icacls on Windows).
   */
  public static restrictPermissions(filePath: string, isDirectory = false): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      if (process.platform === 'win32') {
        const username = os.userInfo().username;
        if (username) {
          // (OI)(CI) are container inheritance flags that only apply to directories
          const perm = isDirectory ? `${username}:(OI)(CI)F` : `${username}:F`;
          execFileSync('icacls', [filePath, '/inheritance:r', '/grant:r', perm], {
            stdio: 'ignore',
            windowsHide: true,
          });
        }
      } else {
        fs.chmodSync(filePath, isDirectory ? 0o700 : 0o600);
      }
    } catch {
      // Best-effort permission tightening; ignore non-critical failures in restricted sandboxes
    }
  }

  /**
   * Read stored tokens from disk. Returns null if file does not exist or is invalid.
   */
  public static readTokens(credentialsPath: string): StoredTokens | null {
    if (!fs.existsSync(credentialsPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(credentialsPath, 'utf8');
      if (!raw || raw.trim().length === 0) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
        return null;
      }
      return parsed as StoredTokens;
    } catch {
      return null;
    }
  }

  /**
   * Atomically write tokens to disk using PID-tagged temporary file replacement.
   */
  public static writeTokens(credentialsPath: string, tokens: StoredTokens): void {
    const dir = path.dirname(credentialsPath);
    this.ensureDirectory(dir);

    const tmpPath = `${credentialsPath}.tmp.${process.pid}.${Date.now()}`;
    const payload = JSON.stringify(tokens, null, 2);

    fs.writeFileSync(tmpPath, payload, { mode: 0o600, encoding: 'utf8' });

    try {
      fs.renameSync(tmpPath, credentialsPath);
    } catch (err: any) {
      if (process.platform === 'win32') {
        try {
          if (fs.existsSync(credentialsPath)) {
            fs.unlinkSync(credentialsPath);
          }
          fs.renameSync(tmpPath, credentialsPath);
        } catch {
          fs.copyFileSync(tmpPath, credentialsPath);
          if (fs.existsSync(tmpPath)) {
            fs.unlinkSync(tmpPath);
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
  public static clearTokens(credentialsPath: string): void {
    try {
      if (fs.existsSync(credentialsPath)) {
        fs.unlinkSync(credentialsPath);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
