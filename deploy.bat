@echo off
REM GradeFlow System - Quick Start Deployment Script for Windows

echo.
echo ========================================
echo GradeFlow System - Deployment Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker is not installed or not in PATH
    echo Please install Docker first: https://docs.docker.com/get-docker/
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo Error: Docker Compose is not installed
    echo Please install Docker Compose: https://docs.docker.com/compose/install/
    exit /b 1
)

echo ✓ Docker and Docker Compose are installed
echo.

REM Check for .env file
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo ✓ .env file created
    echo Edit .env with your configuration before proceeding
    echo.
)

REM Check for backend .env
if not exist backend\.env (
    echo Creating backend\.env file from template...
    copy backend\.env.example backend\.env
)

REM Check for frontend .env
if not exist frontend\.env (
    echo Creating frontend\.env file from template...
    copy frontend\.env.example frontend\.env
)

echo.
echo Building Docker images...
docker-compose build

echo.
echo Starting services...
docker-compose up -d

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak

echo.
echo ========================================
echo ✓ GradeFlow System is running!
echo ========================================
echo.
echo Access the application:
echo   * Frontend: http://localhost:3000
echo   * Backend API: http://localhost:8000
echo   * API Docs: http://localhost:8000/docs
echo.
echo Useful commands:
echo   * View logs: docker-compose logs -f
echo   * Stop services: docker-compose down
echo   * Restart services: docker-compose restart
echo.
echo MongoDB connection string:
echo   mongodb://admin:password@localhost:27017/gradeflow_db?authSource=admin
echo.
echo IMPORTANT: Change the default credentials in .env before deploying!
echo.
pause
