# Comprehensive Testing Strategy for React Frontend and NestJS Backend

## Testing Pyramid Approach

The best practice follows a testing pyramid with:

1. **Unit Tests** (Most numerous)
2. **Integration Tests**
3. **End-to-End Tests** (Fewer, but critical)

## UI Testing Strategy

UI testing requires a multi-faceted approach to ensure both visual correctness and functional behavior:

### 1. Component Visual Testing

#### Storybook for Visual Testing

```jsx
// stories/DashboardCard.stories.jsx
import React from 'react';
import DashboardCard from '../components/DashboardCard';

export default {
  title: 'Dashboard/DashboardCard',
  component: DashboardCard,
  argTypes: {
    title: { control: 'text' },
    value: { control: 'text' },
    trend: { control: 'number' },
    onClick: { action: 'clicked' }
  },
};

const Template = (args) => <DashboardCard {...args} />;

export const Revenue = Template.bind({});
Revenue.args = {
  title: 'Revenue',
  value: '$5,000',
  trend: 12.5,
  icon: 'dollar'
};

export const Users = Template.bind({});
Users.args = {
  title: 'Users',
  value: '1,234',
  trend: 5.3,
  icon: 'users'
};

export const NegativeTrend = Template.bind({});
NegativeTrend.args = {
  title: 'Conversion',
  value: '2.4%',
  trend: -0.8,
  icon: 'chart'
};
```

#### Visual Regression Testing with Chromatic

```javascript
// package.json
{
  "scripts": {
    "chromatic": "npx chromatic --project-token=YOUR_PROJECT_TOKEN"
  }
}
```

### 2. Accessibility Testing

#### Jest with axe-core

