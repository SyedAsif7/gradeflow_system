# How to Fix the Vercel 500 Error

## Root Cause
The 500 error is occurring because your application tries to establish a MongoDB connection at import time, which can fail in serverless environments like Vercel due to:
1. Network timeouts
2. Environment variables not being immediately available
3. Cold start limitations

## Solution Implemented

### 1. Lazy Database Initialization
We've modified the code to only initialize the database connection when it's actually needed, rather than at import time.

### 2. Graceful Error Handling
The application now handles database connection failures gracefully in Vercel environments, allowing health check endpoints to remain available.

### 3. Robust Vercel Entry Point
The `api/index.py` file now handles import errors more gracefully, ensuring the application can start even if database-dependent routes fail to load.

## Steps to Fix the Issue

### Step 1: Verify Environment Variables
Ensure these environment variables are set in your Vercel dashboard:
- `MONGO_URL` - Your MongoDB connection string
- `DB_NAME` - Your database name (e.g., "exam-management")
- `JWT_SECRET` - A secret key for JWT tokens
- `CORS_ORIGINS` - Allowed origins (optional)

### Step 2: Check MongoDB Accessibility
Ensure your MongoDB cluster accepts connections from Vercel:
- If using MongoDB Atlas, add `0.0.0.0/0` to your IP whitelist (or specific Vercel IPs)

### Step 3: Redeploy Your Application
Trigger a new deployment either by:
- Pushing a new commit to your repository
- Using the "Redeploy" button in Vercel dashboard

## If the Issue Persists

### Check Vercel Logs
1. Go to your deployment in Vercel
2. Click on the "Functions" tab
3. Look for specific error messages

### Test Database Connection
Run this command locally to verify your MongoDB connection works:
```bash
cd backend
python test_db_connection.py
```

### Verify Environment Setup
Make sure your `.env` file has the correct values:
```env
MONGO_URL=mongodb+srv://your-user:your-password@cluster.your-url.mongodb.net/?retryWrites=true&w=majority
DB_NAME=exam-management
JWT_SECRET=your-jwt-secret-key
CORS_ORIGINS=http://localhost:3000
```

## Technical Details

### Changes Made

1. **server.py**:
   - Implemented lazy database initialization
   - Added graceful error handling for serverless environments
   - Made database connection conditional on actual usage

2. **api/index.py**:
   - Added robust error handling for route imports
   - Ensured health endpoints remain available even if routes fail

3. **vercel.json**:
   - Verified correct configuration for Python functions

## Expected Behavior After Fix

1. Health check endpoints (`/` and `/health`) should work immediately
2. Database-dependent routes will initialize database connection on first use
3. Application should start without requiring immediate database connectivity
4. 500 errors should be resolved

## Troubleshooting

If you still experience issues:

1. **Check Vercel Environment Variables**: Ensure all required variables are set correctly
2. **Verify MongoDB Connection**: Test the connection string from a different network
3. **Review Vercel Logs**: Look for specific error messages in the function logs
4. **Test Locally**: Run the application locally with `VERCEL=1` to simulate the environment

## Contact Support

If you continue to experience issues:
1. Capture the full Vercel function logs
2. Verify your MongoDB Atlas cluster settings
3. Contact Vercel support with the error details