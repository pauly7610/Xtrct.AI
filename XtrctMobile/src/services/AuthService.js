// src/services/AuthService.js
import { 
  OAuthProvider, 
  GoogleAuthProvider, 
  signInWithCredential,
  signOut 
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_CONFIG = {
  STORAGE_KEYS: {
    AUTH_PROVIDER: 'auth_provider',
    AUTH_TOKENS: 'auth_tokens',
    USER_INFO: 'user_info',
    LAST_LOGIN: 'last_login',
    CALENDAR_PERMISSIONS: 'calendar_permissions'
  },
  PROVIDERS: {
    GOOGLE: {
      name: 'google',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ]
    },
    MICROSOFT: {
      name: 'microsoft',
      scopes: [
        'user.read',
        'calendars.readwrite',
        'mail.read'
      ]
    },
    APPLE: {
      name: 'apple',
      scopes: [
        'email',
        'name'
      ]
    }
  }
};

class AuthService {
  constructor() {
    this.auth = firebaseService.auth;
    this.setupProviders();
  }

  setupProviders() {
    // Google provider setup
    this.googleProvider = new GoogleAuthProvider();
    AUTH_CONFIG.PROVIDERS.GOOGLE.scopes.forEach(scope => 
      this.googleProvider.addScope(scope)
    );

    // Microsoft provider setup
    this.microsoftProvider = new OAuthProvider('microsoft.com');
    AUTH_CONFIG.PROVIDERS.MICROSOFT.scopes.forEach(scope => 
      this.microsoftProvider.addScope(scope)
    );

    // Apple provider setup
    this.appleProvider = new OAuthProvider('apple.com');
    AUTH_CONFIG.PROVIDERS.APPLE.scopes.forEach(scope => 
      this.appleProvider.addScope(scope)
    );
  }

  async signIn(provider, token) {
    try {
      let credential;
      switch (provider) {
        case AUTH_CONFIG.PROVIDERS.GOOGLE.name:
          credential = GoogleAuthProvider.credential(null, token);
          break;
        case AUTH_CONFIG.PROVIDERS.MICROSOFT.name:
          credential = this.microsoftProvider.credential(token);
          break;
        case AUTH_CONFIG.PROVIDERS.APPLE.name:
          credential = this.appleProvider.credential(token);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      const userCredential = await signInWithCredential(this.auth, credential);
      
      // Store auth data
      await this.storeAuthData({
        provider,
        token,
        user: userCredential.user,
        timestamp: new Date().toISOString()
      });

      return userCredential;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async storeAuthData(authData) {
    try {
      const authDataToStore = {
        provider: authData.provider,
        token: authData.token,
        userId: authData.user.uid,
        email: authData.user.email,
        lastLoginAt: authData.timestamp
      };

      await AsyncStorage.multiSet([
        [AUTH_CONFIG.STORAGE_KEYS.AUTH_PROVIDER, authData.provider],
        [AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKENS, JSON.stringify(authDataToStore)],
        [AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN, authData.timestamp]
      ]);
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  async signOut() {
    try {
      await signOut(this.auth);
      await this.clearAuthData();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw new Error('Failed to sign out');
    }
  }

  async clearAuthData() {
    const keysToRemove = Object.values(AUTH_CONFIG.STORAGE_KEYS);
    await AsyncStorage.multiRemove(keysToRemove);
  }

  async getAuthState() {
    try {
      const user = this.auth.currentUser;
      if (!user) return null;

      const [provider, tokens, lastLogin] = await AsyncStorage.multiGet([
        AUTH_CONFIG.STORAGE_KEYS.AUTH_PROVIDER,
        AUTH_CONFIG.STORAGE_KEYS.AUTH_TOKENS,
        AUTH_CONFIG.STORAGE_KEYS.LAST_LOGIN
      ]);

      return {
        user,
        provider: provider[1],
        tokens: tokens[1] ? JSON.parse(tokens[1]) : null,
        lastLoginAt: lastLogin[1]
      };
    } catch (error) {
      console.error('Failed to get auth state:', error);
      return null;
    }
  }

  async refreshToken() {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user is signed in');

      const idToken = await user.getIdToken(true);
      const authData = await this.getAuthState();
      
      if (!authData?.tokens) throw new Error('No stored tokens found');

      // Update stored tokens
      await this.storeAuthData({
        ...authData,
        token: idToken,
        timestamp: new Date().toISOString()
      });

      return idToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged(callback);
  }
}

export const authService = new AuthService();
