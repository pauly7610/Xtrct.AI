// src/context/TaskContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTask, fetchTasks } from '../models/task'; // Importing task API functions
import { PriorityEngine } from '../../../app/utils/PriorityEngine';
import { SmartFeatures } from '../../../app/utils/SmartFeatures';
import { CalendarIntegrations } from '../../../app/utils/CalendarIntegrations';

const TaskContext = createContext();

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'taskManager:tasks',
  FOCUS_SESSIONS: 'taskManager:focusSessions',
  ANALYTICS: 'taskManager:analytics',
  USER_PATTERNS: 'taskManager:userPatterns',
  CALENDAR_CONFIG: 'taskManager:calendarConfig',
  SYNC_STATE: 'taskManager:syncState'
};

export const TaskProvider = ({ children }) => {
  // Core State
  const [tasks, setTasks] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [currentFocusSession, setCurrentFocusSession] = useState(null);
  const [userPatterns, setUserPatterns] = useState({
    focusSessions: [],
    productiveHours: {},
    workingHours: { start: 9, end: 17 },
    maxTasksPerDay: 5
  });

  // Analytics State
  const [analytics, setAnalytics] = useState({
    completionRates: {},
    productivityScores: {},
    workloadDistribution: {},
    predictionAccuracy: 0,
    smartPredictions: {},
    syncStats: {
      successRate: 0,
      lastFailures: [],
      averageSyncTime: 0,
      syncCount: 0
    }
  });

  // Calendar Integration State
  const [calendarConfig, setCalendarConfig] = useState({
    google: {
      enabled: false,
      credentials: null,
      lastSync: null,
      syncErrors: []
    },
    notion: {
      enabled: false,
      credentials: null,
      databaseId: null,
      lastSync: null,
      syncErrors: []
    },
    ical: {
      enabled: false,
      url: null,
      lastSync: null,
      syncErrors: []
    }
  });

  // Sync State
  const [syncState, setSyncState] = useState({
    isInitialSync: true,
    lastFullSync: null,
    syncInProgress: false,
    syncQueue: [],
    failedSyncs: []
  });

  // Initialize system
  useEffect(() => {
    const initialize = async () => {
      await initializeSystem();
    };
    initialize();

    const updateInterval = setInterval(updateSystemState, 60000); // System updates every minute
    const syncInterval = setInterval(handlePeriodicSync, 300000); // Calendar sync every 5 minutes
    return () => {
      clearInterval(updateInterval);
      clearInterval(syncInterval);
    };
  }, []);

  // System Initialization and Updates
  const initializeSystem = async () => {
    try {
      await loadSavedData();
      await initializeCalendarIntegrations();
      await updateSystemState();
    } catch (error) {
      console.error('Error initializing system:', error);
    }
  };

  const loadSavedData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      const savedSessions = await AsyncStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
      if (savedSessions) setFocusSessions(JSON.parse(savedSessions));
      const savedAnalytics = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS);
      if (savedAnalytics) setAnalytics(JSON.parse(savedAnalytics));
      const savedPatterns = await AsyncStorage.getItem(STORAGE_KEYS.USER_PATTERNS);
      if (savedPatterns) setUserPatterns(JSON.parse(savedPatterns));
      const savedCalendarConfig = await AsyncStorage.getItem(STORAGE_KEYS.CALENDAR_CONFIG);
      if (savedCalendarConfig) setCalendarConfig(JSON.parse(savedCalendarConfig));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const updateSystemState = async () => {
    updatePriorities();
    updatePredictions();
    await updateAnalytics();
    await handleCalendarSync();
  };

  // Task Management
  const addTask = async (taskData) => {
    try {
      const newTask = await createTask(taskData); // Using API to create a task
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      await updateSystemState();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const updateTask = async (id, updatedFields) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return { ...task, ...updatedFields, lastModified: new Date().toISOString() };
      }
      return task;
    });

    setTasks(updatedTasks);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
  };

  // Smart Features - Predictions
  const updatePriorities = () => {
    const updatedTasks = tasks.map(task => ({
      ...task,
      priorityScore: PriorityEngine.calculatePriorityScore(task, tasks),
    }));
    setTasks(updatedTasks);
  };

  const updatePredictions = () => {
    const updatedTasks = tasks.map(task => ({
      ...task,
      predictions: SmartFeatures.predictTaskCompletion(task, tasks),
    }));
    setTasks(updatedTasks);
    updatePredictionAccuracy();
  };

  const updatePredictionAccuracy = () => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const accuracyScores = completedTasks.map(task => {
      const prediction = task.predictions?.estimatedDuration || task.estimatedDuration;
      const actual = task.actualDuration;
      return 1 - Math.abs(prediction - actual) / Math.max(prediction, actual);
    });
    const overallAccuracy = accuracyScores.reduce((sum, score) => sum + score, 0) / accuracyScores.length;
    setAnalytics(prev => ({ ...prev, predictionAccuracy: overallAccuracy }));
  };

  // Calendar Integration Methods
  const initializeCalendarIntegrations = async () => {
    try {
      if (calendarConfig.google.enabled) {
        await initializeGoogleCalendar();
      }
      if (calendarConfig.notion.enabled) {
        await initializeNotionCalendar();
      }
      if (calendarConfig.ical.enabled) {
        await initializeICalFeed();
      }
    } catch (error) {
      console.error('Error initializing calendar integrations:', error);
    }
  };

  const handleCalendarSync = async () => {
    if (syncState.syncInProgress) return;

    setSyncState(prev => ({ ...prev, syncInProgress: true }));

    try {
      const syncPromises = [];

      if (calendarConfig.google.enabled) {
        syncPromises.push(CalendarIntegrations.syncWithGoogleCalendar(calendarConfig.google.credentials, tasks));
      }

      if (calendarConfig.notion.enabled) {
        syncPromises.push(CalendarIntegrations.syncWithNotion(calendarConfig.notion.credentials, calendarConfig.notion.databaseId, tasks));
      }

      if (calendarConfig.ical.enabled) {
        syncPromises.push(CalendarIntegrations.generateICalFeed(tasks));
      }

      await Promise.all(syncPromises);
    } catch (error) {
      console.error('Error during calendar sync:', error);
    } finally {
      setSyncState(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  // Focus Session Management
  const startFocusSession = async (taskId) => {
    if (currentFocusSession) return;

    const session = {
      id: Date.now().toString(),
      taskId,
      startTime: new Date().toISOString(),
      endTime: null,
      breaks: [],
      productivity: null,
      completed: false,
      predictedDuration: tasks.find(t => t.id === taskId)?.predictions?.estimatedDuration,
    };

    setCurrentFocusSession(session);
    const updatedSessions = [...focusSessions, session];
    setFocusSessions(updatedSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(updatedSessions));
  };

  const endFocusSession = async (productivity) => {
    if (!currentFocusSession) return;

    const endTime = new Date().toISOString();
    const sessionDuration = new Date(endTime) - new Date(currentFocusSession.startTime);

    const updatedSessions = focusSessions.map(session => 
      session.id === currentFocusSession.id 
        ? { ...session, endTime, productivity, duration: sessionDuration } 
        : session
    );

    setFocusSessions(updatedSessions);
    await AsyncStorage.setItem(STORAGE_KEYS.FOCUS_SESSIONS, JSON.stringify(updatedSessions));
    setCurrentFocusSession(null);
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      focusSessions,
      currentFocusSession,
      analytics,
      userPatterns,
      addTask,
      updateTask,
      startFocusSession,
      endFocusSession,
      handleCalendarSync,
    }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};
