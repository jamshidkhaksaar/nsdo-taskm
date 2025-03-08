// Simple Express server to test port 3001
const express = require('express');
const cors = require('cors');
const app = express();

// Configure CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Simple middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Route for testing authentication
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt received');
  res.json({
    access_token: 'test_token',
    refresh_token: 'test_refresh_token',
    user: {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      role: 'ADMIN'
    }
  });
});

// Basic API routes
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api`);
}); 