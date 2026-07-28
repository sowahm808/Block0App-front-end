import { Environment } from './environment.types';
export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5001/api/v1',
  apiWithCredentials: false,
  appInsightsConnectionString: '',
  enableMockApi: false,
  features: { encouragementCenter: true },
  firebase: {
    apiKey: '',
    identityToolkitUrl: 'https://identitytoolkit.googleapis.com/v1',
    secureTokenUrl: 'https://securetoken.googleapis.com/v1',
  },
};
