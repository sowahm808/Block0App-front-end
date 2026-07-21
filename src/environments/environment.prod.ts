// src/environments/environment.prod.ts

export const environment = {
  production: true,
  apiBaseUrl: 'https://block0app-node-backend.onrender.com/api/v1',
  apiWithCredentials: false,
  appInsightsConnectionString: '',
  enableMockApi: false,
  firebase: {
    apiKey: 'AIzaSyB9647vJIAgOwFrqEEaI347xMLb6FZXTKg',
    authDomain: "blockowhisper.firebaseapp.com",
    projectId: "blockowhisper",
    storageBucket: "blockowhisper.firebasestorage.app",
  messagingSenderId: "545571294957",
    appId: "1:545571294957:web:5897167bdc6431268b46e4",
    measurementId: "G-CY8YBJYPDQ",
    identityToolkitUrl: 'https://identitytoolkit.googleapis.com/v1',
    secureTokenUrl: 'https://securetoken.googleapis.com/v1',
  },
} as const;
