// src/services/google/GoogleAuthHandler.js
class GoogleAuthHandler {
    constructor() {
      this.initialized = false;
    }
  
    async initialize() {
      if (this.initialized) return;
  
      GoogleSignin.configure({
        webClientId: firebaseAuthConfig.google.webClientId,
        iosClientId: firebaseAuthConfig.google.iosClientId,
        offlineAccess: true,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email'
        ]
      });
  
      this.initialized = true;
    }
  
    async signIn() {
      try {
        await this.initialize();
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const tokens = await GoogleSignin.getTokens();
        
        const authData = {
          user: userInfo.user,
          accessToken: tokens.accessToken,
          idToken: tokens.idToken,
          timestamp: Date.now()
        };
  
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH, JSON.stringify(authData));
        return authData;
      } catch (error) {
        appMonitor.logError(error, { context: 'google_signin' });
        throw new Error(`Google sign-in failed: ${error.message}`);
      }
    }
  
    async signOut() {
      try {
        await this.initialize();
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH);
      } catch (error) {
        appMonitor.logError(error, { context: 'google_signout' });
        throw new Error(`Google sign-out failed: ${error.message}`);
      }
    }
  
    async getValidToken() {
      try {
        await this.initialize();
        
        const authDataStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH);
        if (!authDataStr) {
          throw new Error('No stored Google authentication');
        }
  
        const authData = JSON.parse(authDataStr);
        const tokenAge = Date.now() - authData.timestamp;
  
        // Token refresh needed if older than 50 minutes (3000000 ms)
        if (tokenAge > 3000000) {
          return await this.refreshToken();
        }
  
        return authData.accessToken;
      } catch (error) {
        appMonitor.logError(error, { context: 'google_get_token' });
        throw error;
      }
    }
  
    async refreshToken() {
      try {
        await this.initialize();
        await GoogleSignin.signInSilently();
        const tokens = await GoogleSignin.getTokens();
        
        const authData = {
          accessToken: tokens.accessToken,
          timestamp: Date.now()
        };
  
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH, JSON.stringify(authData));
        return tokens.accessToken;
      } catch (error) {
        appMonitor.logError(error, { context: 'google_refresh_token' });
        throw new Error('Failed to refresh Google token');
      }
    }
  }
  
  export const googleAuthHandler = new GoogleAuthHandler();
