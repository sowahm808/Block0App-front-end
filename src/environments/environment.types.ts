import { FirebaseOptions } from 'firebase/app';
export interface Environment {
  production: boolean;
  apiBaseUrl: string;
  apiWithCredentials: boolean;
  appInsightsConnectionString: string;
  enableMockApi: boolean;
  firebase: FirebaseOptions & { identityToolkitUrl: string; secureTokenUrl: string };
  features: { encouragementCenter: boolean };
}
