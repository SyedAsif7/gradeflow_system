// config.js - Centralized configuration
// Check if we are running locally (localhost or 127.0.0.1)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// If local, use the env var or default to localhost:8000
// If production (not local), ALWAYS use relative path (empty string) to let Vercel handle routing
const BACKEND_URL = isLocal ? (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000') : '';

export const API = `${BACKEND_URL}/api`;

