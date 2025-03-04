# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "🧪 Setting up local production test environment..." -ForegroundColor Cyan

# Step 1: Create test database
Write-Host "Creating test database..." -ForegroundColor Yellow
mysql -u root -proot -e "DROP DATABASE IF EXISTS taskmanagement_test; CREATE DATABASE taskmanagement_test;"
Write-Host "✅ Test database created" -ForegroundColor Green

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

# Step 5: Set up a local server for frontend
Write-Host "📡 Setting up local server for frontend..." -ForegroundColor Yellow
npm install -g serve

# Start services in separate terminals
Write-Host "🚀 Starting services..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$PWD'; cd ..\backend-nest; node dist/main.js"
Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$PWD'; serve -s build -l 3000"

Set-Location -Path ".."
Write-Host "✨ Local production test environment is running!" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3001/api" -ForegroundColor White
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Note: To stop the services, close the terminal windows manually" -ForegroundColor Yellow 