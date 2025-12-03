import axios from 'axios';
import { API } from '../config';

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // FastAPI HTTPBearer expects "Bearer <token>"
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add better error handling for blob responses
  if (config.responseType === 'blob') {
    config.timeout = 30000; // 30 second timeout for file downloads
  }
  
  return config;
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject({
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    }
    
    // Handle server errors
    const { status, data } = error.response;
    let message = 'An unexpected error occurred';
    
    if (status === 401) {
      message = 'Authentication failed. Please log in again.';
      // Optionally redirect to login
      // window.location.href = '/login';
    } else if (status === 403) {
      message = 'Access denied. You do not have permission to perform this action.';
    } else if (status === 404) {
      message = 'Resource not found.';
    } else if (status >= 500) {
      message = 'Server error. Please try again later.';
    } else if (data && data.detail) {
      message = data.detail;
    }
    
    return Promise.reject({
      message,
      status,
      data,
      originalError: error
    });
  }
);