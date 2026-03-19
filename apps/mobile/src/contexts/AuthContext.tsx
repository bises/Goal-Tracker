import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = 'bises.auth0.com';
const AUTH0_CLIENT_ID = 'yOfNiraD6JRwGoM55VOnxnI89IaCmD5g';
const AUTH0_AUDIENCE = 'https://goal-tracker-api';

const TOKEN_KEY = 'goal_tracker_token';
const USER_KEY = 'goal_tracker_user';

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  userInfoEndpoint: `https://${AUTH0_DOMAIN}/userinfo`,
};

interface User {
  sub: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'goal-tracker',
  preferLocalhost: true,
});
console.log('[Auth] Redirect URI:', redirectUri);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH0_CLIENT_ID,
      redirectUri,
      scopes: ['openid', 'profile', 'email', 'offline_access'],
      extraParams: {
        audience: AUTH0_AUDIENCE,
      },
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  const decodeIdToken = useCallback((idToken: string): User | null => {
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return {
        sub: payload.sub ?? '',
        name: payload.name ?? payload.nickname ?? '',
        email: payload.email ?? '',
      };
    } catch {
      return null;
    }
  }, []);

  const saveSession = useCallback(async (token: string, userData: User) => {
    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
    }
  }, []);

  const clearSession = useCallback(async () => {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(USER_KEY).catch(() => {});
    }
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      try {
        if (Platform.OS !== 'web') {
          const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
          const storedUser = await SecureStore.getItemAsync(USER_KEY);
          if (storedToken && storedUser) {
            setAccessToken(storedToken);
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
          }
        }
      } catch {
        // No stored session
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  // Handle auth response
  useEffect(() => {
    const exchange = async () => {
      if (response?.type !== 'success' || !response.params.code) return;

      setIsLoading(true);
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code: response.params.code,
            redirectUri,
            extraParams: {
              code_verifier: request?.codeVerifier ?? '',
            },
          },
          discovery
        );

        const token = tokenResult.accessToken;
        setAccessToken(token);
        setIsAuthenticated(true);

        // Get user info from ID token or userinfo endpoint
        let userData: User | null = null;
        if (tokenResult.idToken) {
          userData = decodeIdToken(tokenResult.idToken);
        }

        if (!userData) {
          const userInfoRes = await fetch(`https://${AUTH0_DOMAIN}/userinfo`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const info = await userInfoRes.json();
          userData = {
            sub: info.sub ?? '',
            name: info.name ?? info.nickname ?? '',
            email: info.email ?? '',
          };
        }

        if (userData) {
          setUser(userData);
          await saveSession(token, userData);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Authentication failed';
        Alert.alert('Login Error', message);
      } finally {
        setIsLoading(false);
      }
    };
    exchange();
  }, [response, request?.codeVerifier, decodeIdToken, saveSession]);

  const login = useCallback(async () => {
    await promptAsync();
  }, [promptAsync]);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return accessToken;
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        accessToken,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
