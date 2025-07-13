# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSDO Task Management System is built with a modern full-stack architecture:
- **Framework**: Next.js 15 with App Router
- **Database**: Prisma ORM + MySQL
- **Authentication**: JWT with HTTP-only cookies
- **UI**: Tailwind CSS + TypeScript
- **Architecture**: Full-stack Next.js application with server-side API routes

## Development Commands

All commands should be run from the `nextjs-app/` directory:

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # ESLint checking
npm run type-check       # TypeScript type checking

# Database operations
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes to database (development)
npm run db:migrate       # Create and run migrations (production)
npm run db:seed          # Seed database with sample data
npm run db:studio        # Launch Prisma Studio (database GUI)
```

## Architecture Overview

### Project Structure
```
nsdo-taskm/
├── CLAUDE.md            # This file - development guidance
└── nextjs-app/          # Main application
    ├── prisma/          # Database schema and migrations
    │   ├── schema.prisma # Database schema definition
    │   └── seed.ts      # Database seeding script
    ├── src/
    │   ├── app/         # Next.js App Router
    │   │   ├── api/     # API routes (server-side endpoints)
    │   │   ├── login/   # Login page
    │   │   ├── dashboard/ # Dashboard page
    │   │   └── layout.tsx # Root layout
    │   ├── lib/         # Shared utilities
    │   │   ├── prisma.ts # Prisma client setup
    │   │   └── auth.ts  # Authentication utilities
    │   └── middleware.ts # Next.js middleware for auth/routing
    └── package.json     # Dependencies and scripts
```

### Database Architecture (Prisma + MySQL)
- **ORM**: Prisma with full TypeScript support
- **Database**: MySQL with comprehensive schema
- **Key Models**: User, Task, Department, Province, Role, Permission, Workflow
- **Features**: RBAC, task delegation, audit logging, 2FA support

### Authentication & Authorization
- **Method**: JWT-based authentication with HTTP-only cookies
- **Middleware**: Next.js middleware handles route protection
- **RBAC**: Role-based access control with granular permissions
- **2FA**: Built-in two-factor authentication support

### API Structure (Next.js API Routes)
- **Location**: `src/app/api/`
- **Pattern**: RESTful endpoints using Next.js route handlers
- **Key Routes**:
  - `/api/auth/*` - Authentication endpoints
  - `/api/tasks/*` - Task management
  - `/api/users/*` - User management
  - `/api/departments/*` - Department management

## Key Configuration Files

### Environment Setup (.env)
```bash
# Database
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"

# Email
SENDGRID_API_KEY="your-sendgrid-key"

# Security
BCRYPT_ROUNDS="12"
```

### Database Schema (prisma/schema.prisma)
- **Enums**: TaskStatus, TaskPriority, NotificationType, etc.
- **Core Models**: User, Task, Department, Province
- **RBAC Models**: Role, Permission, RoleWorkflowStepPermission
- **Settings Models**: SecuritySettings, NotificationSettings, BackupSettings

## Development Workflow

### Initial Setup
1. `cd nextjs-app`
2. `npm install` - Install dependencies
3. Set up `.env` file with database credentials
4. `npm run db:generate` - Generate Prisma client
5. `npm run db:push` - Create database schema
6. `npm run db:seed` - Populate with sample data
7. `npm run dev` - Start development server

### Database Operations
- **Schema Changes**: Modify `prisma/schema.prisma` then run `npm run db:push` (dev) or `npm run db:migrate` (prod)
- **Data Inspection**: Use `npm run db:studio` to view/edit data
- **Fresh Start**: Reset with `npx prisma migrate reset`

### API Development
- Create new routes in `src/app/api/`
- Use Zod for request validation
- Leverage Prisma for database operations
- Implement proper error handling and authentication checks

## Key Features Migrated

### From NestJS to Next.js API Routes
- **Controllers** → API route handlers (`route.ts` files)
- **Services** → Shared utilities in `src/lib/`
- **Guards** → Middleware functions
- **DTOs** → Zod schemas for validation
- **Decorators** → Higher-order functions

### Authentication Flow
1. User submits credentials to `/api/auth/login`
2. Server validates and issues JWT in HTTP-only cookie
3. Middleware intercepts requests and validates JWT
4. Protected routes access user context via headers

### Database Migration Benefits
- **Type Safety**: Full TypeScript support with Prisma
- **Query Builder**: Intuitive query API
- **Schema Management**: Version-controlled migrations
- **Performance**: Optimized queries and connection pooling

## Sample Credentials (Development)
```
Admin: admin@nsdo.org.af / admin123
Manager: manager@nsdo.org.af / manager123
User: user@nsdo.org.af / user123
```

## Current Status
- ✅ Database schema (Prisma with 18 models)
- ✅ Authentication system (JWT + cookies)
- ✅ Basic API routes (auth, tasks)
- ✅ Frontend pages (login, dashboard)
- ✅ Middleware and routing protection
- ✅ Database seeding with sample data
- ⏳ Full feature implementation in progress
- ⏳ Advanced UI components
- ⏳ Real-time features (WebSocket, notifications)

## Testing
- **API Testing**: Use `/api` endpoints directly or tools like Postman
- **Database Testing**: Use `npm run db:studio` for data verification
- **Authentication**: Test with provided sample credentials

## Architecture Deep Dive

### Authentication Architecture
- **JWT Service Split**: `src/lib/jwt.ts` contains Edge Runtime compatible JWT operations, while `src/lib/auth.ts` contains Prisma-dependent user operations
- **Middleware Isolation**: Next.js middleware uses only `JWTService` to avoid Prisma import conflicts with Edge Runtime
- **Cookie Strategy**: HTTP-only cookies prevent XSS attacks while enabling server-side token validation

### Database Schema Patterns
- **Soft Deletion**: Tasks use `deletedAt`, `deletedBy` pattern rather than hard deletes
- **Delegation Chain**: Tasks can be delegated with `delegatedFromTaskId` (unique), enabling delegation tracking
- **RBAC Structure**: Role-based permissions through `Role` → `Permission` many-to-many relationships
- **Audit Trail**: `ActivityLog` entity tracks all user actions with metadata

### API Route Patterns
- **Route Structure**: `/api/{resource}/route.ts` for collection endpoints, `/api/{resource}/[id]/route.ts` for item endpoints
- **Error Handling**: Consistent JSON error responses with status codes
- **User Context**: Middleware injects `x-user-id` and `x-user-email` headers for authenticated requests

### Key Technical Constraints
- **Prisma Client**: Must run `npm run db:generate` after schema changes
- **Edge Runtime**: Middleware cannot import Prisma directly - use separate JWT service
- **MySQL Schema**: Uses `@map()` for snake_case database columns while maintaining camelCase TypeScript

## Common Development Patterns

### Database Operations
```typescript
// Always use Prisma client from lib/prisma.ts
import { prisma } from '@/lib/prisma'

// Use include for relations, select for specific fields
const task = await prisma.task.findUnique({
  where: { id },
  include: {
    assignedTo: true,
    department: true
  }
})
```

### API Route Structure
```typescript
// src/app/api/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  // Implementation
}
```

## Important Notes
- Next.js App Router is used (not Pages Router)
- All API routes return JSON responses
- Authentication uses HTTP-only cookies for security
- Prisma handles all database operations with full type safety
- Middleware manages route protection and user context
- All development happens in the `nextjs-app/` directory
- **Critical**: Never import Prisma in middleware.ts - use JWTService instead