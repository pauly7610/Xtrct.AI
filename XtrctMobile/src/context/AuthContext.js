// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { firebaseService } from 'src/config/firebaseConfig';
import { userService } from 'src/services/userService';
import { errorService } from 'src/services/errorService';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import storageConfig from 'src/config/storageConfig';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  // Initialize biometric authentication
  useEffect(() => {
    checkBiometricSupport();
  }, []);
  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseService.auth, async (user) => {
      if (user) {
        try {
          const userData = await userService.fetchUser(user.uid);
          setUser(userData);
          await AsyncStorage.setItem(
            storageConfig.keys.auth.USER_DATA,
            JSON.stringify(userData)
          );

          // Initialize calendar integrations
          await calendarIntegrationService.initialize(userData);

        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(user);
        }
      } else {
        setUser(null);
        await AsyncStorage.multiRemove([
          storageConfig.keys.auth.USER_DATA,
          storageConfig.keys.auth.BIOMETRICS_ENABLED
        ]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const savedPreference = await AsyncStorage.getItem(
        storageConfig.keys.auth.BIOMETRICS_ENABLED
      );

      setBiometricsEnabled(compatible && enrolled && savedPreference === 'true');
    } catch (error) {
      console.error('Biometrics check failed:', error);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use password'
      });
      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };

  const handleAuthError = (error) => {
    const errorMessage = errorService.getErrorMessage('auth', error);
    setError(errorMessage);
    Alert.alert(errorMessage.title, errorMessage.message);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();
      
      // Get Google Calendar access token if available
      const { accessToken } = await GoogleSignin.getTokens();
      
      const result = await firebaseService.signInWithGoogle(idToken);      
      if (result?.user) {
        // Store tokens
        await AsyncStorage.setItem(
          storageConfig.keys.auth.GOOGLE_ACCESS_TOKEN,
          accessToken
        );
        
        // Initialize calendar with token
        await calendarIntegrationService.connectCalendar('google', accessToken);
      }

      return result.user;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);

      const credential = await appleAuth.signInAsync({
        requestedScopes: [
          appleAuth.AppleAuthenticationScope.FULL_NAME,
          appleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });

      const result = await firebaseService.signInWithApple(credential);
      
      if (result?.user && Platform.OS === 'ios') {
        // Initialize Apple calendar integration
        await calendarIntegrationService.connectCalendar('apple');
      }
      return result.user;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithMicrosoft = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await firebaseService.signInWithMicrosoft();
      
      if (result?.user) {
        const { accessToken } = result.additionalUserInfo;
        
        // Store Microsoft token
        await AsyncStorage.setItem(
          storageConfig.keys.auth.MICROSOFT_ACCESS_TOKEN,
          accessToken
        );
        
        // Initialize Outlook calendar
        await calendarIntegrationService.connectCalendar('outlook', accessToken);
      }

      return result.user;
    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const logOut = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sign out from all providers
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      
      await firebaseService.auth.signOut();
      
      // Clear all stored data
      await AsyncStorage.multiRemove([
        storageConfig.keys.auth.USER_DATA,
        storageConfig.keys.auth.GOOGLE_ACCESS_TOKEN,
        storageConfig.keys.auth.MICROSOFT_ACCESS_TOKEN,
        storageConfig.keys.auth.BIOMETRICS_ENABLED
      ]);

      // Disconnect calendar integrations
      await calendarIntegrationService.disconnectAll();

    } catch (error) {
      handleAuthError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const value = {
    user,
    loading,
    error,
    biometricsEnabled,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
    logOut,
    authenticateWithBiometrics,
    isAuthenticated: () => user !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
