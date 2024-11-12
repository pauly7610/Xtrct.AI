// src/services/platform/AuthHandlers.js
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-google-app-auth';
import * as MicrosoftAuth from 'expo-microsoft-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuthConfig } from 'src/config/firebaseAuthConfig';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const AUTH_STORAGE_KEYS = {
  GOOGLE_AUTH: '@auth_google',
  MICROSOFT_AUTH: '@auth_microsoft',
  APPLE_AUTH: '@auth_apple'
};

export class PlatformAuthHandlers {
  static async handleGoogleAuth() {
    try {
      const config = {
        iosClientId: firebaseAuthConfig.google.iosClientId,
        androidClientId: firebaseAuthConfig.google.androidClientId,
        scopes: [
          'profile',
          'email',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
          'https://www.googleapis.com/auth/calendar.readonly',
          'https://www.googleapis.com/auth/tasks'
        ],
        offlineAccess: true
      };

      const { type, accessToken, refreshToken, user } = await Google.logInAsync(config);
      
      if (type === 'success') {
        const authData = {
          accessToken,
          refreshToken,
          user,
          timestamp: Date.now()
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH, JSON.stringify(authData));
        return authData;
      }
      throw new Error('Google auth cancelled');
    } catch (error) {
      appMonitor.logError(error, { context: 'google_auth' });
      throw new Error(`Google authentication failed: ${error.message}`);
    }
  }

  static async handleMicrosoftAuth() {
    try {
      const config = {
        clientId: firebaseAuthConfig.microsoft.clientId,
        tenantId: firebaseAuthConfig.microsoft.tenantId,
        redirectUri: firebaseAuthConfig.microsoft.redirectUri,
        scopes: [
          'user.read',
          'calendars.read',
          'calendars.readwrite',
          'mail.read',
          'offline_access'
        ]
      };

      const { token, refreshToken, expiresOn } = await MicrosoftAuth.signInAsync(config);
      
      const authData = {
        accessToken: token,
        refreshToken,
        expiresOn,
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.MICROSOFT_AUTH, JSON.stringify(authData));
      return authData;
    } catch (error) {
      appMonitor.logError(error, { context: 'microsoft_auth' });
      throw new Error(`Microsoft authentication failed: ${error.message}`);
    }
  }

  static async handleAppleAuth() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS devices');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const authData = {
        accessToken: credential.identityToken,
        user: {
          email: credential.email,
          name: credential.fullName ? 
            `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : 
            null
        },
        timestamp: Date.now()
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.APPLE_AUTH, JSON.stringify(authData));
      return authData;
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        throw new Error('Apple auth cancelled by user');
      }
      appMonitor.logError(error, { context: 'apple_auth' });
      throw new Error(`Apple authentication failed: ${error.message}`);
    }
  }

  static async revokeAuth(provider) {
    try {
      switch (provider) {
        case 'google':
          await googleAuthHandler.signOut();
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.GOOGLE_AUTH);
          break;
        case 'microsoft':
          await microsoftAuthHandler.logout();
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.MICROSOFT_AUTH);
          break;
        case 'apple':
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.APPLE_AUTH);
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error) {
      appMonitor.logError(error, { context: `${provider}_auth_revoke` });
      throw new Error(`Failed to revoke ${provider} authentication: ${error.message}`);
    }
  }
}
