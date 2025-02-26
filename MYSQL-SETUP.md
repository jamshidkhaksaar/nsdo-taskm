# MySQL Setup Guide for NestJS Backend

This guide will help you set up MySQL for the NestJS backend.

## Prerequisites

- MySQL Server installed on your machine
- MySQL Command Line Client or a GUI tool like MySQL Workbench

## Setup Steps

### 1. Install MySQL

If you haven't installed MySQL yet, you can download it from the [official MySQL website](https://dev.mysql.com/downloads/mysql/).

### 2. Start MySQL Server

Make sure your MySQL server is running:

- **Windows**: You can start it from the Services panel or using the MySQL Installer
- **macOS**: You can start it from System Preferences or using `brew services start mysql`
- **Linux**: You can start it using `sudo systemctl start mysql` or `sudo service mysql start`

### 3. Create the Database

You can create the database using the provided SQL script:

```bash
# Navigate to the backend-nest directory
cd backend-nest

# Connect to MySQL and run the script
mysql -u root -p < setup-mysql-db.sql
```

Alternatively, you can create the database manually:

```sql
CREATE DATABASE IF NOT EXISTS taskmanagement;
```

### 4. Configure the Application

Make sure your `.env` file has the correct MySQL configuration:

```
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=root
DATABASE_NAME=taskmanagement
DATABASE_SYNC=true

JWT_SECRET=taskmanagement_secret_key_change_in_production
JWT_EXPIRATION=3600

PORT=8000
```

Update the `DATABASE_USERNAME` and `DATABASE_PASSWORD` with your MySQL credentials.

### 5. Run the Application

Now you can run the NestJS application:

```bash
# Navigate to the backend-nest directory
cd backend-nest

# Install dependencies (if not already done)
npm install

# Start the development server
npm run start:dev
```

The application will connect to MySQL and create the necessary tables automatically (because `DATABASE_SYNC` is set to `true`).

## Troubleshooting

### Connection Issues

If you encounter connection issues, check the following:

1. Make sure MySQL server is running
2. Verify that the credentials in the `.env` file are correct
3. Ensure that the MySQL user has the necessary permissions
4. Check if the MySQL port is correct (default is 3306)

### Authentication Issues

If you encounter authentication issues with MySQL 8+, you might need to update the authentication method:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Database Creation Issues

If you don't have permission to create a database, you can ask your database administrator to create it for you, or use an existing database by updating the `DATABASE_NAME` in the `.env` file. 