// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiBaseUrl: 'https://block0app-back-end.onrender.com/api/v1',
  apiWithCredentials: false,
  appInsightsConnectionString: '',
  enableMockApi: false,
} as const;