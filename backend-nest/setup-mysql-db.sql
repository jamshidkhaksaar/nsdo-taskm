-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS taskmanagement;

-- Use the database
USE taskmanagement;

-- Create a user for the application (if not using root)
-- GRANT ALL PRIVILEGES ON taskmanagement.* TO 'taskuser'@'localhost' IDENTIFIED BY 'taskpassword';
-- FLUSH PRIVILEGES;

-- Note: If you want to use a different user than root, 
-- uncomment the lines above and update the .env file with the new credentials.

-- The tables will be created automatically by TypeORM when the application starts
-- with synchronize: true in the configuration. 