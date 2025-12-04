#!/bin/bash
# GradeFlow System - Quick Start Deployment Script

set -e

echo "🚀 GradeFlow System - Deployment Setup"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install it first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration:"
    echo "   nano .env"
    echo ""
fi

# Check for backend .env
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file from template..."
    cp backend/.env.example backend/.env
fi

# Check for frontend .env
if [ ! -f frontend/.env ]; then
    echo "📝 Creating frontend/.env file from template..."
    cp frontend/.env.example frontend/.env
fi

echo "🔨 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

echo ""
echo "✅ GradeFlow System is running!"
echo ""
echo "📍 Access the application:"
echo "   • Frontend: http://localhost:3000"
echo "   • Backend API: http://localhost:8000"
echo "   • API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Useful commands:"
echo "   • View logs: docker-compose logs -f"
echo "   • Stop services: docker-compose down"
echo "   • Restart services: docker-compose restart"
echo ""
echo "💾 MongoDB connection string:"
echo "   mongodb://admin:password@localhost:27017/gradeflow_db?authSource=admin"
echo ""
echo "🔒 IMPORTANT: Change the default credentials in .env before deploying to production!"
echo ""
