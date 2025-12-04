# Deploy GradeFlow Backend to Railway or Render

Complete guides for deploying the FastAPI backend to Railway or Render with MongoDB.

## Option 1: Deploy to Railway (Recommended)

Railway is the easiest option with automatic GitHub integration and free MongoDB tier.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app/)
2. Click **"Start Project"**
3. Choose **"Deploy from GitHub"**
4. Authorize Railway to access your GitHub account

### Step 2: Create New Project

1. Click **"New Project"**
2. Choose **"Deploy from GitHub"**
3. Search for **`gradeflow_system`**
4. Select your repository

### Step 3: Add Backend Service

1. Click **"Select Service"**
2. Choose **"Python"** runtime
3. Connect to the `backend` directory:
   - Set **"Root Directory"**: `backend`

Railway automatically detects:
- Python version from runtime
- Dependencies from `requirements.txt`
- Start command from Procfile (or defaults to Python)

### Step 4: Add MongoDB Service

1. In Railway project, click **"+ New"**
2. Search **"MongoDB"**
3. Click **"Add"**
4. Railway auto-generates credentials

### Step 5: Configure Environment Variables

In the backend service settings:

```
MONGO_URL=mongodb+srv://[user]:[password]@[cluster].mongodb.net/gradeflow_db
DB_NAME=gradeflow_db
JWT_SECRET=<generate-secure-32-char-key>
ENVIRONMENT=production
LOG_LEVEL=INFO
```

#### Get MongoDB Connection String

1. In Railway, go to MongoDB service
2. Click **"Connect"**
3. Copy connection string
4. Add `gradeflow_db` as database name
5. Paste in backend `MONGO_URL`

#### Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 6: Configure Procfile

Create `backend/Procfile`:

```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Step 7: Deploy

1. Click **"Deploy"**
2. Railway builds and deploys automatically
3. View logs in **"Logs"** tab
4. Get public URL from Railway dashboard

### Step 8: Test Deployment

```bash
# Replace with your Railway URL
curl https://your-railway-app.railway.app/docs

# Test API endpoint
curl https://your-railway-app.railway.app/api/dashboard/stats
```

### Step 9: Update Frontend

Set frontend environment variable:

```env
REACT_APP_BACKEND_URL=https://your-railway-app.railway.app
```

Redeploy frontend to Netlify.

---

## Option 2: Deploy to Render

Render offers free tier with easy GitHub integration.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com/)
2. Click **"Get Started"**
3. Choose **"Deploy from GitHub"**
4. Authorize Render

### Step 2: Create Web Service

1. Click **"Create new"** → **"Web Service"**
2. Choose **"Deploy an existing repository"**
3. Search and select **`gradeflow_system`**
4. Click **"Connect"**

### Step 3: Configure Service

**Basic Settings:**
- **Name**: `gradeflow-backend`
- **Environment**: `Python 3`
- **Region**: Select closest to you
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy:**
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Step 4: Add MongoDB

#### Option A: Use MongoDB Atlas (Recommended)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to Render environment variables

#### Option B: Use Render's PostgreSQL

Not ideal for document-based data. Stick with MongoDB Atlas or Railway's MongoDB.

### Step 5: Set Environment Variables

Click **"Environment"** and add:

```
MONGO_URL=mongodb+srv://user:password@cluster.mongodb.net/gradeflow_db
DB_NAME=gradeflow_db
JWT_SECRET=<your-secure-key>
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Step 6: Deploy

1. Click **"Create Web Service"**
2. Render builds from GitHub
3. View build logs during deployment
4. Get service URL when ready

### Step 7: Test

```bash
curl https://gradeflow-backend.onrender.com/docs
```

### Step 8: Configure Auto-Deploy

1. In Render service, go to **"Settings"**
2. Enable **"Auto-Deploy"**
3. Choose branch (default: `main`)

---

## Option 3: Deploy to Heroku (Legacy - Paid)

Heroku requires credit card but offers reliable hosting.

### Step 1: Install Heroku CLI

```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
choco install heroku-cli

# Linux
curl https://cli.heroku.com/install.sh | sh
```

### Step 2: Login

```bash
heroku login
```

### Step 3: Create Heroku App

```bash
cd backend
heroku create gradeflow-backend
```

### Step 4: Add MongoDB

```bash
# If using MongoDB Atlas
heroku config:set MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db

# Or add Heroku MongoDB addon (paid)
heroku addons:create mongolab:sandbox
```

### Step 5: Set Other Variables

```bash
heroku config:set JWT_SECRET=<your-key>
heroku config:set ENVIRONMENT=production
```

### Step 6: Deploy

