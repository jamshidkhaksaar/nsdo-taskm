# This script helps create the MySQL database for the NestJS application

# Define the MySQL executable path - update this to match your installation
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# Check if the MySQL executable exists at the specified path
if (-not (Test-Path $mysqlPath)) {
    Write-Host "MySQL executable not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the script with the correct path to your MySQL installation" -ForegroundColor Yellow
    
    # Try to find MySQL in common locations
    $possiblePaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin\mysql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-Host "Found MySQL at: $path" -ForegroundColor Green
            Write-Host "Please update the script with this path and run it again" -ForegroundColor Yellow
        }
    }
    
    exit
}

# Prompt for MySQL root password
$password = Read-Host "Enter MySQL root password" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

# Create a temporary SQL file
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value @"
CREATE DATABASE IF NOT EXISTS taskmanagement;
"@

# Run the MySQL command - fixed for PowerShell
try {
    Write-Host "Attempting to create database..." -ForegroundColor Cyan
    
    # Use Get-Content to read the file and pipe it to mysql
    $sqlCommand = Get-Content -Path $tempFile -Raw
    
    # Use echo to pipe the SQL command to mysql
    $sqlCommand | & $mysqlPath -u root -p"$plainPassword"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'taskmanagement' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to create database. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error executing MySQL command: $_" -ForegroundColor Red
} finally {
    # Clean up the temporary file
    Remove-Item -Path $tempFile -Force
}

# Provide instructions for next steps
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make sure your .env file has the correct MySQL configuration:" -ForegroundColor Cyan
Write-Host @"
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=taskmanagement
DATABASE_SYNC=true
"@ -ForegroundColor White

Write-Host "`n2. Start your NestJS application:" -ForegroundColor Cyan
Write-Host "   npm run start:dev" -ForegroundColor White 