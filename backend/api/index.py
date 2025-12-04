# api/index.py - Vercel serverless function entry point
"""
Vercel serverless function entry point
This is the standard way to deploy FastAPI apps to Vercel
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the FastAPI app
app = FastAPI(
    title="Exam Management System API",
    description="API for managing exams, answer sheets, and grading",
    version="1.0.0"
)

# Add CORS middleware
origins = os.environ.get("CORS_ORIGINS", "*")
if origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [origin.strip() for origin in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Content-Type"],
)

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Exam Management System API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running correctly"}

# Import all routes after app initialization to avoid circular imports
# In Vercel, we need to be extra careful about imports that might fail
api_router = None
try:
    logger.info("Importing routes...")
    # Import your main server module but don't create another app instance
    import sys
    from pathlib import Path
    # Add the parent directory to sys.path
    sys.path.append(str(Path(__file__).parent.parent))
    
    # Import the actual server implementation
    # We'll handle potential import errors gracefully
    try:
        from server import api_router
        # Include the router only if import succeeded
        if api_router:
            app.include_router(api_router)
            logger.info("✅ Routes imported and included successfully")
        else:
            logger.warning("⚠️  Routes module imported but no router found")
    except ImportError as e:
        logger.error(f"❌ Failed to import routes due to import error: {e}")
        # Continue without routes - health checks will still work
    except Exception as e:
        logger.error(f"❌ Failed to import routes due to unexpected error: {e}")
        # Continue without routes - health checks will still work
        
except Exception as e:
    logger.error(f"❌ Critical error during route import setup: {e}")
    # We'll continue anyway to keep health endpoints available

# Vercel looks for the 'app' object