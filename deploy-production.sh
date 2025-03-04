#!/bin/bash

# Exit on error
set -e

echo "📦 Building and deploying application to production..."

# Copy production environment file
echo "Setting up environment variables..."
cp backend-nest/.env.production backend-nest/.env

# Backend build
echo "🔧 Building backend..."
cd backend-nest
npm install --production=false
npm run build
echo "✅ Backend build completed"

# Frontend build
echo "🔨 Building frontend..."
cd ../frontend
npm install --production=false
npm run build
echo "✅ Frontend build completed"

echo "🚀 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Deploy the 'backend-nest/dist' folder to your server"
echo "2. Deploy the 'frontend/build' folder to your web server or CDN"
echo "3. Ensure your database is properly configured according to your .env.production file"
echo "4. Start your NestJS application with 'node dist/main' on your server"
echo ""
echo "For advanced deployments, consider using Docker or a platform service like AWS, Google Cloud, or Heroku." 