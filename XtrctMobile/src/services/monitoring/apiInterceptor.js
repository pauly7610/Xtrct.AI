// src/services/apiInterceptor.js
import axios from 'axios';
import { appMonitor } from './AppMonitoringService';

export const setupApiInterceptors = (axiosInstance = axios) => {
  axiosInstance.interceptors.request.use(
    async (config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    },
    (error) => {
      appMonitor.logError(error, { type: 'api_request_error' });
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    async (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      await appMonitor.trackApiRequest(
        response.config.url,
        response.config.method,
        duration,
        response.status
      );
      return response;
    },
    async (error) => {
      const duration = Date.now() - error.config.metadata.startTime;
      await appMonitor.trackApiRequest(
        error.config.url,
        error.config.method,
        duration,
        error.response?.status
      );
      await appMonitor.logError(error, {
        type: 'api_response_error',
        url: error.config.url,
        method: error.config.method
      });
      return Promise.reject(error);
    }
  );
};
