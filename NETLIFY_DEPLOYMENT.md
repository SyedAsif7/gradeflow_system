# Deploy GradeFlow to Netlify

This guide covers deploying the GradeFlow frontend to Netlify with backend integration.

## Prerequisites

- Netlify account ([Create here](https://app.netlify.com/signup))
- GitHub account with the GradeFlow repository
- Backend API deployed (Railway, Render, or your own server)
- Node.js 18+ locally

## Option 1: Deploy Frontend with Netlify UI (Recommended)

### Step 1: Connect GitHub Repository

1. Log in to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub repositories
5. Select **`gradeflow_system`** repository
6. Click **"Continue"**

### Step 2: Configure Build Settings

1. **Owner**: Select your team/account
2. **Branch to deploy**: `main`
3. **Build command**: 
   ```
   cd frontend && yarn build
   ```
4. **Publish directory**: 
   ```
   frontend/build
   ```

### Step 3: Set Environment Variables

1. Click **"Advanced"** → **"New variable"**
2. Add these environment variables:

```
REACT_APP_BACKEND_URL = https://your-backend-api.com
REACT_APP_API_TIMEOUT = 30000
```

> Replace `https://your-backend-api.com` with your actual backend URL

### Step 4: Deploy

1. Click **"Deploy site"**
2. Netlify will build and deploy your application
3. Your site will be live at: `https://[random-name].netlify.app`

### Step 5: Configure Custom Domain

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your custom domain (e.g., `gradeflow.yourdomain.com`)
4. Follow DNS setup instructions
5. Netlify will automatically provision SSL certificate

## Option 2: Deploy with Netlify CLI

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Authenticate

```bash
netlify login
```

This opens a browser to authorize Netlify CLI access.

### Step 3: Link to Netlify Site

```bash
cd gradeflow_system
netlify init
```

Follow the prompts:
- Choose **"Connect this directory to a site"** → **"Create & configure a new site"**
- Select your team
- Give it a name (e.g., `gradeflow`)

### Step 4: Configure netlify.toml

The `netlify.toml` file is already configured. Verify it has:

```toml
[build]
command = "yarn build"
publish = "build"

[build.environment]
NODE_VERSION = "18"
YARN_VERSION = "1.22.22"
```

### Step 5: Set Environment Variables

Create `.env.production`:

```env
REACT_APP_BACKEND_URL=https://your-backend-api.com
REACT_APP_API_TIMEOUT=30000
```

Or set via CLI:

```bash
netlify env:set REACT_APP_BACKEND_URL https://your-backend-api.com
```

### Step 6: Deploy

```bash
# Test build locally
netlify build

# Deploy to Netlify
netlify deploy --prod
```

## Backend Deployment Options

### Option A: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app/)
2. Click **"New Project"** → **"Deploy from GitHub"**
3. Select the `gradeflow_system` repository
4. Select the `backend` service
5. Configure environment variables:
   - `MONGO_URL`: Your MongoDB connection string
   - `DB_NAME`: `gradeflow_db`
   - `JWT_SECRET`: Generate a secure key
6. Railway automatically deploys and provides a URL

### Option B: Deploy Backend to Render

1. Go to [render.com](https://render.com/)
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy an existing repository"**
4. Select `gradeflow_system`
5. Configure:
   - **Environment**: Python 3.10
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
6. Set environment variables
7. Deploy

### Option C: Deploy Backend to Heroku (Alternative)

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add MongoDB Atlas connection
heroku config:set MONGO_URL=your-mongo-connection-string

# Deploy
git push heroku main
```

## API Proxy Setup

Netlify provides serverless functions for API proxying. The `netlify/functions/api.js` file handles:

- Proxying requests to your backend
- CORS handling
- Authentication token forwarding
- Error handling

### Using the Proxy

Instead of calling `https://your-backend.com/api/auth/login`, call:

```javascript
const response = await fetch('/.netlify/functions/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com', password: 'password' })
});
```

The proxy automatically forwards to your actual backend.

## SSL/HTTPS Setup

### Automatic (Recommended)

Netlify automatically provisions free SSL certificates for:
- `*.netlify.app` domains
- Custom domains via Let's Encrypt

### Manual

1. In Netlify Site Settings, go to **SSL/TLS certificate**
2. Choose **"Automatic HTTPS"**
3. Optionally upload custom certificate

## Custom Domain Setup

### Using Netlify DNS

1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter domain (e.g., `gradeflow.yourdomain.com`)
4. Choose **"Verify DNS settings"**
5. Update your registrar's nameservers to Netlify's

### Using External DNS

1. Add custom domain to Netlify
2. In your DNS provider:
   - Create `ALIAS` or `ANAME` record pointing to: `[your-site].netlify.app`
   - Or create `CNAME` record: `subdomain.yourdomain.com CNAME your-site.netlify.app`

## Environment-Specific Builds

Deploy different versions to different URLs:

### Production Branch

```toml
[build]
command = "yarn build"
publish = "frontend/build"
```

### Preview Deployment

Any branch automatically gets preview URL: `https://[branch-name]--[site-name].netlify.app`

## Performance Optimization

### Bundle Analysis

```bash
cd frontend
npm run build -- --analyze
# or
yarn build -- --analyze
```

### CDN Caching

Netlify automatically caches:
- Static assets: 1 year
- HTML files: 0 (always fresh)
- API responses: Based on headers

### Edge Functions (Advanced)

For serverless processing at edge locations:

```javascript
// netlify/edge-functions/auth.js
export default async (request, context) => {
  const token = request.headers.get('Authorization');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  // Continue to next function or origin
  return context.next();
};
```

## Monitoring & Analytics

### Netlify Analytics

1. Go to **Site settings** → **Analytics**
2. Enable analytics
3. View visitor data, build times, deployment history

### Function Logs

```bash
netlify functions:invoke api --payload '{"httpMethod":"GET"}'
```

### Realtime Logs

```bash
netlify logs
```

## Troubleshooting

### Build Fails: "command not found: yarn"

Solution: Install Yarn in build command:

```toml
[build]
command = "npm install -g yarn@1.22.22 && cd frontend && yarn install && yarn build"
```

### "Cannot find module 'axios'"

Solution: Add axios to `frontend/package.json`:

```bash
cd frontend
yarn add axios
```

### API Calls Return 404

Check:
1. `REACT_APP_BACKEND_URL` environment variable
2. Backend is running and accessible
3. CORS headers are configured
4. API endpoint paths are correct

### Deployment Takes Too Long

Optimize:
- Remove large dependencies
- Use `--prod` flag in yarn build
- Enable Netlify's build cache in settings
- Check for slow npm packages

### Site Shows Blank Page

1. Check browser console for errors
2. Verify build log: **Deployments** → **Build logs**
3. Check `.env` variables are set
4. Verify `index.html` was built

## Rollback a Deployment

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"...«** → **"Publish deploy"**

## Continuous Deployment

Automatic deployments on:
- Push to `main` branch
- Pull requests (preview URLs)
- External webhooks

### Disable Auto-Deploy

**Site settings** → **Build & deploy** → **Deploy settings** → Change "Production branch"

## Monitoring Uptime

### Using Netlify

- **Site health**: Dashboard shows deployment status
- **Build notifications**: Email alerts for failed builds

### Using External Tools

- [UptimeRobot](https://uptimerobot.com/) - Free uptime monitoring
- [Sentry](https://sentry.io/) - Error tracking
- [DataDog](https://www.datadoghq.com/) - Full observability

## Backup & Disaster Recovery

### Backup Code

Your GitHub repository is your backup. To restore:

```bash
git clone https://github.com/SyedAsif7/gradeflow_system.git
```

### Backup Database

For MongoDB Atlas:
1. Enable automated backups in Atlas
2. Configure backup frequency and retention
3. Use `mongodump` for manual backups

```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db"
```

## Cost Estimation

| Component | Free Tier | Pro | Enterprise |
|-----------|-----------|-----|-----------|
| Netlify Hosting | ✅ | $19/mo | Custom |
| Build Minutes | 300/mo | 3000/mo | Custom |
| Bandwidth | 100GB/mo | Unlimited | Unlimited |
| Functions | 125k/mo | 1M/mo | Custom |
| SSL Certificate | ✅ | ✅ | ✅ |

## Support & Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Community](https://community.netlify.com/)
- [React Deployment Guide](https://create-react-app.dev/deployment/)
- [GradeFlow DEPLOYMENT.md](../DEPLOYMENT.md)

## Next Steps

1. ✅ Deploy frontend to Netlify
2. Deploy backend to Railway/Render/AWS
3. Update `REACT_APP_BACKEND_URL` to backend URL
4. Test all API endpoints
5. Set up custom domain
6. Configure monitoring
7. Set up automated backups

---

**Ready to deploy? Start with Step 1 above! 🚀**

For questions, check [Netlify docs](https://docs.netlify.com/) or review [DEPLOYMENT.md](../DEPLOYMENT.md).
