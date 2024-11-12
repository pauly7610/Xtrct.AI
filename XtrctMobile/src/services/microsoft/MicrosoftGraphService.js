// src/services/platform/MicrosoftAuthHandler.js
import { PublicClientApplication } from '@azure/msal-browser';
import { firebaseAuthConfig } from 'src/config/firebaseAuthConfig';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const msalConfig = {
  auth: {
    clientId: firebaseAuthConfig.microsoft.clientId,
    authority: `https://login.microsoftonline.com/${firebaseAuthConfig.microsoft.tenantId}`,
    redirectUri: firebaseAuthConfig.microsoft.redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

class MicrosoftAuthHandler {
  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async handleMicrosoftAuth() {
    try {
      const loginRequest = {
        scopes: [
          'User.Read',
          'Calendars.Read',
          'Mail.Read'
        ]
      };

      const response = await this.msalInstance.loginPopup(loginRequest);
      
      if (response) {
        const accessToken = response.accessToken;
        return { 
          accessToken,
          user: {
            email: response.account.username,
            name: response.account.name
          }
        };
      }
      
      throw new Error('Microsoft auth failed - no response');
    } catch (error) {
      appMonitor.logError(error, { context: 'microsoft_auth' });
      throw error;
    }
  }

  async logout() {
    try {
      await this.msalInstance.logout();
    } catch (error) {
      appMonitor.logError(error, { context: 'microsoft_logout' });
      throw error;
    }
  }

  async getToken() {
    try {
      const account = this.msalInstance.getAllAccounts()[0];
      if (!account) {
        throw new Error('No account found');
      }

      const response = await this.msalInstance.acquireTokenSilent({
        scopes: ['User.Read'],
        account: account
      });

      return response.accessToken;
    } catch (error) {
      // If silent token acquisition fails, fallback to interactive method
      if (error.name === "InteractionRequiredAuthError") {
        return this.handleMicrosoftAuth();
      }
      throw error;
    }
  }
}

export const microsoftAuthHandler = new MicrosoftAuthHandler();
