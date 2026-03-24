import Auth0 from 'react-native-auth0';

// Singleton Auth0 instance used by api.ts to retrieve always-valid credentials
// (auto-refreshes access token via refresh token when expired)
export const auth0Client = new Auth0({
  domain: 'bises.auth0.com',
  clientId: 'yOfNiraD6JRwGoM55VOnxnI89IaCmD5g',
});
