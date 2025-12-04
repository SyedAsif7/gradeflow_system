// config.js - Centralized configuration
const isProduction = process.env.NODE_ENV === 'production';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (isProduction ? '' : 'http://localhost:8000');
export const API = `${BACKEND_URL}/api`;

