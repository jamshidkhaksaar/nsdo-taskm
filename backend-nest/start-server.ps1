# Start the NestJS server with error logging
Write-Host "Starting NestJS server..." -ForegroundColor Cyan

# Ensure we are in the backend-nest directory
$currentDir = (Get-Location).Path
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($currentDir -ne $scriptDir) {
    Write-Host "Changing to backend-nest directory..." -ForegroundColor Yellow
    Set-Location $scriptDir
}

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

# Redirect output to log file
$ErrorActionPreference = "Continue"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error starting server. Check ../server.log for details." -ForegroundColor Red
    $Error[0] | Out-File -Append -FilePath "../server.log"
} 