// src/services/iCalService.js
import RNCalendarEvents from 'react-native-calendar-events';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Configure these in your environment files (.env)
const CONFIG = {
  // Add any specific calendar configurations here
  STORAGE_KEYS: {
    CALENDAR_PERMISSIONS: 'ical_permissions',
    SELECTED_CALENDAR: 'ical_selected_calendar',
    LAST_SYNC: 'ical_last_sync'
  }
};

// TODO: For iOS, add these permissions to Info.plist:
/*
<key>NSCalendarsUsageDescription</key>
<string>We need access to your calendar to sync and manage events</string>
<key>NSRemindersUsageDescription</key>
<string>We need access to your reminders to manage event reminders</string>
*/

// TODO: For Android, add these permissions to AndroidManifest.xml:
/*
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
*/

class ICalendarService {
  static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) return;

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permissions not granted');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Calendar initialization failed:', error);
      throw new Error('Failed to initialize calendar services');
    }
  }

  static async requestPermissions() {
    try {
      const permission = await RNCalendarEvents.requestPermissions();
      const isAuthorized = permission === 'authorized';
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.CALENDAR_PERMISSIONS, JSON.stringify(isAuthorized));
      return isAuthorized;
    } catch (error) {
      console.error('Permission request failed:', error);
      throw new Error('Failed to request calendar permissions');
    }
  }

  static async checkPermissions() {
    try {
      const permission = await RNCalendarEvents.checkPermissions();
      return permission === 'authorized';
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  static async fetchCalendars() {
    try {
      await this.initialize();
      return await RNCalendarEvents.findCalendars();
    } catch (error) {
      console.error('Failed to fetch calendars:', error);
      throw new Error('Failed to fetch calendars');
    }
  }

  static async fetchEvents(startDate = new Date(), endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) {
    try {
      await this.initialize();
      
      const selectedCalendar = await AsyncStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_CALENDAR);
      
      const events = await RNCalendarEvents.fetchAllEvents(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedCalendar ? [selectedCalendar] : undefined
      );

      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
      
      return events;
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new Error('Failed to fetch calendar events');
    }
  }

  static async createEvent(eventDetails) {
    try {
      await this.initialize();
      
      const details = {
        title: eventDetails.title,
        startDate: eventDetails.startDate.toISOString(),
        endDate: eventDetails.endDate.toISOString(),
        notes: eventDetails.description,
        location: eventDetails.location,
        alarms: eventDetails.reminders?.map(minutes => ({ date: -minutes })),
        // TODO: Add calendar ID if using specific calendar
        // calendarId: 'SELECTED_CALENDAR_ID'
      };

      const eventId = await RNCalendarEvents.saveEvent(details.title, details);
      return eventId;
    } catch (error) {
      console.error('Failed to create event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  static async updateEvent(eventId, updates) {
    try {
      await this.initialize();
      
      const updatedEvent = await RNCalendarEvents.saveEvent(updates.title, {
        id: eventId,
        startDate: updates.startDate?.toISOString(),
        endDate: updates.endDate?.toISOString(),
        notes: updates.description,
        location: updates.location,
        alarms: updates.reminders?.map(minutes => ({ date: -minutes }))
      });

      return updatedEvent;
    } catch (error) {
      console.error('Failed to update event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  static async deleteEvent(eventId) {
    try {
      await this.initialize();
      await RNCalendarEvents.removeEvent(eventId);
      return true;
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  static async setDefaultCalendar(calendarId) {
    try {
      await AsyncStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_CALENDAR, calendarId);
    } catch (error) {
      console.error('Failed to set default calendar:', error);
      throw new Error('Failed to set default calendar');
    }
  }
}

export default ICalendarService;

// Example usage component
import React, { useState, useEffect } from 'react';
import { View, Text, Button, ActivityIndicator, Alert, ScrollView } from 'react-native';
import ICalendarService from './ICalendarService';

export function ICalendarScreen() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [hasPermissions, setHasPermissions] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const permitted = await ICalendarService.checkPermissions();
      setHasPermissions(permitted);
      if (permitted) {
        fetchEvents();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      setLoading(true);
      const permitted = await ICalendarService.requestPermissions();
      setHasPermissions(permitted);
      if (permitted) {
        fetchEvents();
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const calendarEvents = await ICalendarService.fetchEvents();
      setEvents(calendarEvents);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  const createSampleEvent = async () => {
    try {
      setLoading(true);
      const eventDetails = {
        title: 'Sample Event',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),
        description: 'This is a test event',
        location: 'Sample Location',
        reminders: [15, 30] // 15 and 30 minutes before
      };
      
      await ICalendarService.createEvent(eventDetails);
      Alert.alert('Success', 'Event created successfully');
      fetchEvents();
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      {!hasPermissions ? (
        <Button title="Request Calendar Access" onPress={requestPermissions} />
      ) : (
        <View>
          <Button title="Create Sample Event" onPress={createSampleEvent} />
          <Button title="Refresh Events" onPress={fetchEvents} />
          
          <Text className="text-xl font-bold mt-4 mb-2">Your Calendar Events</Text>
          
          {events.map(event => (
            <View key={event.id} className="my-2 p-4 bg-gray-100 rounded-lg">
              <Text className="font-bold">{event.title}</Text>
              <Text>{new Date(event.startDate).toLocaleString()}</Text>
              {event.location && (
                <Text className="text-gray-600">📍 {event.location}</Text>
              )}
              {event.notes && (
                <Text className="mt-1 text-gray-600">{event.notes}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
