import axios from 'axios';

import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import AsyncStorage from '@react-native-async-storage/async-storage';



const CONFIG = {

  // Your existing web client ID

  WEB_CLIENT_ID: '898344092663-b4s028j36qrgoju7evrobn4ef79us4m7.apps.googleusercontent.com',

  // Add your iOS client ID - get this from Google Cloud Console

  IOS_CLIENT_ID: '898344092663-youriosclientid.apps.googleusercontent.com',

  // Calendar API endpoint

  CALENDAR_API: 'https://www.googleapis.com/calendar/v3',

  // Storage keys

  STORAGE_KEYS: {

    AUTH_TOKENS: 'google_auth_tokens',

    USER_INFO: 'google_user_info',

  }

};



class GoogleCalendarService {

  static isInitialized = false;



  static async initialize(accessToken) {

    this.accessToken = accessToken;

    // No need for separate Google Sign-in since we already have the token

  }



  static async getValidAccessToken() {

    return this.accessToken;

  }



  static async fetchCalendarEvents(startDate = new Date(), endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {

    try {

      const accessToken = await this.getValidAccessToken();

      

      const response = await axios.get(`${CONFIG.CALENDAR_API}/calendars/primary/events`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

        params: {

          timeMin: startDate.toISOString(),

          timeMax: endDate.toISOString(),

          singleEvents: true,

          orderBy: 'startTime',

        },

      });



      return response.data.items;

    } catch (error) {

      console.error('Failed to fetch calendar events:', error);

      throw new Error('Failed to fetch calendar events');

    }

  }



  static async createCalendarEvent(eventDetails) {

    try {

      const accessToken = await this.getValidAccessToken();

      

      const response = await axios.post(

        `${CONFIG.CALENDAR_API}/calendars/primary/events`,

        eventDetails,

        {

          headers: {

            Authorization: `Bearer ${accessToken}`,

            'Content-Type': 'application/json',

          },

        }

      );



      return response.data;

    } catch (error) {

      console.error('Failed to create calendar event:', error);

      throw new Error('Failed to create calendar event');

    }

  }



  static async updateCalendarEvent(eventId, updates) {

    try {

      const accessToken = await this.getValidAccessToken();

      

      const response = await axios.patch(

        `${CONFIG.CALENDAR_API}/calendars/primary/events/${eventId}`,

        updates,

        {

          headers: {

            Authorization: `Bearer ${accessToken}`,

            'Content-Type': 'application/json',

          },

        }

      );



      return response.data;

    } catch (error) {

      console.error('Failed to update calendar event:', error);

      throw new Error('Failed to update calendar event');

    }

  }



  static async deleteCalendarEvent(eventId) {

    try {

      const accessToken = await this.getValidAccessToken();

      

      await axios.delete(

        `${CONFIG.CALENDAR_API}/calendars/primary/events/${eventId}`,

        {

          headers: {

            Authorization: `Bearer ${accessToken}`,

          },

        }

      );



      return true;

    } catch (error) {

      console.error('Failed to delete calendar event:', error);

      throw new Error('Failed to delete calendar event');

    }

  }



  static async checkAuthStatus() {

    try {

      const isSignedIn = await GoogleSignin.isSignedIn();

      if (!isSignedIn) {

        return { isSignedIn: false };

      }



      const userInfo = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.USER_INFO);

      return {

        isSignedIn: true,

        userInfo: userInfo ? JSON.parse(userInfo) : null,

      };

    } catch (error) {

      console.error('Failed to check auth status:', error);

      return { isSignedIn: false };

    }

  }

}



export default GoogleCalendarService;


