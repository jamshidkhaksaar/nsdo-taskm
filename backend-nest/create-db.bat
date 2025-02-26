@echo off
echo Creating MySQL database for NestJS application...

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

REM Create the database
echo CREATE DATABASE IF NOT EXISTS taskmanagement; > temp_sql.sql

REM Execute the SQL command
%MYSQL_PATH% -u root -p%PASSWORD% < temp_sql.sql

REM Check if the command was successful
if %ERRORLEVEL% == 0 (
    echo Database 'taskmanagement' created successfully!
) else (
    echo Failed to create database. Error code: %ERRORLEVEL%
)

REM Clean up
del temp_sql.sql

echo.
echo Database setup complete. You can now start your NestJS application.
pause 