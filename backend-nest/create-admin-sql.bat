@echo off
echo Creating admin user directly with SQL...

REM Update this path to match your MySQL installation
set MYSQL_PATH="C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"

REM Check if MySQL exists at the specified path
if not exist %MYSQL_PATH% (
    echo MySQL executable not found at %MYSQL_PATH%
    echo Please update the script with the correct path to your MySQL installation
    pause
    exit /b
)

REM Prompt for MySQL root password
set /p PASSWORD="Enter MySQL root password: "

REM Execute the SQL script
%MYSQL_PATH% -u root -p%PASSWORD% < create-admin.sql

echo.
echo Admin user creation complete.
echo You can now login with the admin credentials:
echo Username: admin
echo Password: admin123

pause 