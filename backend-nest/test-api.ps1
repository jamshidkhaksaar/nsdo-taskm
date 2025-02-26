# Register a new user
Write-Host "Registering a new user..."
$registerResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/signup" -Method Post -ContentType "application/json" -Body @"
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Password123!"
}
"@ -ErrorAction SilentlyContinue
Write-Host $registerResponse

# Login
Write-Host "Logging in..."
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/signin" -Method Post -ContentType "application/json" -Body @"
{
  "username": "testuser",
  "password": "Password123!"
}
"@ -ErrorAction SilentlyContinue
$token = $loginResponse.accessToken
Write-Host "Token: $token"

# Create a task
Write-Host "Creating a task..."
$createTaskResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/tasks" -Method Post -ContentType "application/json" -Headers @{Authorization = "Bearer $token"} -Body @"
{
  "title": "Test Task",
  "description": "This is a test task"
}
"@ -ErrorAction SilentlyContinue
Write-Host $createTaskResponse

# Get all tasks
Write-Host "Getting all tasks..."
$tasksResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/tasks" -Method Get -Headers @{Authorization = "Bearer $token"} -ErrorAction SilentlyContinue
Write-Host $tasksResponse 