// src/screens/HomeScreen.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { navigationHandlers } from 'src/navigation/navigationHandlers';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { firebaseService } from 'src/services/firebaseConfig.js';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { handleStart } = navigationHandlers.homeScreenHandlers;

  const [isLoading, setIsLoading] = useState(true);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    appMonitor.trackScreenView('HomeScreen');
    checkUserStatus();
  }, []);

  const checkUserStatus = useCallback(async () => {
    try {
      const currentUser = firebaseService.getCurrentUser();
      if (currentUser) {
        setHasUser(true);
        handleStart(navigation);
      } else {
        setHasUser(false);
      }
    } catch (error) {
      appMonitor.logError(error, { context: 'check_user_status' });
    } finally {
      setIsLoading(false);
    }
  }, [navigation, handleStart]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('path/to/your/MainLogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Xtract.AI</Text>
            <Text style={styles.subtitle}>
              Please wait while we load your account...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('path/to/your/MainLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Xtract.AI</Text>
          <Text style={styles.subtitle}>Tap anywhere to continue</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins',
  },
  subtitle: {
    fontSize: 18,
    color: 'gray',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
});

export default HomeScreen;