# NSDO Task Management System

A modern task management system built with NestJS backend and React frontend.

## Architecture

- **Backend**: NestJS with TypeScript and SQL database
- **Frontend**: React with TypeScript, Material-UI

## Features

- User authentication and authorization
- Task creation, assignment, and tracking
- Department management
- User profile management
- Weather widget integration
- Modern UI with glassmorphism design

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- SQL database (MySQL/PostgreSQL)

## Setup Instructions

### Initial Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nsdo-taskm
   ```

2. Install all dependencies:
   ```
   npm run install:all
   ```

### Environment Configuration

#### Backend (.env file in backend-nest directory)

Create a `.env` file in the backend-nest directory with the following variables:

```
PORT=3001
NODE_ENV=development
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRATION=1d
```

#### Frontend (.env file in frontend directory)

Create a `.env` file in the frontend directory with:

```
REACT_APP_API_URL=http://localhost:3001
```

## Running the Application

### Development Mode

To run both frontend and backend simultaneously:

```
npm start
```

To run them separately:

```
# Frontend only
npm run start:frontend

# Backend only
npm run start:backend
```

### Production Build

Build both applications:

```
npm run build:frontend
npm run build:backend
```

## Project Structure

```
nsdo-taskm/
├── backend-nest/         # NestJS backend
│   ├── src/
│   │   ├── auth/         # Authentication
│   │   ├── tasks/        # Task management
│   │   ├── users/        # User management
│   │   └── ...
├── frontend/             # React frontend
│   ├── public/
│   └── src/
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       ├── services/     # API services
│       └── ...
└── ...
```

## API Documentation

After starting the backend, API documentation is available at:
http://localhost:3001/api/docs
