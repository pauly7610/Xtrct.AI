// src/context/TaskContext.js
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
    } catch (error) {
      setError('Failed to initialize task system');
      console.error('Task system initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCachedData = async () => {
    try {
      const cachedTasks = await AsyncStorage.getItem(storageConfig.keys.tasks.CACHED);
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
      }

      const cachedSessions = await AsyncStorage.getItem(storageConfig.keys.tasks.SESSIONS);
      if (cachedSessions) {
        setSessionHistory(JSON.parse(cachedSessions));
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
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

  const updateTask = async (taskId, updates) => {
    try {
      // Update in Firebase
      const updatedTask = await taskService.updateTask(taskId, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setTasks(current => 
        current.map(task => 
          task.id === taskId ? updatedTask : task
        )
      );

      // Update cache
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.CACHED,
        JSON.stringify(tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ))
      );

      // Update calendar if needed
      if (updates.dueDate || updates.status) {
        await CalendarIntegrationService.updateTaskInCalendars(updatedTask);
      }

      return updatedTask;
    } catch (error) {
      setError('Failed to update task');
      throw error;
    }
  };

  const deleteTask = async (taskId) => {
    try {
      // Delete from Firebase
      await taskService.deleteTask(taskId);

      // Update local state
      setTasks(current => 
        current.filter(task => task.id !== taskId)
      );

      // Update cache
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.CACHED,
        JSON.stringify(tasks.filter(task => task.id !== taskId))
      );

      // Remove from calendars
      await CalendarIntegrationService.removeTaskFromCalendars(taskId);
    } catch (error) {
      setError('Failed to delete task');
      throw error;
    }
  };

  // Focus Sessions
  const startFocusSession = async (taskId) => {
    if (currentSession) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');

      const session = {
        id: Date.now().toString(),
        taskId,
        startTime: new Date().toISOString(),
        predictedDuration: task.estimatedDuration || TaskConfig.time.DEFAULT_FOCUS_DURATION,
        breaks: []
      };

      setCurrentSession(session);
      
      // Update task status
      await updateTask(taskId, { 
        status: TaskStatus.IN_PROGRESS.id 
      });

      // Cache session
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.CURRENT_SESSION,
        JSON.stringify(session)
      );
    } catch (error) {
      setError('Failed to start focus session');
      throw error;
    }
  };

  const endFocusSession = async (completed = true) => {
    if (!currentSession) return;

    try {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(currentSession.startTime);

      const completedSession = {
        ...currentSession,
        endTime,
        duration,
        completed
      };

      // Update session history
      const updatedHistory = [...sessionHistory, completedSession];
      setSessionHistory(updatedHistory);
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.SESSIONS,
        JSON.stringify(updatedHistory)
      );

      // Update task
      if (completed) {
        await updateTask(currentSession.taskId, {
          status: TaskStatus.COMPLETED.id,
          completedAt: endTime,
          actualDuration: duration
        });
      }

      // Clear current session
      setCurrentSession(null);
      await AsyncStorage.removeItem(
        storageConfig.keys.tasks.CURRENT_SESSION
      );

      return completedSession;
    } catch (error) {
      setError('Failed to end focus session');
      throw error;
    }
  };
  c// Task Synchronization
  const syncTasks = async () => {
    if (syncStatus.isSyncing) return;

    try {
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: true,
        error: null
      }));

      // Fetch latest tasks from Firebase
      const remoteTasks = await taskService.fetchUserTasks();

      // Analyze tasks with Claude
      const analyzedTasks = await anthropicService.analyzeTasks(remoteTasks);

      // Update priorities and estimates
      const enhancedTasks = analyzedTasks.map(task => ({
        ...task,
        priority: task.aiSuggestedPriority || task.priority,
        estimatedDuration: task.aiEstimatedDuration || task.estimatedDuration
      }));

      // Sync with calendars
      await CalendarIntegrationService.syncTasks(enhancedTasks);

      // Update local state and cache
      setTasks(enhancedTasks);
      await AsyncStorage.setItem(
        storageConfig.keys.tasks.CACHED,
        JSON.stringify(enhancedTasks)
      );

      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
        isSyncing: false
      }));

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        error: 'Failed to sync tasks'
      }));
    }
  };

  // Task Analytics
  const getTaskAnalytics = async () => {
    try {
      // Get completion stats
      const completedTasks = tasks.filter(
        task => task.status === TaskStatus.COMPLETED.id
      );
      
      const completionRate = tasks.length > 0 
        ? (completedTasks.length / tasks.length) * 100 
        : 0;

      // Get focus session stats
      const totalFocusTime = sessionHistory.reduce(
        (total, session) => total + (session.duration || 0), 
        0
      );

      const averageSessionDuration = sessionHistory.length > 0
        ? totalFocusTime / sessionHistory.length
        : 0;

      // Get AI insights
      const insights = await anthropicService.analyzeTaskPatterns(tasks, sessionHistory);

      return {
        tasks: {
          total: tasks.length,
          completed: completedTasks.length,
          completionRate,
          averageDuration: completedTasks.reduce(
            (avg, task) => avg + (task.actualDuration || 0), 
            0
          ) / (completedTasks.length || 1)
        },
        focus: {
          totalSessions: sessionHistory.length,
          totalTime: totalFocusTime,
          averageSession: averageSessionDuration,
          mostProductiveTime: insights.mostProductiveTime
        },
        priorities: {
          high: tasks.filter(t => t.priority === PriorityLevels.HIGH.id).length,
          medium: tasks.filter(t => t.priority === PriorityLevels.MEDIUM.id).length,
          low: tasks.filter(t => t.priority === PriorityLevels.LOW.id).length
        },
        insights: insights.recommendations
      };
    } catch (error) {
      console.error('Analytics error:', error);
      throw error;
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

    // Task Methods
    createTask,
    updateTask,
    deleteTask,
    
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

// Usage example:
/*
import { useTask } from '../context/TaskContext';

const TaskComponent = () => {
  const { 
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    startFocusSession,
    getTaskAnalytics 
  } = useTask();

  const handleCreateTask = async () => {
    try {
      const newTask = await createTask({
        title: 'New Task',
        description: 'Task description',
        priority: PriorityLevels.MEDIUM.id,
        addToCalendar: true
      });
      console.log('Created task:', newTask);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (loading) return <ActivityIndicator />;
  if (error) return <ErrorView error={error} />;

  return (
    <View>
      {tasks.map(task => (
        <TaskCard 
          key={task.id}
          task={task}
          onPress={() => startFocusSession(task.id)}
        />
      ))}
    </View>
  );
};
*/

export default TaskContext;
