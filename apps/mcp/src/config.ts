import os from 'os';
import path from 'path';
import dotenv from 'dotenv';

// Load optional .env from apps/mcp or monorepo root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/mcp/.env') });

if (process.env.GOAL_TRACKER_ALLOW_INSECURE_TLS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

export type EnvironmentProfile = 'development' | 'production';

export interface ProfileConfig {
  profile: EnvironmentProfile;
  apiUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
  auth0Scopes: string;
  baseDir: string;
  credentialsPath: string;
  lockPath: string;
}

export const V1_READ_SCOPES = 'openid profile email offline_access read:goals read:tasks read:calendar';
export const V2_SCOPES = 'openid profile email offline_access read:goals read:tasks read:calendar write:goals write:tasks';

export function getProfileConfig(profileArg?: string): ProfileConfig {
  const profileName = (
    profileArg ||
    process.env.GOAL_TRACKER_PROFILE ||
    'production'
  ).toLowerCase() as EnvironmentProfile;

  if (profileName !== 'development' && profileName !== 'production') {
    throw new Error(
      `Invalid profile: '${profileName}'. Allowed profiles are 'development' or 'production'.`
    );
  }

  const baseDir = path.join(os.homedir(), '.goal-tracker');
  const credentialsPath = path.join(baseDir, `auth-${profileName}.json`);
  const lockPath = path.join(baseDir, `auth-${profileName}.lock`);

  if (profileName === 'development') {
    const apiUrl = process.env.GOAL_TRACKER_DEV_API_URL || process.env.GOAL_TRACKER_API_URL || 'http://localhost:3000';
    return {
      profile: 'development',
      apiUrl,
      auth0Domain: process.env.AUTH0_DOMAIN || 'bises.auth0.com',
      auth0ClientId: process.env.AUTH0_DEV_CLIENT_ID || 'DEDICATED_DEV_CLIENT_ID',
      auth0Audience: process.env.AUTH0_DEV_AUDIENCE || 'https://goal-tracker-api-dev',
      auth0Scopes: process.env.AUTH0_SCOPES || V2_SCOPES,
      baseDir,
      credentialsPath,
      lockPath,
    };
  }

  // Production profile (port 3001 maps to container 3000 in docker-compose.prod.yml)
  const apiUrl = process.env.GOAL_TRACKER_PROD_API_URL || process.env.GOAL_TRACKER_API_URL || 'https://jbhouse.tail6c5f41.ts.net:3001';
  
  // Transport safety validation for production: HTTPS required unless explicitly tested with GOAL_TRACKER_INSECURE_TEST
  if (!apiUrl.startsWith('https://') && process.env.NODE_ENV !== 'test' && !process.env.GOAL_TRACKER_INSECURE_TEST) {
    throw new Error(
      `Transport security violation: Production profile API URL must use HTTPS (received '${apiUrl}'). Plain HTTP is prohibited for production.`
    );
  }

  return {
    profile: 'production',
    apiUrl,
    auth0Domain: process.env.AUTH0_DOMAIN || 'bises.auth0.com',
    auth0ClientId: process.env.AUTH0_CLIENT_ID || 'DEDICATED_PROD_CLIENT_ID',
    auth0Audience: process.env.AUTH0_AUDIENCE || 'https://goal-tracker-api',
    auth0Scopes: process.env.AUTH0_SCOPES || V2_SCOPES,
    baseDir,
    credentialsPath,
    lockPath,
  };
}
