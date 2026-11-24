import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenManager } from '../auth/tokenManager';
import { TokenStore, StoredTokens } from '../auth/tokenStore';
import { ProfileConfig } from '../config';
import { AuthRequiredError } from '../client/errors';

describe('TokenManager & TokenStore', () => {
  let testDir: string;
  let testConfig: ProfileConfig;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `gt-mcp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(testDir, { recursive: true });

    testConfig = {
      profile: 'development',
      apiUrl: 'http://localhost:3000',
      auth0Domain: 'test.auth0.com',
      auth0ClientId: 'test-client-id',
      auth0Audience: 'https://goal-tracker-api-dev',
      auth0Scopes: 'openid profile email read:goals',
      baseDir: testDir,
      credentialsPath: path.join(testDir, 'auth-development.json'),
      lockPath: path.join(testDir, 'auth-development.lock'),
    };
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  });

  describe('TokenStore', () => {
    it('should atomically write and read stored tokens', () => {
      const tokens: StoredTokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        expiresAt: Date.now() + 3600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };

      TokenStore.writeTokens(testConfig.credentialsPath, tokens);
      const readBack = TokenStore.readTokens(testConfig.credentialsPath);

      expect(readBack).not.toBeNull();
      expect(readBack?.accessToken).toBe('access-123');
      expect(readBack?.refreshToken).toBe('refresh-456');
    });

    it('should return null when reading non-existent token file', () => {
      const nonExistentPath = path.join(testDir, 'non-existent.json');
      expect(TokenStore.readTokens(nonExistentPath)).toBeNull();
    });

    it('should cleanly remove tokens on clearTokens', () => {
      const tokens: StoredTokens = {
        accessToken: 'acc',
        refreshToken: 'ref',
        expiresAt: Date.now() + 1000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };
      TokenStore.writeTokens(testConfig.credentialsPath, tokens);
      expect(fs.existsSync(testConfig.credentialsPath)).toBe(true);

      TokenStore.clearTokens(testConfig.credentialsPath);
      expect(fs.existsSync(testConfig.credentialsPath)).toBe(false);
    });
  });

  describe('TokenManager Authentication & Mutex Locking', () => {
    it('should throw AuthRequiredError if credentials do not exist on disk', async () => {
      const manager = new TokenManager(testConfig);
      await expect(manager.getValidAccessToken()).rejects.toThrow(AuthRequiredError);
    });

    it('should immediately observe external logout and throw AuthRequiredError instead of serving stale cache', async () => {
      const tokens: StoredTokens = {
        accessToken: 'cached-fresh-token',
        refreshToken: 'ref',
        expiresAt: Date.now() + 600000, // 10 minutes in future
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };
      TokenStore.writeTokens(testConfig.credentialsPath, tokens);

      const manager = new TokenManager(testConfig);
      const token1 = await manager.getValidAccessToken();
      expect(token1).toBe('cached-fresh-token');

      // Now simulate a separate CLI logout removing the file from disk
      TokenStore.clearTokens(testConfig.credentialsPath);

      // Running process MUST observe that credentials are gone and require auth
      await expect(manager.getValidAccessToken()).rejects.toThrow(AuthRequiredError);
    });

    it('should immediately observe external account switch and return new account token', async () => {
      const user1Tokens: StoredTokens = {
        accessToken: 'user-1-token',
        refreshToken: 'user-1-ref',
        expiresAt: Date.now() + 600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };
      TokenStore.writeTokens(testConfig.credentialsPath, user1Tokens);

      const managerA = new TokenManager(testConfig);
      expect(await managerA.getValidAccessToken()).toBe('user-1-token');

      // Manager B (e.g. CLI login) saves credentials for user 2
      const user2Tokens: StoredTokens = {
        accessToken: 'user-2-token',
        refreshToken: 'user-2-ref',
        expiresAt: Date.now() + 600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now() + 1000,
      };

      // Slight delay to ensure filesystem mtime difference
      await new Promise((r) => setTimeout(r, 20));
      TokenStore.writeTokens(testConfig.credentialsPath, user2Tokens);

      // Running manager A MUST observe external update and return user 2's token
      expect(await managerA.getValidAccessToken()).toBe('user-2-token');
    });

    it('should PRESERVE lock exclusivity for live processes even if older than 30s', async () => {
      // Create a lock file owned by current live process with old timestamp
      const liveLockPayload = JSON.stringify({
        pid: process.pid, // Current live process!
        timestamp: Date.now() - 40000, // 40 seconds old
        lockId: 'live-lock-id',
      });
      fs.writeFileSync(testConfig.lockPath, liveLockPayload, 'utf8');

      const manager = new TokenManager(testConfig);

      // Attempting to acquire lock with short timeout must fail because live process lock is preserved
      await expect(manager.acquireLock(200)).rejects.toThrow(/Timeout acquiring lock/);
      expect(fs.existsSync(testConfig.lockPath)).toBe(true);

      // Clean up lock file
      fs.unlinkSync(testConfig.lockPath);
    });

    it('should NOT delete successor lock if an older owner releases after losing ownership', async () => {
      const lockPath = testConfig.lockPath;
      const oldLock = { fd: 999, path: lockPath, lockId: 'old-lock-id' };

      // Successor acquired lock and wrote its own lockId
      const successorPayload = JSON.stringify({
        pid: process.pid,
        timestamp: Date.now(),
        lockId: 'successor-lock-id',
      });
      fs.writeFileSync(lockPath, successorPayload, 'utf8');

      const manager = new TokenManager(testConfig);
      // Old owner attempts release
      manager.releaseLock(oldLock as any);

      // Successor lock MUST remain intact!
      expect(fs.existsSync(lockPath)).toBe(true);
      const remainingContent = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      expect(remainingContent.lockId).toBe('successor-lock-id');

      // Clean up
      fs.unlinkSync(lockPath);
    });

    it('should re-read valid token from disk under lock when refreshed by peer process', async () => {
      // Setup expired token on disk initially
      const expiredTokens: StoredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Date.now() - 10000, // 10s expired
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now() - 3600000,
      };
      TokenStore.writeTokens(testConfig.credentialsPath, expiredTokens);

      const manager = new TokenManager(testConfig);

      // Simulate a peer process refreshing the token just before or as lock is acquired
      const freshTokens: StoredTokens = {
        accessToken: 'refreshed-by-peer',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };

      // Mock fetch: should NOT be called because in-lock disk re-read finds freshTokens!
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      // Update disk to simulate peer refresh
      TokenStore.writeTokens(testConfig.credentialsPath, freshTokens);

      const token = await manager.getValidAccessToken();
      expect(token).toBe('refreshed-by-peer');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should perform Auth0 refresh rotation when token on disk is expired', async () => {
      const expiredTokens: StoredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: Date.now() - 10000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now() - 3600000,
      };
      TokenStore.writeTokens(testConfig.credentialsPath, expiredTokens);

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: 'brand-new-rotated-access-token',
          refresh_token: 'brand-new-rotated-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'read:goals',
        }),
      });
      global.fetch = mockFetch;

      const manager = new TokenManager(testConfig);
      const token = await manager.getValidAccessToken();

      expect(token).toBe('brand-new-rotated-access-token');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify new tokens saved to disk
      const onDisk = TokenStore.readTokens(testConfig.credentialsPath);
      expect(onDisk?.accessToken).toBe('brand-new-rotated-access-token');
      expect(onDisk?.refreshToken).toBe('brand-new-rotated-refresh-token');
    });

    it('should clear disk tokens and throw AuthRequiredError when Auth0 returns invalid_grant', async () => {
      const expiredTokens: StoredTokens = {
        accessToken: 'expired-token',
        refreshToken: 'revoked-refresh-token',
        expiresAt: Date.now() - 10000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now() - 3600000,
      };
      TokenStore.writeTokens(testConfig.credentialsPath, expiredTokens);

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'The refresh token was revoked.',
        }),
      });
      global.fetch = mockFetch;

      const manager = new TokenManager(testConfig);
      await expect(manager.getValidAccessToken()).rejects.toThrow(AuthRequiredError);

      // Verify credentials file was removed from disk
      expect(fs.existsSync(testConfig.credentialsPath)).toBe(false);
    });

    it('should automatically recover from a stale lock file with an old timestamp', async () => {
      // Create a stale lock file older than 30s
      const stalePayload = JSON.stringify({
        pid: 99999999, // Unlikely to exist
        timestamp: Date.now() - 35000,
      });
      fs.writeFileSync(testConfig.lockPath, stalePayload, 'utf8');

      const freshTokens: StoredTokens = {
        accessToken: 'valid-token',
        refreshToken: 'valid-ref',
        expiresAt: Date.now() + 3600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };
      TokenStore.writeTokens(testConfig.credentialsPath, freshTokens);

      const manager = new TokenManager(testConfig);
      const token = await manager.getValidAccessToken();

      expect(token).toBe('valid-token');
      // Lock should have been cleared after operation
      expect(fs.existsSync(testConfig.lockPath)).toBe(false);
    });

    it('should perform logout and clear disk credentials', async () => {
      const tokens: StoredTokens = {
        accessToken: 'active-token',
        refreshToken: 'active-ref',
        expiresAt: Date.now() + 3600000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      };
      TokenStore.writeTokens(testConfig.credentialsPath, tokens);

      const manager = new TokenManager(testConfig);
      expect(manager.getStoredTokens()).not.toBeNull();

      await manager.logout();
      expect(fs.existsSync(testConfig.credentialsPath)).toBe(false);
      expect(manager.getStoredTokens()).toBeNull();
    });
  });
});
