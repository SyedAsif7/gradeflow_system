# How to Fix the Vercel File System Error

## Root Cause
The 500 error is occurring because your application tries to create directories on the file system at import time, but Vercel's serverless environment has a read-only file system. Specifically, the error shows:

```
OSError: [Errno 30] Read-only file system: '/var/task/uploads'
```

## Solution Implemented

### 1. Conditional Directory Creation
Modified the code to only create directories when not running in a serverless environment (like Vercel).

### 2. Graceful Handling of File System Limitations
In Vercel environments, the application now skips directory creation and uses GridFS for file storage instead.

### 3. Maintained Backward Compatibility
The application continues to work normally in local development environments.

## Changes Made

### server.py
- Modified directory creation to be conditional on the environment
- In Vercel environments, `UPLOAD_DIR` is set to `None`
- Added proper error handling for file system operations
- Preserved GridFS functionality for file storage

## Steps to Fix the Issue

### Step 1: Redeploy Your Application
The fix has already been implemented in your code. Simply redeploy your application to Vercel.

### Step 2: Verify Environment Variables
Ensure these environment variables are set in your Vercel dashboard:
- `MONGO_URL` - Your MongoDB connection string
- `DB_NAME` - Your database name (e.g., "exam-management")
- `JWT_SECRET` - A secret key for JWT tokens
- `CORS_ORIGINS` - Allowed origins (optional)

### Step 3: Check MongoDB Accessibility
Ensure your MongoDB cluster accepts connections from Vercel:
- If using MongoDB Atlas, add `0.0.0.0/0` to your IP whitelist (or specific Vercel IPs)

## Expected Behavior After Fix

1. Application starts without file system errors
2. File uploads continue to work using GridFS
3. Local development environment remains unaffected
4. 500 errors should be resolved

## Technical Details

### File Storage Approach
Your application now uses two different approaches for file storage:

1. **Local Development**: Uses filesystem directories
2. **Vercel Deployment**: Uses MongoDB GridFS

Both approaches provide the same functionality without requiring file system write permissions in serverless environments.

### Code Changes
The key change was in `server.py` where we modified:

```python
# Before (problematic in Vercel):
UPLOAD_DIR = ROOT_DIR / 'uploads' / 'answer_sheets'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# After (Vercel-friendly):
try:
    UPLOAD_DIR = ROOT_DIR / 'uploads' / 'answer_sheets'
    # In Vercel/serverless environments, we might not be able to create directories
    # So we'll handle this gracefully
    if not os.environ.get('VERCEL'):
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Upload directory ready: {UPLOAD_DIR}")
    else:
        logger.info("⚠️  Running in Vercel environment, skipping upload directory creation")
        # In Vercel, we'll use GridFS for file storage instead of filesystem
        UPLOAD_DIR = None
except Exception as e:
    logger.error(f"❌ Failed to create upload directory: {e}")
    # In serverless environments, we don't want to fail the entire app for file system issues
    if os.environ.get('VERCEL'):
        logger.warning("⚠️  Continuing without upload directory in Vercel environment")
        UPLOAD_DIR = None
    else:
        raise
```

## Troubleshooting

If you still experience issues:

1. **Check Vercel Logs**: Look for specific error messages in the function logs
2. **Verify Environment Variables**: Ensure all required variables are set correctly
3. **Test Database Connection**: Verify your MongoDB connection works from external networks
4. **Contact Support**: If issues persist, contact Vercel support with the error details

## Contact Support

If you continue to experience issues:
1. Capture the full Vercel function logs
2. Verify your MongoDB Atlas cluster settings
3. Contact Vercel support with the error details