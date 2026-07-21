// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiBaseUrl: 'https://block0app-back-end.onrender.com/api/v1',
  apiWithCredentials: false,
  appInsightsConnectionString: '',
  enableMockApi: false,
  firebase: {
    apiKey: '',
    identityToolkitUrl: 'https://identitytoolkit.googleapis.com/v1',
    secureTokenUrl: 'https://securetoken.googleapis.com/v1',
  },
} as const;
