# NSDO Task Management System

A full-stack task management application with a React frontend and NestJS backend.

## Project Overview

This project is a comprehensive task management system that allows users to create, manage, and track tasks. It features user authentication, task organization, and a modern, responsive UI.

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Material UI** for UI components
- **React Hook Form** with Zod for form validation
- **Axios** for API requests
- **Chart.js** for data visualization
- **React Query** for data fetching
- **Hello Pangea DND** for drag-and-drop functionality

### Backend
- **NestJS** framework
- **TypeORM** for database interactions
- **MySQL** database
- **JWT** for authentication
- **Passport** for authentication strategies
- **Bcrypt** for password hashing
- **Class Validator** for DTO validation

## Project Structure

```
nsdo-taskm/
├── frontend/                # React frontend application
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   ├── package.json         # Frontend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
├── backend-nest/            # NestJS backend application
│   ├── src/                 # Source code
│   ├── test/                # Test files
│   ├── dist/                # Compiled output
│   ├── package.json         # Backend dependencies
│   └── tsconfig.json        # TypeScript configuration
│
├── .gitignore               # Git ignore file
└── README.md                # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MySQL database

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend-nest
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already done)
   - Update the database connection details in `.env`

4. Set up the database:
   - For Windows:
     ```bash
     ./create-db.bat
     ```
   - For PowerShell:
     ```bash
     ./setup-mysql-db.ps1
     ```

5. Create an admin user:
   - For Windows:
     ```bash
     ./create-admin.bat
     ```
   - For PowerShell:
     ```bash
     ./create-admin.ps1
     ```
   - Or using NestJS CLI:
     ```bash
     npm run create:admin
     ```

6. Start the backend server:
   ```bash
   npm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` (if not already done)
   - Update the API URL if needed

4. Start the frontend development server:
   ```bash
   npm start
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

## Documentation

Additional documentation is available in the project:

- `FRONTEND-INTEGRATION.md` - Guide for integrating the frontend with the backend
- `NESTJS-MIGRATION-SUMMARY.md` - Summary of the migration from Django to NestJS
- `MYSQL-SETUP.md` - MySQL setup instructions
- `MYSQL-SETUP-WINDOWS.md` - MySQL setup instructions for Windows
- `MYSQL-WORKBENCH-GUIDE.md` - Guide for using MySQL Workbench
- `ADMIN-USER-GUIDE.md` - Guide for admin user functionality
- `API_TESTING_GUIDE.md` - Guide for testing the API

## Development

### Testing the API

You can use the provided test scripts to test the API:

- For Windows (PowerShell):
  ```bash
  cd backend-nest
  ./test-api.ps1
  ```

- For Linux/Mac:
  ```bash
  cd backend-nest
  chmod +x test-api.sh
  ./test-api.sh
  ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. 