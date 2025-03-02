# Comprehensive Testing Strategy for React Frontend and NestJS Backend

## Testing Pyramid Approach

The best practice follows a testing pyramid with:

1. **Unit Tests** (Most numerous)
2. **Integration Tests**
3. **End-to-End Tests** (Fewer, but critical)

## Frontend Testing (React)

### Unit Testing Components

```jsx
// Using Jest and React Testing Library
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardCard from './DashboardCard';

describe('DashboardCard', () => {
  test('renders card with correct title', () => {
    render(<DashboardCard title="Revenue" value="$5000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$5000')).toBeInTheDocument();
  });
  
  test('handles click events', async () => {
    const mockOnClick = jest.fn();
    render(<DashboardCard title="Revenue" value="$5000" onClick={mockOnClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### Component Integration Testing

```jsx
// Testing connected components with Redux/Context
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import Dashboard from './Dashboard';

const mockStore = configureStore([]);

describe('Dashboard', () => {
  test('renders all dashboard widgets with data from store', () => {
    const store = mockStore({
      dashboard: {
        metrics: {
          revenue: 5000,
          users: 120,
          conversion: 3.2
        }
      }
    });
    
    render(
      <Provider store={store}>
        <Dashboard />
      </Provider>
    );
    
    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('3.2%')).toBeInTheDocument();
  });
});
```

### Mock API Testing

```jsx
// Using MSW (Mock Service Worker) to intercept API calls
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from './DashboardPage';

const server = setupServer(
  rest.get('/api/dashboard/metrics', (req, res, ctx) => {
    return res(ctx.json({
      revenue: 5000,
      users: 120,
      conversion: 3.2
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('loads and displays dashboard data', async () => {
  render(<DashboardPage />);
  
  // Check loading state
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('3.2%')).toBeInTheDocument();
  });
});
```

## Backend Testing (NestJS)

### Unit Testing Services

```typescript
// src/dashboard/dashboard.service.spec.ts
import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Transaction } from '../transactions/transaction.entity';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  
  const mockUserRepository = {
    count: jest.fn().mockResolvedValue(120)
  };
  
  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 5000 })
    }))
  };
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository
        }
      ],
    }).compile();
    
    dashboardService = moduleRef.get<DashboardService>(DashboardService);
  });
  
  it('should return dashboard metrics', async () => {
    const result = await dashboardService.getDashboardMetrics();
    expect(result).toEqual({
      revenue: 5000,
      users: 120,
      conversion: expect.any(Number)
    });
  });
});
```

### Controller Testing

```typescript
// src/dashboard/dashboard.controller.spec.ts
import { Test } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

