# Creating an Admin User for NestJS Backend

This guide provides multiple methods to create an admin user for your NestJS application.

## Method 1: Using the Batch File (Easiest)

I've created a simple batch file that will create a predefined admin user:

1. Make sure MySQL Server is running
2. Open File Explorer and navigate to the `backend-nest` folder
3. Double-click on `create-admin-sql.bat`
4. Enter your MySQL root password when prompted
5. The script will create an admin user with the following credentials:
   - Username: `admin`
   - Password: `admin123`

## Method 2: Using the NestJS CLI Command

If you prefer to create a custom admin user:

1. Open a terminal in the `backend-nest` folder
2. Run one of the following:
   - Windows: `.\create-admin.bat` or `.\create-admin.ps1`
   - Linux/Mac: `chmod +x create-admin.sh && ./create-admin.sh`
3. Enter the admin username, email, and password when prompted

## Method 3: Using the Direct JavaScript Script

If the other methods don't work:

1. Open a terminal in the `backend-nest` folder
2. Run: `node create-admin-direct.js`
3. Enter the admin username, email, and password when prompted

## Method 4: Using MySQL Workbench

If you prefer to use MySQL Workbench:

1. Open MySQL Workbench
2. Connect to your MySQL instance
3. Open the `create-admin.sql` file
4. Modify the username, email, and password hash if desired
5. Execute the script

## Method 5: Manual SQL Insertion

You can also manually insert an admin user:

1. Connect to your MySQL database
2. Run the following SQL command:

```sql
INSERT INTO user (username, email, password, role, isActive, createdAt, updatedAt)
VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$uLJ6MmJV.ZKhQGhIkChRWOYnVl8VD7k2G9KP3z4.d/fZpPYIQF.Uy',
  'admin',
  1,
  NOW(),
  NOW()
);
```

Note: The password in the example is a bcrypt hash of 'admin123'.

## After Creating the Admin User

Once you've created the admin user, you can login with the admin credentials:

1. Start your NestJS application:
   ```bash
   npm run start:dev
   ```

2. Use the admin credentials to login:
   - If using the predefined admin: Username `admin`, Password `admin123`
   - If using a custom admin: Use the credentials you provided

## Troubleshooting

### Table Not Found Error

If you get an error about the user table not existing, make sure:

1. Your NestJS application has run at least once with `DATABASE_SYNC=true` in the `.env` file
2. You're connecting to the correct database

### Authentication Error

If you can't login with the admin credentials:

1. Make sure you're using the correct username and password
2. Check if the user exists in the database:
   ```sql
   SELECT * FROM user WHERE username = 'admin';
   ```

### Permission Issues

If you get permission errors when running the scripts:

1. Make sure you're using the correct MySQL username and password
2. Ensure the MySQL user has permission to insert data into the database 