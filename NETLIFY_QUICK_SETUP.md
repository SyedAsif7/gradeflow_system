# 🚀 GradeFlow on Netlify - Complete Setup Guide

**Deploy your GradeFlow application to Netlify in 15 minutes**

## ⚡ Quick Deploy (3 Steps)

### Step 1: Push to GitHub
Your code is already committed. Ensure it's on GitHub:
```bash
git push origin main
```

### Step 2: Go to Netlify

1. Visit [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Select **`gradeflow_system`** repository

### Step 3: Configure & Deploy

**Build settings:**
- Build command: `cd frontend && yarn build`
- Publish directory: `frontend/build`

**Environment variables:**
```
REACT_APP_BACKEND_URL=https://your-backend-api.com
REACT_APP_API_TIMEOUT=30000
```

Click **"Deploy"** ✅

Your app is live in 2-3 minutes!

---

## 📋 Complete Deployment Strategy

### Architecture

```
Netlify (Frontend)
    ↓
netlify/functions/api.js (Proxy)
    ↓
Your Backend API (Railway/Render)
    ↓
MongoDB Atlas
```

### Three-Component Deployment

#### 1️⃣ Frontend (Netlify)
- React 19 application
- Automatic builds on GitHub push
- Free SSL/HTTPS
- Global CDN
- Automatic deployments

#### 2️⃣ Backend API (Railway or Render)
- FastAPI server
- MongoDB connection
- Automatic GitHub deployments
- Health checks

#### 3️⃣ Database (MongoDB Atlas)
- Free tier available
- Automated backups
- Secure authentication

---

## 🎯 Detailed Setup Guide

### Part A: Deploy Frontend to Netlify

**Time: 5 minutes**

#### Step 1: Connect GitHub Repository

1. Log in to [Netlify](https://app.netlify.com/)
2. Dashboard → **"Add new site"**
3. **"Import an existing project"** → **"GitHub"**
4. Click **"Authorize Netlify"**
5. Select your GitHub account
6. Search for **`gradeflow_system`**
7. Click **"Select"**

#### Step 2: Configure Build

On the build settings page:

```
Owner:           Your team
Repository:      gradeflow_system
Branch:          main
Build command:   cd frontend && yarn build
Publish dir:     frontend/build
```

#### Step 3: Set Environment Variables

Click **"Advanced"** → **"New variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `REACT_APP_BACKEND_URL` | `https://your-backend-api.com` |
| `REACT_APP_API_TIMEOUT` | `30000` |
| `NODE_ENV` | `production` |

> Update backend URL after deploying backend

#### Step 4: Deploy

Click **"Deploy site"**

Wait for:
- ✅ Build to complete (2-3 min)
- ✅ Tests to pass
- ✅ Deploy to finish

Your site is live at: **`https://[random-name].netlify.app`**

#### Step 5: Custom Domain (Optional)

1. Site settings → **"Domain management"**
2. **"Add custom domain"**
3. Enter your domain: `gradeflow.yourdomain.com`
4. Follow DNS setup instructions
5. Netlify provisions SSL certificate automatically

### Part B: Deploy Backend to Railway (Recommended)

**Time: 10 minutes**

See [RAILWAY_RENDER_DEPLOYMENT.md](RAILWAY_RENDER_DEPLOYMENT.md) for detailed instructions.

#### Quick Summary

1. Go to [railway.app](https://railway.app/)
2. **"New Project"** → **"Deploy from GitHub"**
3. Select `gradeflow_system` repository
4. Railway auto-detects Python backend
5. Add MongoDB service
6. Set environment variables:
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db
   JWT_SECRET=<generate-secure-key>
   ENVIRONMENT=production
   ```
7. Railway provides public URL: `https://your-app.railway.app`

### Part C: Setup MongoDB Atlas

**Time: 5 minutes**

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **"Create"** → **"M0 Free Tier"**
3. Create Database User (username/password)
4. Whitelist IP: **0.0.0.0/0**
5. Copy connection string
6. Add database name: `gradeflow_db`
7. Use in `MONGO_URL` environment variable

---

## 🔄 Post-Deployment Steps

### Step 1: Update Backend URL

After Railway deployment:

1. Get your Railway backend URL (e.g., `https://gradeflow-backend.railway.app`)
2. In Netlify site settings → **"Environment"**
3. Update `REACT_APP_BACKEND_URL` to your Railway URL
4. Netlify automatically rebuilds and redeploys

### Step 2: Test API Connection

Check that frontend can reach backend:

```javascript
// Open browser console on your Netlify site
fetch('YOUR_BACKEND_URL/api/dashboard/stats')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

### Step 3: Seed Initial Data

```bash
# Connect to your backend
ssh your-railway-backend

# or use Railway CLI
railway shell

# Seed database
cd backend
python seed_user.py
```

This creates default users:
- Admin: `admin@example.com` / `password`
- Teacher: `teacher@example.com` / `password`
- Student: `student@example.com` / `password`

### Step 4: Test Full Application

1. Open your Netlify URL
2. Login with test account
3. Create exam, students, upload answer sheets
4. Test PDF viewing and grading

---

## 🛠️ Troubleshooting

### Issue: Build fails - "command not found: yarn"

**Solution:** Add to Netlify build command:
```
npm install -g yarn@1.22.22 && cd frontend && yarn install && yarn build
```

Or add `package-lock.json` to repository:
```bash
cd frontend
npm install  # generates package-lock.json
git add package-lock.json
git commit -m "chore: add package-lock.json"
git push
```

### Issue: Frontend shows blank page

**Solutions:**
1. Check browser console for errors (F12)
2. Verify `REACT_APP_BACKEND_URL` is set correctly
3. Check backend is running and accessible
4. Clear browser cache: Ctrl+Shift+Del

### Issue: "Cannot reach backend API"

**Solutions:**
1. Verify backend is deployed and running
2. Check `REACT_APP_BACKEND_URL` in Netlify environment
3. Verify CORS is enabled on backend
4. Test backend directly: `curl https://your-backend.railway.app/docs`

### Issue: Deployment takes too long

**Optimize:**
1. Remove large dependencies from `package.json`
2. Use tree-shaking with `--prod` flag
3. Enable Netlify build cache in settings
4. Use `--frozen-lockfile` in yarn command

### Issue: Custom domain doesn't work

**Solutions:**
1. Wait 24 hours for DNS propagation
2. Verify DNS records are set correctly
3. Check domain nameservers point to Netlify
4. Try clearing browser DNS cache

---

## 📊 Performance Monitoring

### Netlify Analytics

1. Site settings → **"Analytics"**
2. Enable analytics
3. View:
   - Visitor statistics
   - Page load times
   - Build times
   - Error rates

### Edge Functions (Advanced)

Add authentication at edge:

```javascript
// netlify/edge-functions/auth.js
export default async (request, context) => {
  const token = request.headers.get('Authorization');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  return context.next();
};
```

### Monitoring & Errors

- **Sentry**: [sentry.io](https://sentry.io/) - Real-time error tracking
- **LogRocket**: [logrocket.com](https://logrocket.com/) - Session replay
- **Datadog**: [datadoghq.com](https://www.datadoghq.com/) - APM

---

## 🔐 Security Checklist

- [ ] Change default JWT secret
- [ ] Enable HTTPS (automatic on Netlify)
- [ ] Whitelist backend CORS origins
- [ ] Secure MongoDB with authentication
- [ ] Rotate MongoDB credentials regularly
- [ ] Enable two-factor auth on Netlify
- [ ] Set up deployment previews for PR reviews
- [ ] Configure rate limiting on backend
- [ ] Use environment variables for secrets
- [ ] Regular security audits

---

## 💰 Cost Breakdown

### Netlify Frontend
- Free tier: ✅ Unlimited builds, 100GB bandwidth
- Pro: $19/month (higher limits)
- Enterprise: Custom pricing

### Railway Backend
- Free: $5 credit (roughly $5-10/month usage)
- Pro: Pay-as-you-go (~$0.30/hour running)

### MongoDB Atlas
- Free: M0 cluster (512MB storage)
- Shared: $0.07/hour clusters
- Dedicated: $57-2000+/month

### Typical Monthly Cost
- **Free Tier**: $0 (if using free tier limits)
- **Small App**: $5-15 (Railway + Netlify)
- **Medium App**: $50-100 (dedicated clusters)

---

## 🚀 Production Checklist

Before going live:

- [ ] Test all features locally
- [ ] Deploy frontend to Netlify
- [ ] Deploy backend to Railway/Render
- [ ] Set up MongoDB Atlas
- [ ] Update environment variables
- [ ] Test API connectivity
- [ ] Seed initial data
- [ ] Set up custom domain
- [ ] Enable SSL/HTTPS
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Document deployment process
- [ ] Create runbooks for common issues

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview |
| `GETTING_STARTED.md` | Quick local setup |
| `DEPLOYMENT.md` | All deployment options |
| `NETLIFY_DEPLOYMENT.md` | Netlify-specific guide |
| `RAILWAY_RENDER_DEPLOYMENT.md` | Backend deployment |
| `netlify.toml` | Netlify configuration |
| `backend/Procfile` | Backend startup command |
| `backend/runtime.txt` | Python version |

---

## 🎓 Learning Resources

- [Netlify Docs](https://docs.netlify.com/)
- [Railway Docs](https://docs.railway.app/)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

---

## 💬 Getting Help

### Common Issues

1. **Build failures**: Check build logs in Netlify UI
2. **API errors**: Check backend logs in Railway dashboard
3. **Database issues**: Check MongoDB Atlas Connection status
4. **Performance**: Use Netlify Analytics and backend monitoring

### Support Resources

- Netlify Support: [support.netlify.com](https://support.netlify.com/)
- Railway Help: [railway.app/docs](https://docs.railway.app/)
- MongoDB Community: [community.mongodb.com](https://community.mongodb.com/)
- GradeFlow Issues: [GitHub Issues](https://github.com/SyedAsif7/gradeflow_system/issues)

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Frontend loads at Netlify URL
- ✅ Can log in to application
- ✅ API requests reach backend
- ✅ Can upload PDF files
- ✅ PDF viewer works
- ✅ Can grade papers
- ✅ Can export Excel files
- ✅ Custom domain works (if configured)
- ✅ SSL certificate is valid
- ✅ Monitoring is active

---

## 🎉 You're Done!

Your GradeFlow application is now live on Netlify!

**Next Steps:**
1. Share your live URL with users
2. Create user accounts
3. Add exams and students
4. Start grading
5. Monitor performance
6. Set up backups

---

**Live URL**: `https://your-site.netlify.app`  
**Admin Dashboard**: `https://your-site.netlify.app` (login as admin)  
**API Docs**: `https://your-backend.railway.app/docs`

For issues or questions, refer to:
- [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md) - Detailed Netlify guide
- [RAILWAY_RENDER_DEPLOYMENT.md](RAILWAY_RENDER_DEPLOYMENT.md) - Backend guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - All deployment options

---

**Happy grading! 🎓**
