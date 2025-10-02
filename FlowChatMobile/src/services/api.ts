import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = __DEV__
  ? 'http://10.0.2.2:5000/api' // Android emulator
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('authToken');
      // Navigate to login - will be handled by navigation
    }
    return Promise.reject(error);
  }
);

export default api;
