# PowerShell script to run all tests

# Set colors for output
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow

Write-Host "Starting test suite for the entire application..." -ForegroundColor $Yellow

# Run frontend tests
Write-Host "`nRunning frontend tests..." -ForegroundColor $Yellow
Set-Location -Path frontend
$frontendResult = (npm test -- --watchAll=false) | Out-Host
$frontendSuccess = $LASTEXITCODE -eq 0

if ($frontendSuccess) {
    Write-Host "Frontend tests passed!" -ForegroundColor $Green
} else {
    Write-Host "Frontend tests failed!" -ForegroundColor $Red
}

# Run backend unit tests
Write-Host "`nRunning backend unit tests..." -ForegroundColor $Yellow
Set-Location -Path ../backend-nest
$backendUnitResult = (npm test) | Out-Host
$backendUnitSuccess = $LASTEXITCODE -eq 0

if ($backendUnitSuccess) {
    Write-Host "Backend unit tests passed!" -ForegroundColor $Green
} else {
    Write-Host "Backend unit tests failed!" -ForegroundColor $Red
}

# Run backend E2E tests
Write-Host "`nRunning backend E2E tests..." -ForegroundColor $Yellow
$backendE2EResult = (npm run test:e2e) | Out-Host
$backendE2ESuccess = $LASTEXITCODE -eq 0

if ($backendE2ESuccess) {
    Write-Host "Backend E2E tests passed!" -ForegroundColor $Green
} else {
    Write-Host "Backend E2E tests failed!" -ForegroundColor $Red
}

# Return to the root directory
Set-Location -Path ..

# Check if all tests passed
if ($frontendSuccess -and $backendUnitSuccess -and $backendE2ESuccess) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor $Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Please check the output above for details." -ForegroundColor $Red
    exit 1
} 