# API Testing Guide

This guide explains how to properly test the API services in this application using real data instead of mock data.

## Prerequisites

1. **Backend Server**: Ensure your NestJS backend is running on port 3001
2. **Database**: Make sure your database is properly configured and accessible
3. **Environment Variables**: Verify that all required environment variables are set correctly

## Testing Approach

### 1. API Health Dashboard

The API Health Dashboard provides a comprehensive overview of all API endpoints and their status. To access it:

1. Navigate to `/admin/api-health` in the application
2. The dashboard will automatically test all API endpoints
3. Review the results to identify any failing endpoints

### 2. Testing Authentication

Authentication is a critical component to test:

```javascript
// Example of testing authentication
const response = await axios.post('/api/auth/login', {
  username: 'admin',
  password: 'admin123'
});

// Store the token for subsequent requests
const token = response.data.token;
```

### 3. Testing Department Endpoints

Department endpoints require authentication and sometimes a department ID:

```javascript
// Get all departments
const departmentsResponse = await axios.get('/api/departments', {
  headers: { Authorization: `Bearer ${token}` }
});

// Get a specific department's performance
const departmentId = departmentsResponse.data[0].id;
const performanceResponse = await axios.get(`/api/departments/${departmentId}/performance`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

### 4. Testing Task Endpoints

Task endpoints also require authentication:

```javascript
// Get all tasks
const tasksResponse = await axios.get('/api/tasks', {
  headers: { Authorization: `Bearer ${token}` }
});

// Create a new task
const newTaskResponse = await axios.post('/api/tasks', {
  title: 'Test Task',
  description: 'This is a test task',
  status: 'pending',
  priority: 'medium',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## Common Issues and Troubleshooting

### CORS Issues

If you encounter CORS errors:

1. Verify that your backend has CORS properly configured
2. Check that the allowed origins include your frontend URL
3. Ensure that credentials are allowed if you're using cookies

```javascript
// Example NestJS CORS configuration
app.enableCors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

### Authentication Issues

If authentication fails:

1. Check that your credentials are correct
2. Verify that the token is being properly stored and sent with requests
3. Check token expiration and refresh token functionality

### Database Connection Issues

If database-related endpoints fail:

1. Verify database connection settings
2. Check that the database is running and accessible
3. Ensure that the required tables exist and have the correct schema

## Advanced Testing

### Automated API Testing

For more comprehensive testing, consider implementing automated tests:

```javascript
// Example Jest test for an API endpoint
describe('Department API', () => {
  it('should return all departments', async () => {
    const response = await axios.get('/api/departments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);
  });
});
```

### Load Testing

To test API performance under load:

1. Use tools like Apache JMeter or k6
2. Simulate multiple concurrent users
3. Monitor response times and error rates

### Security Testing

Don't forget to test security aspects:

1. Test authentication bypass attempts
2. Verify that unauthorized users cannot access protected endpoints
3. Check for common vulnerabilities like SQL injection and XSS

## Conclusion

Testing with real data provides the most accurate assessment of your API services. By following this guide, you can ensure that your application works correctly with your actual backend implementation. 