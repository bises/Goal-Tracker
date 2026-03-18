import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import Auth0, { Credentials } from 'react-native-auth0';

const AUTH0_DOMAIN = 'bises.auth0.com';
const AUTH0_CLIENT_ID = 'izygI8zTKeFDiyME5JETirr288UDMr7q';
const AUTH0_AUDIENCE = 'https://goal-tracker-api';

const auth0 = new Auth0({
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
});

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleCredentials = useCallback((credentials: Credentials) => {
    setAccessToken(credentials.accessToken);
    setIsAuthenticated(true);

    // Decode basic user info from ID token claims
    if (credentials.idToken) {
      try {
        const payload = JSON.parse(atob(credentials.idToken.split('.')[1]));
        setUser({
          sub: payload.sub ?? '',
          name: payload.name ?? payload.nickname ?? '',
          email: payload.email ?? '',
        });
      } catch {
        // If decode fails, fetch from userinfo
        auth0.auth
          .userInfo({ token: credentials.accessToken })
          .then((info) => {
            setUser({
              sub: info.sub,
              name: info.name ?? info.nickname ?? '',
              email: info.email ?? '',
            });
          })
          .catch(() => {});
      }
    }
  }, []);

  // Try silent auth on mount (refresh token)
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const credentials = await auth0.credentialsManager.getCredentials();
        if (credentials.accessToken) {
          handleCredentials(credentials);
        }
      } catch {
        // No stored credentials — user needs to log in
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, [handleCredentials]);

  const login = useCallback(async () => {
    setIsLoading(true);
    try {
      const credentials = await auth0.webAuth.authorize({
        scope: 'openid profile email offline_access',
        audience: AUTH0_AUDIENCE,
      });
      handleCredentials(credentials);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Login failed';
      if (!message.includes('cancelled')) {
        Alert.alert('Login Error', message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleCredentials]);

  const logout = useCallback(async () => {
    try {
      await auth0.webAuth.clearSession();
    } catch {
      // Clear session may fail on some devices, continue anyway
    }
    try {
      await auth0.credentialsManager.clearCredentials();
    } catch {
      // Ignore
    }
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const credentials = await auth0.credentialsManager.getCredentials();
      if (credentials.accessToken) {
        setAccessToken(credentials.accessToken);
        return credentials.accessToken;
      }
    } catch {
      // Token expired or unavailable
    }
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
