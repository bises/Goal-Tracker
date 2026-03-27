import { Auth0Provider } from '@auth0/auth0-react';
import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App';
import { GoalProvider } from './contexts/GoalContext';
import { TaskProvider } from './contexts/TaskContext';
import './styles/design-system.css';

const domain = import.meta.env.VITE_AUTH0_DOMAIN || 'bises.auth0.com';
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || 'izygI8zTKeFDiyME5JETirr288UDMr7q';
const audience = import.meta.env.VITE_AUTH0_AUDIENCE || 'https://goal-tracker-api';

const Auth0ProviderWithNavigate = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  return (
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
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || '/', { replace: true });
      }}
    >
      {children}
    </Auth0Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <GoalProvider>
          <TaskProvider>
            <App />
          </TaskProvider>
        </GoalProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </React.StrictMode>
);
