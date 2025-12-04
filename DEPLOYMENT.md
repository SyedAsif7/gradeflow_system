# GradeFlow System - Deployment Guide

## Overview

GradeFlow is a full-stack web application for automated grading and exam management. It consists of:
- **Frontend**: React application with Tailwind CSS and Radix UI components
- **Backend**: FastAPI server with MongoDB integration
- **Database**: MongoDB (local or cloud)
- **File Storage**: GridFS for PDF answer sheets

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.9+ (for local backend development)
- MongoDB instance (local or MongoDB Atlas)
- Git

## Quick Start with Docker

### 1. **Using Docker Compose (Recommended)**

Clone the repository and navigate to the project directory:
```bash
cd gradeflow_system
```

Create a `.env` file in the root directory:
```bash
# MongoDB Configuration
MONGO_URL=mongodb://mongo:27017
DB_NAME=gradeflow_db

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Backend Configuration
BACKEND_PORT=8000
BACKEND_URL=http://localhost:8000

# Frontend Configuration
REACT_APP_BACKEND_URL=http://localhost:8000
```

Start the stack:
```bash
docker-compose up -d
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 2. **Local Development Setup**

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URL and other credentials

# Run the server
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create .env file
cp .env.example .env
# Edit .env with your backend URL (e.g., http://localhost:8000)

# Start development server
npm start
# or
yarn start
```

## Production Deployment Options

### Option 1: Deploy with Vercel (Frontend) + Railway/Render (Backend)

#### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Configure environment variables in Vercel dashboard:
   - `REACT_APP_BACKEND_URL`: Your production backend URL
4. Deploy button will trigger automatically on push

#### Deploy Backend to Railway/Render

**Using Railway:**

1. Push code to GitHub
2. Connect repository to Railway dashboard
3. Set environment variables:
   - `MONGO_URL`: Your MongoDB Atlas connection string
   - `DB_NAME`: gradeflow_db
   - `JWT_SECRET`: Strong secret key
4. Railway automatically detects FastAPI and deploys

**Using Render:**

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set runtime to Python 3.10
4. Configure environment variables
5. Set start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`

### Option 2: Deploy with Docker to AWS/Google Cloud/DigitalOcean

#### Using DigitalOcean App Platform

1. Create new app in DigitalOcean
2. Connect GitHub repository
3. Create `app.yaml` in project root (see example below)
4. Configure services for frontend, backend, and database

#### Using AWS ECS

```bash
# Build and push Docker images to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

# Tag and push frontend image
docker tag gradeflow-frontend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/gradeflow-frontend:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/gradeflow-frontend:latest

# Tag and push backend image
docker tag gradeflow-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/gradeflow-backend:latest
docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/gradeflow-backend:latest
```

### Option 3: Self-Hosted with Docker Swarm or Kubernetes

#### Docker Swarm

```bash
# Initialize Docker Swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml gradeflow
```

#### Kubernetes

Create `kubernetes.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gradeflow-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gradeflow-backend
  template:
    metadata:
      labels:
        app: gradeflow-backend
    spec:
      containers:
      - name: gradeflow-backend
        image: your-registry/gradeflow-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGO_URL
          valueFrom:
            secretKeyRef:
              name: gradeflow-secrets
              key: mongo-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: gradeflow-secrets
              key: jwt-secret
```

Deploy:
```bash
kubectl apply -f kubernetes.yaml
```

## Environment Variables

### Backend (.env)

```env
# Database
MONGO_URL=mongodb://username:password@host:port/
DB_NAME=gradeflow_db

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters

# Server
ENVIRONMENT=development  # or production
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

## Database Setup

### MongoDB Atlas (Cloud)

1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user
4. Whitelist IP addresses
5. Get connection string: `mongodb+srv://user:password@cluster.mongodb.net/`

### Local MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally: https://docs.mongodb.com/manual/installation/
```

## Monitoring and Maintenance

### Health Checks

- Backend: `http://your-backend-url/health` (if implemented)
- Frontend: Check console for errors

### Logs

**Docker:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Application Logs:**
- Backend logs are written to console/Docker logs
- Configure log files in `.env` if needed

### Database Backups

**MongoDB Atlas**: Automatic backups included with paid plans

**Local MongoDB**:
```bash
mongodump --uri "mongodb://localhost:27017" --out ./backup

mongorestore --uri "mongodb://localhost:27017" --dir ./backup
```

## Performance Optimization

### Frontend
- Enable gzip compression in nginx
- Use CDN for static assets
- Implement lazy loading for components
- Optimize images and PDFs

### Backend
- Use connection pooling (configured in server.py)
- Implement caching where applicable
- Use indexes in MongoDB
- Rate limiting for API endpoints

### Database
```javascript
// Create indexes
db.answer_sheets.createIndex({ exam_id: 1, student_id: 1 })
db.exams.createIndex({ subject_id: 1 })
db.students.createIndex({ class_name: 1 })
```

## Troubleshooting

### Connection Issues

**Backend can't connect to MongoDB:**
```
Solution: Check MONGO_URL, ensure database is running, verify whitelist IPs
```

**Frontend can't reach backend:**
```
Solution: Check REACT_APP_BACKEND_URL, CORS settings, network connectivity
```

### Docker Issues

```bash
# Clear Docker cache and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong, random value
- [ ] Enable HTTPS/SSL certificates
- [ ] Set secure MongoDB authentication
- [ ] Enable CORS with specific origins only
- [ ] Use environment variables for all secrets
- [ ] Implement rate limiting
- [ ] Regular security updates for dependencies
- [ ] Use firewall rules appropriately
- [ ] Enable MongoDB authentication
- [ ] Regular backups configured

## Support

For issues and questions, refer to:
- Backend: FastAPI documentation - https://fastapi.tiangolo.com/
- Frontend: React documentation - https://react.dev/
- MongoDB: MongoDB documentation - https://docs.mongodb.com/
- Docker: Docker documentation - https://docs.docker.com/

---

**Last Updated**: December 2025
**Version**: 1.0
