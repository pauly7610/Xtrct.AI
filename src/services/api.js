import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';  // This reads from the .env file

// Set up an axios instance for API requests
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token for authenticated requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error fetching token:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Utility function to handle errors consistently
const handleError = (error, message) => {
  console.error(message, error);
  throw error;
};

// API function to register a new user
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/register', userData);
    return response.data;
  } catch (error) {
    handleError(error, 'Registration Error:');
  }
};

// API function to log in a user
export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/login', credentials);
    const token = response.data.token;

    // Store token in AsyncStorage for future authenticated requests
    if (token) {
      await AsyncStorage.setItem('userToken', token);
    }

    return response.data;
  } catch (error) {
    handleError(error, 'Login Error:');
  }
};

// API function to fetch tasks
export const fetchTasks = async () => {
  try {
    const response = await api.get('/tasks');
    return response.data;
  } catch (error) {
    handleError(error, 'Fetch Tasks Error:');
  }
};

// Logout function to remove token from AsyncStorage
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
  } catch (error) {
    console.error('Logout Error:', error);
  }
};

export default api;

