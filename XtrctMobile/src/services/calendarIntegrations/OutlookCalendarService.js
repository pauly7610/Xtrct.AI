/ src/services/calendarIntegrations/OutlookCalendarService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appMonitor } from '../monitoring/AppMonitoringService';
import { userService } from '../userService';

const CONFIG = {
  CLIENT_ID: 'd7873856-03f0-4615-ba3b-7172c047d24c',
  TENANT_ID: '8018cfb0-2996-4490-889a-3cfd9476b2fa',
  GRAPH_API: 'https://graph.microsoft.com/v1.0',
  STORAGE_KEYS: {
    AUTH_TOKENS: '@outlook_auth_tokens',
    USER_INFO: '@outlook_user_info',
  },
  SCOPES: [
    'User.Read',
    'Calendars.ReadWrite',
    'offline_access'
  ]
};

class OutlookCalendarService {
  static accessToken = null;

  static async getValidAccessToken() {
    try {
      const tokensString = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKENS);
      if (!tokensString) {
        throw new Error('No access token found');
      }

      const tokens = JSON.parse(tokensString);
      const tokenExpirationTime = new Date(tokens.expiresOn).getTime();
      
      // If token is expired or about to expire in next 5 minutes
      if (Date.now() + 5 * 60 * 1000 >= tokenExpirationTime) {
        // Call userService to refresh token
        const newTokens = await userService.refreshMicrosoftToken();
        await this.initialize(newTokens);
        return newTokens.accessToken;
      }

      return tokens.accessToken;
    } catch (error) {
      appMonitor.logError(error, { context: 'get_valid_access_token' });
      throw error;
    }
  }

  static async initialize(authResult) {
    try {
      this.accessToken = authResult.accessToken;
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKENS, JSON.stringify({
        accessToken: authResult.accessToken,
        expiresOn: authResult.expiresOn,
        refreshToken: authResult.refreshToken
      }));

      // Cache user info
      const userInfo = await this.fetchUserInfo(authResult.accessToken);
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

      return true;
    } catch (error) {
      appMonitor.logError(error, { context: 'outlook_calendar_init' });
      throw error;
    }
  }

  static async fetchUserInfo(accessToken) {
    try {
      const response = await axios.get(`${CONFIG.GRAPH_API}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      appMonitor.logError(error, { context: 'fetch_outlook_user' });
      throw error;
    }
  }

  static async fetchCalendarEvents(startDate = new Date(), endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await axios.get(`${CONFIG.GRAPH_API}/me/calendar/events`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $select: 'id,subject,start,end,organizer,location,bodyPreview',
          $orderby: 'start/dateTime',
          $filter: `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
        }
      });

      return response.data.value.map(event => ({
        id: event.id,
        title: event.subject,
        description: event.bodyPreview,
        start: event.start.dateTime,
        end: event.end.dateTime,
        location: event.location?.displayName,
        organizer: event.organizer?.emailAddress?.name
      }));
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'fetch_outlook_events',
        details: { startDate, endDate }
      });
      throw new Error('Failed to fetch calendar events');
    }
  }

  static async createCalendarEvent(eventDetails) {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await axios.post(
        `${CONFIG.GRAPH_API}/me/calendar/events`,
        {
          subject: eventDetails.subject,
          start: {
            dateTime: eventDetails.startTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: eventDetails.endTime,
            timeZone: 'UTC'
          },
          location: eventDetails.location ? {
            displayName: eventDetails.location
          } : undefined,
          body: eventDetails.description ? {
            contentType: "HTML",
            content: eventDetails.description
          } : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'create_outlook_event',
        details: { eventDetails }
      });
      throw new Error('Failed to create calendar event');
    }
  }

  static async updateCalendarEvent(eventId, updates) {
    try {
      const accessToken = await this.getValidAccessToken();
      
      const response = await axios.patch(
        `${CONFIG.GRAPH_API}/me/calendar/events/${eventId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'update_outlook_event',
        details: { eventId, updates }
      });
      throw new Error('Failed to update calendar event');
    }
  }

  static async deleteCalendarEvent(eventId) {
    try {
      const accessToken = await this.getValidAccessToken();
      
      await axios.delete(
        `${CONFIG.GRAPH_API}/me/calendar/events/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      return true;
    } catch (error) {
      appMonitor.logError(error, { 
        context: 'delete_outlook_event',
        details: { eventId }
      });
      throw new Error('Failed to delete calendar event');
    }
  }

  static async checkAuthStatus() {
    try {
      const tokensString = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKENS);
      const userInfoString = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_INFO);

      if (!tokensString || !userInfoString) {
        return { isSignedIn: false };
      }

      const tokens = JSON.parse(tokensString);
      const userInfo = JSON.parse(userInfoString);

      // Check if token is expired
      const tokenExpirationTime = new Date(tokens.expiresOn).getTime();
      const isTokenValid = Date.now() < tokenExpirationTime;

      return {
        isSignedIn: isTokenValid,
        userInfo: isTokenValid ? userInfo : null,
      };
    } catch (error) {
      appMonitor.logError(error, { context: 'check_outlook_auth' });
      return { isSignedIn: false };
    }
  }

  static async clearCache() {
    try {
      await AsyncStorage.multiRemove([
        CONFIG.STORAGE_KEYS.AUTH_TOKENS,
        CONFIG.STORAGE_KEYS.USER_INFO
      ]);
      this.accessToken = null;
    } catch (error) {
      appMonitor.logError(error, { context: 'clear_outlook_cache' });
    }
  }
}

export default OutlookCalendarService;
