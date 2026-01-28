import { useEffect } from 'react';
import { useAuth } from 'react-oidc-context';

export function LoginPage() {
  const auth = useAuth();

  useEffect(() => {
    // If already authenticated, this won't execute
    // Auto-redirect to login
    if (!auth.isAuthenticated && !auth.isLoading) {
      auth.signinRedirect();
    }
  }, [auth.isAuthenticated, auth.isLoading]);

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-gray-800 border border-red-500/30 p-8 rounded-lg shadow-xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
          <p className="text-gray-300 mb-6">{auth.error.message}</p>
          <button
            onClick={() => auth.signinRedirect()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            Goal Tracker
          </h1>
          <p className="text-gray-400 mb-8">Track your progress and achieve your dreams</p>

          {auth.isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-400">Redirecting to login...</p>
            </div>
          ) : (
            <button
              onClick={() => auth.signinRedirect()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Sign In with Authentik
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
