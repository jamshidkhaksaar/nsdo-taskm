# Simple script to create MySQL database for NestJS application

# Define the MySQL executable path - update this to match your installation
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

# Check if the MySQL executable exists at the specified path
if (-not (Test-Path $mysqlPath)) {
    Write-Host "MySQL executable not found at $mysqlPath" -ForegroundColor Red
    Write-Host "Please update the script with the correct path to your MySQL installation" -ForegroundColor Yellow
    exit
}

# Prompt for MySQL root password
$password = Read-Host "Enter MySQL root password" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

# Run the MySQL command with direct SQL
try {
    Write-Host "Attempting to create database..." -ForegroundColor Cyan
    
    # Execute the SQL command directly
    $command = "CREATE DATABASE IF NOT EXISTS taskmanagement;"
    echo $command | & $mysqlPath -u root -p"$plainPassword"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database 'taskmanagement' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to create database. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "Error executing MySQL command: $_" -ForegroundColor Red
}

Write-Host "`nDatabase setup complete. You can now start your NestJS application." -ForegroundColor Green 