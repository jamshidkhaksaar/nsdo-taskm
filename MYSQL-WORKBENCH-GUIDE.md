# Setting Up MySQL Database Using MySQL Workbench

If you're having trouble with the command line, MySQL Workbench provides a user-friendly GUI to manage your MySQL databases.

## Step 1: Open MySQL Workbench

MySQL Workbench should have been installed along with MySQL Community Edition. You can find it in your Start menu.

## Step 2: Connect to Your MySQL Server

1. When you open MySQL Workbench, you should see your local MySQL instance listed on the home screen
2. Click on the connection (it might be named "Local instance MySQL80" or similar)
3. Enter your root password when prompted

## Step 3: Create the Database

1. Once connected, you'll see the MySQL Workbench interface
2. Click on the "SQL Editor" tab or click the "Create a new SQL tab" button
3. In the query editor, type the following SQL command:

```sql
CREATE DATABASE IF NOT EXISTS taskmanagement;
```

4. Click the lightning bolt icon (Execute) or press Ctrl+Enter to run the query
5. You should see "Query executed successfully" in the output panel

## Step 4: Verify the Database Was Created

1. In the left sidebar, click the refresh icon next to "SCHEMAS"
2. You should now see "taskmanagement" in the list of databases

## Step 5: Update Your NestJS Configuration

Make sure your `.env` file in the backend-nest directory has the correct MySQL configuration:

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

Replace `your_actual_password` with the password you set for your MySQL root user.

## Step 6: Run Your NestJS Application

Now you can start your NestJS application:

```bash
cd backend-nest
npm run start:dev
```

The application will connect to MySQL and create the necessary tables automatically (because `DATABASE_SYNC` is set to `true`).

## Troubleshooting

### Authentication Error

If you encounter an authentication error with MySQL 8+, you might need to update the authentication method. In MySQL Workbench:

1. Open a new SQL tab
2. Run the following command:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

Replace `your_password` with your actual MySQL root password.

### Connection Refused

If your NestJS application can't connect to MySQL:

1. Make sure MySQL service is running
2. Check that the port in your `.env` file matches the port MySQL is running on (default is 3306)
3. Verify that the username and password in your `.env` file are correct 