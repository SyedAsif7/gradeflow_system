#!/bin/bash

# Build script for the exam management system

echo "Building the frontend..."
cd frontend
yarn install
yarn build
cd ..

echo "Build completed!"
echo "The frontend build is available in frontend/build/"