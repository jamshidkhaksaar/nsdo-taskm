## 🔍 Project Overview

This is a full-stack task management application with a modern architecture using React for the frontend and NestJS for the backend.

## 🖥️ Frontend Technology Stack

### Core Framework
- **React 18**: Modern UI library for building component-based interfaces
- **TypeScript**: For type safety across the codebase

### State Management
- **Redux Toolkit**: For global state management
- **React Query**: For data fetching and server state management

### Routing and Navigation
- **React Router 6**: For client-side routing

### UI Framework
- **Material UI (MUI v5)**: Component library for consistent UI design
- **Emotion**: CSS-in-JS styling solution used with MUI

### Form Handling
- **React Hook Form**: For form state management
- **Zod**: For form validation schemas

### Data Visualization
- **Chart.js/React-Chartjs-2**: For chart visualizations
- **Recharts**: Alternative charting library

### Drag and Drop
- **@hello-pangea/dnd**: For drag-and-drop functionality (fork of react-beautiful-dnd)

### Other Frontend Tools
- **Axios**: For HTTP requests
- **date-fns**: For date manipulation
- **tsparticles**: For particle animations/effects
- **Fingerprintjs**: For browser fingerprinting (likely for security purposes)

## 🔧 Backend Technology Stack

### Core Framework
- **NestJS 11**: Modern, TypeScript-based Node.js framework
- **TypeScript**: For type safety

### Database
- **MySQL**: Primary database (via mysql2 driver)
- **TypeORM**: ORM for database interactions
- **PostgreSQL**: Secondary database support (via pg driver)

### Authentication & Security
- **Passport.js**: Authentication middleware
- **JWT**: For stateless authentication
- **bcrypt**: For password hashing
- **speakeasy & qrcode**: For two-factor authentication

### API Documentation
- **Swagger**: Via @nestjs/swagger for API documentation

### Email
- Custom mail module (likely using a third-party email service)

### CLI Tools
- **nest-commander**: For creating CLI commands (admin creation, etc.)

### Validation
- **class-validator & class-transformer**: For DTO validation and transformation

### Configuration
- **dotenv & @nestjs/config**: For environment-based configuration

### Testing
- **Jest**: For unit and integration tests
- **Supertest**: For HTTP testing

## 🔄 DevOps & Infrastructure

### Build Tools
- **React Scripts**: For frontend build process
- **NestJS CLI**: For backend build process
- **SWC**: For faster TypeScript compilation

### Linting & Formatting
- **ESLint**: For code linting
- **Prettier**: For code formatting

### Environment Setup
- Multiple environment configurations (.env, .env.production, .env.test)
- PowerShell scripts for server management and testing

## 📈 Architecture Insights

1. **Modular Backend**: The NestJS backend follows a modular architecture with separate modules for:
   - Authentication
   - Users
   - Tasks
   - Departments
   - Settings
   - Admin
   - Backup
   - Profile
   - Mail
   - Notes

2. **Frontend Architecture**:
   - Component-based architecture
   - Separation of concerns with dedicated directories for components, pages, contexts, etc.
   - Theme customization
   - Service worker support for offline capabilities

3. **Database**: Uses TypeORM with MySQL with entity-based data modeling

4. **API Security**:
   - JWT-based authentication
   - CORS configuration for security
   - Validation pipes to prevent malicious input

5. **Testing Strategy**:
   - Comprehensive test setup for both frontend and backend
   - End-to-end, unit, and integration tests

This is a robust, modern full-stack application built with industry-standard technologies and best practices, focusing on type safety, scalability, and maintainability.
