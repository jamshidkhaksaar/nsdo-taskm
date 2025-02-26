@echo off
echo Creating admin user for the NestJS application...

REM Prompt for admin user details
set /p USERNAME="Enter admin username: "
set /p EMAIL="Enter admin email: "
set /p PASSWORD="Enter admin password: "

REM Run the create:admin command with the provided details
echo Creating admin user...
call npm run create:admin -- %USERNAME% %EMAIL% %PASSWORD%

echo.
echo Admin user creation complete.
echo You can now login with the admin credentials:
echo Username: %USERNAME%
echo Password: [your password]

pause 