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
    
    missing_vars = []
    for var in required_vars:
        if not os.environ.get(var):
            logger.warning(f"Environment variable {var} not set")
            missing_vars.append(var)
        else:
            # Log that the variable is set (without exposing the value)
            logger.info(f"Environment variable {var} is set")
            
    if missing_vars:
        logger.warning(f"Missing environment variables: {missing_vars}")
    else:
        logger.info("All required environment variables are set")
    
    logger.info("Environment setup completed")

# Setup environment before importing the app
setup_environment()

# Import the main server module
try:
    logger.info("Importing FastAPI app from server module...")
    from server import app
    logger.info("FastAPI app imported successfully")
except ImportError as e:
    logger.error(f"Failed to import FastAPI app due to import error: {e}")
    raise
except Exception as e:
    logger.error(f"Failed to import FastAPI app due to unexpected error: {e}")
    raise

# Vercel expects the app to be available as 'app'
# This is already handled by our server.py

if __name__ == "__main__":
    # This is for local testing
    import uvicorn
    logger.info("Starting server locally for testing...")
    uvicorn.run("vercel_entry:app", host="127.0.0.1", port=8000, reload=True)