import { Auth0Provider } from '@auth0/auth0-react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoalProvider } from './contexts/GoalContext';
import { TaskProvider } from './contexts/TaskContext';
import './styles/design-system.css';

// TODO: Make Auth0 configuration environment-specific
// For now, hardcoded to simplify deployment
const DEFAULT_AUTH0_DOMAIN = 'bises.auth0.com';
const DEFAULT_AUTH0_CLIENT_ID = 'izygI8zTKeFDiyME5JETirr288UDMr7q';
const DEFAULT_AUTH0_AUDIENCE = 'https://goal-tracker-api';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || DEFAULT_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || DEFAULT_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || DEFAULT_AUTH0_AUDIENCE;

// Validate Auth0 configuration
if (!domain || !clientId) {
  console.error('Auth0 configuration missing.');
  throw new Error('Auth0 domain and client ID must be configured');
}

// Validate domain format
if (
  !domain.includes('.auth0.com') &&
  !domain.includes('.us.auth0.com') &&
  !domain.includes('.eu.auth0.com') &&
  !domain.includes('.au.auth0.com')
) {
  console.warn('Auth0 domain format might be incorrect. Expected format: your-domain.auth0.com');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element with id "root" not found in DOM. Ensure your HTML includes <div id="root"></div>.'
  );
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + '/callback',
        audience: audience || undefined,
        scope: 'openid profile email offline_access',
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      <GoalProvider>
        <TaskProvider>
          <App />
        </TaskProvider>
      </GoalProvider>
    </Auth0Provider>
  </React.StrictMode>
);
