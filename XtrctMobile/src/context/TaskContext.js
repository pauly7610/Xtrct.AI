import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskService } from 'src/services/taskService';
import { anthropicService } from 'src/services/AnthropicService';
import { CalendarIntegrationService } from 'src/services/CalendarIntegrationService';
import storageConfig from 'src/config/storageConfig';
import { TaskStatus, PriorityLevels, TaskConfig } from 'src/config/constants';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  // Core States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({
    lastSync: null,
    isSyncing: false,
    error: null
  });

  // User Personalization States
  const [userPreferences, setUserPreferences] = useState({
    prioritizationAlgorithm: 'default',
    taskCategories: [],
    workingHours: {
      start: '9:00',
      end: '17:00'
    }
  });

  // Focus Session States
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Initialize
  useEffect(() => {
    initializeTaskSystem();
    const syncInterval = setInterval(syncTasks, TaskConfig.intervals.SYNC_INTERVAL * 1000);
    return () => clearInterval(syncInterval);
  }, []);

  // Initialization
  const initializeTaskSystem = async () => {
    try {
      setLoading(true);
      await loadCachedData();
      await syncTasks();
      await loadUserPreferences();
    } catch (error) {
      setError('Failed to initialize task system');
      console.error('Task system initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const cachedPreferences = await AsyncStorage.getItem(storageConfig.keys.user.PREFERENCES);
      if (cachedPreferences) {
        setUserPreferences(JSON.parse(cachedPreferences));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const updateUserPreferences = async (updates) => {
    try {
      const newPreferences = { ...userPreferences, ...updates };
      setUserPreferences(newPreferences);
      await AsyncStorage.setItem(
        storageConfig.keys.user.PREFERENCES,
        JSON.stringify(newPreferences)
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const setPrioritizationAlgorithm = (algorithm) => {
    updateUserPreferences({ prioritizationAlgorithm: algorithm });
  };

  const addTaskCategory = (category) => {
    updateUserPreferences({
      taskCategories: [...userPreferences.taskCategories, category]
    });
  };

  const removeTaskCategory = (category) => {
    updateUserPreferences({
      taskCategories: userPreferences.taskCategories.filter(c => c !== category)
    });
  };

  const setWorkingHours = (start, end) => {
    updateUserPreferences({
      workingHours: { start, end }
    });
  };

  // Task Management
  const createTask = async (taskData) => {
    try {
      // Process with AI for smart defaults
      const enhancedTask = await anthropicService.processTask({
        ...taskData,
        status: TaskStatus.PENDING.id,
        createdAt: new Date().toISOString()
      });

      // Create task in Firebase
      const newTask = await taskService.createTask(enhancedTask);
      
      // Update local state
      setTasks(current => [...current, newTask]);
      
      // Cache update
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.CACHED,
        JSON.stringify([...tasks, newTask])
      );

      // Sync with calendars if needed
      if (taskData.addToCalendar) {
        await CalendarIntegrationService.addTaskToCalendars(newTask);
      }

      return newTask;
    } catch (error) {
      setError('Failed to create task');
      throw error;
    }
  };

  const prioritizeTasks = (tasks) => {
    if (userPreferences.prioritizationAlgorithm === 'default') {
      return tasks.sort((a, b) => b.priority - a.priority);
    } else {
      // TODO: Implement custom prioritization algorithm
      return tasks;
    }
  };

  // Context value
  const value = {
    // States
    tasks,
    loading,
    error,
    currentSession,
    sessionHistory,
    syncStatus,
    userPreferences,

    // Task Methods
    createTask,
    updateTask,
    deleteTask,
    prioritizeTasks,
    
    // User Preference Methods
    updateUserPreferences,
    setPrioritizationAlgorithm,
    addTaskCategory,
    removeTaskCategory,
    setWorkingHours,
    
    // Session Methods
    startFocusSession,
    endFocusSession,
    
    // Sync Methods
    syncTasks,
    
    // Analytics Methods
    getTaskAnalytics,

    // Helper Methods
    getTotalTasks: () => tasks.length,
    getCompletedTasks: () => tasks.filter(t => t.status === TaskStatus.COMPLETED.id).length,
    getTasksByPriority: (priority) => tasks.filter(t => t.priority === priority),
    getTaskById: (id) => tasks.find(t => t.id === id),
    getCurrentFocus: () => currentSession,
    getFocusHistory: () => sessionHistory,
    getLastSync: () => syncStatus.lastSync
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};