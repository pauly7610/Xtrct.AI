import { Platform } from 'react-native';

export const ENV = {
  dev: {
    name: 'development',
    apiUrl: 'https://dev-api.xtractai.com',
    anthropicApiUrl: 'https://api.anthropic.com/v1',
    bundleId: 'com.xtractai.app.dev',
    googleClientId: '898344092663-xxxxxxxxxxxx.apps.googleusercontent.com',
    microsoftClientId: 'd7873856-03f0-4615-ba3b-7172c047d24c',
  },
  staging: {
    name: 'staging',
    apiUrl: 'https://staging-api.xtractai.com',
    anthropicApiUrl: 'https://api.anthropic.com/v1',
    bundleId: 'com.xtractai.app.staging',
    googleClientId: 'your-staging-google-client-id',
    microsoftClientId: 'your-staging-microsoft-client-id',
  },
  prod: {
    name: 'production',
    apiUrl: 'https://api.xtractai.com',
    anthropicApiUrl: 'https://api.anthropic.com/v1',
    bundleId: 'com.xtractai.app',
    googleClientId: 'your-prod-google-client-id',
    microsoftClientId: 'your-prod-microsoft-client-id',
  }
};

