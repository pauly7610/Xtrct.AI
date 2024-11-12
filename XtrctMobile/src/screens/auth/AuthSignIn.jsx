// src/screens/auth/AuthSignIn.jsx

import React, { useState, useCallback } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { userService } from 'src/services/userService';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import { navigationHandlers } from 'src/navigation/navigationHandlers';

const AuthSignIn = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  
  const { handleAuthSuccess, handleAuthCancel } = navigationHandlers.authScreenHandlers;

  React.useEffect(() => {
    appMonitor.trackScreenView('AuthSignIn');
  }, []);

  const handleAuth = useCallback(async (provider) => {
    if (loading) return;

    try {
      setLoading(true);
      setSelectedProvider(provider);

      appMonitor.trackUserActivity('auth_attempt', { provider });

      let authResult;
      switch (provider) {
        case 'google':
          authResult = await userService.signInWithGoogle();
          break;
        case 'microsoft':
          authResult = await userService.signInWithMicrosoft();
          break;
        case 'apple':
          authResult = await userService.signInWithApple();
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      if (authResult?.user) {
        await calendarIntegrationService.initializeCalendars(authResult.user.uid);
        handleAuthSuccess(navigation, authResult.user);
      } else {
        handleAuthCancel(navigation);
      }

    } catch (error) {
      appMonitor.logError(error, {
        context: 'oauth_signin',
        provider
      });
      handleAuthCancel(navigation);
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  }, [navigation, loading]);

  const renderAuthButton = useCallback(({ provider, label, iconName }) => (
    <TouchableOpacity
      style={[
        styles.authButton,
        (loading && selectedProvider !== provider) && styles.authButtonDisabled
      ]}
      onPress={() => handleAuth(provider)}
      disabled={loading}
      activeOpacity={0.7}
    >
      <AntDesign 
        name={iconName} 
        size={24} 
        color="white" 
        style={styles.authButtonIcon}
      />
      <Text style={styles.authButtonText}>
        Continue with {label}
      </Text>
      {loading && selectedProvider === provider && (
        <ActivityIndicator color="#007AFF" style={styles.loader} />
      )}
    </TouchableOpacity>
  ), [loading, selectedProvider, handleAuth]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AntDesign 
            name="appstore1" 
            size={80} 
            color="white" 
            style={styles.headerIcon}
          />
          <Text style={styles.headerTitle}>
            Welcome Back
          </Text>
          <Text style={styles.headerSubtitle}>
            Choose a method to sign in
          </Text>
        </View>

        <View style={styles.authButtonsContainer}>
          {renderAuthButton({ provider: 'google', label: 'Google', iconName: 'google' })}
          {renderAuthButton({ provider: 'microsoft', label: 'Microsoft', iconName: 'windows' })}
          {renderAuthButton({ provider: 'apple', label: 'Apple', iconName: 'apple1' })}
        </View>

        <Text style={styles.privacyNotice}>
          By continuing, you agree to our{'\n'}
          Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (styles remain the same)
});

export default AuthSignIn;