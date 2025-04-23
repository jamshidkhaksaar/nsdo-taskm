# Technical Context

## Frontend (Vite + React)
- Modern React application using Vite as build tool
- Component structure organized by feature/domain areas:
  - Common components
  - Dashboard components
  - Department components
  - Kanban components
  - Task components
  - Layout components
- State management appears to use Redux (based on store/slices directory)
- Testing framework in place (tests directory includes integration and component tests)
- Storybook integration for component development
- MagicUI components for enhanced UI elements

## Backend (NestJS)
- Well-structured NestJS application following modular architecture
- API organized around domain entities:
  - Users
  - Tasks
  - Notes
  - Departments
  - Settings
  - Notifications
- Authentication system implemented
- Migration system in place
- Email functionality
- Queue implementation for background processing
- Admin features
- Analytics capabilities

## Integration Points
- Frontend services directory suggests API integration with backend
- Authentication flow between frontend and backend

## Development Environment
- VS Code configuration (.vscode directory)
- GitHub workflows for CI/CD (.github/workflows)
- TypeScript configuration (tsconfig.json)

## Technical Debt Assessment (Preliminary)
- Assessment needed for:
  - Test coverage
  - Type safety implementation
  - API documentation
  - Frontend-backend integration points
  - Error handling strategy 