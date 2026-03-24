import React, { createContext, useCallback, useContext } from 'react';
import { Auth0Provider, useAuth0 } from 'react-native-auth0';

const AUTH0_DOMAIN = 'bises.auth0.com';
const AUTH0_CLIENT_ID = 'yOfNiraD6JRwGoM55VOnxnI89IaCmD5g';
const AUTH0_AUDIENCE = 'https://goal-tracker-api';

interface User {
  sub: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Inner component that bridges react-native-auth0's useAuth0 hook into our context
const AuthContextBridge = ({ children }: { children: React.ReactNode }) => {
  const { authorize, clearSession, user: auth0User, isLoading } = useAuth0();

  const login = useCallback(async () => {
    try {
      await authorize({
        scope: 'openid profile email offline_access',
        audience: AUTH0_AUDIENCE,
      });
    } catch (e) {
      console.error('[Auth] Login error:', e);
    }
  }, [authorize]);

  const logout = useCallback(async () => {
    try {
      await clearSession();
    } catch (e) {
      console.error('[Auth] Logout error:', e);
    }
  }, [clearSession]);

  const user: User | null = auth0User
    ? {
        sub: auth0User.sub ?? '',
        name: auth0User.name ?? auth0User.nickname ?? '',
        email: auth0User.email ?? '',
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!auth0User,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => (
  <Auth0Provider domain={AUTH0_DOMAIN} clientId={AUTH0_CLIENT_ID}>
    <AuthContextBridge>{children}</AuthContextBridge>
  </Auth0Provider>
);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
