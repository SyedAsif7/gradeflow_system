# Vercel Deployment Checklist

## Environment Variables Required

1. `MONGO_URL` - MongoDB connection string
2. `DB_NAME` - Database name
3. `JWT_SECRET` - Secret for JWT token signing
4. `CORS_ORIGINS` - Allowed CORS origins (optional, defaults to "*")

## Steps to Deploy

1. Set the environment variables in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all required variables from above

2. Ensure the MongoDB connection is accessible from Vercel:
   - Check that your MongoDB cluster allows connections from Vercel IPs
   - MongoDB Atlas: Add `0.0.0.0/0` to IP whitelist (or specific Vercel IPs)

3. Redeploy your application:
   - Push changes to your repository
   - Or trigger a new deployment manually in Vercel

## Troubleshooting

If you still get a 500 error:

1. Check Vercel logs:
   - Go to your deployment
   - Click on "Functions" tab
   - Check the logs for specific error messages

2. Verify environment variables:
   - Make sure all required variables are set
   - Check for typos in variable names

3. Test database connectivity:
   - Ensure the MongoDB URL works from external networks
   - Try connecting from a different machine to verify accessibility

## Recent Improvements

- Implemented lazy database initialization for serverless environments
- Added graceful error handling for database connection failures
- Routes will initialize database connection on first use rather than at import time
- Health check endpoints remain available even if database connection fails