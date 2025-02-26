#!/bin/bash

# Register a new user
echo "Registering a new user..."
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!"
  }'
echo -e "\n"

# Login
echo "Logging in..."
TOKEN=$(curl -X POST http://localhost:8000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123!"
  }' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
echo "Token: $TOKEN"
echo -e "\n"

# Create a task
echo "Creating a task..."
curl -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Task",
    "description": "This is a test task"
  }'
echo -e "\n"

# Get all tasks
echo "Getting all tasks..."
curl -X GET http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
echo -e "\n" 