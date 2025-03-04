# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "🧪 Setting up complete local production test environment..." -ForegroundColor Cyan

# Step 1: Create test database
Write-Host "Creating test database..." -ForegroundColor Yellow
try {
    mysql -u root -proot -e "DROP DATABASE IF EXISTS taskmanagement_test; CREATE DATABASE taskmanagement_test;"
    Write-Host "✅ Test database created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create database. Make sure MySQL is running and credentials are correct." -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Copy test environment file
Write-Host "Setting up test environment variables..." -ForegroundColor Yellow
Copy-Item -Path "backend-nest\.env.test" -Destination "backend-nest\.env" -Force

# Step 3: Build backend
Write-Host "🔧 Building backend in production mode..." -ForegroundColor Yellow
Set-Location -Path "backend-nest"
npm install
npm run build
Write-Host "✅ Backend build completed" -ForegroundColor Green

# Step 4: Build frontend
Write-Host "🔨 Building frontend in production mode..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"
npm install
npm run build
Write-Host "✅ Frontend build completed" -ForegroundColor Green

# Step 5: Back to root and install dependencies for data import
Set-Location -Path ".."
Write-Host "Installing dependencies for data import..." -ForegroundColor Yellow
npm install typeorm bcrypt uuid

# Step 6: Import test data
Write-Host "💾 Importing test data..." -ForegroundColor Yellow
try {
    node import-test-data.js
    Write-Host "✅ Test data imported successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to import test data" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Continuing anyway..." -ForegroundColor Yellow
}

# Step 7: Set up a local server for frontend
Write-Host "📡 Setting up local server for frontend..." -ForegroundColor Yellow
npm install -g serve

# Step 8: Start services in separate terminals
Write-Host "🚀 Starting services..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$PWD'; cd backend-nest; node dist/main.js"
Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$PWD'; cd frontend; serve -s build -l 3000"

Write-Host "✨ Local production test environment is now running!" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001/api" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Test User Credentials:" -ForegroundColor White
Write-Host "- Admin: username=admin, password=admin123" -ForegroundColor White
Write-Host "- User 1: username=user1, password=user123" -ForegroundColor White
Write-Host "- User 2: username=user2, password=user123" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Note: To stop the services, close the terminal windows manually" -ForegroundColor Yellow 