```bash
# Ensure you're on main branch
git checkout main

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

### Step 7: Get URL

```bash
heroku open
# or
heroku info  # Shows app URL
```

---

## Database: MongoDB Atlas Setup

Best for all deployment platforms.

### Step 1: Create Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"**
3. Create account (email or Google)

### Step 2: Create Cluster

1. Click **"Create a Deployment"**
2. Choose **"M0 Free"** tier
3. Select cloud provider (AWS/Google/Azure)
4. Select region (same as your backend)
5. Click **"Create Cluster"**

### Step 3: Create Database User

1. Click **"Security"** → **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create username/password
5. Click **"Add User"**

### Step 4: Whitelist IP

1. Click **"Security"** → **"Network Access"**
2. Click **"Add IP Address"**
3. Choose **"Allow access from anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Step 5: Get Connection String

1. Click **"Clusters"** → **"Connect"**
2. Choose **"Connect your application"**
3. Select **"Python"** driver
4. Copy connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gradeflow_db?retryWrites=true&w=majority
   ```

### Step 6: Add to Backend Environment

```env
MONGO_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/gradeflow_db?retryWrites=true&w=majority
DB_NAME=gradeflow_db
```

---

## Comparison: Railway vs Render

| Feature | Railway | Render | Heroku |
|---------|---------|--------|--------|
| **Free Tier** | $5 credit | $0.10/hour ($7.20/mo) | None (paid) |
| **MongoDB** | Included free | Need Atlas | Addon (paid) |
| **GitHub Integration** | ✅ | ✅ | ✅ |
| **Auto-Deploy** | ✅ | ✅ | ✅ |
| **Environment Variables** | ✅ | ✅ | ✅ |
| **Custom Domain** | ✅ | ✅ | ✅ |
| **SSL/HTTPS** | ✅ Free | ✅ Free | ✅ Free |
| **Support** | Good | Good | Excellent |
| **Speed** | Fast | Fast | Fast |
| **Recommended** | ⭐⭐⭐ | ⭐⭐ | ⭐ |

---

## Monitoring & Logs

### Railway

```bash
# View logs in real-time
railway logs --service backend

# View logs in dashboard: Project → Logs tab
```

### Render

1. Go to service
2. Click **"Logs"** tab
3. View build and runtime logs

### Heroku

```bash
heroku logs --tail
heroku logs --source app --lines 50
```

---

## Performance Tuning

### Connection Pooling

Already configured in `server.py`:

```python
client = AsyncIOMotorClient(
    mongo_url,
    maxPoolSize=10,      # Maximum connections
    minPoolSize=0,       # Minimum connections
    maxIdleTimeMS=60000  # Idle timeout
)
```

### Request Timeouts

```python
connectTimeoutMS=5000      # 5 seconds
serverSelectionTimeoutMS=5000  # 5 seconds
```

### Database Indexes

Create indexes for better performance:

```bash
# Connect to MongoDB
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db"

# Create indexes
db.answer_sheets.createIndex({ exam_id: 1, student_id: 1 })
db.exams.createIndex({ subject_id: 1 })
db.students.createIndex({ class_name: 1 })
db.users.createIndex({ email: 1 })
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'motor'"

Solution: Ensure `requirements.txt` is installed:

```bash
# Railway/Render auto-installs from requirements.txt
# Check: requirements.txt includes motor
cat requirements.txt | grep motor
```

### "MONGO_URL not set"

Solution: Set environment variable:

```bash
# Railway: Environment tab
# Render: Environment section
# Heroku: heroku config:set MONGO_URL=...
```

### "Connection timeout to MongoDB"

Solutions:
1. Check IP is whitelisted in MongoDB Atlas
2. Verify connection string is correct
3. Ensure MongoDB cluster is running
4. Check backend logs for detailed error

### "Port already in use"

Railway/Render automatically assign port via `$PORT` variable. Ensure `--port $PORT` in command.

### Deployment fails with "Python version error"

Solution: Specify Python version in `runtime.txt`:

```
python-3.11.0
```

---

## Custom Domain

### Railway

1. Go to service **"Settings"**
2. Add **"Custom Domain"**
3. Update DNS to Railway nameservers
4. SSL auto-provisioned

### Render

1. Go to service **"Settings"**
2. Add **"Custom Domain"**
3. Update DNS records
4. SSL auto-provisioned

### Heroku

```bash
heroku domains:add api.yourdomain.com
```

Then update DNS records pointing to Heroku app.

---

## Backing Up Data

### MongoDB Atlas

1. Go to **"Backup"** section
2. Enable automated backups
3. Download backups anytime

### Manual Backup

```bash
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db" --out ./backup
```

### Restore

```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/gradeflow_db" ./backup
```

---

## Next Steps

1. ✅ Choose platform (Railway recommended)
2. ✅ Deploy backend
3. ✅ Set up MongoDB
4. ✅ Configure environment variables
5. ✅ Test API endpoints
6. ✅ Update frontend REACT_APP_BACKEND_URL
7. ✅ Redeploy frontend to Netlify
8. ✅ Test full application
9. ✅ Set up monitoring
10. ✅ Configure backups

---

**Recommended Path:**
1. Deploy frontend to Netlify
2. Deploy backend to Railway
3. Use MongoDB Atlas for database

For issues, check platform docs or [DEPLOYMENT.md](../DEPLOYMENT.md).
