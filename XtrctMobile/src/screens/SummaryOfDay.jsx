// src/screens/SummaryOfDay.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, View, Alert, Platform, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { navigationHandlers } from 'src/navigation/navigationHandlers';

// Services
import { firebaseService } from 'src/services/firebaseConfig.js';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { userService } from 'src/services/userService';

// Components
import StatusBar from 'src/components/common/StatusBar';
import ProfileButton from 'src/components/common/ProfileButton';
import SearchBar from 'src/components/common/SearchBar';
import BottomNavigation from 'src/components/common/BottomNavigation';
import LoadingView from 'src/views/LoadingView';
import TasksView from 'src/views/TasksView';
import EmptyStateView from 'src/views/EmptyStateView';

export default function SummaryOfDay() {
  const navigation = useNavigation();
  const { handleNewTask, handleViewAnalytics, handleShare, handleSignOut } = 
    navigationHandlers.summaryOfDayHandlers;

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarSyncStatus, setCalendarSyncStatus] = useState({
    google: true,
    outlook: true,
    apple: true
  });

  const handleCalendarError = useCallback(async (provider) => {
    setCalendarSyncStatus(prev => ({ ...prev, [provider]: false }));
    if (provider === 'outlook' || provider === 'google') {
      try {
        await userService.refreshToken(provider);
        setCalendarSyncStatus(prev => ({ ...prev, [provider]: true }));
      } catch (error) {
        appMonitor.logError(error, { context: 'calendar_refresh_token', provider });
      }
    }
  }, []);

  const fetchDaySummary = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = firebaseService.getCurrentUser();
      if (!currentUser) {
        appMonitor.trackEvent('auth_redirect', { reason: 'no_user' });
        handleSignOut(navigation);
        return;
      }

      const today = new Date();
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const firebaseTasks = await firebaseService.getTasks(currentUser.uid).catch(error => {
        appMonitor.logError(error, { context: 'fetch_firebase_tasks' });
        return [];
      });

      const [googleEvents, outlookEvents, appleEvents] = await Promise.all([
        calendarIntegrationService.getCalendarEvents('google', today, thirtyDaysFromNow)
          .catch(error => {
            handleCalendarError('google');
            appMonitor.logError(error, { context: 'fetch_google_events' });
            return [];
          }),
        calendarIntegrationService.getCalendarEvents('outlook', today, thirtyDaysFromNow)
          .catch(error => {
            handleCalendarError('outlook');
            appMonitor.logError(error, { context: 'fetch_outlook_events' });
            return [];
          }),
        Platform.OS === 'ios'
          ? calendarIntegrationService.getCalendarEvents('apple', today, thirtyDaysFromNow)
              .catch(error => {
                handleCalendarError('apple');
                appMonitor.logError(error, { context: 'fetch_apple_events' });
                return [];
              })
          : []
      ]);

      const allItems = [
        // ... (data formatting remains the same)
      ].sort((a, b) => {
        const dateA = new Date(a.start || a.dueDate);
        const dateB = new Date(b.start || b.dueDate);
        return dateA - dateB;
      });

      setTasks(allItems);
      appMonitor.trackEvent('calendar_sync_complete', {
        itemCount: allItems.length,
        calendarSyncStatus
      });

    } catch (error) {
      appMonitor.logError(error, { context: 'fetch_day_summary' });
      Alert.alert(
        'Error',
        'Failed to load your schedule. Pull down to refresh.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [navigation, handleCalendarError, handleSignOut]);

  useEffect(() => {
    appMonitor.trackScreenView('Summary');
    fetchDaySummary();
  }, [fetchDaySummary]);

  const handleTaskCreation = useCallback(() => {
    appMonitor.trackEvent('new_task_initiated');
    handleNewTask(navigation, {
      onTaskCreated: fetchDaySummary
    });
  }, [navigation, handleNewTask, fetchDaySummary]);

  const handleRefresh = useCallback(async () => {
    appMonitor.trackEvent('manual_refresh_initiated');
    setRefreshing(true);
    await fetchDaySummary();
    setRefreshing(false);
  }, [fetchDaySummary]);

  const handleAnalytics = useCallback(() => {
    handleViewAnalytics(navigation, { tasks });
  }, [navigation, handleViewAnalytics, tasks]);

  const handleSharePress = useCallback(() => {
    handleShare(navigation, { tasks });
  }, [navigation, handleShare, tasks]);

  const getTaskColor = useCallback((category) => {
    const colors = {
      personal: '#EFEEFE',
      work: '#E0FAEF',
      study: '#FAF2E3',
      default: '#EFEEFE'
    };
    return colors[category] || colors.default;
  }, []);

  const filteredTasks = tasks.filter(task => 
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar />
      <ProfileButton onPress={() => handleSignOut(navigation)} />
      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={() => appMonitor.trackEvent('search_performed', { query: searchQuery })}
      />

      {loading ? (
        <LoadingView />
      ) : filteredTasks.length > 0 ? (
        <TasksView 
          tasks={filteredTasks}
          onNewTask={handleTaskCreation}
          onRefresh={handleRefresh}
          onAnalytics={handleAnalytics}
          onShare={handleSharePress}
          refreshing={refreshing}
          calendarSyncStatus={calendarSyncStatus}
        />
      ) : (
        <EmptyStateView 
          onNewTask={handleTaskCreation}
          searchActive={searchQuery.length > 0}
        />
      )}

      <BottomNavigation 
        onNewTask={handleTaskCreation}
        onAnalytics={handleAnalytics}
        onShare={handleSharePress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (styles remain the same)
});