```jsx
// DashboardCard.test.jsx
import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import DashboardCard from './DashboardCard';

expect.extend(toHaveNoViolations);

describe('DashboardCard accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <DashboardCard 
        title="Revenue" 
        value="$5,000" 
        trend={12.5} 
        icon="dollar" 
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Audit URLs using Lighthouse
        uses: treosh/lighthouse-ci-action@v8
        with:
          urls: |
            https://staging-app.example.com/
            https://staging-app.example.com/dashboard
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

### 3. Responsive Design Testing

#### Cypress Viewport Testing

```javascript
// cypress/integration/responsive.spec.js
describe('Dashboard Responsive Design', () => {
  const viewports = [
    { width: 375, height: 667, device: 'mobile' },
    { width: 768, height: 1024, device: 'tablet' },
    { width: 1280, height: 800, device: 'laptop' },
    { width: 1920, height: 1080, device: 'desktop' }
  ];
  
  viewports.forEach(viewport => {
    it(`should display correctly on ${viewport.device}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/dashboard');
      cy.wait('@getDashboardMetrics');
      
      // Check layout specifics for each viewport
      if (viewport.width < 768) {
        cy.get('.dashboard-cards').should('have.css', 'flex-direction', 'column');
      } else {
        cy.get('.dashboard-cards').should('have.css', 'flex-direction', 'row');
      }
      
      // Take screenshot for visual comparison
      cy.screenshot(`dashboard-${viewport.device}`);
    });
  });
});
```

### 4. User Flow Testing

#### User Journey Testing with Cypress

```javascript
// cypress/integration/user-flows.spec.js
describe('Dashboard User Flows', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/dashboard/metrics', { fixture: 'dashboard-metrics.json' }).as('getDashboardMetrics');
    cy.intercept('GET', '/api/dashboard/revenue/details', { fixture: 'revenue-details.json' }).as('getRevenueDetails');
    
    cy.login('test@example.com', 'password123');
    cy.visit('/dashboard');
    cy.wait('@getDashboardMetrics');
  });
  
  it('should allow user to view revenue details and export data', () => {
    // Click on revenue card
    cy.get('[data-testid="revenue-card"]').click();
    
    // Verify navigation to revenue details
    cy.url().should('include', '/dashboard/revenue');
    cy.wait('@getRevenueDetails');
    
    // Verify chart is visible
    cy.get('[data-testid="revenue-chart"]').should('be.visible');
    
    // Test date range filter
    cy.get('[data-testid="date-range-picker"]').click();
    cy.get('[data-testid="last-30-days"]').click();
    cy.wait('@getRevenueDetails');
    
    // Test export functionality
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-csv"]').click();
    cy.verifyDownload('revenue-report.csv');
  });
});
```

### 5. Animation and Transition Testing

```jsx
// TransitionTest.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import ExpandableCard from './ExpandableCard';

describe('ExpandableCard animations', () => {
  it('should apply correct animation classes when expanding', async () => {
    // Render component
    render(<ExpandableCard title="Test Card" content="Test content" />);
    
    // Check initial state
    const card = screen.getByTestId('expandable-card');
    expect(card).not.toHaveClass('expanded');
    
    // Click to expand
    await userEvent.click(screen.getByText('Test Card'));
    
    // Check expanded state
    expect(card).toHaveClass('expanding');
    
    // Wait for animation to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300)); // Animation duration
    });
    
    // Check final state
    expect(card).toHaveClass('expanded');
    expect(card).not.toHaveClass('expanding');
  });
});
```

### 6. Theme and Dark Mode Testing

```jsx
// ThemeTest.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../context/ThemeContext';
import Dashboard from './Dashboard';

describe('Theme switching', () => {
  it('should apply correct theme classes when switching themes', async () => {
    // Render with theme provider
    render(
      <ThemeProvider>
        <Dashboard />
      </ThemeProvider>
    );
    
    // Check initial theme (light by default)
    const dashboardContainer = screen.getByTestId('dashboard-container');
    expect(dashboardContainer).toHaveClass('theme-light');
    expect(dashboardContainer).not.toHaveClass('theme-dark');
    
    // Find and click theme toggle
    const themeToggle = screen.getByTestId('theme-toggle');
    await userEvent.click(themeToggle);
    
    // Check if dark theme is applied
    expect(dashboardContainer).toHaveClass('theme-dark');
    expect(dashboardContainer).not.toHaveClass('theme-light');
    
    // Toggle back to light theme
    await userEvent.click(themeToggle);
    expect(dashboardContainer).toHaveClass('theme-light');
  });
});
```

### 7. Performance Testing for UI

#### React Profiler Testing

```jsx
// PerformanceTest.jsx
import React, { Profiler } from 'react';
import { render } from '@testing-library/react';
import Dashboard from './Dashboard';

describe('Dashboard performance', () => {
  it('should render efficiently', () => {
    const onRender = jest.fn();
    
    render(
      <Profiler id="dashboard" onRender={onRender}>
        <Dashboard />
      </Profiler>
    );
    
    // Check if render happened
    expect(onRender).toHaveBeenCalled();
    
    // Get the actual render duration
    const [, , actualDuration] = onRender.mock.calls[0];
    
    // Assert that render time is below threshold (e.g., 50ms)
    expect(actualDuration).toBeLessThan(50);
  });
});
```

#### Lighthouse Performance Metrics

```json
// lighthouse-budget.json
{
  "performance": 90,
  "accessibility": 90,
  "best-practices": 85,
  "seo": 90,
  "pwa": 50,
  "resource-summary": [
    {
      "resourceType": "total",
      "budget": 300
    },
    {
      "resourceType": "script",
      "budget": 150
    },
    {
      "resourceType": "image",
      "budget": 100
    }
  ],
  "timing": [
    {
      "metric": "interactive",
      "budget": 3000
    },
    {
      "metric": "first-contentful-paint",
      "budget": 1500
    }
  ]
}
```

### 8. Cross-Browser Testing

#### BrowserStack Integration

```javascript
// browserstack.conf.js
exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  capabilities: [
    {
      browserName: 'chrome',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    },
    {
      browserName: 'firefox',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    },
    {
      browserName: 'safari',
      browser_version: 'latest',
      os: 'OS X',
      os_version: 'Big Sur'
    },
    {
      browserName: 'edge',
      browser_version: 'latest',
      os: 'Windows',
      os_version: '10'
    }
  ],
  
  specs: [
    './test/e2e/**/*.spec.js'
  ],
  
  baseUrl: 'https://staging-app.example.com'
};
```

### 9. Internationalization (i18n) Testing

```jsx
// i18n.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n'; // Your i18n configuration
import Dashboard from './Dashboard';

describe('Dashboard internationalization', () => {
  beforeEach(() => {
    i18n.changeLanguage('en'); // Reset to English
  });
  
  it('should display content in English by default', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });
  
  it('should display content in Spanish when language is changed', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Dashboard />
      </I18nextProvider>
    );
    
    // Change language to Spanish
    await i18n.changeLanguage('es');
    
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Usuarios')).toBeInTheDocument();
  });
});
```

### 10. UI Component Interaction Testing

```jsx
// InteractionTest.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataTable from './DataTable';

describe('DataTable interactions', () => {
  const mockData = [
    { id: 1, name: 'John', email: 'john@example.com', status: 'active' },
    { id: 2, name: 'Jane', email: 'jane@example.com', status: 'inactive' },
    { id: 3, name: 'Bob', email: 'bob@example.com', status: 'active' }
  ];
  
  it('should sort data when column header is clicked', async () => {
    render(<DataTable data={mockData} />);
    
    // Get initial order
    const initialRows = screen.getAllByRole('row');
    expect(initialRows[1]).toHaveTextContent('John');
    expect(initialRows[2]).toHaveTextContent('Jane');
    expect(initialRows[3]).toHaveTextContent('Bob');
    
    // Click on name column header to sort
    await userEvent.click(screen.getByText('Name'));
    
    // Check sorted order (alphabetical)
    const sortedRows = screen.getAllByRole('row');
    expect(sortedRows[1]).toHaveTextContent('Bob');
    expect(sortedRows[2]).toHaveTextContent('Jane');
    expect(sortedRows[3]).toHaveTextContent('John');
    
    // Click again to reverse sort
    await userEvent.click(screen.getByText('Name'));
    
    // Check reverse sorted order
    const reverseSortedRows = screen.getAllByRole('row');
    expect(reverseSortedRows[1]).toHaveTextContent('John');
    expect(reverseSortedRows[2]).toHaveTextContent('Jane');
    expect(reverseSortedRows[3]).toHaveTextContent('Bob');
  });
  
  it('should filter data when search input is used', async () => {
    render(<DataTable data={mockData} />);
    
    // Type in search box
    await userEvent.type(screen.getByPlaceholderText('Search...'), 'jo');
    
    // Check filtered results
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(2); // Header + 1 result
    expect(rows[1]).toHaveTextContent('John');
    expect(screen.queryByText('Jane')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
  });
});
```

## Frontend Testing (React)

// ... [rest of the original content] ...