#!/bin/bash
# Build and Push Script for GradeFlow Docker Images
# Usage: ./build-and-push.sh [registry] [version]

set -e

REGISTRY="${1:-docker.io/syed_asif7}"
VERSION="${2:-latest}"

echo "🔨 Building GradeFlow Docker Images"
echo "Registry: $REGISTRY"
echo "Version: $VERSION"

# Build Backend
echo ""
echo "📦 Building Backend Image..."
docker build -t "$REGISTRY/gradeflow-backend:$VERSION" ./backend
docker tag "$REGISTRY/gradeflow-backend:$VERSION" "$REGISTRY/gradeflow-backend:latest"

# Build Frontend  
echo ""
echo "📦 Building Frontend Image..."
docker build -t "$REGISTRY/gradeflow-frontend:$VERSION" ./frontend
docker tag "$REGISTRY/gradeflow-frontend:$VERSION" "$REGISTRY/gradeflow-frontend:latest"

echo ""
echo "✅ Build complete!"
echo ""
echo "To push images to registry:"
echo "  docker push $REGISTRY/gradeflow-backend:$VERSION"
echo "  docker push $REGISTRY/gradeflow-frontend:$VERSION"
echo ""
echo "Or run: docker-compose push"
