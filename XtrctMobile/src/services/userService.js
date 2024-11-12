// src/services/UserService.js
import { 
  collection, doc, getDoc, setDoc, updateDoc, query, 
  where, getDocs, serverTimestamp, writeBatch 
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppleAuthentication } from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Msal from 'react-native-msal';
import { firebaseService } from 'src/config/firebaseConfig';
import { taskService } from 'src/services/taskService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';

const MSAL_CONFIG = {
  auth: {
    clientId: 'd7873856-03f0-4615-ba3b-7172c047d24c',
    authority: 'https://login.microsoftonline.com/8018cfb0-2996-4490-889a-3cfd9476b2fa',
  },
  cache: {
    cacheLocation: "localStorage"
  },
  scopes: [
    'User.Read',
    'Calendars.ReadWrite',
    'offline_access'
  ]
};

class UserService {
  constructor() {
    this.db = firebaseService.db;
    this.auth = firebaseService.auth;
    this.usersRef = collection(this.db, 'users');
    this.userSessionsRef = collection(this.db, 'userSessions');
    this.userPreferencesRef = collection(this.db, 'userPreferences');
    this.msalInstance = new Msal.PublicClientApplication(MSAL_CONFIG);
    
    // Initialize Google Sign-In
    GoogleSignin.configure({
      webClientId: process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.REACT_APP_GOOGLE_IOS_CLIENT_ID,
      offlineAccess: true,
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/tasks'
      ]
    });
  }

  async signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const { accessToken, refreshToken } = await GoogleSignin.getTokens();

      await this.createOrUpdateUser(userInfo.user, {
        provider: 'google',
        accessToken,
        refreshToken,
        email: userInfo.user.email
      });

      await calendarIntegrationService.connectCalendar('google', {
        accessToken,
        refreshToken
      });

      await AsyncStorage.setItem('@auth_provider', 'google');
      return await this.fetchUserWithData(userInfo.user.id);
    } catch (error) {
      appMonitor.logError(error, { context: 'google_signin' });
      throw error;
    }
  }

  async signInWithApple() {
    try {
      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME
        ]
      });

      await this.createOrUpdateUser({
        id: appleAuthRequestResponse.user,
        email: appleAuthRequestResponse.email,
        name: `${appleAuthRequestResponse.fullName.givenName} ${appleAuthRequestResponse.fullName.familyName}`
      }, {
        provider: 'apple',
        accessToken: appleAuthRequestResponse.identityToken
      });

      if (Platform.OS === 'ios') {
        await calendarIntegrationService.connectCalendar('apple');
      }

      await AsyncStorage.setItem('@auth_provider', 'apple');
      return await this.fetchUserWithData(appleAuthRequestResponse.user);
    } catch (error) {
      appMonitor.logError(error, { context: 'apple_signin' });
      throw error;
    }
  }

  async signInWithMicrosoft() {
    try {
      const authResult = await this.msalInstance.acquireTokenAsync(MSAL_CONFIG.scopes);
      const microsoftUser = await this.fetchMicrosoftUserInfo(authResult.accessToken);

      await this.createOrUpdateUser({
        id: microsoftUser.id,
        email: microsoftUser.mail || microsoftUser.userPrincipalName,
        name: microsoftUser.displayName,
        photoURL: null
      }, {
        provider: 'microsoft',
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken
      });

      await calendarIntegrationService.connectCalendar('microsoft', {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresOn: authResult.expiresOn
      });

      await AsyncStorage.setItem('@auth_provider', 'microsoft');
      return await this.fetchUserWithData(microsoftUser.id);
    } catch (error) {
      appMonitor.logError(error, { context: 'microsoft_signin' });
      throw error;
    }
  }

  async refreshMicrosoftToken() {
    try {
      const tokens = JSON.parse(await AsyncStorage.getItem('@microsoft_tokens'));
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await this.msalInstance.acquireTokenSilentAsync(
        MSAL_CONFIG.scopes,
        tokens.refreshToken
      );

      await AsyncStorage.setItem('@microsoft_tokens', JSON.stringify({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresOn: newTokens.expiresOn
      }));

      return newTokens;
    } catch (error) {
      appMonitor.logError(error, { context: 'refresh_microsoft_token' });
      throw error;
    }
  }

  async refreshGoogleToken() {
    try {
      const { accessToken, refreshToken } = await GoogleSignin.getTokens();
      return { accessToken, refreshToken };
    } catch (error) {
      appMonitor.logError(error, { context: 'refresh_google_token' });
      throw error;
    }
  }

  async fetchMicrosoftUserInfo(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return await response.json();
    } catch (error) {
      appMonitor.logError(error, { context: 'fetch_microsoft_user' });
      throw error;
    }
  }

  async createOrUpdateUser(authUser, authData) {
    try {
      const batch = writeBatch(this.db);
      const userRef = doc(this.usersRef, authUser.id);
      const userDoc = await getDoc(userRef);

      const userData = {
        email: authUser.email,
        displayName: authUser.name || authUser.displayName,
        photoURL: authUser.photoURL,
        lastLoginAt: serverTimestamp(),
        provider: authData.provider,
        updatedAt: serverTimestamp()
      };

      if (!userDoc.exists()) {
        userData.createdAt = serverTimestamp();
        userData.preferences = this.getDefaultPreferences();
      }

      // Update user document
      batch.set(userRef, userData, { merge: true });

      // Update preferences with auth tokens
      const prefsRef = doc(this.userPreferencesRef, authUser.id);
      batch.set(prefsRef, {
        updatedAt: serverTimestamp(),
        authProvider: authData.provider,
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken
      }, { merge: true });

      await batch.commit();
      await this.cacheUserData(authUser.id, {
        ...userData,
        preferences: userData.preferences
      });

    } catch (error) {
      appMonitor.logError(error, { context: 'create_update_user' });
      throw error;
    }
  }

  async fetchUserWithData(userId) {
    try {
      const cachedUser = await this.getCachedUserData(userId);
      if (!navigator.onLine && cachedUser) {
        return cachedUser;
      }

      const userDoc = await getDoc(doc(this.usersRef, userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const [taskStats, preferences] = await Promise.all([
        taskService.getTaskStatistics(userId),
        this.getUserPreferences(userId)
      ]);

      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
        taskStats,
        preferences
      };

      await this.cacheUserData(userId, userData);
      return userData;
    } catch (error) {
      appMonitor.logError(error, { context: 'fetch_user_data' });
      
      const cachedUser = await this.getCachedUserData(userId);
      if (cachedUser) return cachedUser;
      
      throw error;
    }
  }

  async signOut() {
    try {
      const provider = await AsyncStorage.getItem('@auth_provider');
      
      switch (provider) {
        case 'google':
          await GoogleSignin.signOut();
          break;
        case 'apple':
          // Apple doesn't require sign-out
          break;
        case 'microsoft':
          await this.msalInstance.signOut();
          break;
      }

      await calendarIntegrationService.disconnectCalendars();
      
      await AsyncStorage.multiRemove([
        '@auth_provider',
        '@user_data',
        '@user_preferences',
        '@access_token',
        '@microsoft_tokens',
        '@google_tokens'
      ]);

      await firebaseService.auth.signOut();
    } catch (error) {
      appMonitor.logError(error, { context: 'signout' });
      throw error;
    }
  }

  async cacheUserData(userId, userData) {
    try {
      await AsyncStorage.setItem(
        `@user_${userId}`,
        JSON.stringify({
          data: userData,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'cache_user' });
    }
  }

  async getCachedUserData(userId) {
    try {
      const cached = await AsyncStorage.getItem(`@user_${userId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          return data;
        }
      }
      return null;
    } catch (error) {
      appMonitor.logError(error, { context: 'get_cached_user' });
      return null;
    }
  }

  async getUserPreferences(userId) {
    try {
      const prefsDoc = await getDoc(doc(this.userPreferencesRef, userId));
      return prefsDoc.exists() ? prefsDoc.data() : this.getDefaultPreferences();
    } catch (error) {
      appMonitor.logError(error, { context: 'get_user_preferences' });
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      theme: 'system',
      notifications: true,
      taskDefaultView: 'list',
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      workDays: [1, 2, 3, 4, 5],
      taskCategories: ['Work', 'Personal', 'Meetings', 'Follow-up']
    };
  }
}

export const userService = new UserService();
