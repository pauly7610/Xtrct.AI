// app/config/apiConfig.js
import { API_BASE_URL } from '@env';

export default {
  baseURL: API_BASE_URL,
  endpoints: {
    login: '/auth/login',
    register: '/auth/register',
    tasks: '/tasks'
  }
};
