// src/services/api.js

import axios from 'axios';

import { getAuth } from 'firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { appMonitor } from 'src/services/monitoring/AppMonitoringService';



class ApiService {

  constructor() {

    this.auth = getAuth();

    

    // Base API

    this.baseAPI = axios.create({

      baseURL: process.env.REACT_APP_API_BASE_URL,

      headers: {

        'Content-Type': 'application/json',

      },

    });



    // Calendar APIs

    this.msGraphAPI = axios.create({

      baseURL: 'https://graph.microsoft.com/v1.0',

      headers: { 'Content-Type': 'application/json' },

    });



    this.googleAPI = axios.create({

      baseURL: 'https://www.googleapis.com',

      headers: { 'Content-Type': 'application/json' },

    });



    // Anthropic API

    this.anthropicAPI = axios.create({

      baseURL: 'https://api.anthropic.com/v1',

      headers: {

        'Content-Type': 'application/json',

        'anthropic-version': '2024-01-01'

      },

    });



    this.setupInterceptors();

  }



  setupInterceptors() {

    // Add existing interceptors...



    // Add Anthropic API interceptor

    this.anthropicAPI.interceptors.request.use(async (config) => {

      const apiKey = await AsyncStorage.getItem('anthropic_api_key');

      config.headers['x-api-key'] = apiKey;

      return config;

    });

  }



  // Add methods for calendar services

  async getCalendarEvents(calendarType, timeRange, accessToken) {

    try {

      switch(calendarType) {

        case 'google':

          return await this.getGoogleCalendar(accessToken, timeRange);

        case 'microsoft':

          return await this.getMicrosoftCalendar(accessToken, timeRange);

        default:

          throw new Error(`Unsupported calendar type: ${calendarType}`);

      }

    } catch (error) {

      appMonitor.logError(error, { context: 'get_calendar_events', calendarType });

      throw this.enhanceError(error);

    }

  }



  // Update calendar methods to include timeRange

  async getMicrosoftCalendar(accessToken, timeRange) {

    try {

      const response = await this.msGraphAPI.get('/me/calendar/events', {

        headers: { Authorization: `Bearer ${accessToken}` },

        params: {

          $select: 'subject,start,end,importance,bodyPreview,attendees',

          $orderby: 'start/dateTime',

          startDateTime: timeRange?.start,

          endDateTime: timeRange?.end,

          $top: 50

        }

      });

      return response.data;

    } catch (error) {

      throw this.enhanceError(error);

    }

  }



  async getGoogleCalendar(accessToken, timeRange) {

    try {

      const response = await this.googleAPI.get('/calendar/v3/calendars/primary/events', {

        headers: { Authorization: `Bearer ${accessToken}` },

        params: {

          timeMin: timeRange?.start || new Date().toISOString(),

          timeMax: timeRange?.end,

          maxResults: 50,

          singleEvents: true,

          orderBy: 'startTime'

        }

      });

      return response.data;

    } catch (error) {

      throw this.enhanceError(error);

    }

  }



  // Add methods for Anthropic integration

  async processWithClaude(content, systemPrompt) {

    try {

      const response = await this.anthropicAPI.post('/messages', {

        model: 'claude-3-sonnet-20240229',

        max_tokens: 4096,

        messages: [{ role: 'user', content }],

        system: systemPrompt

      });

      return response.data;

    } catch (error) {

      appMonitor.logError(error, { context: 'claude_process' });

      throw this.enhanceError(error);

    }

  }



  // ... rest of your existing methods

}



export const apiService = new ApiService();
