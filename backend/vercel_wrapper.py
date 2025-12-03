#!/usr/bin/env python3
"""
Vercel ASGI wrapper for the FastAPI application
This is a more explicit way to handle Vercel deployments
"""

import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Setup environment variables check
def check_environment():
    """Check that required environment variables are set"""
    required_vars = ['MONGO_URL', 'DB_NAME', 'JWT_SECRET']
    
    logger.info("Checking environment variables for Vercel deployment...")
    
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            logger.info(f"✅ {var}: Set")
        else:
            logger.warning(f"❌ {var}: Not set")
            
    logger.info("Environment check completed")

# Perform environment check
check_environment()

# Import and initialize the FastAPI app
try:
    logger.info("Initializing FastAPI application...")
    from server import app
    logger.info("✅ FastAPI application initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize FastAPI application: {e}")
    raise

# Vercel looks for the 'app' object
# This makes it explicitly available at module level
handler = app

# For compatibility with different Vercel configurations
application = app
asgi_app = app

if __name__ == "__main__":
    # For local testing
    import uvicorn
    logger.info("Starting server locally...")
    uvicorn.run("vercel_wrapper:app", host="127.0.0.1", port=8000, reload=True)