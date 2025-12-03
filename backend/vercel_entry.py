#!/usr/bin/env python3
"""
Vercel entry point for the FastAPI application
"""

import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def setup_environment():
    """Setup environment variables for Vercel deployment"""
    # In Vercel, environment variables are set in the dashboard
    # This function just verifies they exist
    required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
    
    for var in required_vars:
        if not os.environ.get(var):
            logger.warning(f"Environment variable {var} not set")
            
    logger.info("Environment setup completed")

# Import the FastAPI app after environment setup
setup_environment()

# Import the main server module
try:
    from server import app
    logger.info("FastAPI app imported successfully")
except Exception as e:
    logger.error(f"Failed to import FastAPI app: {e}")
    raise

# Vercel expects the app to be available as 'app'
# This is already handled by our server.py