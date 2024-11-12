// src/services/microsoft/MicrosoftAuthHandler.js
class MicrosoftAuthHandler {
    constructor() {
      this.msalInstance = null;
      this.initialized = false;
    }
  
    async initialize() {
      if (this.initialized) return;
  
      this.msalInstance = new PublicClientApplication(msalConfig);
      this.initialized = true;
    }
  
    async handleMicrosoftAuth() {
      try {
        await this.initialize();
  
        const loginRequest = {
          scopes: [
            'User.Read',
            'Calendars.Read',
            'Calendars.ReadWrite',
            'Mail.Read',
            'offline_access'
          ]
        };
  
        const response = await this.msalInstance.loginPopup(loginRequest);
        
        if (response) {
          const authData = { 
            accessToken: response.accessToken,
            user: {
              email: response.account.username,
              name: response.account.name
            },
            timestamp: Date.now()
          };
  
          await AsyncStorage.setItem(AUTH_STORAGE_KEYS.MICROSOFT_AUTH, JSON.stringify(authData));
          return authData;
        }
        
        throw new Error('Microsoft auth failed - no response');
      } catch (error) {
        appMonitor.logError(error, { context: 'microsoft_auth' });
        throw new Error(`Microsoft authentication failed: ${error.message}`);
      }
    }
  
    async getValidToken() {
      try {
        await this.initialize();
        
        const authDataStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.MICROSOFT_AUTH);
        if (!authDataStr) {
          throw new Error('No stored Microsoft authentication');
        }
  
        const authData = JSON.parse(authDataStr);
        const tokenAge = Date.now() - authData.timestamp;
  
        // Token refresh needed if older than 50 minutes
        if (tokenAge > 3000000) {
          return await this.refreshToken();
        }
  
        return authData.accessToken;
      } catch (error) {
        appMonitor.logError(error, { context: 'microsoft_get_token' });
        throw error;
      }
    }
  
    async refreshToken() {
      try {
        await this.initialize();
        const account = this.msalInstance.getAllAccounts()[0];
        
        if (!account) {
          throw new Error('No account found');
        }
  
        const response = await this.msalInstance.acquireTokenSilent({
          scopes: ['User.Read', 'Calendars.Read', 'Calendars.ReadWrite'],
          account: account
        });
  
        const authData = {
          accessToken: response.accessToken,
          timestamp: Date.now()
        };
  
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.MICROSOFT_AUTH, JSON.stringify(authData));
        return response.accessToken;
      } catch (error) {
        if (error.name === "InteractionRequiredAuthError") {
          return this.handleMicrosoftAuth();
        }
        throw error;
      }
    }
  }
  
  export const microsoftAuthHandler = new MicrosoftAuthHandler();
