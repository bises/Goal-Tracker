import { ProfileConfig } from '../config';
import { TokenManager } from './tokenManager';
import { StoredTokens } from './tokenStore';

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete?: string;
  expires_in: number;
  interval?: number;
}

export class DeviceFlow {
  private config: ProfileConfig;
  private tokenManager: TokenManager;

  constructor(config: ProfileConfig, tokenManager: TokenManager) {
    this.config = config;
    this.tokenManager = tokenManager;
  }

  public async login(): Promise<StoredTokens> {
    console.error(`[MCP:login] Initiating Device Authorization Flow for profile '${this.config.profile}'...`);

    const deviceCodeData = await this.requestDeviceCode();
    const verificationUrl = deviceCodeData.verification_uri_complete || deviceCodeData.verification_uri;

    console.error('');
    console.error('============================================================');
    console.error('       Goal Tracker MCP - Device Authentication             ');
    console.error('============================================================');
    console.error(` Profile:          ${this.config.profile}`);
    console.error(` User Code:        ${deviceCodeData.user_code}`);
    console.error(` Verification URL: ${verificationUrl}`);
    console.error('============================================================');
    console.error('Opening browser automatically...');

    // Attempt to open browser automatically
    try {
      const openModule = await import('open');
      const openFn = (openModule.default || openModule) as (url: string) => Promise<any>;
      await openFn(verificationUrl);
    } catch {
      console.error('(Could not automatically launch browser. Please open the URL manually above.)');
    }

    console.error('Waiting for authorization in browser...');

    const tokens = await this.pollForToken(deviceCodeData);
    await this.tokenManager.saveTokens(tokens);

    console.error('');
    console.error(`[MCP:login] Authentication successful! Tokens saved for profile '${this.config.profile}'.`);
    return tokens;
  }

  private async requestDeviceCode(): Promise<DeviceCodeResponse> {
    const endpoint = `https://${this.config.auth0Domain}/oauth/device/code`;
    const params = new URLSearchParams({
      client_id: this.config.auth0ClientId,
      scope: this.config.auth0Scopes,
      audience: this.config.auth0Audience,
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      redirect: 'error',
    });

    if (!res.ok) {
      let errText = '';
      try {
        const json = await res.json();
        errText = json.error_description || json.error || res.statusText;
      } catch {
        errText = await res.text();
      }
      throw new Error(`Failed to initiate device authorization (${res.status}): ${errText}`);
    }

    return (await res.json()) as DeviceCodeResponse;
  }

  private async pollForToken(deviceCodeData: DeviceCodeResponse): Promise<StoredTokens> {
    const tokenEndpoint = `https://${this.config.auth0Domain}/oauth/token`;
    let pollInterval = (deviceCodeData.interval || 5) * 1000;
    const expiresAt = Date.now() + deviceCodeData.expires_in * 1000;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const params = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code: deviceCodeData.device_code,
        client_id: this.config.auth0ClientId,
      });

      let res: Response;
      try {
        res = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
          redirect: 'error',
        });
      } catch (err: any) {
        // Network blip, retry next interval
        console.error(`[MCP:auth] Warning: transient network error during polling: ${err.message}`);
        continue;
      }

      if (res.ok) {
        const data = (await res.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
          token_type?: string;
          scope?: string;
        };

        if (!data.refresh_token) {
          throw new Error(
            'Auth0 did not return a refresh token. Ensure Allow Offline Access is enabled on the API and client.'
          );
        }

        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
          scope: data.scope || this.config.auth0Scopes,
          tokenType: data.token_type || 'Bearer',
          updatedAt: Date.now(),
        };
      }

      let errJson: any = {};
      try {
        errJson = await res.json();
      } catch {
        // non-json
      }

      const error = errJson.error;
      if (error === 'authorization_pending') {
        // Keep polling
        continue;
      } else if (error === 'slow_down') {
        pollInterval += 5000;
        continue;
      } else if (error === 'expired_token') {
        throw new Error('Device code expired. Please restart login.');
      } else if (error === 'access_denied') {
        throw new Error('Authorization was cancelled or denied by the user.');
      } else {
        throw new Error(
          `Authentication failed (${res.status}): ${errJson.error_description || error || res.statusText}`
        );
      }
    }

    throw new Error('Device code authorization timed out. Please restart login.');
  }
}
