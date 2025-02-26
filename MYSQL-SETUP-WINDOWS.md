# MySQL Setup Guide for Windows

This guide provides multiple methods to create a MySQL database for your NestJS application on Windows.

## Method 1: Using the Batch File (Easiest)

I've created a simple batch file that will create the database for you:

1. Make sure MySQL Server is installed and running
2. Open File Explorer and navigate to the `backend-nest` folder
3. Double-click on `create-db.bat`
4. Enter your MySQL root password when prompted
5. The script will create the `taskmanagement` database

## Method 2: Using PowerShell Scripts

If you prefer PowerShell, I've created two PowerShell scripts:

### Option A: Simple PowerShell Script

1. Right-click on `create-db-simple.ps1` in the `backend-nest` folder
2. Select "Run with PowerShell"
3. If you get a security warning, you may need to run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```
4. Enter your MySQL root password when prompted

### Option B: Advanced PowerShell Script

1. Right-click on `setup-mysql-db.ps1` in the `backend-nest` folder
2. Select "Run with PowerShell"
3. Enter your MySQL root password when prompted

## Method 3: Using MySQL Workbench

If the scripts don't work, you can use MySQL Workbench:

1. Open MySQL Workbench from your Start menu
2. Connect to your local MySQL instance (click on the connection)
3. Enter your root password when prompted
4. Click on the "SQL Editor" tab or the "Create a new SQL tab" button
5. Type the following SQL command:
   ```sql
   CREATE DATABASE IF NOT EXISTS taskmanagement;
   ```
6. Click the lightning bolt icon (Execute) or press Ctrl+Enter

## Method 4: Using MySQL Command Line Client

If MySQL Command Line Client is installed:

1. Search for "MySQL Command Line Client" in the Start menu
2. Open it and enter your root password when prompted
3. Run the following command:
   ```sql
   CREATE DATABASE IF NOT EXISTS taskmanagement;
   ```

## Troubleshooting

### Script Can't Find MySQL

If the scripts can't find your MySQL installation:

1. Open the script file in a text editor
2. Update the MySQL path variable to match your installation:
   - For the batch file: `set MYSQL_PATH="C:\path\to\your\mysql.exe"`
   - For PowerShell scripts: `$mysqlPath = "C:\path\to\your\mysql.exe"`

Common MySQL installation paths:
- `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`
- `C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe`
- `C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe`

### Authentication Issues

If you encounter authentication issues with MySQL 8+:

1. Open MySQL Workbench
2. Connect to your MySQL instance
3. Run the following command:
   ```sql
   ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
   FLUSH PRIVILEGES;
   ```
   Replace `your_password` with your actual MySQL root password.

## After Creating the Database

Once you've created the database:

1. Make sure your `.env` file has the correct MySQL configuration:
   ```
   DATABASE_TYPE=mysql
   DATABASE_HOST=localhost
   DATABASE_PORT=3306
   DATABASE_USERNAME=root
   DATABASE_PASSWORD=your_actual_password
   DATABASE_NAME=taskmanagement
   DATABASE_SYNC=true
   
   JWT_SECRET=taskmanagement_secret_key_change_in_production
   JWT_EXPIRATION=3600
   
   PORT=8000
   ```
   Replace `your_actual_password` with your actual MySQL root password.

2. Start your NestJS application:
   ```
   cd backend-nest
   npm run start:dev
   ```

The application will connect to MySQL and create the necessary tables automatically because `DATABASE_SYNC` is set to `true`. 