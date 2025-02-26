-- This script creates an admin user directly in the database
-- Replace the values with your desired admin credentials
-- The password should be a bcrypt hash - this example uses 'admin123'

-- Make sure you're using the correct database
USE taskmanagement;

-- Insert admin user
-- Note: The password is a bcrypt hash of 'admin123'
INSERT INTO user (id, username, email, password, role, isActive, createdAt, updatedAt)
VALUES (
  UUID(),
  'admin',
  'admin@example.com',
  '$2b$10$uLJ6MmJV.ZKhQGhIkChRWOYnVl8VD7k2G9KP3z4.d/fZpPYIQF.Uy',
  'admin',
  1,
  NOW(),
  NOW()
);

-- Verify the user was created
SELECT id, username, email, role FROM user WHERE username = 'admin'; 