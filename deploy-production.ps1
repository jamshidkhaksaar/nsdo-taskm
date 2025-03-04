# Exit on error
$ErrorActionPreference = "Stop"

Write-Host "📦 Building and deploying application to production..." -ForegroundColor Cyan

# Copy production environment file
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
Copy-Item -Path "backend-nest\.env.production" -Destination "backend-nest\.env" -Force

# Backend build
Write-Host "🔧 Building backend..." -ForegroundColor Yellow
Set-Location -Path "backend-nest"
npm install --production=false
npm run build
Write-Host "✅ Backend build completed" -ForegroundColor Green

# Frontend build
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
Set-Location -Path "..\frontend"
npm install --production=false
npm run build
Write-Host "✅ Frontend build completed" -ForegroundColor Green

Set-Location -Path ".."
Write-Host "🚀 Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy the 'backend-nest\dist' folder to your server" -ForegroundColor White
Write-Host "2. Deploy the 'frontend\build' folder to your web server or CDN" -ForegroundColor White
Write-Host "3. Ensure your database is properly configured according to your .env.production file" -ForegroundColor White
Write-Host "4. Start your NestJS application with 'node dist/main' on your server" -ForegroundColor White
Write-Host ""
Write-Host "For advanced deployments, consider using Docker or a platform service like AWS, Google Cloud, or Azure." -ForegroundColor Cyan 