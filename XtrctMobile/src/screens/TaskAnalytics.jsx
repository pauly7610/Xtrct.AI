import React, { useState, useEffect, useCallback } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import { navigationHandlers } from 'src/navigation/navigationHandlers';

// Services
import { taskService } from 'src/services/taskService';
import { anthropicService } from 'src/services/AnthropicService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';
import { calendarAnalyticsService } from 'src/services/calendarServices/CalendarAnalyticsService';
import { TaskStatus, PriorityLevels } from 'src/config/constants';

const TaskAnalytics = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { handleClose, handleShare } = navigationHandlers.taskAnalyticsHandlers;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [focusStats, setFocusStats] = useState(null);
  const [calendarImpact, setCalendarImpact] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);

  const taskId = route.params?.taskId;

  const handleError = useCallback((error, context) => {
    appMonitor.logError(error, { context });
    Alert.alert(
      'Error',
      'Failed to load data. Please try again.',
      [{ text: 'OK' }]
    );
  }, []);

  useEffect(() => {
    appMonitor.trackScreenView('TaskAnalytics', { taskId });
    loadAnalytics();
  }, [taskId]);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      if (!taskId) {
        throw new Error('No task ID provided');
      }

      const [taskAnalytics, focusData, calendarData, insights] = await Promise.all([
        taskService.getTaskAnalytics(taskId).catch(error => {
          handleError(error, 'get_task_analytics');
          return null;
        }),
        taskService.getFocusStats(taskId).catch(error => {
          handleError(error, 'get_focus_stats');
          return null;
        }),
        calendarAnalyticsService.getTaskCalendarImpact(taskId).catch(error => {
          handleError(error, 'get_calendar_impact');
          return null;
        }),
        anthropicService.analyzeTaskPatterns([taskId]).catch(error => {
          handleError(error, 'get_ai_insights');
          return null;
        })
      ]);

      if (!taskAnalytics) {
        throw new Error('Failed to load task analytics');
      }

      setAnalytics(taskAnalytics);
      setFocusStats(focusData);
      setCalendarImpact(calendarData);
      setAiInsights(insights);

      appMonitor.trackEvent('analytics_loaded', {
        taskId,
        hasFocusData: !!focusData,
        hasCalendarData: !!calendarData,
        hasInsights: !!insights
      });

    } catch (error) {
      handleError(error, 'load_analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [taskId, handleError]);

  const handleSharePress = useCallback(() => {
    const shareData = {
      taskId,
      analytics,
      focusStats,
      calendarImpact,
      insights: aiInsights
    };
    handleShare(navigation, shareData);
  }, [navigation, taskId, analytics, focusStats, calendarImpact, aiInsights, handleShare]);

  const renderProgressOverview = useCallback(() => {
    if (!analytics || !focusStats) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Progress Overview</Text>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Status: {analytics.status || TaskStatus.PENDING}
          </Text>
          <Text style={styles.detailText}>
            Priority: {analytics.priority || PriorityLevels.MEDIUM}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View>
            <Text style={styles.statLabel}>Time Spent</Text>
            <Text style={styles.statValue}>
              {focusStats.totalFocusTime || 0}m
            </Text>
          </View>

          <View>
            <Text style={styles.statLabel}>Completion</Text>
            <Text style={styles.statValue}>
              {analytics.completionRate || 0}%
            </Text>
          </View>
        </View>
      </View>
    );
  }, [analytics, focusStats]);

  const renderFocusSessions = useCallback(() => {
    if (!focusStats?.sessions?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Focus Sessions</Text>
        {focusStats.sessions.map((session, index) => (
          <View key={index} style={styles.sessionCard}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>Session {index + 1}</Text>
              <Text style={styles.sessionDate}>
                {new Date(session.startTime).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.sessionDuration}>{session.duration}m</Text>
          </View>
        ))}
      </View>
    );
  }, [focusStats]);

  const renderAiInsights = useCallback(() => {
    if (!aiInsights?.suggestions?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Insights</Text>
        {aiInsights.suggestions.map((insight, index) => (
          <View key={index} style={styles.insightCard}>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>
    );
  }, [aiInsights]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#007AFF" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => handleClose(navigation)}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.headerTitle}>Task Analytics</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSharePress}
          style={styles.shareButton}
          accessibilityLabel="Share task analytics"
        >
          <Icon name="share" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshing={refreshing}
        onRefresh={() => loadAnalytics(true)}
        keyboardShouldPersistTaps="handled"
      >
        {renderProgressOverview()}
        {renderFocusSessions()}
        {renderAiInsights()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ... (styles remain the same)
});

export default TaskAnalytics;