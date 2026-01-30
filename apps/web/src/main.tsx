import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import AppContent from './App';
import { GoalProvider } from './contexts/GoalContext';
import { TaskProvider } from './contexts/TaskContext';
import './styles/design-system.css';

//TODO replace import.meta.env with a config file
const oidcConfig = {
  authority: import.meta.env.VITE_AUTHENTIK_AUTHORITY || '',
  client_id: import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '',
  redirect_uri: window.location.origin + '/callback',
  post_logout_redirect_uri: window.location.origin + '/login',
  scope: 'openid email profile',
  audience: import.meta.env.VITE_AUTHENTIK_API_AUDIENCE || '',
  automaticSilentRenew: true,
  loadUserInfo: true,
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <GoalProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </GoalProvider>
    </AuthProvider>
  </React.StrictMode>
);
