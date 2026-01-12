#!/bin/bash
set -e  # Exit on error

# Firebase Deployment Script for MindGrid

echo "🚀 Starting Firebase Deployment..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Verify build output exists
if [ ! -d "frontend/out" ]; then
    echo "❌ Frontend build output not found at frontend/out"
    echo "   Make sure next.config.ts has output: 'export'"
    exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env not found. Make sure to set up environment variables in Firebase Console."
fi

# Deploy to Firebase
echo "☁️  Deploying to Firebase..."
firebase deploy

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://mindgrid-cf2e1.web.app"
