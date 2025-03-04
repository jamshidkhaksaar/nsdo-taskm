#!/bin/bash

# Exit on error
set -e

echo "🧪 Setting up local production test environment..."

# Step 1: Create test database
echo "Creating test database..."
mysql -u root -proot -e "DROP DATABASE IF EXISTS taskmanagement_test; CREATE DATABASE taskmanagement_test;"
echo "✅ Test database created"

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

# Step 5: Set up a local server for frontend
echo "📡 Setting up local server for frontend..."
npm install -g serve

# Start services in separate terminals
echo "🚀 Starting services..."
cd ../backend-nest
gnome-terminal -- bash -c "node dist/main.js; exec bash" || open -a Terminal.app "node dist/main.js" || xterm -e "node dist/main.js" || x-terminal-emulator -e "node dist/main.js" || konsole -e "node dist/main.js" &
cd ../frontend
gnome-terminal -- bash -c "serve -s build -l 3000; exec bash" || open -a Terminal.app "serve -s build -l 3000" || xterm -e "serve -s build -l 3000" || x-terminal-emulator -e "serve -s build -l 3000" || konsole -e "serve -s build -l 3000" &

cd ..
echo "✨ Local production test environment is running!"
echo "- Backend: http://localhost:3001/api"
echo "- Frontend: http://localhost:3000"
echo "Note: To stop the services, close the terminal windows manually" 