describe('DashboardController', () => {
  let dashboardController: DashboardController;
  
  const mockDashboardService = {
    getDashboardMetrics: jest.fn().mockResolvedValue({
      revenue: 5000,
      users: 120,
      conversion: 3.2
    })
  };
  
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService
        }
      ],
    }).compile();
    
    dashboardController = moduleRef.get<DashboardController>(DashboardController);
  });
  
  it('should return dashboard metrics', async () => {
    expect(await dashboardController.getDashboardMetrics()).toEqual({
      revenue: 5000,
      users: 120,
      conversion: 3.2
    });
    expect(mockDashboardService.getDashboardMetrics).toHaveBeenCalled();
  });
});
```

### API Integration Testing

```typescript
// test/dashboard.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Transaction } from '../src/transactions/transaction.entity';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  
  const mockUserRepository = {
    count: jest.fn().mockResolvedValue(120)
  };
  
  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 5000 })
    }))
  };
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(getRepositoryToken(User))
    .useValue(mockUserRepository)
    .overrideProvider(getRepositoryToken(Transaction))
    .useValue(mockTransactionRepository)
    .compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  it('/GET dashboard/metrics', () => {
    return request(app.getHttpServer())
      .get('/dashboard/metrics')
      .expect(200)
      .expect({
        revenue: 5000,
        users: 120,
        conversion: expect.any(Number)
      });
  });
  
  afterAll(async () => {
    await app.close();
  });
});
```

## End-to-End Testing (Full Stack)

### Cypress for E2E Testing

```javascript
// cypress/integration/dashboard.spec.js
describe('Dashboard Page', () => {
  beforeEach(() => {
    // Intercept API calls
    cy.intercept('GET', '/api/dashboard/metrics', {
      statusCode: 200,
      body: {
        revenue: 5000,
        users: 120,
        conversion: 3.2
      }
    }).as('getDashboardMetrics');
    
    // Visit dashboard page
    cy.visit('/dashboard');
    
    // Wait for API call to complete
    cy.wait('@getDashboardMetrics');
  });
  
  it('displays dashboard metrics correctly', () => {
    cy.get('[data-testid="revenue-card"]').should('contain', '$5000');
    cy.get('[data-testid="users-card"]').should('contain', '120');
    cy.get('[data-testid="conversion-card"]').should('contain', '3.2%');
  });
  
  it('navigates to detailed view when clicking on a card', () => {
    cy.get('[data-testid="revenue-card"]').click();
    cy.url().should('include', '/dashboard/revenue');
  });
});
```

## Database Testing

### Using Test Database

```typescript
// test/setup.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { Transaction } from '../src/transactions/transaction.entity';

export const testDbConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [User, Transaction],
  synchronize: true,
};

// In your e2e tests
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDbConfig } from './setup';

const moduleFixture = await Test.createTestingModule({
  imports: [
    TypeOrmModule.forRoot(testDbConfig),
    // Other modules
  ],
}).compile();
```

## Test Data Management

### Factories for Test Data

```typescript
// test/factories/user.factory.ts
import { User } from '../../src/users/user.entity';
import { getRepository } from 'typeorm';
import * as faker from 'faker';

export const createUser = async (overrides = {}): Promise<User> => {
  const userRepository = getRepository(User);
  
  const user = userRepository.create({
    email: faker.internet.email(),
    name: faker.name.findName(),
    createdAt: new Date(),
    ...overrides
  });
  
  return await userRepository.save(user);
};
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run frontend tests
      run: npm run test:frontend
      
    - name: Run backend tests
      run: npm run test:backend
      
    - name: Run e2e tests
      run: npm run test:e2e
```

## Best Practices

1. **Test in isolation**: Unit tests should not depend on external services
2. **Use real-like data**: Generate realistic test data with libraries like Faker
3. **Test coverage**: Aim for high coverage but focus on critical paths
4. **Continuous testing**: Run tests on every commit with CI/CD
5. **Test driven development**: Write tests before implementing features
6. **Snapshot testing**: For UI components that change infrequently
7. **Performance testing**: Include load tests for critical API endpoints

## Implementation Timeline

### Phase 1: Setup Testing Infrastructure (Week 1-2)
- Configure Jest for frontend and backend
- Set up Cypress for E2E testing
- Create test database configuration
- Implement CI pipeline for automated testing

### Phase 2: Unit Testing (Week 3-4)
- Write unit tests for React components
- Write unit tests for NestJS services and controllers
- Aim for 70%+ coverage of core functionality

### Phase 3: Integration Testing (Week 5-6)
- Implement API integration tests
- Test component interactions
- Test database operations

### Phase 4: E2E Testing (Week 7-8)
- Create Cypress tests for critical user flows
- Test full application functionality
- Performance and load testing

## Required Dependencies

### Frontend Testing
- jest
- @testing-library/react
- @testing-library/user-event
- msw (Mock Service Worker)

### Backend Testing
- @nestjs/testing
- supertest
- jest

### E2E Testing
- cypress

### Data Generation
- faker

## Conclusion

By implementing this comprehensive testing strategy, we can ensure our SaaS application is thoroughly tested at all levels, providing confidence in its functionality and reliability. This approach will help us catch bugs early, maintain code quality, and deliver a robust product to our users. 