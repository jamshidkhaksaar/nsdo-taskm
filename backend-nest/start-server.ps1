# Start the NestJS server with error logging
Write-Host "Starting NestJS server..." -ForegroundColor Cyan

# Set environment variables
$env:PORT = 3001
$env:NODE_ENV = "development"

# Clean any old build files
if (Test-Path dist) {
    Write-Host "Cleaning old build files..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force dist
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path node_modules)) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the project
Write-Host "Building the project..." -ForegroundColor Yellow
npm run build

# Start the server
Write-Host "Starting the server..." -ForegroundColor Green
npm run start:dev 