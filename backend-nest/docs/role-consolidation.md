# User Role Consolidation

## Overview

This document outlines the consolidation of user roles from 5 types to 3 types in the task management system.

## Role Changes

### Previous Roles
- USER
- MANAGER
- GENERAL_MANAGER
- LEADERSHIP
- ADMIN

### New Roles
- USER (includes former MANAGER)
- LEADERSHIP (includes former GENERAL_MANAGER)
- ADMIN

## Migration Strategy

1. Database Schema Changes
   - Update the `role` enum in the `user` table
   - Migration: `1700000000000-simplify-user-roles.ts`

2. Data Migration
   - Convert 'manager' role users to 'user' role
   - Convert 'general_manager' role users to 'leadership' role
   - Script: `src/scripts/migrate-user-roles.ts`

3. Code Updates
   - Updated UserRole enum in `users/entities/user.entity.ts`
   - Updated frontend type definitions
   - Modified role-based guards and controller decorators

## Role Capabilities

### USER Role
- Create personal tasks
- Manage tasks they created
- View and update tasks assigned to them
- View and manage tasks for departments they belong to
- Access to basic dashboard features

### LEADERSHIP Role
- All USER capabilities
- Department management capabilities
- Create tasks for any department
- View all tasks in the system
- Access to activity logs
- Access to analytics and reporting

### ADMIN Role
- All LEADERSHIP capabilities
- User management capabilities
- System configuration
- Department and province management
- Full access to activity logs
- Ability to modify any task

## Deployment Steps

1. Run the database migration:
   ```
   npm run migration:run
   ```

2. Execute the role migration script:
   ```
   npm run migrate:user-roles
   ```
   
   Alternatively, for manual control over the migration process:
   ```
   npm run migrate:user-roles:manual
   ```

3. Deploy updated code to frontend and backend

## Rollback Plan

In case of issues, the following steps can be taken to rollback the changes:

1. Revert the database migration:
   ```
   npm run migration:revert
   ```

2. Restore code from version control to previous state

## Testing

Before deploying to production, verify:
- Login functionality works for all role types
- Permission-based features work correctly
- Users maintain appropriate access after migration