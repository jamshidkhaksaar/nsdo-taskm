#!/bin/bash

# Exit on error
set -e

echo "🧪 Setting up complete local production test environment..."

# Step 1: Create test database
echo "Creating test database..."
if mysql -u root -proot -e "DROP DATABASE IF EXISTS taskmanagement_test; CREATE DATABASE taskmanagement_test;"; then
    echo "✅ Test database created"
else
    echo "❌ Failed to create database. Make sure MySQL is running and credentials are correct."
    echo "Error: $?"
    exit 1
fi

# Step 2: Copy test environment file
echo "Setting up test environment variables..."
cp backend-nest/.env.test backend-nest/.env

# Step 3: Build backend
echo "🔧 Building backend in production mode..."
cd backend-nest
npm install
npm run build
echo "✅ Backend build completed"

# Step 4: Build frontend
echo "🔨 Building frontend in production mode..."
cd ../frontend
npm install
npm run build
echo "✅ Frontend build completed"

# Step 5: Back to root and install dependencies for data import
cd ..
echo "Installing dependencies for data import..."
npm install typeorm bcrypt uuid

# Step 6: Import test data
echo "💾 Importing test data..."
if node import-test-data.js; then
    echo "✅ Test data imported successfully"
else
    echo "❌ Failed to import test data"
    echo "Error: $?"
    echo "Continuing anyway..."
fi

# Step 7: Set up a local server for frontend
echo "📡 Setting up local server for frontend..."
npm install -g serve

# Step 8: Start services in separate terminals
echo "🚀 Starting services..."
cd backend-nest
gnome-terminal -- bash -c "node dist/main.js; exec bash" || open -a Terminal.app "node dist/main.js" || xterm -e "node dist/main.js" || x-terminal-emulator -e "node dist/main.js" || konsole -e "node dist/main.js" &
cd ../frontend
gnome-terminal -- bash -c "serve -s build -l 3000; exec bash" || open -a Terminal.app "serve -s build -l 3000" || xterm -e "serve -s build -l 3000" || x-terminal-emulator -e "serve -s build -l 3000" || konsole -e "serve -s build -l 3000" &

cd ..
echo "✨ Local production test environment is now running!"
echo "- Backend: http://localhost:3001/api"
echo "- Frontend: http://localhost:3000"
echo ""
echo "Test User Credentials:"
echo "- Admin: username=admin, password=admin123"
echo "- User 1: username=user1, password=user123" 
echo "- User 2: username=user2, password=user123"
echo ""
echo "Note: To stop the services, close the terminal windows manually" 