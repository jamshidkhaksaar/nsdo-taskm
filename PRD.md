# Project Requirements Document (PRD) - NSDO Task Manager

## 1. Overview

This document tracks the analysis, requirements, dependencies, findings, and improvements for the NSDO Task Manager project. It serves as a central reference point for the ongoing debugging and code cleanup process.

## 2. Tech Stack

### 2.1. Backend (`backend-nest`)

*   **Framework:** NestJS (`@nestjs/core`, `@nestjs/common`, etc.)
*   **Language:** TypeScript
*   **Database:** MySQL (`mysql2`), PostgreSQL (`pg`) - *Presence of both drivers noted. Needs verification on actual usage.*
*   **ORM:** TypeORM (`@nestjs/typeorm`, `typeorm`)
*   **API Documentation:** Swagger (`@nestjs/swagger`)
*   **Authentication:** Passport (`@nestjs/passport`, `passport`, `passport-jwt`, `passport-local`), JWT (`@nestjs/jwt`), bcrypt
*   **Real-time:** WebSockets (`@nestjs/platform-socket.io`, `@nestjs/websockets`, `socket.io`)
*   **Queues:** BullMQ (`@nestjs/bull`, `bullmq`), Redis (`ioredis`)
*   **Email:** Nodemailer (`@nestjs-modules/mailer`, `nodemailer`), SendGrid (`@sendgrid/mail`)
*   **Configuration:** `@nestjs/config`, `dotenv`
*   **Validation:** `class-validator`, `class-transformer`
*   **Security:** Helmet (`helmet`), CSRF (`csurf`), Throttler (`@nestjs/throttler`)
*   **HTTP Client:** Axios (`@nestjs/axios`, `axios`)
*   **CLI:** `nest-commander`
*   **Other:** Caching (`@nestjs/cache-manager`), Health Checks (`@nestjs/terminus`), QR Code (`qrcode`), 2FA (`speakeasy`), Fingerprinting (`react-turnstile`? - *Seems like a frontend lib, needs investigation; confirmed present in backend-nest/package.json, likely an error*)

### 2.2. Frontend (`frontend`)

*   **Framework/Library:** React (`react`, `react-dom`)
*   **Language:** TypeScript
*   **Build Tool:** Vite (`vite`)
*   **UI Library:** Material UI (`@mui/material`, `@mui/icons-material`), potentially Tailwind CSS (`tailwindcss`, `tailwind-merge`, `clsx`) - *Presence of both needs verification.*
*   **State Management:** Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
*   **Routing:** React Router (`react-router-dom`)
*   **Data Fetching/Caching:** TanStack Query (`@tanstack/react-query`), Axios (`axios`)
*   **Forms:** React Hook Form (`react-hook-form`), Zod (`zod`) for validation
*   **Real-time:** Socket.IO Client (`socket.io-client`)
*   **Drag & Drop:** `@hello-pangea/dnd`
*   **Charts:** Chart.js (`chart.js`, `react-chartjs-2`)
*   **Notifications:** Notistack (`notistack`), React Toastify (`react-toastify`)
*   **Date/Time:** date-fns (`date-fns`), Day.js (`dayjs`), MUI Date Pickers (`@mui/x-date-pickers`)
*   **Other:** Fingerprinting (`@fingerprintjs/fingerprintjs`), CAPTCHA (`@marsidev/react-turnstile`, `react-turnstile`), Icons (`lucide-react`), Particles (`react-tsparticles`, `tsparticles`), Heatmap (`react-heatmap-grid`), Grid Layout (`react-grid-layout`)

## 3. Task Management System Features

This section details the core features of the task management system, their current implementation, associated RBAC permissions, and steps for verification.

### 3.1. Task Creation
- **Description:** Users can create tasks with essential details such as title, description, priority, and due date. Tasks can be personal or assigned to other users, specific departments, or departments within a designated province.
- **Current Implementation:**
    - **Backend:**
        - API Endpoint: `POST /tasks` (handled by `TasksController.create()`).
        - Service Logic: `TasksService.create()` in `backend-nest/src/tasks/tasks.service.ts`.
            - Populates `Task` entity fields (`title`, `description`, `priority`, `dueDate`, `createdById`).
            - Sets default `status` to `PENDING` and `isDelegated` to `false`.
            - Determines `TaskType` based on provided assignee IDs:
                - `TaskType.USER`: If `assignedToUserIds` are provided.
                - `TaskType.DEPARTMENT`: If `assignedToDepartmentIds` are provided.
                - `TaskType.PROVINCE_DEPARTMENT`: If `assignedToDepartmentIds` and `assignedToProvinceId` are provided.
                - `TaskType.PERSONAL`: If no assignees are provided (task assigned to creator).
            - Validates against assigning to both users and departments, or users and a province simultaneously. Province assignment requires department assignment.
            - Saves the task to the database.
            - Triggers notifications to assignees.
        - DTO: `CreateTaskDto` (`backend-nest/src/tasks/dto/create-task.dto.ts`) defines the input structure.
    - **Frontend:**
        - UI Components: Expected to be in `frontend/src/components/tasks/CreateTaskDialog.tsx` and/or `frontend/src/components/tasks/TaskForm.tsx`.
        - Service: API calls likely handled by `addTask` function in `frontend/src/services/task.ts` or `frontend/src/services/tasks.service.ts`.
