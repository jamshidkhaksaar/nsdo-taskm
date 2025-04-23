# Active Context

## Current Focus Areas
Based on detailed code analysis of the task management application, the following areas are identified as active focus points:

1. **Project Architecture Analysis**
   - Frontend: React with Vite using TypeScript, Redux state management, and Material UI
   - Backend: NestJS with TypeORM and MySQL database
   - Authentication: JWT-based with refresh token support and 2FA capability

2. **Code Structure Analysis**
   - Frontend component organization follows feature-based architecture
   - Backend follows NestJS modular architecture with controllers, services, entities
   - TypeORM entities define data model with relationships

3. **Feature Implementation Status**
   - Core task management functionality implemented with status, priority, assignment
   - User management system with roles (user, manager, general_manager, admin, leadership)
   - Department organization with province relationships
   - Notification system structure exists
   - Kanban visualization implemented with drag-and-drop functionality

## Critical Integration Points
1. **Authentication Flow**
   - Frontend: AuthService and Redux auth slice manage JWT tokens and user state
   - Backend: JwtStrategy validates tokens and manages user context
   - Token refresh mechanism implemented for session persistence

2. **Task Management**
   - Tasks have relationships with users, departments, and provinces
   - Status workflow: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, DELEGATED
   - Priority levels: LOW, MEDIUM, HIGH
   - Task types: PERSONAL, DEPARTMENT, USER, PROVINCE_DEPARTMENT

3. **User Management**
   - Role-based access control
   - Department membership and leadership assignment
   - Two-factor authentication support
   - Profile management

## Current Technical Details
1. **Database Schema**
   - MySQL database with TypeORM entities defining relationships
   - Entity relationships: User-Task, User-Department, Task-Department, Province-Department

2. **API Structure**
   - RESTful API with NestJS controllers
   - JWT authentication with guards and strategies
   - Swagger documentation available in non-production environments

3. **API Endpoints Documentation**
   - **Authentication Endpoints**:
     - `POST /auth/signin`: Authenticates a user with username/password and handles 2FA if enabled
     - `POST /auth/login`: Alternative login endpoint for basic authentication
     - `POST /auth/refresh`: Refreshes an access token using a refresh token
     - `POST /auth/request-email-code`: Requests a 2FA verification code via email
   
   - **Two-Factor Authentication Endpoints**:
     - `GET /settings/2fa-status`: Gets the current 2FA status for a user
     - `POST /settings/setup_2fa/`: Sets up 2FA (app or email based) for a user
     - `POST /settings/verify_2fa/`: Verifies a 2FA code during setup
     - `POST /settings/send_2fa_code/`: Sends a 2FA code via email
   
   - **Task Management Endpoints**:
     - `GET /tasks`: Retrieves all tasks (admin/leadership access)
     - `POST /tasks`: Creates a new task
     - `GET /tasks/dashboard`: Gets tasks for the dashboard view
     - `GET /tasks/assigned-to-me`: Retrieves tasks assigned to the authenticated user
     - `GET /tasks/created-by-me`: Retrieves tasks created by the authenticated user
     - `GET /tasks/delegated-by-me`: Retrieves tasks delegated by the authenticated user
     - `GET /tasks/delegated-to-me`: Retrieves tasks delegated to the authenticated user
     - `GET /tasks/:id`: Gets details for a specific task
     - `PUT /tasks/:id`: Updates a task
     - `DELETE /tasks/:id`: Deletes a task
     - `PATCH /tasks/:id/status`: Updates the status of a task
     - `PATCH /tasks/:id/priority`: Updates the priority of a task
     - `POST /tasks/:id/delegate`: Delegates a task to one or more users
     - `POST /tasks/:id/cancel`: Cancels a task
     - `GET /tasks/counts/by-status/department/:departmentId`: Gets task counts by status for a department
     - `GET /tasks/counts/by-status/user/:userId`: Gets task counts by status for a user
   
   - **User Management Endpoints**:
     - `GET /users`: Retrieves all users
     - `GET /users/:id`: Gets a specific user's details
     - `POST /users`: Creates a new user
     - `DELETE /users/:id`: Deletes a user
     - `POST /users/:id/reset-password`: Resets a user's password
     - `POST /users/:id/toggle-status`: Toggles a user's active status
     - `PUT /users/:id`: Updates a user's information
     - `GET /users/:id/tasks`: Gets tasks for a specific user
     - `GET /users/:id/performance`: Gets performance metrics for a user (admin/leadership access)
   
   - **Department Management Endpoints**:
     - `GET /departments`: Retrieves all departments, optionally filtered by province
     - `GET /departments/:id`: Gets a specific department's details
     - `POST /departments`: Creates a new department (admin/leadership access)
     - `PUT /departments/:id`: Updates a department (admin/leadership access)
     - `DELETE /departments/:id`: Deletes a department (admin/leadership access)
     - `POST /departments/:id/members/:userId/`: Adds a user to a department (admin/leadership access)
     - `DELETE /departments/:id/members/:userId/`: Removes a user from a department (admin/leadership access)
     - `GET /departments/:id/tasks`: Gets tasks for a specific department
     - `GET /departments/:id/members`: Gets members of a specific department

   - **Health Check Endpoints**:
     - `GET /health`: Provides system health information including database connection status

4. **Frontend Implementation**
   - Redux store with slices for auth, tasks, users, departments
   - Material UI components with custom styling
   - Kanban board using @hello-pangea/dnd for drag-and-drop

5. **Security Implementation**
   - Helmet for HTTP headers
   - CORS configuration
   - Password hashing with bcrypt
   - CSRF protection (currently disabled for development)

## Recent Technical Improvements
1. **TypeScript Error Resolution**
   - Fixed user property errors in the Users.tsx component
   - Ensured proper typing for user status properties
   - Updated user role names throughout the codebase

2. **Database Migration Improvements**
   - Enhanced migration scripts for reliable database connection handling
   - Fixed entity management in migration processes
   - Resolved issues with database synchronization

## Next Assessment Targets
1. **Testing Implementation**
   - Review test coverage and test approach
   - Identify gaps in test coverage
   - Evaluate testing tools and patterns

2. **Performance Considerations**
   - Identify potential performance bottlenecks
   - Review data fetching and caching strategies
   - Assess optimization opportunities

3. **Security Assessment**
   - Review authentication and authorization implementation
   - Identify potential security vulnerabilities
   - Evaluate CSRF, XSS, and other security protections 