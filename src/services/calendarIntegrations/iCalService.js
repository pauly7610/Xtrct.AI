// src/services/iCalService.js
import RNCalendarEvents from 'react-native-calendar-events';

export const requestCalendarPermissions = async () => {
  const permission = await RNCalendarEvents.requestPermissions();
  return permission === 'authorized';
};

export const fetchICalEvents = async () => {
  const events = await RNCalendarEvents.fetchAllEvents('2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z');
  return events; // Return events
};