- **RBAC Permissions:**
    - The `POST /tasks` endpoint is protected by `JwtAuthGuard` and `PermissionsGuard` at the `TasksController` class level.
    - No specific `@Permissions()` decorator is on the `create()` method, suggesting it might rely on a general "task:create" permission checked by `PermissionsGuard`, or be available to any authenticated user if no specific permission is configured for this route by default.
- **Verification Steps:**
    - Log in as a user with "task:create" permission (or equivalent).
        - Create a task with minimum required fields (e.g., title). Verify default values for priority, description.
        - Create a task with all fields populated.
        - Create a task assigned to a single user; verify assignee receives a notification.
        - Create a task assigned to multiple users; verify all assignees receive notifications.
        - Create a task assigned to a single department.
        - Create a task assigned to multiple departments in one province.
        - Create a task assigned to a department within a specific province.
        - Confirm the newly created task appears in the dashboard (List View and Kanban mode) for the creator and any assignees.
    - Log in as a user *without* "task:create" permission. Confirm UI options for task creation are disabled/hidden, or the API call fails with a 403 Forbidden error.
    - Attempt to create a task assigning to both `assignedToUserIds` and `assignedToDepartmentIds`; expect a 400 Bad Request error.
    - Attempt to create a task assigning to `assignedToUserIds` and an `assignedToProvinceId`; expect a 400 Bad Request error.
    - Attempt to create a task assigning to an `assignedToProvinceId` without `assignedToDepartmentIds`; expect a 400 Bad Request error.

### 3.2. Task Assignment
- **Description:** Tasks can be assigned to one or more users, one or more departments, or departments within a specific province. Assignments can be set during task creation or modified later.
- **Current Implementation:**
    - **Backend:**
        - Assignment during creation is handled by `TasksService.create()` as described above.
        - Assignment updates are handled by `TasksService.update()` (called by `PUT /tasks/:id` endpoint in `TasksController`).
        - The `Task` entity (`backend-nest/src/tasks/entities/task.entity.ts`) uses `assignedToUsers` (ManyToMany), `assignedToDepartments` (ManyToMany), and `assignedToProvinceId` (string, with `assignedToProvince` relation) to store assignments.
    - **Frontend:**
        - Task creation forms (`CreateTaskDialog.tsx`, `TaskForm.tsx`) should provide UI for selecting assignees.
        - Task editing forms (`EditTaskDialog.tsx`) should allow modification of these assignments.
- **RBAC Permissions:**
    - Creation: Governed by "task:create" permission (see Task Creation).
    - Update: The `PUT /tasks/:id` endpoint is protected by `JwtAuthGuard` and `PermissionsGuard`.
    - `TasksService.update()` includes internal checks: the requesting user must be the task creator, a current assignee, or have an Admin/Leadership role to modify the task (including assignments). `TaskQueryService.checkAssigneePermission()` is used to verify if a user is an assignee (directly, via department, or via province/department).
    - A specific "task:assign" or "task:update:assignment" permission might be checked by `PermissionsGuard`.
- **Verification Steps:**
    - (Creation assignment steps are covered under Task Creation).
    - Log in as a user who is the creator of a task. Edit the task to:
        - Change user assignment from User A to User B.
        - Add User C as an additional assignee.
        - Change department assignment.
        - Change provincial department assignment.
        - Verify changes are saved and notifications (if configured for updates) are sent.
    - Log in as a user who is an assignee of a task (but not creator). Attempt to modify assignments. This should be allowed based on `TasksService.update()` logic. Verify.
    - Log in as an Admin/Leadership role. Modify assignments for any task. Verify.
    - Log in as a user who is neither creator, assignee, nor admin for a task. Confirm attempts to change assignments are denied.

### 3.3. Task Delegation
- **Description:** Users can delegate tasks to other users. This typically involves creating a new sub-task assigned to the new user, while the original task's status is updated to "Delegated".
- **Current Implementation:**
    - **Backend:**
        - API Endpoint: `POST /tasks/:id/delegate` (handled by `TasksController.delegateTask()`).
        - Service Logic: `TasksService.delegateTask()` in `backend-nest/src/tasks/tasks.service.ts`.
            - Fetches the original task using `TaskQueryService.findOne()`.
            - Validates `newAssigneeUserIds` from `DelegateTaskDto`.
            - Creates new `Task` entities (sub-tasks) for each `newAssigneeUserId`.
                - Sub-task title is prefixed with `(Delegated)`.
                - Sub-tasks link back to the original task via `delegatedFromTaskId` and `delegatedByUserId`.
                - Sub-tasks are of `TaskType.USER`.
            - Sets the original task's `status` to `DELEGATED`.
            - Sends notifications to the new assignees of the sub-tasks.
        - DTO: `DelegateTaskDto` (`backend-nest/src/tasks/dto/delegate-task.dto.ts`) includes `newAssigneeUserIds` and `delegationReason`.
    - **Frontend:**
        - UI: A "Delegate Task" button is expected in the task details view (e.g., `frontend/src/components/tasks/TaskViewDialog.tsx`).
        - Service: API calls likely handled by a `delegateTask` function in `frontend/src/services/task.ts`.
