// src/services/GoogleCalendarService.js
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Use your Google Client ID here
const GOOGLE_CLIENT_ID = '898344092663-b4s028j36qrgoju7evrobn4ef79us4m7.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID,
  offlineAccess: true, // Optional - allows access to user data when offline
});

// Function to sign in with Google
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return userInfo; // Return user info for further processing
  } catch (error) {
    console.error('Error during Google Sign-In:', error);
    throw error; // Propagate error
  }
};

// Function to fetch Google Calendar events
export const fetchGoogleCalendarEvents = async (accessToken) => {
  try {
    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.items; // Return events
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error; // Propagate error
  }
};
