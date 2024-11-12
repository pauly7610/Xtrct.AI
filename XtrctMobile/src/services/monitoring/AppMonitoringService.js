// src/services/monitoring/AppMonitoringService.js
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseService } from 'src/config/firebaseConfig';
import { DateTime } from 'luxon';

class AppMonitoringService {
  constructor() {
    this.db = firebaseService.db;
    this.logsRef = collection(this.db, 'logs');
    this.eventsRef = collection(this.db, 'events');
    this.errorsRef = collection(this.db, 'errors');
    this.performanceRef = collection(this.db, 'performance');
    
    // In-memory metrics
    this.metrics = new Map();
    this.activeUsers = new Set();
    this.activeSessions = new Map();

    // Performance tracking
    this.performanceMarks = new Map();
  }

  // User Activity Tracking
  async trackUserActivity(userId, action, details = {}) {
    try {
      await addDoc(this.eventsRef, {
        userId,
        action,
        details,
        timestamp: serverTimestamp(),
        sessionId: this.activeSessions.get(userId)
      });

      this.updateMetrics('userActions', 1);
    } catch (error) {
      console.error('Failed to track user activity:', error);
      this.logError('activity_tracking_failed', error);
    }
  }

  // Error Tracking
  async logError(error, context = {}) {
    try {
      const errorLog = {
        message: error.message || error,
        stack: error.stack,
        context,
        timestamp: serverTimestamp(),
        environment: process.env.NODE_ENV,
        userAgent: navigator.userAgent
      };

      await addDoc(this.errorsRef, errorLog);
      this.updateMetrics('errors', 1);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Performance Monitoring
  startPerformanceTracking(operationId) {
    this.performanceMarks.set(operationId, {
      start: performance.now(),
      marks: new Map()
    });
  }

  markPerformance(operationId, markName) {
    const operation = this.performanceMarks.get(operationId);
    if (operation) {
      operation.marks.set(markName, performance.now());
    }
  }

  async endPerformanceTracking(operationId, details = {}) {
    const operation = this.performanceMarks.get(operationId);
    if (!operation) return;

    const end = performance.now();
    const duration = end - operation.start;

    try {
      await addDoc(this.performanceRef, {
        operationId,
        duration,
        marks: Object.fromEntries(operation.marks),
        details,
        timestamp: serverTimestamp()
      });

      this.updateMetrics('performance', duration);
    } catch (error) {
      this.logError('performance_tracking_failed', error);
    } finally {
      this.performanceMarks.delete(operationId);
    }
  }

  // Session Management
  startUserSession(userId) {
    const sessionId = `session_${DateTime.now().toMillis()}_${userId}`;
    this.activeSessions.set(userId, sessionId);
    this.activeUsers.add(userId);

    return sessionId;
  }

  endUserSession(userId) {
    this.activeSessions.delete(userId);
    this.activeUsers.delete(userId);
  }

  // Calendar Sync Monitoring
  async trackCalendarSync(calendarType, result) {
    try {
      await addDoc(this.logsRef, {
        type: 'calendar_sync',
        calendarType,
        result,
        timestamp: serverTimestamp()
      });

      this.updateMetrics(`calendar_sync_${calendarType}`, 1);
    } catch (error) {
      this.logError('calendar_sync_tracking_failed', error);
    }
  }

  // API Request Tracking
  async trackApiRequest(endpoint, method, duration, status) {
    try {
      await addDoc(this.logsRef, {
        type: 'api_request',
        endpoint,
        method,
        duration,
        status,
        timestamp: serverTimestamp()
      });

      this.updateMetrics('api_requests', 1);
    } catch (error) {
      this.logError('api_tracking_failed', error);
    }
  }

  // Metrics Management
  updateMetrics(metricName, value) {
    const current = this.metrics.get(metricName) || 0;
    this.metrics.set(metricName, current + value);
  }

  getMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      activeUsers: this.activeUsers.size,
      activeSessions: this.activeSessions.size,
      timestamp: DateTime.now().toISO()
    };
  }

  // Health Check
  async performHealthCheck() {
    const checks = {
      database: await this.checkDatabaseConnection(),
      api: await this.checkApiConnections(),
      calendars: await this.checkCalendarConnections(),
      memory: this.checkMemoryUsage(),
      performance: this.checkPerformanceMetrics()
    };

    return {
      status: Object.values(checks).every(check => check.status === 'healthy')
        ? 'healthy'
        : 'degraded',
      checks,
      timestamp: DateTime.now().toISO()
    };
  }

  // Usage example in your app:
  /*
    // Track user actions
    await appMonitor.trackUserActivity(userId, 'calendar_view', { 
      calendarType: 'google',
      viewType: 'month' 
    });

    // Track performance
    appMonitor.startPerformanceTracking('calendar_sync');
    appMonitor.markPerformance('calendar_sync', 'google_fetch_start');
    // ... sync operations ...
    appMonitor.markPerformance('calendar_sync', 'google_fetch_end');
    await appMonitor.endPerformanceTracking('calendar_sync', { 
      calendarType: 'google',
      eventCount: 150 
    });

    // Track errors
    try {
      // ... your code ...
    } catch (error) {
      await appMonitor.logError(error, {
        operation: 'calendar_sync',
        userId: currentUser.id
      });
    }

    // Get metrics
    const metrics = appMonitor.getMetrics();
    console.log('App metrics:', metrics);
  */
}

export const appMonitor = new AppMonitoringService();