- **RBAC Permissions:**
    - The `TasksController.delegateTask()` method is decorated with `@Permissions("task:manage")` and `@Roles("Leadership", "Administrator")`. These are strict.
    - `TasksService.delegateTask()` contains more granular internal permission logic: the delegator must be the task `isCreator`, OR `isAssignee` (checked via `TaskQueryService.checkAssigneePermission`), OR `isAdminOrLeadership`.
    - **Potential Conflict:** The controller-level RBAC (guards run first) is more restrictive than the service-level logic. If `PermissionsGuard` enforces "task:manage" and the specified roles strictly, only users matching those criteria can access the endpoint, regardless of the service's more permissive checks. This needs clarification or alignment.
    - The user request specifies:
        1.  Delegation enabled if task is assigned to current user by someone else. (Partially covered by `isAssignee` in service if controller allows).
        2.  Delegation enabled if task assigned to user's department and user is a manager. (This specific "department manager" delegation logic is not explicitly present in `TasksService.delegateTask()` unless the manager role maps to "Leadership" or "Administrator" and has "task:manage").
- **Verification Steps:**
    - Assuming the controller-level RBAC (`task:manage` permission and Leadership/Administrator role) is the effective gate:
        - Log in as a "Leadership" or "Administrator" role with "task:manage" permission.
            - Delegate a task originally assigned to User A to User B. Verify sub-task creation for User B, original task status update, and notifications.
    - If service-level permissions were reachable (e.g., if controller guards were less strict or "task:manage" was granted more broadly):
        - Scenario 1 (Task assigned to current user): User A is assigned a task. Log in as User A. Attempt to delegate to User C. Verify outcome based on effective permissions.
        - Scenario 2 (Department manager): Task assigned to Dept X. User M is manager of Dept X. Log in as User M. Attempt to delegate to User D in Dept X. Verify.
    - Log in as a user without the "task:manage" permission and relevant role. Confirm "Delegate Task" button is hidden/disabled or API call fails with 403.
    - Test delegation of a completed or cancelled task; expect a 400 Bad Request.

