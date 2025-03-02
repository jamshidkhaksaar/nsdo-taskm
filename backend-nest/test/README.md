# Backend Testing Guide

This directory contains tests for the NestJS backend API. The tests are organized by module and type to make them easy to understand and maintain.

## Test Structure

```
test/
├── e2e/                  # End-to-end tests for API endpoints
│   └── tasks.e2e-spec.ts # Tests for tasks API endpoints
├── jest-e2e.json         # Jest configuration for E2E tests
└── README.md             # This file
```

## Prerequisites

Before running the tests, make sure you have installed all the required dependencies:

```bash
npm install
```

## Running Tests

### Running Unit Tests

To run all unit tests (located in the src directory alongside the code):

```bash
npm test
```

To run tests with watch mode:

```bash
npm run test:watch
```

To run tests with coverage report:

```bash
npm run test:cov
```

### Running E2E Tests

To run all E2E tests:

```bash
npm run test:e2e
```

## Test Types

### Unit Tests

Unit tests focus on testing individual services, controllers, and other components in isolation. They verify that each component behaves as expected.

Example: `src/tasks/tasks.service.spec.ts`

### E2E Tests

E2E tests verify that the API endpoints work correctly end-to-end. They test the integration between controllers, services, and the database.

Example: `test/tasks.e2e-spec.ts`

## Test Database

The E2E tests use a test database configuration that's separate from your development database. This is configured in the `AppModule` for testing.

## Authentication in Tests

For endpoints that require authentication, we create a test user and generate a JWT token for that user. This token is then included in the request headers.

Example:
```typescript
// Generate JWT token for the test user
const authToken = jwtService.sign({ 
  sub: testUser.id,
  email: testUser.email,
  role: testUser.role
});

// Use the token in requests
request(app.getHttpServer())
  .get('/api/tasks')
  .set('Authorization', `Bearer ${authToken}`)
  .expect(200);
```

## Mocking

We use several mocking strategies:

1. **Repository Mocks**: For database operations
2. **Service Mocks**: When testing controllers
3. **Module Mocks**: For external services

## Adding New Tests

When adding new tests:

1. Follow the existing structure
2. Use descriptive test names
3. Test both success and failure cases
4. Clean up test data after tests
5. Focus on behavior, not implementation details

## Troubleshooting

### Common Issues

- **Database connection errors**: Make sure your test database is configured correctly
- **Authentication errors**: Check that the JWT token is generated and included in the request headers
- **Test data conflicts**: Make sure tests clean up after themselves

### Debugging Tests

To debug tests:

```bash
npm run test:debug
```

This will run the tests in debug mode, allowing you to use the Node.js debugger. 