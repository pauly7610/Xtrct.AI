// src/config/storageConfig.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from './appConfig';

const STORAGE_PREFIX = 'xtrct_ai_';
const VERSION = '1.0.0';

const storageConfig = {
  // Storage keys
  keys: {
    // Auth related
    auth: {
      TOKEN: `${STORAGE_PREFIX}auth_token`,
      REFRESH_TOKEN: `${STORAGE_PREFIX}refresh_token`,
      USER_DATA: `${STORAGE_PREFIX}user_data`,
      CREDENTIALS: `${STORAGE_PREFIX}credentials`
    },

    // User preferences
    preferences: {
      THEME: `${STORAGE_PREFIX}theme`,
      NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
      LANGUAGE: `${STORAGE_PREFIX}language`,
      TIME_FORMAT: `${STORAGE_PREFIX}time_format`,
      FOCUS_DURATION: `${STORAGE_PREFIX}focus_duration`
    },

    // Task related
    tasks: {
      DRAFT: `${STORAGE_PREFIX}task_draft`,
      RECENT: `${STORAGE_PREFIX}recent_tasks`,
      CACHED: `${STORAGE_PREFIX}cached_tasks`,
      TEMPLATES: `${STORAGE_PREFIX}task_templates`
    },

    // App state
    state: {
      ONBOARDING_COMPLETE: `${STORAGE_PREFIX}onboarding_complete`,
      LAST_SYNC: `${STORAGE_PREFIX}last_sync`,
      APP_OPENS: `${STORAGE_PREFIX}app_opens`,
      VERSION: `${STORAGE_PREFIX}version`
    },

    // Offline data
    offline: {
      PENDING_ACTIONS: `${STORAGE_PREFIX}pending_actions`,
      SYNC_QUEUE: `${STORAGE_PREFIX}sync_queue`
    }
  },

  // Expiration times (in seconds)
  expiration: {
    TOKEN: 3600, // 1 hour
    REFRESH_TOKEN: 7 * 24 * 3600, // 7 days
    CACHE: 5 * 60, // 5 minutes
    DRAFT: 24 * 3600, // 1 day
    RECENT_TASKS: 7 * 24 * 3600 // 7 days
  },

  // Storage limits
  limits: {
    MAX_RECENT_TASKS: 50,
    MAX_CACHED_TASKS: 100,
    MAX_TEMPLATES: 20,
    MAX_PENDING_ACTIONS: 100
  },

  // Helper methods
  helpers: {
    // Store data with expiration
    storeWithExpiry: async (key, value, expirationInSeconds) => {
      try {
        const item = {
          value,
          timestamp: Date.now(),
          expiresIn: expirationInSeconds * 1000
        };
        await AsyncStorage.setItem(key, JSON.stringify(item));
      } catch (error) {
        console.error('Storage Error:', error);
        throw error;
      }
    },

    // Get data and check expiration
    getWithExpiry: async (key) => {
      try {
        const itemStr = await AsyncStorage.getItem(key);
        if (!itemStr) return null;

        const item = JSON.parse(itemStr);
        const now = Date.now();
        
        if (now - item.timestamp > item.expiresIn) {
          await AsyncStorage.removeItem(key);
          return null;
        }
        
        return item.value;
      } catch (error) {
        console.error('Storage Error:', error);
        throw error;
      }
    },

    // Clear expired items
    clearExpired: async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const expiredKeys = [];

        for (const key of keys) {
          const itemStr = await AsyncStorage.getItem(key);
          if (!itemStr) continue;

          try {
            const item = JSON.parse(itemStr);
            if (Date.now() - item.timestamp > item.expiresIn) {
              expiredKeys.push(key);
            }
          } catch {
            // Skip non-JSON items
            continue;
          }
        }

        if (expiredKeys.length > 0) {
          await AsyncStorage.multiRemove(expiredKeys);
        }
      } catch (error) {
        console.error('Clear Expired Error:', error);
      }
    },

    // Store task draft
    storeDraft: async (taskData) => {
      await storageConfig.helpers.storeWithExpiry(
        storageConfig.keys.tasks.DRAFT,
        taskData,
        storageConfig.expiration.DRAFT
      );
    },

    // Get task draft
    getDraft: async () => {
      return await storageConfig.helpers.getWithExpiry(
        storageConfig.keys.tasks.DRAFT
      );
    },

    // Add to recent tasks
    addToRecent: async (task) => {
      try {
        const recentTasks = await storageConfig.helpers.getWithExpiry(
          storageConfig.keys.tasks.RECENT
        ) || [];

        // Add to front, remove duplicates, limit size
        const updatedTasks = [
          task,
          ...recentTasks.filter(t => t.id !== task.id)
        ].slice(0, storageConfig.limits.MAX_RECENT_TASKS);

        await storageConfig.helpers.storeWithExpiry(
          storageConfig.keys.tasks.RECENT,
          updatedTasks,
          storageConfig.expiration.RECENT_TASKS
        );
      } catch (error) {
        console.error('Recent Tasks Error:', error);
      }
    },

    // Add pending offline action
    addPendingAction: async (action) => {
      try {
        const pendingActions = await AsyncStorage.getItem(
          storageConfig.keys.offline.PENDING_ACTIONS
        ) || '[]';
        
        const actions = JSON.parse(pendingActions);
        actions.push({
          ...action,
          timestamp: Date.now()
        });

        // Limit size
        if (actions.length > storageConfig.limits.MAX_PENDING_ACTIONS) {
          actions.shift(); // Remove oldest
        }

        await AsyncStorage.setItem(
          storageConfig.keys.offline.PENDING_ACTIONS,
          JSON.stringify(actions)
        );
      } catch (error) {
        console.error('Pending Action Error:', error);
      }
    }
  }
};

// Usage example:
/*
// Store auth token
await storageConfig.helpers.storeWithExpiry(
  storageConfig.keys.auth.TOKEN,
  'user-token',
  storageConfig.expiration.TOKEN
);

// Get auth token
const token = await storageConfig.helpers.getWithExpiry(
  storageConfig.keys.auth.TOKEN
);

// Store task draft
await storageConfig.helpers.storeDraft({
  title: 'Draft Task',
  description: 'Task details'
});

// Get task draft
const draft = await storageConfig.helpers.getDraft();

// Add task to recent
await storageConfig.helpers.addToRecent({
  id: 'task-123',
  title: 'New Task'
});

// Add pending offline action
await storageConfig.helpers.addPendingAction({
  type: 'CREATE_TASK',
  data: taskData
});

// Clear expired items
await storageConfig.helpers.clearExpired();
*/

export default storageConfig;
