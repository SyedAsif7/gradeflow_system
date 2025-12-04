# GradeFlow System

A comprehensive web application for automated grading and exam management. Built with **React**, **FastAPI**, and **MongoDB**.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Python](https://img.shields.io/badge/python-3.9+-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![Docker](https://img.shields.io/badge/docker-supported-blue)

## 🎯 Features

- **Answer Sheet Management**: Upload, organize, and manage student answer sheets
- **Intelligent Evaluation**: Interactive PDF viewer with annotation tools for grading
- **Multi-User Roles**: Admin, Teachers, and Students with role-based access control
- **Exam Management**: Create and manage exams with question templates
- **Student Management**: Manage student information and class assignments
- **Subject Management**: Organize subjects by class/year
- **Excel Export**: Generate and export marksheets in Excel format
- **Real-time Feedback**: Instant feedback and remarks for students
- **Secure Authentication**: JWT-based authentication and authorization
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## 🏗️ Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   React     │◄─────►│   FastAPI    │◄─────►│  MongoDB    │
│  Frontend   │ HTTP  │   Backend    │ Async │  Database   │
└─────────────┘       └──────────────┘       └─────────────┘
      :3000                :8000                  :27017
```

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/SyedAsif7/gradeflow_system.git
cd gradeflow_system

# Copy environment template
cp .env.example .env

# Start the stack
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run server
uvicorn server:app --reload --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Configure environment
cp .env.example .env

# Start development server
npm start
# or
yarn start
```

## 📦 Tech Stack

### Frontend
- **React 19**: Modern JavaScript library for building UIs
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **React PDF Viewer**: PDF annotation and viewing
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Unstyled, accessible component library

### Backend
- **FastAPI**: Modern Python web framework
- **Motor**: Async MongoDB driver
- **Pydantic**: Data validation
- **JWT**: Authentication
- **GridFS**: Large file storage
- **OpenPyXL**: Excel file handling

### Database
- **MongoDB**: NoSQL document database
- **GridFS**: File storage in MongoDB

## 📚 Project Structure

```
gradeflow_system/
├── frontend/                 # React application
│   ├── public/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── Dockerfile
├── backend/                  # FastAPI application
│   ├── server.py            # Main application
│   ├── requirements.txt
│   ├── uploads/             # Answer sheets storage
│   └── Dockerfile
├── docker-compose.yml       # Multi-container setup
├── DEPLOYMENT.md            # Deployment guide
├── README.md                # This file
└── .env.example             # Environment template
```

## 🔐 Environment Variables

### Backend (.env)

```env
MONGO_URL=mongodb://admin:password@localhost:27017/
DB_NAME=gradeflow_db
JWT_SECRET=your-secret-key
ENVIRONMENT=development
LOG_LEVEL=INFO
```

### Frontend (.env)

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

See `.env.example` files for complete configuration options.

## 📖 API Documentation

Interactive API documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🌐 Deployment

Multiple deployment options available:

### Frontend Deployment
- ✅ **Netlify** - [NETLIFY_DEPLOYMENT.md](NETLIFY_DEPLOYMENT.md)
- ✅ Vercel
- ✅ AWS Amplify
- ✅ GitHub Pages
- ✅ DigitalOcean App Platform

### Backend Deployment
- ✅ **Railway** - [RAILWAY_RENDER_DEPLOYMENT.md](RAILWAY_RENDER_DEPLOYMENT.md) (Recommended)
- ✅ **Render** - [RAILWAY_RENDER_DEPLOYMENT.md](RAILWAY_RENDER_DEPLOYMENT.md)
- ✅ Heroku
- ✅ AWS (ECS, Lambda)
- ✅ Google Cloud (Cloud Run)
- ✅ DigitalOcean App Platform

### Full Stack Deployment
- ✅ Docker & Docker Compose
- ✅ Kubernetes
- ✅ Docker Swarm
- ✅ Self-hosted VPS

**See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive guides on all platforms.**

## 📊 Database Setup

### MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`

### Local MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
# or
yarn test
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create new student
- `GET /api/students/{id}` - Get student details
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam
- `GET /api/exams/{id}` - Get exam details
- `PUT /api/exams/{id}` - Update exam
- `DELETE /api/exams/{id}` - Delete exam

### Answer Sheets
- `POST /api/answer-sheets/upload` - Upload answer sheet
- `GET /api/answer-sheets` - List answer sheets
- `GET /api/answer-sheets/{id}` - Get sheet details
- `PUT /api/answer-sheets/{id}/grade` - Submit grades
- `DELETE /api/answer-sheets/{id}` - Delete sheet

See [API Documentation](http://localhost:8000/docs) for complete endpoint reference.

## 🛠️ Development

### Code Quality
```bash
# Backend linting
cd backend
flake8 server.py

# Frontend linting
cd frontend
npm run lint
```

### Running in Development Mode
```bash
# Terminal 1: Backend
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3 (optional): MongoDB
docker run -p 27017:27017 mongo:latest
```

## 🐛 Troubleshooting

### MongoDB Connection Issues
```
Error: connection refused
Solution: Check MongoDB is running, verify MONGO_URL and credentials
```

### CORS Errors
```
Error: Cross-Origin Request Blocked
Solution: Check REACT_APP_BACKEND_URL matches backend server URL
```

### Docker Issues
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild containers
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 📞 Support

- 📖 [FastAPI Docs](https://fastapi.tiangolo.com/)
- 📖 [React Docs](https://react.dev/)
- 📖 [MongoDB Docs](https://docs.mongodb.com/)
- 📖 [Docker Docs](https://docs.docker.com/)

## 📄 License

This project is licensed under the ISC License - see LICENSE file for details.

## 👨‍💻 Author

**Syed Asif** - [GitHub Profile](https://github.com/SyedAsif7)

## 🙏 Acknowledgments

Built with modern technologies and best practices for educational institutions.

---

**Last Updated**: December 2025  
**Version**: 1.0.0
