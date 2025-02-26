# Script to create an admin user for the NestJS application

# Prompt for admin user details
$username = Read-Host "Enter admin username"
$email = Read-Host "Enter admin email"
$password = Read-Host "Enter admin password"

# Run the create:admin command with the provided details
Write-Host "Creating admin user..." -ForegroundColor Cyan
npm run create:admin -- $username $email $password

Write-Host "`nAdmin user creation complete." -ForegroundColor Green
Write-Host "You can now login with the admin credentials:" -ForegroundColor Green
Write-Host "Username: $username" -ForegroundColor White
Write-Host "Password: [your password]" -ForegroundColor White 