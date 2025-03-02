# Testing Documentation

This document provides an overview of the testing strategy and setup for the entire application, including both frontend and backend components.

## Testing Structure

The application testing is organized as follows:

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── tests/
│   │   │   ├── components/       # Unit tests for components
│   │   │   ├── pages/            # Tests for page components
│   │   │   ├── integration/      # Integration tests
│   │   │   ├── setup.ts          # Test setup file
│   │   │   ├── __mocks__/        # Mock files for testing
│   │   │   └── README.md         # Frontend testing documentation
│   ├── jest.config.js            # Jest configuration for frontend
├── backend-nest/
│   ├── src/
│   │   └── **/*.spec.ts          # Unit tests alongside source files
│   ├── test/
│   │   ├── e2e/                  # E2E tests for API endpoints
│   │   ├── jest-e2e.json         # Jest configuration for E2E tests
│   │   └── README.md             # Backend testing documentation
├── run-all-tests.sh              # Shell script to run all tests (Unix/Mac)
├── run-all-tests.ps1             # PowerShell script to run all tests (Windows)
└── README-testing.md             # This file
```

## Testing Philosophy

Our testing approach follows these principles:

1. **Test Pyramid**: We follow the test pyramid approach with more unit tests than integration tests, and more integration tests than E2E tests.
2. **Component Testing**: Frontend components are tested in isolation using React Testing Library.
3. **API Testing**: Backend API endpoints are tested using NestJS testing utilities.
4. **Integration Testing**: Critical user flows are tested with integration tests that verify frontend and backend work together.

## Running Tests

### Running All Tests

To run all tests in both frontend and backend:

**On Unix/Mac:**
```bash
chmod +x run-all-tests.sh
./run-all-tests.sh
```

**On Windows:**
```powershell
.\run-all-tests.ps1
```

### Running Frontend Tests Only

```bash
cd frontend
npm test
```

For more detailed information about frontend testing, see [Frontend Testing Documentation](frontend/src/tests/README.md).

### Running Backend Tests Only

**Unit Tests:**
```bash
cd backend-nest
npm test
```

**E2E Tests:**
```bash
cd backend-nest
npm run test:e2e
```

For more detailed information about backend testing, see [Backend Testing Documentation](backend-nest/test/README.md).

## Test Coverage

To generate test coverage reports:

**Frontend:**
```bash
cd frontend
npm test -- --coverage
```

**Backend:**
```bash
cd backend-nest
npm run test:cov
```

## Continuous Integration

Tests are automatically run in our CI pipeline on every pull request and merge to the main branch. The pipeline will fail if any tests fail, ensuring that only code with passing tests is merged.

## Adding New Tests

When adding new features or fixing bugs:

1. Add unit tests for new components, services, or functions
2. Update existing tests if you're changing behavior
3. Add integration tests for critical user flows
4. Ensure all tests pass before submitting a pull request

## Mocking

We use various mocking strategies:

1. **API Mocks**: Frontend tests use MSW (Mock Service Worker) to mock API calls
2. **Redux Store Mocks**: For testing components that interact with Redux
3. **Service Mocks**: Backend tests mock database repositories and external services

## Troubleshooting

If you encounter issues with tests:

1. Make sure all dependencies are installed
2. Check that the test environment is properly set up
3. Look for timing issues in asynchronous tests
4. Verify that mocks are correctly configured

For more specific troubleshooting guidance, see the README files in the respective test directories. 