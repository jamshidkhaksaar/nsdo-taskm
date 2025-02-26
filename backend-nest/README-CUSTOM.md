# Task Management API

This is a NestJS backend for the Task Management application. It provides RESTful API endpoints for user authentication and task management.

## Features

- User authentication (signup, signin) with JWT
- Task management (create, read, update, delete)
- MySQL database integration with TypeORM

## Prerequisites

- Node.js (v16 or higher)
- MySQL

## Installation

```bash
# Install dependencies
npm install
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=root
DATABASE_NAME=taskmanagement
DATABASE_SYNC=true

JWT_SECRET=taskmanagement_secret_key_change_in_production
JWT_EXPIRATION=3600

PORT=8000
```

## Running the app

```bash
# Development
npm run start:dev

# Production mode
npm run start:prod
```

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/signin` - Login and get JWT token

### Tasks

- `GET /api/tasks` - Get all tasks for the authenticated user
- `GET /api/tasks/:id` - Get a specific task by ID
- `POST /api/tasks` - Create a new task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/status` - Update task status

## License

This project is licensed under the MIT License. 