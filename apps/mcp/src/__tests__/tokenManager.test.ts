import fs from 'fs';
import path from 'path';
import os from 'os';
import { TokenManager } from '../auth/tokenManager';
import { TokenStore, StoredTokens } from '../auth/tokenStore';
import { ProfileConfig } from '../config';
import { AuthRequiredError } from '../client/errors';

describe('TokenManager & TokenStore', () => {
  const originalFetch = global.fetch;
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
    global.fetch = originalFetch;
    jest.restoreAllMocks();
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
      const manager = new TokenManager(testConfig);
      const oldLock = await manager.acquireLock();
      fs.renameSync(lockPath, `${lockPath}.abandoned`);
      const successorLock = await manager.acquireLock();
      // Old owner attempts release
      manager.releaseLock(oldLock);

      // Successor lock MUST remain intact!
      expect(fs.existsSync(lockPath)).toBe(true);
      const remainingContent = JSON.parse(fs.readFileSync(successorLock.ownerPath, 'utf8'));
      expect(remainingContent.lockId).toBe(successorLock.lockId);

      // Clean up
      manager.releaseLock(successorLock);
    });

    it.each(['', '{"pid":', 'null', '{}'])(
      'should recover an abandoned incomplete lock record %j using its file age',
      async (content) => {
        fs.writeFileSync(testConfig.lockPath, content);
        const abandonedAt = new Date(Date.now() - 600_000);
        fs.utimesSync(testConfig.lockPath, abandonedAt, abandonedAt);

        const manager = new TokenManager(testConfig);
        const lock = await manager.acquireLock(1000);
        expect(JSON.parse(fs.readFileSync(lock.ownerPath, 'utf8'))).toEqual(
          expect.objectContaining({ pid: process.pid, lockId: lock.lockId })
        );
        manager.releaseLock(lock);
        expect(fs.existsSync(testConfig.lockPath)).toBe(false);
      }
    );

    it('should preserve a recent incomplete lock record', async () => {
      fs.writeFileSync(testConfig.lockPath, '');
      const manager = new TokenManager(testConfig);

      await expect(manager.acquireLock(200)).rejects.toThrow(/Timeout acquiring lock/);
      expect(fs.readFileSync(testConfig.lockPath, 'utf8')).toBe('');
    });

    it('should recover a directory left empty by an interrupted release', async () => {
      fs.mkdirSync(testConfig.lockPath);
      const abandonedAt = new Date(Date.now() - 600_000);
      fs.utimesSync(testConfig.lockPath, abandonedAt, abandonedAt);
      const manager = new TokenManager(testConfig);

      const lock = await manager.acquireLock(1000);
      expect(fs.existsSync(lock.ownerPath)).toBe(true);
      manager.releaseLock(lock);
      expect(fs.existsSync(testConfig.lockPath)).toBe(false);
    });

    it('should leave no lock behind when creating its owner record fails', async () => {
      jest.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {
        throw new Error('Synthetic lock write failure');
      });
      const manager = new TokenManager(testConfig);

      await expect(manager.acquireLock()).rejects.toThrow('Synthetic lock write failure');
      expect(fs.readdirSync(testDir)).toEqual([]);

      const lock = await manager.acquireLock();
      manager.releaseLock(lock);
    });

    it('should preserve a successor that replaces an abandoned lock during recovery', async () => {
      fs.writeFileSync(testConfig.lockPath, '{}');
      const abandonedAt = new Date(Date.now() - 600_000);
      fs.utimesSync(testConfig.lockPath, abandonedAt, abandonedAt);
      const realStat = fs.statSync;
      let lockReads = 0;
      jest.spyOn(fs, 'statSync').mockImplementation(((filename: fs.PathLike, options?: any) => {
        if (filename === testConfig.lockPath && ++lockReads === 2) {
          fs.writeFileSync(testConfig.lockPath, JSON.stringify({
            pid: process.pid,
            lockId: 'successor-lock-id',
            timestamp: Date.now(),
          }));
        }
        return realStat(filename, options);
      }) as typeof fs.statSync);
      const manager = new TokenManager(testConfig);

      await expect(manager.acquireLock(300)).rejects.toThrow(/Timeout acquiring lock/);
      expect(JSON.parse(fs.readFileSync(testConfig.lockPath, 'utf8')).lockId).toBe('successor-lock-id');
    });

    it('should never remove a successor directory when reclaiming a dead owner', async () => {
      fs.mkdirSync(testConfig.lockPath);
      const oldOwnerPath = path.join(testConfig.lockPath, 'owner-dead.json');
      fs.writeFileSync(oldOwnerPath, JSON.stringify({ pid: 99999999, lockId: 'dead' }));
      const realUnlink = fs.unlinkSync;
      let replaced = false;
      jest.spyOn(fs, 'unlinkSync').mockImplementation((filename) => {
        if (filename === oldOwnerPath && !replaced) {
          replaced = true;
          fs.renameSync(testConfig.lockPath, `${testConfig.lockPath}.abandoned`);
          fs.mkdirSync(testConfig.lockPath);
          fs.writeFileSync(path.join(testConfig.lockPath, 'owner-successor.json'), JSON.stringify({
            pid: process.pid,
            lockId: 'successor',
          }));
        }
        realUnlink(filename);
      });

      await expect(new TokenManager(testConfig).acquireLock(300)).rejects.toThrow(/Timeout acquiring lock/);
      const successor = JSON.parse(fs.readFileSync(path.join(testConfig.lockPath, 'owner-successor.json'), 'utf8'));
      expect(successor.lockId).toBe('successor');
    });

    it('should reject an initializer whose directory was replaced before its owner record was written', async () => {
      const realWrite = fs.writeFileSync;
      let replaced = false;
      jest.spyOn(fs, 'writeFileSync').mockImplementation(((filename: fs.PathOrFileDescriptor, data: any, options?: any) => {
        if (!replaced) {
          replaced = true;
          fs.renameSync(testConfig.lockPath, `${testConfig.lockPath}.abandoned`);
          fs.mkdirSync(testConfig.lockPath);
          realWrite(path.join(testConfig.lockPath, 'owner-successor.json'), JSON.stringify({
            pid: process.pid,
            lockId: 'successor',
          }));
        }
        realWrite(filename, data, options);
      }) as typeof fs.writeFileSync);

      await expect(new TokenManager(testConfig).acquireLock(300)).rejects.toThrow(/Timeout acquiring lock/);
      expect(fs.readdirSync(testConfig.lockPath)).toEqual(['owner-successor.json']);
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
      expect(onDisk?.refreshPending).toBeUndefined();
    });

    it('should persist the pending refresh before sending credentials to Auth0', async () => {
      TokenStore.writeTokens(testConfig.credentialsPath, {
        accessToken: 'expired-access',
        refreshToken: 'synthetic-refresh',
        expiresAt: Date.now() - 1000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
      });
      global.fetch = jest.fn().mockImplementation(async () => {
        expect(TokenStore.readTokens(testConfig.credentialsPath)?.refreshPending).toBe(true);
        return {
          ok: true,
          json: async () => ({
            access_token: 'fresh-access',
            refresh_token: 'rotated-refresh',
            expires_in: 3600,
          }),
        };
      });

      expect(await new TokenManager(testConfig).getValidAccessToken()).toBe('fresh-access');
      expect(TokenStore.readTokens(testConfig.credentialsPath)?.refreshPending).toBeUndefined();
    });

    it.each(['timeout', 'invalid response', 'server error', 'token persistence failure'])(
      'should prevent replay after an uncertain refresh with %s',
      async (failure) => {
        TokenStore.writeTokens(testConfig.credentialsPath, {
          accessToken: 'expired-access',
          refreshToken: 'synthetic-refresh',
          expiresAt: Date.now() - 1000,
          scope: 'read:goals',
          tokenType: 'Bearer',
          updatedAt: Date.now(),
        });
        const mockFetch = jest.fn().mockImplementation(async () => {
          if (failure === 'timeout') {
            throw new DOMException('Synthetic lost response', 'TimeoutError');
          }
          if (failure === 'server error') {
            return { ok: false, status: 502, json: async () => ({}) };
          }
          return {
            ok: true,
            json: async () => {
              if (failure === 'invalid response') {
                throw new SyntaxError('Synthetic truncated response');
              }
              jest.spyOn(TokenStore, 'writeTokens').mockImplementationOnce(() => {
                throw new Error('Synthetic disk failure');
              });
              return {
                access_token: 'fresh-access',
                refresh_token: 'rotated-refresh',
                expires_in: 3600,
              };
            },
          };
        });
        global.fetch = mockFetch;
        const manager = new TokenManager(testConfig);

        await expect(manager.getValidAccessToken()).rejects.toThrow(AuthRequiredError);
        expect(TokenStore.readTokens(testConfig.credentialsPath)).toBeNull();
        await expect(new TokenManager(testConfig).getValidAccessToken()).rejects.toThrow(AuthRequiredError);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      }
    );

    it('should require login after a process crashed with a pending refresh', async () => {
      TokenStore.writeTokens(testConfig.credentialsPath, {
        accessToken: 'still-valid-access',
        refreshToken: 'possibly-consumed-refresh',
        expiresAt: Date.now() + 3600_000,
        scope: 'read:goals',
        tokenType: 'Bearer',
        updatedAt: Date.now(),
        refreshPending: true,
      });
      fs.writeFileSync(testConfig.lockPath, JSON.stringify({
        pid: 99999999,
        timestamp: Date.now(),
        lockId: 'interrupted-process',
      }));
      const mockFetch = jest.fn();
      global.fetch = mockFetch;

      await expect(new TokenManager(testConfig).getValidAccessToken()).rejects.toThrow(AuthRequiredError);
      expect(mockFetch).not.toHaveBeenCalled();
      expect(TokenStore.readTokens(testConfig.credentialsPath)).toBeNull();
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
