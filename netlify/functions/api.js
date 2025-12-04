import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Proxy handler for all API requests
export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      body: '',
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/api', '');
    const url = `${BACKEND_URL}${path}`;

    // Build request config
    const config = {
      method: event.httpMethod.toLowerCase(),
      url,
      headers: {
        ...event.headers,
        'Content-Type': 'application/json',
      },
    };

    // Add body for non-GET requests
    if (event.body && event.httpMethod !== 'GET') {
      config.data = JSON.parse(event.body);
    }

    // Forward request to backend
    const response = await axios(config);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error('API Proxy Error:', error.message);

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data || error.message;

    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'API request failed',
        message: errorMessage,
        details: error.message,
      }),
    };
  }
};
