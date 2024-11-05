// src/services/OutlookCalendarService.js
import { AuthenticationContext } from 'react-native-azure-ad';
import axios from 'axios';

const CLIENT_ID = 'your_outlook_client_id';
const REDIRECT_URI = 'your_redirect_uri';

const authContext = new AuthenticationContext({
  clientId: CLIENT_ID,
  redirectUri: REDIRECT_URI,
});

export const signInWithOutlook = async () => {
  try {
    const result = await authContext.acquireTokenAsync({
      scopes: ['https://graph.microsoft.com/Calendars.Read'],
    });
    return result.accessToken;
  } catch (error) {
    console.error("Outlook Sign-In Error:", error);
  }
};

export const fetchOutlookCalendarEvents = async (accessToken) => {
  try {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me/events', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.value; // Return events
  } catch (error) {
    console.error("Error fetching Outlook Calendar events:", error);
  }
};
