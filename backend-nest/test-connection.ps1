# Test connection to the backend server
Write-Host "Testing connection to the backend server..." -ForegroundColor Yellow

try {
    # Test connection to the root API endpoint
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api" -Method GET -ErrorAction Stop
    Write-Host "Successfully connected to the backend server!" -ForegroundColor Green
    Write-Host "Status code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response content: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Error connecting to the backend server:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Check if the server is running on a different port
    Write-Host "`nChecking if the server is running on different ports..." -ForegroundColor Yellow
    $ports = @(3000, 3001, 3002, 3003, 3333, 8000, 8080)
    foreach ($port in $ports) {
        try {
            $null = Test-NetConnection -ComputerName localhost -Port $port -ErrorAction SilentlyContinue
            if ($?) {
                Write-Host "Port $port is open!" -ForegroundColor Green
            }
        } catch {
            # Ignore errors
        }
    }
    
    # List running Node processes
    Write-Host "`nChecking running Node.js processes..." -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -eq "node" } | Format-Table Id, ProcessName, StartTime, CPU
}

# Pause to see the results
Write-Host "`nPress Enter to exit..." -ForegroundColor Yellow
$null = Read-Host 