// src/config/appConfig.js
const appConfig = {
  // Debug settings
  debug: {
    enabled: __DEV__,
    logLevel: __DEV__ ? 'debug' : 'error',
    showConsoleInDev: true
  },

  // App theming
  theme: {
    colors: {
      primary: '#70B7FA',
      secondary: '#313442',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#FF4444',
      background: '#000000',
      card: '#1D2226',
      text: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.60)'
    },
    fonts: {
      regular: 'Poppins',
      medium: 'Poppins-Medium',
      bold: 'Poppins-Bold'
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32
    }
  },

  // Feature flags
  features: {
    TaskAnalytics: true,
    aiSuggestions: true,
    fileUpload: true,
    calendarSync: true,
    offlineMode: true,
    pushNotifications: true
  },

  // App settings
  settings: {
    defaultTaskDuration: 25, // minutes
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxAttachments: 5,
    autoSaveInterval: 30000, // 30 seconds
    sessionTimeout: 3600000, // 1 hour
  },

  // Navigation
  navigation: {
    defaultRoute: 'summaryOfDay',
    animationEnabled: true,
    gesturesEnabled: true
  },

  // Task configuration
  tasks: {
    priorities: ['high', 'medium', 'low'],
    categories: ['work', 'personal', 'study'],
    statuses: ['pending', 'inProgress', 'completed', 'blocked'],
    defaultPriority: 'medium',
    defaultCategory: 'work'
  },

  // UI settings
  ui: {
    animations: {
      enabled: true,
      duration: 300
    },
    lists: {
      pageSize: 20,
      loadMoreThreshold: 3
    },
    cards: {
      cornerRadius: 12,
      shadowDepth: 2
    }
  },

  // Persistence
  storage: {
    prefix: 'xtrct_ai_',
    version: '1.0.0',
    keys: {
      authToken: 'auth_token',
      user: 'user_data',
      settings: 'user_settings',
      tasks: 'tasks_data',
      theme: 'theme_preference'
    }
  },

  // API related settings
  api: {
    retryAttempts: 3,
    timeout: 30000,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  },

  // Analytics settings
  analytics: {
    enabled: !__DEV__,
    trackScreens: true,
    trackErrors: true,
    trackPerformance: true
  },

  // Helper methods
  helpers: {
    // Get storage key with prefix
    getStorageKey: (key) => {
      return `${appConfig.storage.prefix}${key}`;
    },

    // Get color based on priority
    getPriorityColor: (priority) => {
      switch (priority) {
        case 'high':
          return appConfig.theme.colors.error;
        case 'medium':
          return appConfig.theme.colors.warning;
        case 'low':
          return appConfig.theme.colors.success;
        default:
          return appConfig.theme.colors.primary;
      }
    },

    // Get status color
    getStatusColor: (status) => {
      switch (status) {
        case 'completed':
          return appConfig.theme.colors.success;
        case 'inProgress':
          return appConfig.theme.colors.primary;
        case 'blocked':
          return appConfig.theme.colors.error;
        default:
          return appConfig.theme.colors.textSecondary;
      }
    },

    // Format file size
    formatFileSize: (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Check if feature is enabled
    isFeatureEnabled: (featureName) => {
      return appConfig.features[featureName] || false;
    },

    // Get style with theme
    getThemedStyle: (style = {}) => {
      return {
        ...style,
        backgroundColor: appConfig.theme.colors.background,
        color: appConfig.theme.colors.text
      };
    }
  }
};

// Usage examples:
/*
// Using storage keys
const authToken = await AsyncStorage.getItem(
  appConfig.helpers.getStorageKey(appConfig.storage.keys.authToken)
);

// Using theme colors
const styles = StyleSheet.create({
  container: {
    backgroundColor: appConfig.theme.colors.background,
    padding: appConfig.theme.spacing.md
  },
  text: {
    color: appConfig.theme.colors.text,
    fontFamily: appConfig.theme.fonts.regular
  }
});

// Checking features
if (appConfig.helpers.isFeatureEnabled('TaskAnalytics')) {
  // Track task analytics
}

// Using priority colors
const priorityColor = appConfig.helpers.getPriorityColor(task.priority);
*/

export default appConfig;
