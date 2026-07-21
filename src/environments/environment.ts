export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5001/api/v1',
  apiWithCredentials: false,
  appInsightsConnectionString: '',
  enableMockApi: false,
  firebase: {
    apiKey: '',
    identityToolkitUrl: 'https://identitytoolkit.googleapis.com/v1',
    secureTokenUrl: 'https://securetoken.googleapis.com/v1',
  },
} as const;
