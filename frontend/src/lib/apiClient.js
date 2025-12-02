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
  return config;
});


