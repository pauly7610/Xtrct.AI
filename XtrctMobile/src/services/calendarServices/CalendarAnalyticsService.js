// src/services/CalendarAnalyticsService.js
import { DateTime } from 'luxon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calendarIntegrationService } from 'src/services/calendarIntegrations/CalendarIntegrationService';
import { appMonitor } from 'src/services/monitoring/AppMonitoringService';

const CACHE_KEYS = {
  ANALYTICS: '@calendar_analytics_',
  PREFERENCES: '@user_preferences_'
};

class CalendarAnalyticsService {
  constructor() {
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.analyticsCache = new Map();
  }

  async getAnalytics(userId, timeRange) {
    try {
      // Check cache first
      const cacheKey = `${userId}_${timeRange.start}_${timeRange.end}`;
      const cachedData = await this.getCachedAnalytics(cacheKey);
      if (cachedData) return cachedData;

      const events = await calendarIntegrationService.getAllEvents(timeRange);
      const userPrefs = await this.getUserPreferences(userId);
      
      const analytics = {
        overview: this.getOverviewMetrics(events),
        timeAnalysis: this.getTimeAnalysis(events, userPrefs),
        collaboration: this.getCollaborationMetrics(events),
        worklifeBalance: this.getWorkLifeBalanceMetrics(events, userPrefs),
        productivity: this.getProductivityMetrics(events),
        trends: this.getTrends(events, timeRange),
        recommendations: await this.generateRecommendations(events, userPrefs)
      };

      // Cache the results
      await this.cacheAnalytics(cacheKey, analytics);
      return analytics;
    } catch (error) {
      appMonitor.logError(error, { context: 'calendar_analytics', userId });
      throw new Error('Failed to generate analytics');
    }
  }

  getOverviewMetrics(events) {
    const totalMeetings = events.length;
    const meetingDurations = events.map(event => 
      event.end.diff(event.start, 'minutes').minutes
    );

    return {
      totalMeetings,
      totalDuration: meetingDurations.reduce((acc, dur) => acc + dur, 0),
      averageDuration: totalMeetings ? 
        meetingDurations.reduce((acc, dur) => acc + dur, 0) / totalMeetings : 0,
      recurringMeetings: events.filter(e => e.recurrence).length,
      oneOnOneMeetings: events.filter(e => e.attendees?.length === 2).length,
      meetingDistribution: {
        short: meetingDurations.filter(d => d <= 30).length,
        medium: meetingDurations.filter(d => d > 30 && d <= 60).length,
        long: meetingDurations.filter(d => d > 60).length
      }
    };
  }

  getTimeAnalysis(events, userPrefs) {
    const workingHours = this.parseWorkingHours(userPrefs.workingHours);
    const timeSlots = this.groupEventsByTimeSlot(events);
    const dayAnalysis = this.analyzeDayPatterns(events);

    return {
      timeSlots,
      peakHours: this.identifyPeakHours(timeSlots),
      quietHours: this.identifyQuietHours(timeSlots, workingHours),
      dayPatterns: dayAnalysis,
      workingHoursUtilization: this.calculateWorkingHoursUtilization(events, workingHours),
      timeZoneImpact: this.analyzeTimeZoneImpact(events)
    };
  }

  getCollaborationMetrics(events) {
    const interactions = new Map();
    const teamInteractions = new Map();

    events.forEach(event => {
      this.processEventInteractions(event, interactions, teamInteractions);
    });

    return {
      collaborators: this.processCollaboratorMetrics(interactions),
      teams: this.processTeamMetrics(teamInteractions),
      networkAnalysis: this.analyzeCollaborationNetwork(interactions),
      meetingSize: this.analyzeMeetingSizes(events),
      crossTeamCollaboration: this.analyzeCrossTeamCollaboration(events)
    };
  }

  getWorkLifeBalanceMetrics(events, userPrefs) {
    const workingHours = this.parseWorkingHours(userPrefs.workingHours);
    
    return {
      outsideHoursWork: this.analyzeOutsideHoursWork(events, workingHours),
      meetingLoad: this.analyzeMeetingLoad(events),
      breakViolations: this.analyzeBreakViolations(events, userPrefs),
      weekendWork: this.analyzeWeekendWork(events),
      wellnessScore: this.calculateWellnessScore(events, userPrefs)
    };
  }

  getProductivityMetrics(events) {
    return {
      focusTime: this.calculateFocusTime(events),
      meetingEfficiency: this.analyzeMeetingEfficiency(events),
      timeUtilization: this.analyzeTimeUtilization(events),
      context: {
        switchingCost: this.calculateContextSwitchingCost(events),
        topicClustering: this.analyzeTopicClustering(events)
      },
      productivity: {
        score: this.calculateProductivityScore(events),
        trends: this.analyzeProductivityTrends(events)
      }
    };
  }

  getTrends(events, timeRange) {
    return {
      weekly: this.analyzeWeeklyTrends(events),
      monthly: this.analyzeMonthlyTrends(events),
      yearOverYear: this.compareYearOverYear(events),
      patterns: {
        seasonal: this.analyzeSeasonalPatterns(events),
        recurring: this.identifyRecurringPatterns(events)
      },
      growth: this.calculateGrowthMetrics(events, timeRange)
    };
  }

  async generateRecommendations(events, userPrefs) {
    const metrics = {
      overview: this.getOverviewMetrics(events),
      worklife: this.getWorkLifeBalanceMetrics(events, userPrefs),
      productivity: this.getProductivityMetrics(events)
    };

    return {
      scheduling: this.generateSchedulingRecommendations(metrics),
      worklife: this.generateWorkLifeRecommendations(metrics),
      productivity: this.generateProductivityRecommendations(metrics),
      collaboration: this.generateCollaborationRecommendations(metrics)
    };
  }

  // Helper methods
  parseWorkingHours(workingHours) {
    return {
      start: DateTime.fromFormat(workingHours.start, 'HH:mm'),
      end: DateTime.fromFormat(workingHours.end, 'HH:mm')
    };
  }

  async getCachedAnalytics(key) {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEYS.ANALYTICS}${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheTimeout) {
          return data;
        }
      }
      return null;
    } catch (error) {
      appMonitor.logError(error, { context: 'analytics_cache_get' });
      return null;
    }
  }

  async cacheAnalytics(key, data) {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEYS.ANALYTICS}${key}`,
        JSON.stringify({
          data,
          timestamp: Date.now()
        })
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'analytics_cache_set' });
    }
  }

  async getUserPreferences(userId) {
    try {
      const prefs = await AsyncStorage.getItem(`${CACHE_KEYS.PREFERENCES}${userId}`);
      return prefs ? JSON.parse(prefs) : this.getDefaultPreferences();
    } catch (error) {
      appMonitor.logError(error, { context: 'get_user_preferences' });
      return this.getDefaultPreferences();
    }
  }

  getDefaultPreferences() {
    return {
      workingHours: { start: '09:00', end: '17:00' },
      minimumBreak: 15,
      lunchTime: { start: '12:00', end: '13:00' },
      workDays: [1, 2, 3, 4, 5] // Monday to Friday
    };
  }
}

export const calendarAnalyticsService = new CalendarAnalyticsService();
