# Codebase Structure

This document provides a detailed directory tree for the entire codebase, including the root, frontend, and backend directories. Use this as a reference for navigation and memory.

---

## Root Directory

```
.
├── backend-nest/
├── frontend/
├── screenshots/
├── src/
├── .github/
├── .roo/
├── .memory/
├── .vscode/
├── .cursor/
├── node_modules/
├── .git/
├── .env.local
├── .gitignore
├── .roomodes
├── .roomodes.json
├── backend-improvement-plan.md
├── frontend-improvement-plan.md
├── memory.md
├── package.json
├── package-lock.json
├── PROJECT_DOCUMENTATION.md
├── README.md
├── refactoring-plan.md
├── TASK_ASSIGNMENT_ENHANCEMENT_PLAN.md
├── tsconfig.json
```

---

## Frontend Directory (`frontend/`)

```
frontend/
├── .env
├── .env.example
├── .env.production
├── .gitignore
├── babel.config.js
├── compile-errors.txt
├── index.html
├── jest.config.js
├── ONBOARDING.md
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── vite.config.ts
├── vitest.workspace.ts
├── build/
├── dist/
├── node_modules/
├── public/
│   ├── favicon.png
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── constants/
│   │   └── index.ts
│   ├── components/
│   │   ├── AdminLayout.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Footer.tsx
│   │   ├── LoadingScreen.tsx
│   │   ├── LoginFooter.tsx
│   │   ├── Navigation.tsx
│   │   ├── PrivateRoute.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── departments/
│   │   ├── dialogs/
│   │   ├── kanban/
│   │   ├── layout/
│   │   ├── tasks/
│   │   ├── tasks-overview/
│   │   └── users/
│   ├── assets/
│   │   └── images/
│   │       ├── logo.png
│   │       └── logoIcon.png
│   ├── constants/
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useAnimations.ts
│   │   ├── useDragAndDrop.ts
│   │   ├── useErrorHandler.ts
│   │   ├── useMockTasks.ts
│   │   ├── useReferenceData.ts
│   │   ├── useTaskPermissions.ts
│   │   ├── useTasks.ts
│   │   └── useWidgetVisibility.ts
│   ├── index.css
│   ├── index.tsx
│   ├── layouts/
│   │   └── AdminLayout.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Departments.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── index.ts
│   │   ├── Login.tsx
│   │   ├── NotFound.tsx
│   │   ├── Profile.tsx
│   │   ├── Province.tsx
│   │   ├── ProvinceAdmin.tsx
│   │   ├── ProvinceView.tsx
│   │   ├── Provinces.tsx
│   │   ├── ProvincesPage.tsx
│   │   ├── Settings.tsx
│   │   ├── Tasks.tsx
│   │   ├── TasksOverview.tsx
│   │   ├── Users.tsx
│   │   └── admin/
│   ├── polyfills/
│   ├── routes/
│   ├── services/
│   │   ├── activityLogs.ts
│   │   ├── admin.ts
│   │   ├── api.ts
│   │   ├── apiHealthService.ts
│   │   ├── AuthService.ts
│   │   ├── auth.ts
│   │   ├── backupService.ts
│   │   ├── DepartmentService.ts
│   │   ├── department.ts
│   │   ├── index.ts
│   │   ├── mockActivityLogsService.ts
│   │   ├── mockAdminService.ts
│   │   ├── mockApiHealthService.ts
│   │   ├── mockBackupService.ts
│   │   ├── mockSettingsService.ts
│   │   ├── mockTaskService.ts
│   │   ├── mockUserService.ts
│   │   ├── notes.ts
│   │   ├── notification.ts
│   │   ├── profile.ts
│   │   ├── provinceService/
│   │   ├── queryClient.ts
│   │   ├── settings.ts
│   │   ├── task.ts
│   │   ├── tasks.service.ts
│   │   ├── user.ts
│   │   └── websocket.ts
│   ├── store/
│   │   ├── context.ts
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── departmentSlice.ts
│   │       ├── provinceSlice.ts
│   │       └── userSlice.ts
│   ├── stories/
│   ├── tests/
│   ├── theme.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── fingerprintjs.d.ts
│   │   ├── globals.d.ts
│   │   ├── hello-pangea__dnd.d.ts
│   │   ├── images.d.ts
│   │   ├── index.d.ts
│   │   ├── index.ts
│   │   ├── province.ts
│   │   ├── react-grid-layout.d.ts
│   │   ├── react-heatmap-grid.d.ts
│   │   ├── service-worker.d.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── apiTester.ts
│   │   ├── authUtils.ts
│   │   ├── axios.ts
│   │   ├── backgroundStyles.ts
│   │   ├── colors.ts
│   │   ├── config.ts
│   │   ├── dateUtils.ts
│   │   ├── glassmorphismStyles.ts
│   │   └── testBackupAPI.ts
│   ├── vite-env.d.ts
│   ├── serviceWorkerRegistration.ts
│   ├── service-worker.ts
│   └── tsconfig.json
```

---

## Backend Directory (`backend-nest/`)

```
backend-nest/
├── .env
├── .env.example
├── .env.local
├── .env.production
├── .env.test
├── .gitignore
├── data-source.ts
├── eslint.config.mjs
├── migrations/
├── nest-cli.json
├── node_modules/
├── ormconfig.js
├── ormconfig.ts
├── package.json
├── package-lock.json
├── prettierrc
├── restart.ps1
├── scripts/
├── src/
│   ├── admin/
│   ├── analytics/
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   ├── auth/
│   ├── backup/
│   ├── cli.ts
│   ├── common/
│   ├── data-source.ts
│   ├── departments/
│   │   ├── controllers/
│   │   ├── departments.controller.ts
│   │   ├── departments.module.ts
│   │   ├── departments.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │       └── department.entity.ts
│   ├── health/
│   ├── main.ts
│   ├── mail/
│   ├── migrations/
│   ├── notes/
│   ├── notifications/
│   ├── profile/
│   ├── provinces/
│   ├── queue/
│   ├── settings/
│   ├── tasks/
│   │   ├── dto/
│   │   │   ├── create-task.dto.ts
│   │   │   ├── update-task-priority.dto.ts
│   │   │   ├── update-task-status.dto.ts
│   │   │   └── update-task.dto.ts
│   │   ├── entities/
│   │   │   └── task.entity.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.module.ts
│   │   ├── tasks.service.spec.ts
│   │   └── tasks.service.ts
│   ├── users/
│   │   ├── commands/
│   │   │   ├── commands.module.ts
│   │   │   └── create-admin.command.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   └── ...
├── start-server.ps1
├── tsconfig.build.json
├── tsconfig.json
├── update_db.ps1
├── update_status.bat
```

---

# Notes
- This structure is up-to-date as of the latest scan.
- For more details on any directory, explore the respective folders.
- This file is intended for memory and navigation purposes. 