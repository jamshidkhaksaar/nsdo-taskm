# Stop any running Node processes
Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue

# Clear the terminal
Clear-Host

# Start the server in development mode
Write-Host "Starting the NestJS server in development mode..." -ForegroundColor Green
npm run start:dev 