# Getting Started with GradeFlow

Welcome to GradeFlow! This guide will help you get the application running locally in minutes.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker** ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose** (Usually comes with Docker Desktop)
- **Git** ([Download](https://git-scm.com/))

### Verify Installation

```bash
docker --version
docker-compose --version
git --version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/SyedAsif7/gradeflow_system.git
cd gradeflow_system
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
# Root environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

Edit `.env` and update credentials if needed (especially for production):

```env
MONGO_ROOT_PASSWORD=change_this_to_secure_password
JWT_SECRET=generate_a_secure_key
```

### 3. Start the Application

#### Using Docker Compose (Recommended)

**Linux/macOS:**
```bash
./deploy.sh
```

**Windows:**
```bash
deploy.bat
```

**Or manually:**
```bash
docker-compose up -d
```

### 4. Verify Installation

Wait 30 seconds for all services to start, then open your browser:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Default Credentials

When first installed, you'll need to seed the database with initial users:

```bash
cd backend
python seed_user.py
```

This will create:
- **Admin**: admin@example.com / password
- **Teacher**: teacher@example.com / password
- **Student**: student@example.com / password

> ⚠️ Change these credentials in production!

## Common Tasks

### View Application Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

### Stop All Services

```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

### Access MongoDB Directly

```bash
# Connect to MongoDB shell
docker-compose exec mongo mongosh -u admin -p password

# Or use MongoDB Compass
# Connection string: mongodb://admin:password@localhost:27017/
```

### View Database Collections

```bash
docker-compose exec mongo mongosh -u admin -p password --eval "use gradeflow_db; db.getCollectionNames()"
```

### Rebuild Containers

```bash
# Remove volumes too (fresh start)
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Development Setup

If you want to develop locally without Docker:

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start MongoDB (in separate terminal)
docker run -p 27017:27017 mongo:latest

# Configure .env file
cp .env.example .env
# Edit .env with MongoDB URL: mongodb://localhost:27017

# Run the server
uvicorn server:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Configure .env file
cp .env.example .env
# Edit .env if backend is not on localhost:8000

# Start development server
npm start
# or
yarn start
```

## Troubleshooting

### Port Already in Use

```
Error: address already in use :::3000
```

Solution: Kill the process using the port or change ports in docker-compose.yml

```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in docker-compose.yml
```

### MongoDB Connection Failed

```
Error: Failed to initialize MongoDB connection
```

Solution:
1. Check MongoDB is running: `docker-compose logs mongo`
2. Verify credentials in `.env`
3. Check connection string: `mongodb://admin:password@mongo:27017/`

### Frontend can't reach Backend

```
Error: Network request failed / CORS error
```

Solution:
1. Check `REACT_APP_BACKEND_URL` in frontend/.env
2. Ensure backend is running: `docker-compose logs backend`
3. Verify API is accessible: `curl http://localhost:8000/docs`

### Docker Daemon not Running

```
Error: Cannot connect to Docker daemon
```

Solution:
1. Start Docker Desktop (Windows/macOS)
2. Or start Docker service (Linux): `sudo systemctl start docker`

## Next Steps

1. **Create Initial Data**: Upload exams, students, and subjects
2. **Upload Answer Sheets**: Start uploading student answer PDFs
3. **Begin Evaluation**: Use the evaluation interface to grade papers
4. **Export Results**: Generate Excel marksheets

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment to production platforms
- [API Documentation](http://localhost:8000/docs) - Interactive API reference
- [README.md](README.md) - Project overview and features

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review [DEPLOYMENT.md](DEPLOYMENT.md)
3. Check application logs: `docker-compose logs -f`
4. Open an issue on [GitHub](https://github.com/SyedAsif7/gradeflow_system/issues)

## Tips for Success

✅ **Do:**
- Use Docker for consistent environment
- Keep environment variables secure
- Backup MongoDB regularly
- Monitor logs for errors
- Use strong passwords in production

❌ **Don't:**
- Commit `.env` files to git
- Use default credentials in production
- Run as root in production
- Expose MongoDB directly to internet
- Keep debug mode enabled in production

---

Happy grading! 🎓
