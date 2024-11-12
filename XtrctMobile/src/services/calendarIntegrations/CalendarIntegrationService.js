// src/services/calendarIntegrations/CalendarIntegrationService.js
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appMonitor } from '../monitoring/AppMonitoringService';
import OutlookCalendarService from './OutlookCalendarService';
import { userService } from '../userService';

const STORAGE_KEYS = {
  CONNECTED_CALENDARS: '@connected_calendars',
  CALENDAR_SYNC_STATUS: '@calendar_sync_status'
};

class CalendarIntegrationService {
  constructor() {
    this.connectedCalendars = [];
    this.loadConnectedCalendars();
  }

  async loadConnectedCalendars() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTED_CALENDARS);
      this.connectedCalendars = stored ? JSON.parse(stored) : [];
    } catch (error) {
      appMonitor.logError(error, { context: 'load_connected_calendars' });
      this.connectedCalendars = [];
    }
  }

  async saveConnectedCalendars() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CONNECTED_CALENDARS,
        JSON.stringify(this.connectedCalendars)
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'save_connected_calendars' });
    }
  }

  async connectCalendar(provider, authData) {
    try {
      switch (provider) {
        case 'microsoft':
        case 'outlook':
          await OutlookCalendarService.initialize(authData);
          break;
        case 'google':
          // Initialize Google Calendar with authData
          // Implementation depends on your Google Calendar service
          break;
        case 'apple':
          if (Platform.OS !== 'ios') {
            throw new Error('Apple Calendar is only available on iOS');
          }
          // Implementation depends on your Apple Calendar service
          break;
        default:
          throw new Error(`Unsupported calendar provider: ${provider}`);
      }

      // Add to connected calendars if not already present
      if (!this.connectedCalendars.includes(provider)) {
        this.connectedCalendars.push(provider);
        await this.saveConnectedCalendars();
      }

      await this.updateSyncStatus(provider, true);
      appMonitor.trackEvent('calendar_connected', { provider });
      return true;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'connect_calendar',
        provider 
      });
      await this.updateSyncStatus(provider, false);
      throw error;
    }
  }

  async disconnectCalendar(provider) {
    try {
      switch (provider) {
        case 'microsoft':
        case 'outlook':
          await OutlookCalendarService.clearCache();
          break;
        case 'google':
          // Clear Google Calendar cache
          break;
        case 'apple':
          // Clear Apple Calendar cache
          break;
      }

      this.connectedCalendars = this.connectedCalendars.filter(p => p !== provider);
      await this.saveConnectedCalendars();
      await this.updateSyncStatus(provider, false);
      appMonitor.trackEvent('calendar_disconnected', { provider });
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'disconnect_calendar',
        provider 
      });
      throw error;
    }
  }

  async disconnectCalendars() {
    try {
      const providers = [...this.connectedCalendars];
      await Promise.all(
        providers.map(provider => this.disconnectCalendar(provider))
      );
    } catch (error) {
      appMonitor.logError(error, { context: 'disconnect_all_calendars' });
      throw error;
    }
  }

  async getCalendarEvents(provider, startDate, endDate) {
    try {
      if (!this.connectedCalendars.includes(provider)) {
        return [];
      }

      let events = [];
      switch (provider) {
        case 'microsoft':
        case 'outlook':
          events = await OutlookCalendarService.fetchCalendarEvents(startDate, endDate);
          break;
        case 'google':
          // Fetch Google Calendar events
          break;
        case 'apple':
          if (Platform.OS !== 'ios') {
            return [];
          }
          // Fetch Apple Calendar events
          break;
      }

      await this.updateSyncStatus(provider, true);
      return events;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'get_calendar_events',
        provider,
        details: { startDate, endDate }
      });
      await this.updateSyncStatus(provider, false);

      // Try to recover from auth errors
      if (this.isAuthError(error)) {
        try {
          await this.refreshCalendarAuth(provider);
          return await this.getCalendarEvents(provider, startDate, endDate);
        } catch (refreshError) {
          appMonitor.logError(refreshError, { 
            context: 'refresh_calendar_auth',
            provider 
          });
        }
      }

      return [];
    }
  }

  async createCalendarEvent(provider, eventDetails) {
    try {
      if (!this.connectedCalendars.includes(provider)) {
        throw new Error(`Calendar not connected: ${provider}`);
      }

      switch (provider) {
        case 'microsoft':
        case 'outlook':
          return await OutlookCalendarService.createCalendarEvent(eventDetails);
        case 'google':
          // Create Google Calendar event
          break;
        case 'apple':
          if (Platform.OS !== 'ios') {
            throw new Error('Apple Calendar is only available on iOS');
          }
          // Create Apple Calendar event
          break;
      }
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'create_calendar_event',
        provider,
        details: { eventDetails }
      });
      throw error;
    }
  }

  async updateCalendarEvent(provider, eventId, updates) {
    try {
      if (!this.connectedCalendars.includes(provider)) {
        throw new Error(`Calendar not connected: ${provider}`);
      }

      switch (provider) {
        case 'microsoft':
        case 'outlook':
          return await OutlookCalendarService.updateCalendarEvent(eventId, updates);
        case 'google':
          // Update Google Calendar event
          break;
        case 'apple':
          if (Platform.OS !== 'ios') {
            throw new Error('Apple Calendar is only available on iOS');
          }
          // Update Apple Calendar event
          break;
      }
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'update_calendar_event',
        provider,
        details: { eventId, updates }
      });
      throw error;
    }
  }

  async deleteCalendarEvent(provider, eventId) {
    try {
      if (!this.connectedCalendars.includes(provider)) {
        throw new Error(`Calendar not connected: ${provider}`);
      }

      switch (provider) {
        case 'microsoft':
        case 'outlook':
          return await OutlookCalendarService.deleteCalendarEvent(eventId);
        case 'google':
          // Delete Google Calendar event
          break;
        case 'apple':
          if (Platform.OS !== 'ios') {
            throw new Error('Apple Calendar is only available on iOS');
          }
          // Delete Apple Calendar event
          break;
      }
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'delete_calendar_event',
        provider,
        details: { eventId }
      });
      throw error;
    }
  }

  async updateSyncStatus(provider, isSync) {
    try {
      const currentStatus = await this.getSyncStatus();
      currentStatus[provider] = isSync;
      await AsyncStorage.setItem(
        STORAGE_KEYS.CALENDAR_SYNC_STATUS,
        JSON.stringify(currentStatus)
      );
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'update_sync_status',
        provider 
      });
    }
  }

  async getSyncStatus() {
    try {
      const status = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_SYNC_STATUS);
      return status ? JSON.parse(status) : {
        google: false,
        outlook: false,
        microsoft: false,
        apple: false
      };
    } catch (error) {
      appMonitor.logError(error, { context: 'get_sync_status' });
      return {
        google: false,
        outlook: false,
        microsoft: false,
        apple: false
      };
    }
  }

  async refreshCalendarAuth(provider) {
    try {
      let newTokens;
      switch (provider) {
        case 'microsoft':
        case 'outlook':
          newTokens = await userService.refreshMicrosoftToken();
          await this.connectCalendar(provider, newTokens);
          break;
        case 'google':
          newTokens = await userService.refreshGoogleToken();
          await this.connectCalendar(provider, newTokens);
          break;
        // Apple doesn't need refresh
      }
      return true;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'refresh_calendar_auth',
        provider 
      });
      throw error;
    }
  }

  isAuthError(error) {
    return (
      error.response?.status === 401 ||
      error.response?.status === 403 ||
      error.message?.toLowerCase().includes('unauthorized') ||
      error.message?.toLowerCase().includes('unauthenticated')
    );
  }

  getConnectedCalendars() {
    return this.connectedCalendars;
  }
}

export const calendarIntegrationService = new CalendarIntegrationService();