### 3.4. Task Status Changes
- **Description:** Users can update the lifecycle status of tasks (e.g., from Pending to In Progress, Completed, or Cancelled).
- **Current Implementation:**
    - **Backend:**
        - API Endpoint: `PATCH /tasks/:id/status` (handled by `TasksController.updateStatus()`).
        - Service Logic: `TasksService.updateStatus()` in `backend-nest/src/tasks/tasks.service.ts`.
            - Fetches the task using `TaskQueryService.findOne()`.
            - Validates status transitions (e.g., cannot cancel an already completed task).
            - If new status is `CANCELLED`, a `cancellationReason` (min 20 characters from `UpdateTaskStatusDto`) is required.
            - Updates `task.status`. Sets `task.completedAt` if status is `COMPLETED`. Sets `task.cancelledAt`, `task.cancelledById`, `task.cancellationReason` if `CANCELLED`.
            - Records an entry in the activity log.
            - Sends notifications to assignees if status changes to `COMPLETED` or `CANCELLED`.
        - DTO: `UpdateTaskStatusDto` (`backend-nest/src/tasks/dto/update-task-status.dto.ts`) includes `status` and optional `cancellationReason`.
        - Available Statuses: Defined in `TaskStatus` enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DELEGATED`, `DELETED`) in `task.entity.ts`.
    - **Frontend:**
        - UI: Task views (`TaskViewDialog.tsx`, `TaskList.tsx` items, `TaskBoard.tsx` columns/cards) should provide means to change task status (e.g., dropdown menus, drag-and-drop functionality).
        - Service: API calls likely handled by an `updateTaskStatus` function in `frontend/src/services/task.ts`.
- **RBAC Permissions:**
    - The `PATCH /tasks/:id/status` endpoint is protected by `JwtAuthGuard` and `PermissionsGuard` at the `TasksController` class level.
    - `TasksService.updateStatus()` includes internal permission logic: the requesting user must be the task `isCreator`, OR `isAssignee` (checked via `TaskQueryService.checkAssigneePermission`), OR `isAdminOrLeadership`.
    - A specific "task:update:status" permission might be checked by `PermissionsGuard`.
- **Verification Steps:**
    - Log in as a user who is an assignee of a task.
        - Change task status: Pending -> In Progress. Verify.
        - Change task status: In Progress -> Completed. Verify `completedAt` is set and notifications sent.
        - Change task status: Pending -> Cancelled (provide a valid reason). Verify `cancelledAt`, `cancelledById`, `cancellationReason` are set and notifications sent.
    - Log in as the creator of a task (who may not be a current assignee). Attempt to change status. Verify based on service logic.
    - Log in as an Admin/Leadership role. Attempt to change status for any task. Verify.
    - Log in as a user who is neither creator, assignee, nor admin for a task. Confirm attempts to change status are denied.
    - Attempt to change status to `CANCELLED` without providing a `cancellationReason` (or with a too-short reason); expect a 400 Bad Request.
    - Attempt to change the status of an already `COMPLETED` task to `CANCELLED`; expect a 400 Bad Request.

### 3.5. Summary of Task Management Features
- **Task Creation:** Users with "task:create" (or equivalent default) permission can create tasks. Input fields (`title`, `description`, `priority`, `dueDate`) are validated. Tasks can be assigned to users, departments, or provincial departments, triggering notifications. Backend: `POST /tasks`, `TasksService.create()`.
- **Task Assignment:** Assignment to single/multiple users, departments, or provincial departments is handled during creation (`CreateTaskDto`) or update (`UpdateTaskDto`). Backend logic in `TasksService.create()` and `TasksService.update()` manages `TaskType` and assignee relations. Permissions are tied to task creation/update, with service-level checks for creator/assignee/admin roles.
- **Task Delegation:** Users with "task:manage" permission and "Leadership"/"Administrator" roles (per controller decorator) can delegate tasks via `POST /tasks/:id/delegate`. `TasksService.delegateTask()` creates sub-tasks for new assignees and sets the original task to "DELEGATED". Service-level permission checks are more granular (creator/assignee/admin) but may be superseded by stricter controller guards.
- **Task Status Changes:** Users who are creators, assignees, or admins/leadership can update task statuses (Pending, In Progress, Completed, Cancelled) via `PATCH /tasks/:id/status`. `TasksService.updateStatus()` handles logic, including requiring a reason for cancellation and sending notifications for completion/cancellation.
- **RBAC Integration:** All primary task operations (`create`, `update`, `delegate`, `updateStatus`) in `TasksController` are protected by `JwtAuthGuard` and `PermissionsGuard`. Specific controller methods have `@Permissions` or `@Roles` decorators (e.g., delegation). Service methods (`TasksService`) further implement fine-grained permission checks (e.g., creator, assignee, admin/leadership status) often using `TaskQueryService.checkAssigneePermission()`.

## 4. Function Analysis

*(To be populated after code review)*

## 5. Dependencies Review

*(To be populated after analysis)*

### 5.1. Backend Dependencies

*   **Initial Notes:**
    *   Both `mysql2` and `pg` are listed. Verify which database is actively used.
    *   `react-turnstile` appears in backend dependencies, which seems unusual. Verify its usage.

### 5.2. Frontend Dependencies

*   **Initial Notes:**
    *   Both Material UI and Tailwind CSS dependencies are present. Verify how they are used together or if one is primary.
    *   Two notification libraries (`notistack`, `react-toastify`). Verify usage.
    *   `react-turnstile` appears in backend dependencies, which seems unusual. Verify its usage. *Confirmed present, likely an error and should be removed from backend.*

## 6. Project Requirements Implemented

*(To be populated based on function analysis)*

## 7. Findings, Improvements & Actions

### 7.1. Initial Findings

*   **TypeScript Compilation Errors:** Errors found during startup related to missing `api-settings.entity` import in `backend-nest/ormconfig.ts` and `backend-nest/src/app.module.ts`.
    *   **Status:** Resolved. References removed. (2024-0X-XX)
*   **Admin 2FA Days Setting:** User reported that the admin-set "2FA days" value doesn't reflect for users.
    *   **Finding:** The relevant admin setting in `SecuritySettings` is `password_expiry_days`, not directly related to 2FA code validity (which is typically 30-60s for TOTP). There is a `two_factor_device_remembrance_days` setting (default 30) in `security_settings` table, which is used by the backend to determine how long to "remember" a device after a successful login (including 2FA). This "remembrance" currently triggers "New Login Notification" emails if a login occurs from an unrecognized device. It does not, however, bypass the 2FA challenge on subsequent logins from a remembered device.
    *   **Status:** Analysis Complete. The system remembers devices for notification purposes but not for skipping 2FA.
*   **Authenticator App 2FA Verification Failure (400 Error):** Users encounter a 400 error when trying to verify the code after scanning the QR code.
    *   **Finding:** The `AuthService.login2FA` method was incomplete. The actual TOTP verification logic was commented out. Furthermore, the check for `user.twoFactorEnabled` and `user.twoFactorSecret` was likely failing because the user setup process (generating secret, saving it, enabling flag) was missing entirely, leading to a `BadRequestException` (400).
    *   **Status:** Resolved. (YYYY-MM-DD)
*   **"Remember Device" for 2FA Functionality:** Investigation into the "remember this device" feature for 2FA.
    *   **Finding:** The "Remember Device" feature for 2FA has been standardized and implemented to provide a true 2FA bypass mechanism.
        *   **Frontend:** Continues to send `rememberDevice: boolean` from the 2FA dialog during login (`Login.tsx`) and `remember_browser: boolean` from the 2FA setup verification in user settings (`Settings.tsx`).
        *   **Backend DTOs:** `LoginTwoFactorDto` now includes `rememberDevice?: boolean`. `VerifyTwoFactorDto` (for 2FA setup) now includes `remember_browser?: boolean`.
        *   **Backend Controllers:**
            *   `AuthController` (`POST /auth/login/2fa`): Now correctly processes `rememberDevice` from `LoginTwoFactorDto` and passes it to `AuthService.login2FA`.
            *   `TwoFactorController` (`POST /settings/verify_2fa/`): Now correctly processes `remember_browser` from `VerifyTwoFactorDto`. If 2FA setup verification is successful and `remember_browser` is true, it calls `authService.handleNewLoginSecurityChecks` to register the device.
        *   **Backend Services:**
            *   `AuthService.login2FA`: Signature updated to accept `rememberDevice?: boolean`.
            *   `AuthService.signIn`: Now performs a 2FA bypass check. It generates a device fingerprint, compares it against `user.rememberedBrowsers`, and if the device is recognized and its remembrance period (defined by `two_factor_device_remembrance_days`) has not expired, it bypasses the 2FA code challenge. It still calls `handleNewLoginSecurityChecks` to log the login and potentially update device activity.
            *   `AuthService.handleNewLoginSecurityChecks`: This method (now public) remains the core logic for device fingerprinting, checking for new devices (triggering notifications), and storing/updating device fingerprints in `user.rememberedBrowsers` with an expiry date based on `security_settings.two_factor_device_remembrance_days`.
            *   `AuthService.generateDeviceFingerprint`: A new private helper method added for consistent device fingerprint generation.
    *   **Conclusion:** The system now effectively allows users to have their 2FA challenge bypassed on trusted devices for a duration configured by administrators (`two_factor_device_remembrance_days`). This is achieved by checking the device fingerprint during the initial sign-in phase. Devices can be marked for remembrance during the 2FA prompt at login or during the 2FA setup verification in user settings.
    *   **Status:** Implemented. The core functionality for 2FA bypass on remembered devices is in place. Fine-tuning of `handleNewLoginSecurityChecks` could be considered if more granular control over device memory is needed when a user *explicitly unchecks* "remember device" (e.g., to not remember it even for notifications in that specific instance).
    *   **Action:** Monitor and test. Consider further refinement of `AuthService.handleNewLoginSecurityChecks` if explicit "do not remember this specific login instance even for notifications" is required when the user unticks the remember box (current behavior will still log it via `handleNewLoginSecurityChecks` if the 2FA login itself is successful).
*   **Email 2FA Delivery Failure:** Emails for email-based 2FA are not being sent.
    *   **Finding:** `AuthService` calls `MailService.sendTemplatedEmail` correctly. `MailService` uses `@nestjs-modules/mailer`, which is configured in `MailModule` to use SendGrid via SMTP, fetching the API key from `SettingsService` (which reads the `settings` DB table). The failure is likely due to: missing/incorrect API key/from-address in DB settings, incorrect SendGrid permissions, a missing/malformed `TWO_FACTOR_LOGIN_CODE` email template in the DB, or network issues.
    *   **Status:** Investigation ongoing. Added logging to `MailService` to help diagnose further. Need to check DB settings, template existence, and potentially test SendGrid key directly.
    *   **Update:** Email templates for 2FA (`TWO_FACTOR_CODE_EMAIL`, `TWO_FACTOR_LOGIN_CODE`) created. SendGrid integration for these emails relies on existing `MailService`. Further testing of SendGrid key and settings is still advised.
*   **Console Error in TaskViewDialog:** A `TypeError: Cannot read properties of null (reading 'title')` was occurring in `frontend/src/components/tasks/TaskViewDialog.tsx`.
    *   **Finding:** The error happened because the `task` object was accessed in the `DialogTitle` and `DialogActions` before it was fully loaded, or if it failed to load. The `task` state is initialized to `null` and populated asynchronously.
    *   **Status:** Resolved. (YYYY-MM-DD)

### 7.2. Planned Actions

*   ~~Resolve TypeScript compilation errors.~~ (Done)
*   **Implement 2FA Backend Flow:**
    *   Add controller endpoints for `/auth/2fa/setup` and `/auth/2fa/confirm` calling the new `AuthService` methods.
    *   (Optional) Implement recovery code generation and verification.
*   **Diagnose & Fix Email 2FA Delivery:**
    *   Verify `SENDGRID_API_KEY` and `EMAIL_FROM_ADDRESS` in DB settings.
    *   Verify existence and content of `TWO_FACTOR_LOGIN_CODE` email template in DB.
    *   Use `testSendGridSettings` or admin panel test feature to check key validity.
    *   Analyze logs after the added logging in `MailService` for specific errors during `mailerService.sendMail()`.
    *   **Update:** Email templates for 2FA (`TWO_FACTOR_CODE_EMAIL`, `TWO_FACTOR_LOGIN_CODE`) created. SendGrid integration for these emails relies on existing `MailService`. Further testing of SendGrid key and settings is still advised.
*   Perform detailed function analysis for both backend and frontend.
*   Analyze dependency usage to identify unused or missing packages.
*   Document implemented project requirements.
*   Investigate potential bugs using logs and browser tools.

### 7.3. Implemented 2FA System (Details)

A comprehensive Two-Factor Authentication (2FA) system has been implemented, offering users the choice between an Authenticator App (TOTP) and Email-based codes.

**Key Backend Components & Logic:**

*   **`TwoFactorService` (`backend-nest/src/auth/two-factor.service.ts`):**
    *   Handles core 2FA logic: generating secrets for app-based 2FA, generating QR codes (using `qrcode`), verifying TOTP codes (using `speakeasy`).
    *   Manages 2FA status (enabled/disabled, method) for users.
    *   Sends email codes for 2FA setup verification (using `MailService` and `TWO_FACTOR_CODE_EMAIL` template).
*   **`AuthService` (`backend-nest/src/auth/auth.service.ts`):**
    *   Integrates 2FA into the primary login flow (`signIn` method checks if 2FA is required).
    *   Handles 2FA code verification during login (`login2FA` method).
    *   Sends login OTP codes via email (`sendLoginTwoFactorEmailCode` using `MailService` and `TWO_FACTOR_LOGIN_CODE` template).
*   **`TwoFactorController` (`backend-nest/src/auth/two-factor.controller.ts`):**
    *   Mounted at `/settings`.
    *   Provides endpoints for frontend settings management:
        *   `GET /2fa-status`: Fetches the current 2FA status and method for the logged-in user.
        *   `POST /setup_2fa`: Enables/disables 2FA, sets the method (app/email). Returns QR code for app setup.
        *   `POST /verify_2fa`: Verifies the TOTP code during 2FA setup.
*   **`AuthController` (`backend-nest/src/auth/auth.controller.ts`):**
    *   `POST /login/2fa/resend-code`: New endpoint to allow users to request a new OTP if needed during the login 2FA challenge.
*   **`EmailTemplatesService` (`backend-nest/src/email-templates/email-templates.service.ts`):**
    *   Added two new default email templates:
        *   `TWO_FACTOR_CODE_EMAIL`: For verifying email as a 2FA method during setup.
        *   `TWO_FACTOR_LOGIN_CODE`: For sending the OTP during login.
*   **User Entity (`backend-nest/src/users/entities/user.entity.ts`):**
    *   Updated to include `twoFactorEnabled`, `twoFactorSecret`, `twoFactorMethod`, `loginOtp`, `loginOtpExpiresAt`.

**Key Frontend Components & Logic:**

*   **`Settings.tsx` (`frontend/src/pages/Settings.tsx`):**
    *   Provides UI in the "Security" tab for users to manage their 2FA settings.
    *   Allows enabling/disabling 2FA.
    *   Allows selection between "Authenticator App" and "Email" methods.
    *   Guides users through the setup process for the chosen method (displaying QR code, prompting for verification code).
    *   Uses `SettingsService.ts` for backend communication.
*   **`TwoFactorAuthPopup.tsx` (`frontend/src/components/auth/TwoFactorAuthPopup.tsx`):**
    *   A reusable modal dialog that prompts the user to enter their 2FA code (from app or email).
    *   Includes a "Resend Code" option for email-based 2FA during login.
*   **`Login.tsx` (`frontend/src/pages/Login.tsx`):**
    *   Integrates the `TwoFactorAuthPopup`.
    *   When the initial username/password login is successful and the backend indicates 2FA is required, this popup is shown.
    *   Handles submission of the 2FA code to the backend.
*   **`AuthService.ts` (`frontend/src/services/AuthService.ts`):**
    *   `login()`: Updated to handle responses indicating 2FA is required.
    *   `login2FA()`: Sends the 2FA code to the backend for verification during login.
    *   `resendLoginOtp()`: New method to request a new login OTP.
*   **`SettingsService.ts` (`frontend/src/services/settings.ts`):**
    *   Contains methods to interact with the backend 2FA settings endpoints (`get2FAStatus`, `setup2FA`, `verify2FA`).

## 8. Change Log & Rationales

*   **2024-0X-XX:** Removed references to the non-existent `ApiSettings` entity from `backend-nest/ormconfig.ts` (import only) and `backend-nest/src/app.module.ts` (import and `TypeOrmModule` entities array).
    *   **Rationale:** Resolved startup compilation errors. Entity confirmed as obsolete.
*   **2024-0X-XX:** Added 2FA authenticator app setup and verification logic to `AuthService`.
    *   Installed `speakeasy`.
    *   Added `generateTwoFactorSetupDetails`, `confirmTwoFactorSetup`, `sendLoginTwoFactorEmailCode`, `disableTwoFactor` methods.
    *   Implemented TOTP check in `login2FA`.
    *   Added `loginOtp`, `loginOtpExpiresAt` to `User` entity and made `twoFactorSecret` nullable.
    *   **Rationale:** Fixes the 400 error during 2FA app verification by implementing the missing setup and verification flow.
*   **2024-0X-XX:** Added logging to `MailService.sendTemplatedEmail`.
    *   **Rationale:** To help diagnose failures in email delivery by logging fetched templates and specific errors from the underlying mailer transport.
*   **2024-05-XX (Current Sprint):** Implemented a comprehensive Two-Factor Authentication (2FA) system.
    *   **Backend:**
        *   Added `TwoFactorService` for core 2FA logic (TOTP generation/verification with `speakeasy`, QR codes with `qrcode`).
        *   Updated `AuthService` to integrate 2FA into login and handle login OTPs.
        *   Added `TwoFactorController` for 2FA settings management (status, setup, verification) via `/settings/...` endpoints.
        *   Added `/auth/login/2fa/resend-code` endpoint to `AuthController`.
        *   Created new email templates (`TWO_FACTOR_CODE_EMAIL`, `TWO_FACTOR_LOGIN_CODE`) in `EmailTemplatesService`.
        *   Updated `User` entity with necessary 2FA fields.
        *   Corrected user ID access in `TwoFactorController` (from `req.user.id` to `req.user.userId`) to resolve user context issues.
    *   **Frontend:**
        *   Developed `TwoFactorAuthPopup.tsx` for 2FA code entry during login.
        *   Integrated the popup into `Login.tsx` and updated login flow to handle 2FA.
        *   Refactored 2FA management UI in `Settings.tsx` for a clearer, step-by-step setup process for app and email methods.
        *   Updated `AuthService.ts` (frontend) with `login2FA` and `resendLoginOtp` methods.
        *   Ensured `SettingsService.ts` (frontend) correctly calls backend 2FA settings endpoints.
    *   **Rationale:** Significantly enhances account security by adding an additional layer of verification for users. Addresses planned action items for 2FA implementation.
*   YYYY-MM-DD:** Fixed console error in `TaskViewDialog.tsx` and related linter warning.
    *   **Issue:** `TypeError: Cannot read properties of null (reading 'title')` caused by accessing `task.title` before `task` data was loaded. A linter warning for `TaskStatus.DELETED` also appeared.
    *   **Fix:**
        *   Added null checks for the `task` object in `frontend/src/components/tasks/TaskViewDialog.tsx` before accessing `task.title` in `DialogTitle` and properties of `task` in `DialogActions`. Display 'Loading Task...' if task is null.
        *   Removed the non-existent `TaskStatus.DELETED` from the status filter in the same component, resolving the linter error.
    *   **Rationale:** Prevents runtime errors and improves UI stability when task data is loading or unavailable. Corrected enum usage.

*   **YYYY-MM-DD (Current Sprint/Date):** Standardized and Implemented 'Remember Device for 2FA' Functionality.
    *   **Backend:**
        *   Updated `LoginTwoFactorDto` to include `rememberDevice?: boolean` and `VerifyTwoFactorDto` to include `remember_browser?: boolean`.
        *   Modified `AuthController` (`POST /auth/login/2fa`): Now processes `rememberDevice` from `LoginTwoFactorDto` and passes it to `AuthService.login2FA`.
        *   Updated `AuthService.login2FA` signature to accept `rememberDevice?: boolean`.
        *   Significantly updated `AuthService.signIn`:
            *   Added a private helper `generateDeviceFingerprint(userAgentString)` for consistent fingerprinting.
            *   Now loads `user.rememberedBrowsers`.
            *   Checks if the current device fingerprint matches a non-expired entry in `user.rememberedBrowsers`.
            *   If a match is found, it bypasses the 2FA challenge, logs the user in directly, and calls `handleNewLoginSecurityChecks`.
        *   Made `AuthService.handleNewLoginSecurityChecks` public. This method continues to be responsible for device fingerprint storage (using `two_factor_device_remembrance_days`) and new login notifications.
        *   Modified `TwoFactorController` (`POST /settings/verify_2fa/`):
            *   Now processes `remember_browser` from `VerifyTwoFactorDto`.
            *   If 2FA setup verification is successful and `remember_browser` is true, it calls the public `authService.handleNewLoginSecurityChecks` to register the device.
    *   **Frontend:** No direct code changes in this iteration, but existing functionality in `Login.tsx` (sending `rememberDevice`) and `Settings.tsx` (sending `remember_browser`) now correctly interfaces with the enhanced backend logic.
    *   **Rationale:** Implemented a consistent and functional "remember this device" feature, allowing users to bypass 2FA on trusted devices for a configurable duration (`two_factor_device_remembrance_days`). This enhances user experience by reducing friction on recognized devices, while security is maintained through device fingerprinting and notifications for logins from new/unrecognized devices. Standardized the behavior for remembering a device during both the login 2FA prompt and the 2FA setup verification process.

## 9. Task Management & Communication Protocol

*   **Task Tracking:** This PRD will serve as the primary task tracking document. Context7 MCP server will be used for fetching up-to-date documentation when needed. (Note: Task Master MCP is not available).
*   **Data Integrity:** Ensure all data interactions use the real MySQL database via backend APIs. No mock data.
*   **Change Control:** Detailed rationale will be provided in Section 7 before any code or dependency removal.
*   **Verification:** Frontend testing confirmation will be requested after implementations/fixes. Proceed only after receiving "great job" or similar approval.

## 10. Bug Tracking

*(To be populated as bugs are identified and resolved)*

### Newly Reported Issues (2025-05-14)

1.  **Quick Notes Leakage:** Quick notes of an admin user are showing in another user's notes section.
2.  **Incorrect Task Assignee Display:** Tasks created by a user for themselves (personal tasks) are showing as "Unassigned" in task lists instead of "My Task" or "Personal Task".
3.  **Duplicate Sidebar Menu Icon:** There are two "Tasks Overview" icons in the sidebar menu; the first one should be removed.
4.  **Admin Task Visibility Discrepancy:** Admin account sees 5 tasks for all departments, while another user (member of HR) sees no tasks. This behavior is unexpected.
5.  **Admin Tasks Overview Page Error:** The "Tasks Overview" page for the admin user shows "Error loading data: Validation failed (uuid is expected)".
6.  **Provincial Department Task Assignment Failure:** Unable to assign a task to a provincial department. System requests selection of at least one department, even when a province and department are already check-marked.
7.  **User Page Issues (User Management):**
    *   The "Users" page (currently titled "User Management") is intended for listing users to assign tasks.
    *   User selection for assignment is not working.
    *   An "Add User" button is present and should be removed as this page is not for user creation.
8.  **Task Assignee Display & Interaction in Departments Page & Dashboard:**
    *   In the "Departments" page, when a department is selected, task creator and assignee information is visible. This detailed display (showing actual names instead of "Unassigned" for personal/creator tasks) should be consistent in the user's main dashboard/task lists.
    *   Currently, the dashboard shows "Unassigned" for such tasks.
    *   Admin created tasks are showing the username "ading" in the middle (needs clarification/enhancement).
    *   Clicking on a task card (e.g., in Departments page or dashboard) does not pop out the full task details dialog.
9.  **Department Members Not Showing:** In the "Departments" page, selecting a department (e.g., IT) does not show its members (shows "Members 0").
10. **Task Details Dialog Enhancement:**
    *   The dialog shows "Created By" with a user ID/UUID instead of a user-friendly name.
    *   Needs professional redesign, potentially using a glassmorphism effect. This should apply to other popups/dialogs for consistency.
11. **Duplicate Buttons in Task Details Dialog:** "Cancel Task", "Delete Task", and "Delegate Assignments" buttons are still duplicated in the Task Details dialog.
12. **Department Task Assignment Failure:** When trying to assign a task to a department, an error "department is not selected" occurs.
13. **System Activity Logs Page Issues:**
    *   The styling of the "Activity Logs" page (Admin Panel) does not match the overall application design.
    *   Needs filters (e.g., by user, action, date range).
    *   The log information is insufficient and not "lovely" (needs more comprehensive details).
14. **System Settings Save Error:** When changing settings in the "System Settings" page and clicking "Save All Changes", an error "Sorry, something went wrong" appears.

## Workflow Permissions Visualizer for RBAC

This feature will provide a visual way to understand how different user roles interact with application workflows (e.g., Task Creation) based on their RBAC permissions. It will be a new tab within the Admin Panel's RBAC section.

**I. Conceptual & Design (Align with PRD)**

1.  **Define V1 Scope:**
    *   **Focus Workflow:** Start with "Task Creation".
    *   **Visualization:** Read-only display of how different roles can navigate the steps of task creation, showing what actions/fields they can interact with based on their existing permissions.
    *   **Key Elements:** Roles, Workflow Steps (e.g., "Initiate Task", "Set Details", "Assign", "Set Dates"), Connections, and Permission annotations.
2.  **Data Model Design (Backend):**
    *   **New Entities:**
        *   `Workflow`: Represents a business process (e.g., `id`, `name`, `description`, `slug`).
        *   `WorkflowStep`: Represents a distinct stage or action within a workflow (e.g., `id`, `workflowId`, `name`, `description`, `order`).
    *   **Linking to RBAC:**
        *   *Implicit Linking:* If permission names are granular (e.g., `task:create:%`), map these to workflow steps.
        *   *Explicit Linking (more flexible):* A join table like `WorkflowStepPermissionRequirement` (`workflowStepId`, `permissionId`). For V1, implicit mapping might be sufficient if permission names are well-structured.
3.  **API Design (Backend):**
    *   Endpoints to define and retrieve workflows and their steps.
    *   An endpoint to fetch the necessary data for the frontend to render the visualization for a selected workflow and (optionally) a specific role.
4.  **UI/UX Design (Frontend):**
    *   **Tab:** New "Workflow Visualizer" tab in the RBAC admin section.
    *   **Selectors:** Dropdowns to select the Workflow and (optionally V1, definite V2) the Role.
    *   **Diagram Library:** Consider React Flow or Cytoscape.js.
    *   **Display:** Define node types (Role, Workflow Step), edge styles, and how permissions are displayed (tooltips, side panel).

**II. Backend Development Plan**

1.  **Create `Workflows` Module (`backend-nest/src/admin/workflows/`)**
    *   **Entities:**
        *   `workflow.entity.ts`: (`id`, `name`, `slug`, `description`, `createdAt`, `updatedAt`)
        *   `workflow-step.entity.ts`: (`id`, `workflowId` (FK to Workflow), `name`, `description`, `stepOrder`, `relevantPermissionPatterns` (e.g., `["task:create:%", "task:details:%"]`), `createdAt`, `updatedAt`)
    *   **DTOs:** For creating/updating workflows and steps.
    *   **Service (`workflows.service.ts`):**
        *   CRUD for `Workflow` and `WorkflowStep`.
        *   `getWorkflowVisualData(workflowSlug: string, roleId?: string)`: Fetches workflow, steps, roles, and computes permission-based connections for visualization.
    *   **Controller (`workflows.controller.ts`):**
        *   CRUD endpoints for workflows/steps.
        *   `GET /admin/workflows/visualize/:workflowSlug`
        *   `GET /admin/workflows/visualize/:workflowSlug/role/:roleId`
    *   **Module (`workflows.module.ts`):** Wire up and import into `AdminModule`.
2.  **Database Migrations:** Add tables for `workflows` and `workflow_steps`.
3.  **Seed Data:**
    *   Create a seed for the "Task Creation" workflow with defined steps (e.g., `initiate-task`, `set-basic-details`, `set-assignments`, `set-due-date`, `submit-creation`) and their relevant permission patterns. 