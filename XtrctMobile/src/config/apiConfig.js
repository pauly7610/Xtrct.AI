// src/config/apiConfig.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment settings
const ENV = {
  development: {
    baseURL: 'https://task-a117a.firebaseapp.com',
    anthropicURL: 'https://api.anthropic.com/v1',
    timeout: 30000,
    enableLogs: true
  },
  production: {
    baseURL: 'https://task-a117a.firebaseapp.com',
    anthropicURL: 'https://api.anthropic.com/v1',
    timeout: 15000,
    enableLogs: false
  }
};

// Get current environment
const currentEnv = __DEV__ ? ENV.development : ENV.production;

// Main API configuration
const config = {
  // Base URLs
  baseURL: currentEnv.baseURL,
  anthropicURL: currentEnv.anthropicURL,

  // Endpoints
  endpoints: {
    // Auth endpoints
    auth: {
      signIn: '/auth/signin',
      signUp: '/auth/signup',
      resetPassword: '/auth/reset-password',
      refreshToken: '/auth/refresh'
    },

    // Task endpoints
    tasks: {
      create: '/tasks',
      update: '/tasks/:id',
      delete: '/tasks/:id',
      list: '/tasks',
      search: '/tasks/search'
    },

    // File endpoints
    files: {
      upload: '/files/upload',
      download: '/files/:id'
    }
  },

  // Default headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // Request options
  options: {
    timeout: currentEnv.timeout
  }
};

// API instance
const api = axios.create({
  baseURL: config.baseURL,
  timeout: config.options.timeout,
  headers: config.headers
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.removeItem('authToken');
        // Add your logout logic here
      } catch (e) {
        console.error('Error handling unauthorized response:', e);
      }
    }
    return Promise.reject(error);
  }
);

// Helper functions
const helpers = {
  // Build URL with parameters
  buildUrl: (endpoint, params) => {
    let url = endpoint;
    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
      });
    }
    return url;
  },

  // Log API calls in development
  logCall: (method, endpoint, data) => {
    if (currentEnv.enableLogs) {
      console.log(`API ${method}:`, endpoint);
      if (data) console.log('Data:', data);
    }
  },

  // Handle API errors
  handleError: (error) => {
    let message = 'Something went wrong';

    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 400:
          message = error.response.data?.message || 'Invalid request';
          break;
        case 401:
          message = 'Please login to continue';
          break;
        case 403:
          message = 'You don\'t have permission for this';
          break;
        case 404:
          message = 'Not found';
          break;
        case 500:
          message = 'Server error. Please try again later';
          break;
        default:
          message = error.response.data?.message || 'Something went wrong';
      }
    } else if (error.request) {
      // No response received
      message = 'Network error. Please check your connection';
    }

    return {
      message,
      originalError: error
    };
  }
};

// API methods
const apiMethods = {
  // Auth methods
  auth: {
    signIn: async (credentials) => {
      try {
        helpers.logCall('POST', config.endpoints.auth.signIn, credentials);
        const response = await api.post(config.endpoints.auth.signIn, credentials);
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    },

    signUp: async (userData) => {
      try {
        helpers.logCall('POST', config.endpoints.auth.signUp, userData);
        const response = await api.post(config.endpoints.auth.signUp, userData);
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    }
  },

  // Task methods
  tasks: {
    create: async (taskData) => {
      try {
        helpers.logCall('POST', config.endpoints.tasks.create, taskData);
        const response = await api.post(config.endpoints.tasks.create, taskData);
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    },

    update: async (taskId, taskData) => {
      try {
        const url = helpers.buildUrl(config.endpoints.tasks.update, { id: taskId });
        helpers.logCall('PUT', url, taskData);
        const response = await api.put(url, taskData);
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    },

    list: async () => {
      try {
        helpers.logCall('GET', config.endpoints.tasks.list);
        const response = await api.get(config.endpoints.tasks.list);
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    }
  },

  // File methods
  files: {
    upload: async (file, onProgress) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        helpers.logCall('POST', config.endpoints.files.upload);
        const response = await api.post(config.endpoints.files.upload, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(percentCompleted);
          }
        });
        return response.data;
      } catch (error) {
        throw helpers.handleError(error);
      }
    }
  }
};

// Example usage:
/*
// Sign in
const signIn = async (email, password) => {
  try {
    const response = await apiMethods.auth.signIn({ email, password });
    await AsyncStorage.setItem('authToken', response.token);
    return response;
  } catch (error) {
    console.error(error.message);
    // Handle error appropriately
  }
};

// Create task
const createTask = async (taskData) => {
  try {
    const task = await apiMethods.tasks.create(taskData);
    return task;
  } catch (error) {
    console.error(error.message);
    // Handle error appropriately
  }
};
*/

export default {
  config,
  api,
  helpers,
  ...apiMethods
};
