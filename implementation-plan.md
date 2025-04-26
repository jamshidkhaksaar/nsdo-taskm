# Implementation Plan

This document outlines the design decisions and implementation steps for new features or major refactors.

---

## Notification System Design

🎨🎨🎨 **ENTERING CREATIVE PHASE: Architecture**

**Component Description:**
The Notification System is responsible for generating, managing, and delivering notifications to users via **in-app messages (using WebSockets)** and **Microsoft Teams**. It should inform users about relevant events, such as task assignments, status updates, mentions, or administrative actions.

**Requirements & Constraints:**
1.  **Functionality:** Deliver real-time or near real-time notifications for key events.
2.  **Delivery Channels:** Support:
    *   Real-time in-app notifications via WebSockets for active browser sessions.
    *   Notifications delivered to relevant Microsoft Teams channels or users.
3.  **Platform Adaptability:** The core logic should function consistently across Windows (development) and Linux (production). Configuration and infrastructure setup might differ (especially for Teams integration).
4.  **Scalability:** The system should handle a growing number of users and notification events, particularly for WebSocket connections and Teams API interactions.
5.  **Technology:** Leverage NestJS framework capabilities. Redis is recommended for decoupling and coordination between WebSocket and Teams delivery. Integration with Microsoft Teams APIs (Webhooks or Graph API) is required.
6.  **Reliability:** Ensure notifications are delivered reliably to connected WebSocket clients and to Microsoft Teams. Handle potential Teams API errors or rate limits.
7.  **Persistence:** Notifications should be stored persistently for history and potentially for auditing.
8.  **User Preferences:** Allow users/admins to configure Teams notification destinations (future consideration, but design should allow for it).

**Options Analysis:**

*   **Option A: Direct DB Polling + Queue + WebSocket + Teams Integration**
    *   **Description:** Backend services write notification events to a database. A queue worker (e.g., BullMQ using Redis) processes these events, pushing messages to a WebSocket Gateway for in-app delivery and sending messages to the Microsoft Teams API (Webhook or Graph).
    *   **Pros:** Leverages existing DB/Queue infrastructure if available. Persistence is straightforward.
    *   **Cons:** Latency for in-app notifications depends on polling/queue processing speed (not truly real-time). Can increase database load.

*   **Option B: Redis Pub/Sub + WebSocket Gateway + Teams Integration**
    *   **Description:** Backend services publish notification events to specific Redis channels. A dedicated NestJS WebSocket Gateway subscribes to these channels for real-time in-app delivery. A separate consumer/service (or potentially integrated into the Gateway) subscribes to the same Redis channels to format and send notifications to the Microsoft Teams API.
    *   **Pros:** Provides real-time in-app notification delivery via WebSockets. Decouples event production from delivery (WebSocket & Teams). Leverages Redis's efficient pub/sub mechanism. Scalable.
    *   **Cons:** Requires Redis setup and management (Docker recommended for dev consistency). Slightly more complex initial setup than direct polling.

*   **Option C: Direct WebSocket & Teams API Calls (No Redis/Queue)**
    *   **Description:** Backend services, upon generating a notification event, directly call methods on the WebSocket Gateway to push messages to connected clients *and* directly call the Microsoft Teams API.
    *   **Pros:** Simplest architecture, fewest moving parts initially. No Redis dependency.
    *   **Cons:** Tightly couples business logic to notification delivery mechanics. Less scalable under high load. Potential for blocking operations or unhandled errors if Teams API calls are slow or fail synchronously within the main request flow. Harder to coordinate or retry failed deliveries.

**Recommended Approach:**
**Option B: Redis Pub/Sub + WebSocket Gateway + Teams Integration**

*   **Justification:** This approach offers the best balance for the current requirements. It provides true real-time delivery for in-app notifications via WebSockets, which is a primary channel. Using Redis Pub/Sub effectively decouples the generation of notification events from the two delivery mechanisms (WebSocket and Teams), making the system more resilient and scalable. It allows the WebSocket gateway and the Teams integration logic to operate and scale independently. While it introduces Redis, the benefits of decoupling and real-time performance outweigh the added complexity, especially compared to the potential drawbacks of direct integration (Option C) or the latency of polling (Option A).
*   **Redis Role:** Redis acts as a central hub. An event is published once, and multiple subscribers (WebSocket Gateway, Teams Notifier) can react independently.

**Implementation Guidelines:**
1.  **Infrastructure & Setup:**
    *   Set up Redis (Recommend using Docker Desktop with a Redis image for local Windows development).
    *   Configure Microsoft Teams:
        *   Identify target channels/users.
        *   Set up Incoming Webhooks for target channels OR register an Azure AD application for using the Microsoft Graph API (preferred for more complex scenarios or user-specific messages).
    *   Store Redis connection details and Teams Webhook URLs/Graph API credentials securely in the NestJS backend environment (`.env`).
2.  **Backend (NestJS):**
    *   Create a `NotificationsModule`.
    *   Integrate `ioredis` or a similar client for Redis Pub/Sub.
    *   Create a `NotificationsService` responsible for:
        *   Accepting notification requests (event type, data, target user(s)/context).
        *   Formatting a generic notification payload.
        *   Publishing the payload to a relevant Redis channel (e.g., `notifications:new`).
    *   Implement a `NotificationsGateway` (`@nestjs/websockets`):
        *   Handles WebSocket connections and authentication (e.g., associating connections with user IDs).
        *   Subscribes to relevant Redis channels (e.g., `notifications:new`).
        *   Filters received messages based on connected user IDs/context.
        *   Pushes messages via WebSocket to the appropriate connected client(s).
    *   Implement a `TeamsNotificationConsumer` (could be a Service, a Queue Processor if combined with BullMQ later, or integrated listener):
        *   Subscribes to the same Redis channels (e.g., `notifications:new`).
        *   Formats the generic payload into a Teams message (e.g., Adaptive Card JSON).
        *   Determines the target Teams Webhook URL or Graph API endpoint based on the notification context.
        *   Sends the message to Teams using `axios` or a dedicated Graph API client library. Handles Teams API responses/errors.
    *   Implement API endpoints for WebSocket authentication/setup if needed.
    *   Add notification persistence logic (e.g., the `NotificationsService` or a dedicated subscriber writes to the database *after* publishing to Redis).
3.  **Frontend (React):**
    *   Use a WebSocket client library (e.g., `socket.io-client`).
    *   Establish a WebSocket connection upon user login/app initialization, handling authentication.
    *   Listen for incoming notification events via the WebSocket.
    *   Implement UI components to display notifications (e.g., toast messages, notification dropdown/panel).
    *   **No FCM/Service Worker/Push Token logic needed.**
4.  **Microsoft Teams:**
    *   Ensure channels exist or bot permissions are granted as needed for the integration method chosen.

**Verification Checkpoint:**
*   Does the design support in-app WebSocket delivery? (Yes)
*   Does the design support Microsoft Teams delivery? (Yes)
*   Is complexity managed? (Yes, by decoupling via Redis)
*   Is it platform-adaptable (Dev/Prod)? (Yes, via Docker/Env Vars for Redis & Teams config)
*   Is it scalable? (Yes, Redis pub/sub and independent consumers)
*   Is it reliable? (Yes, decoupling helps; Teams API error handling needed)
*   Is persistence included? (Yes, guideline included)
*   **Are mobile/web push components correctly excluded? (Yes)**

🎨🎨🎨 **EXITING CREATIVE PHASE** 

---

## CAPTCHA Integration (Login & Password Reset)

**Component Description:**
Implement CAPTCHA verification (Google reCAPTCHA v2/v3 or Cloudflare Turnstile) to protect sensitive public-facing forms, primarily Login and Forgot Password, against automated bots.

**Requirements & Constraints:**
1.  **Security:** Provide effective bot protection for specified forms.
2.  **User Experience:** Choose a CAPTCHA method that minimizes friction for legitimate users (e.g., invisible reCAPTCHA v3 or Cloudflare Turnstile are generally less intrusive than v2 checkboxes).
3.  **Target Forms:** Initially implement on Login (`/login`) and Forgot Password (`/forgot-password` - or its future equivalent).
4.  **Technology:** Integrate with the chosen CAPTCHA provider (Google or Cloudflare).
5.  **Configuration:** Site keys (frontend) and secret keys (backend) must be configurable via environment variables.

**Decision Point: CAPTCHA Provider**
*   **Google reCAPTCHA:** Industry standard, offers v2 (checkbox/invisible) and v3 (score-based invisible).
    *   Pros: Widely known, robust.
    *   Cons: V3 requires score threshold tuning, potential privacy concerns for some users.
*   **Cloudflare Turnstile:** Newer alternative, focuses on privacy and user experience (often invisible, non-interactive challenges).
    *   Pros: Generally better privacy, often less intrusive UX, easy integration.
    *   Cons: Newer than reCAPTCHA.
*   **Recommendation:** **Cloudflare Turnstile** is often preferred for better UX and privacy, unless there's a strong reason to use Google reCAPTCHA. We will proceed assuming Turnstile, but the implementation steps are similar for reCAPTCHA.

**Implementation Guidelines:**
1.  **Infrastructure & Setup:**
    *   Sign up for the chosen service (e.g., Cloudflare Turnstile).
    *   Register the site, obtaining a Site Key (for frontend) and a Secret Key (for backend).
    *   Add keys to frontend and backend environment variables (`.env`):
        *   Frontend: `REACT_APP_TURNSTILE_SITE_KEY` (or `REACT_APP_RECAPTCHA_SITE_KEY`)
        *   Backend: `TURNSTILE_SECRET_KEY` (or `RECAPTCHA_SECRET_KEY`)
2.  **Backend (NestJS):**
    *   Add an HTTP client module (e.g., `@nestjs/axios`) if not already present.
    *   Create a `CaptchaService`:
        *   Inject `HttpService` and `ConfigService`.
        *   Implement a `verifyToken(token: string): Promise<boolean>` method.
        *   Inside `verifyToken`, make a POST request to the CAPTCHA provider's verification endpoint (e.g., `https://challenges.cloudflare.com/turnstile/v0/siteverify`) including the `secretKey` and the `token` received from the frontend.
        *   Parse the response and return `true` if verification succeeded, `false` otherwise. Handle potential errors.
    *   Inject `CaptchaService` into the `AuthService` (or relevant controllers/services handling login and password reset requests).
    *   Modify the DTOs for login (`LoginDto`) and password reset (`ForgotPasswordDto`) to include the CAPTCHA token field (e.g., `captchaToken: string`).
    *   In the login and password reset handler methods:
        *   Call `captchaService.verifyToken(dto.captchaToken)`.
        *   If verification fails, throw an `UnauthorizedException` or `BadRequestException`.
        *   Only proceed with the authentication/password reset logic if verification passes.
3.  **Frontend (React):**
    *   Choose a library for integration (e.g., `react-turnstile` for Cloudflare or `react-google-recaptcha` for Google).
    *   Add the CAPTCHA widget component to the Login form (`src/pages/Login.tsx`) and the (future) Forgot Password form.
    *   Configure the widget with the Site Key from environment variables.
    *   On form submission:
        *   Retrieve the CAPTCHA token provided by the widget.
        *   Include this token in the payload sent to the backend API (e.g., in the `LoginDto`).
    *   Handle cases where the CAPTCHA fails on the frontend (e.g., display an error, prevent submission).

**Verification Checkpoint:**
*   Is CAPTCHA present on Login and Forgot Password forms? (To be verified after implementation)
*   Does the backend verify the token before processing the request? (To be verified)
*   Are keys stored securely in environment variables? (Yes, guideline)
*   Is the chosen CAPTCHA method reasonably user-friendly? (Yes, assuming Turnstile/reCAPTCHA v3) 

---

## Two-Factor Authentication (2FA/TSV) Completion

**Component Description:**
Complete and enforce Two-Factor Authentication (primarily using Time-based One-Time Passwords - TOTP via authenticator apps) for user login to enhance account security.

**Requirements & Constraints:**
1.  **Enforcement:** If a user has enabled 2FA, the login process MUST require a valid TOTP code after successful password verification.
2.  **Setup:** Users must be able to enable 2FA via their profile/settings page. This involves generating a secret, displaying it as a QR code (compatible with Google Authenticator, Authy, etc.), and verifying an initial TOTP code.
3.  **Disable:** Users must be able to disable 2FA from their settings (requiring a current TOTP code for confirmation).
4.  **Recovery Codes:** Generate and display a set of single-use recovery codes when 2FA is enabled. Provide a mechanism to use a recovery code during login if the authenticator device is unavailable. Store recovery codes securely (e.g., hashed).
5.  **Method:** Focus on TOTP authenticator apps as the primary method. Email-based 2FA (existing code suggests it might be partially implemented) should be reviewed and potentially deprecated or made a secondary option due to lower security.
6.  **Security:** Secrets and recovery codes must be handled and stored securely.

**Analysis of Existing Code:**
*   **Backend:** API endpoints exist in `/settings` for status check, setup (incl. QR code generation), verification, and possibly sending email codes. An endpoint `/auth/forgot-password` exists.
*   **Frontend:** `AuthService` handles login with an optional `verificationCode`. `settings.ts` service interacts with backend 2FA endpoints. `Login.tsx` includes a dialog to prompt for a 2FA code *after* initial login attempt if indicated by the backend (`need_2fa: true`).
*   **Gaps:**
    *   Backend login enforcement seems missing/split (relies on frontend to call verify). Login flow should be unified.
    *   Recovery code generation, storage, display, and usage are missing.
    *   Password reset flow beyond initiating the request is likely missing.
    *   Clarity needed on the reliability/security/completeness of the email 2FA path.

**Implementation Guidelines:**
1.  **Backend (NestJS - primarily `AuthModule`, `UsersModule`/`ProfileModule`):**
    *   **User Entity:** Ensure the `User` entity has fields like `isTwoFactorEnabled: boolean`, `twoFactorSecret: string` (encrypted), `hashedRecoveryCodes: string[]` (or similar structure).
    *   **AuthService (`login` method):**
        *   After successful password validation, check `user.isTwoFactorEnabled`.
        *   If `false`, complete login, return token.
        *   If `true`, **DO NOT** return the final auth token yet. Instead, return a response indicating 2FA is required (e.g., `{ twoFactorRequired: true, userId: user.id }` or a temporary 2FA token).
        *   **Remove** the `need_2fa: true` flag logic if it relies on the frontend making a separate verification call *after* getting a preliminary token.
    *   **AuthService (New `login2FA` method):**
        *   Accepts `userId` (or the temporary 2FA token) and the `verificationCode` (which could be a TOTP code or a recovery code).
        *   Verify the TOTP code against the user's `twoFactorSecret` OR check if the code is a valid, unused recovery code (and mark it as used).
        *   If verification succeeds, generate and return the final authentication token.
        *   If verification fails, throw `UnauthorizedException`.
    *   **Profile/Settings Service (`enable2FA` method):**
        *   Generate a new `twoFactorSecret` using a library like `otplib`.
        *   Generate a QR code data URL using the secret and user identifier (e.g., `otpauth://totp/YourAppName:user@example.com?secret=YOURSECRET&issuer=YourAppName`).
        *   Generate a set of recovery codes (e.g., 10 codes, 8-10 digits/chars each).
        *   Hash the recovery codes before storing them on the `User` entity.
        *   Return the `secret`, QR code URL, and the **plain text** recovery codes to the frontend **only during this initial setup step**. (Emphasize to the user these must be saved securely).
        *   **DO NOT** save `isTwoFactorEnabled = true` yet.
    *   **Profile/Settings Service (New `confirm2FA` method):**
        *   Accepts the `verificationCode` provided by the user after scanning the QR code.
        *   Verify the code against the *pending* `twoFactorSecret` stored temporarily (e.g., in cache or on the user object before final save).
        *   If valid, save `isTwoFactorEnabled = true`, store the (encrypted) `twoFactorSecret`, store the hashed recovery codes, and confirm success.
    *   **Profile/Settings Service (`disable2FA` method):**
        *   Accepts the current `verificationCode`.
        *   Verify the code against the user's active `twoFactorSecret`.
        *   If valid, set `isTwoFactorEnabled = false`, clear the secret and recovery codes.
    *   **Review/Refactor Email 2FA:** Decide whether to keep or remove the existing `/settings/send_2fa_code` logic. If kept, ensure it's clearly distinct and potentially less emphasized than TOTP.
    *   **Password Reset:** Implement the full flow: generate secure reset token, email it, provide an endpoint/page to verify the token and set a new password. Enforce 2FA during password reset if it was enabled.
2.  **Frontend (React):**
    *   **Login Page (`Login.tsx`):**
        *   Adjust the `onSubmit` handler. If the backend response indicates `twoFactorRequired: true`, *then* show the `show2FADialog`.
        *   The `onSubmit2FA` handler should now call the new backend `login2FA` endpoint, sending the `userId` and the `verificationCode`.
        *   Add UI elements to allow entering a recovery code instead of a TOTP code in the 2FA dialog.
    *   **Settings/Profile Page:**
        *   Implement the UI flow for enabling 2FA: button to start, display QR code and secret, show recovery codes (with strong warnings to save them), input field for initial verification code, confirm/cancel buttons.
        *   Call backend `enable2FA` to get QR/codes, then `confirm2FA` after user enters the first code.
        *   Implement UI flow for disabling 2FA: button, prompt for current TOTP code, call backend `disable2FA`.
        *   (Optional) Add a way to view/regenerate recovery codes (requires current password/2FA verification).
    *   **Password Reset Page:** Create the missing `ForgotPassword.tsx` and potentially `ResetPassword.tsx` pages to handle the token verification and new password form.

**Verification Checkpoint:**
*   Is 2FA enforced during login if enabled? (To be verified)
*   Can users successfully enable TOTP 2FA (QR code + initial verify)? (To be verified)
*   Are recovery codes generated, displayed securely during setup, and usable for login? (To be verified)
*   Can users disable 2FA using a current code? (To be verified)
*   Is the login flow secure (no token leakage before 2FA step)? (To be verified)
*   Is the password reset flow complete and secure? (To be verified) 

---

## Comprehensive Role-Based Access Control (RBAC) System

**Component Description:**
Implement a flexible and centralized Role-Based Access Control (RBAC) system allowing administrators to manage user roles and their associated permissions for accessing different features, data scopes, and pages within the application.

**Requirements & Constraints:**
1.  **Centralized Management:** Admins need a dedicated UI section to manage roles and permissions.
2.  **Roles:** Define distinct roles (e.g., 'Standard User', 'Department Manager', 'Administrator'). Admins should be able to Create, Read, Update, and Delete roles (except potentially core system roles like 'Super Admin').
3.  **Permissions:** Define granular permissions for specific actions (e.g., `task:create`, `user:edit`, `page:view:admin_dashboard`).
4.  **Role-Permission Mapping:** Admins must be able to assign/revoke permissions to/from roles.
5.  **User-Role Assignment:** Admins must be able to assign one (or potentially multiple) roles to users.
6.  **Enforcement:** Access control must be enforced consistently on the backend (API endpoints) and reflected on the frontend (UI elements, page access).
7.  **Granularity:** Permissions should cover:
    *   **Actions:** Create, Read, Update, Delete (CRUD) on major entities (Tasks, Notes, Users, Departments, Provinces, etc.).
    *   **Data Scope:** Access to own data, data within their department, or all data.
    *   **Page/Feature Access:** Visibility of specific pages (e.g., Admin sections, Settings) and UI components.
8.  **Extensibility:** The system should allow adding new permissions as the application grows.

**Proposed Architecture:**
1.  **Database Schema:**
    *   `roles` table: `id`, `name` (unique), `description`, `is_system_role` (boolean, prevents deletion).
    *   `permissions` table: `id`, `name` (unique, e.g., `task:create`), `description`, `group` (e.g., 'Tasks', 'Users', 'Admin'). (Start with a predefined list, potentially allow dynamic creation later).
    *   `role_permissions` table: `role_id` (FK to roles), `permission_id` (FK to permissions). (Many-to-Many).
    *   `users` table: Modify to include a foreign key `role_id` (if single role per user) OR create a `user_roles` table (`user_id`, `role_id`) for many-to-many relationship.
2.  **Backend (NestJS):**
    *   **Entities:** Create TypeORM entities for `Role`, `Permission`, `RolePermission`.
    *   **RBAC Module:** Create an `RbacModule` containing services, controllers (for admin management), and guards.
    *   **PermissionService:** Logic to check if a user (via their role(s)) has a specific permission.
    *   **RoleService:** CRUD operations for roles and managing their permissions.
    *   **Guards (`RolesGuard`, `PermissionsGuard`):** Implement `CanActivate` guards.
        *   `RolesGuard`: Checks if the user has *at least one* of the specified roles.
        *   `PermissionsGuard`: Uses `PermissionService` to check if the user has *all* specified permissions.
    *   **Decorators (`@Roles(...)`, `@Permissions(...)`):** Custom decorators to apply the guards easily to controllers and route handlers.
    *   **Integration:** Apply guards to relevant API endpoints. Inject `PermissionService` into other services for fine-grained data access checks within business logic (e.g., checking `task:edit:all` vs `task:edit:own` within `TasksService`).
3.  **Admin Panel UI (Frontend - React):**
    *   **Role Management Page:** Table displaying roles, buttons for Add/Edit/Delete. Form for creating/editing roles (name, description).
    *   **Permission Assignment UI:** (e.g., within Role Edit form) A checklist or multi-select component displaying all available permissions (grouped by `permission.group`), allowing admins to assign/revoke permissions for the selected role.
    *   **User Management Page:** Update the user edit form to include a dropdown/multi-select for assigning roles to the user.
4.  **Frontend Enforcement:**
    *   **Fetch Permissions:** After login, fetch the user's roles and the aggregated list of permissions associated with those roles. Store this in the auth state (e.g., Redux slice).
    *   **Conditional Rendering:** Create a hook (e.g., `usePermissions`) or component to check if the current user has specific permissions. Use this to show/hide buttons, menu items, or other UI elements.
    *   **Route Guards:** Enhance `PrivateRoute` or create new route components that check for required roles/permissions before rendering a page/route.

**Key Permissions to Define (Initial List - Expand as needed):**
*   **Tasks:** `task:create`, `task:view:own`, `task:view:department`, `task:view:all`, `task:edit:own`, `task:edit:department`, `task:edit:all`, `task:delete:own`, `task:delete:department`, `task:delete:all`, `task:assign`, `task:change_status`
*   **Notes:** `note:add`, `note:view`, `note:edit:own`, `note:delete:own`
*   **Departments:** `department:create`, `department:view`, `department:edit`, `department:delete`, `department:assign_users`
*   **Users:** `user:create`, `user:view:profile`, `user:view:list`, `user:edit:own_profile`, `user:edit:any`, `user:delete`, `user:assign_role`, `user:manage_2fa:own`, `user:manage_2fa:any`
*   **Provinces:** `province:create`, `province:view`, `province:edit`, `province:delete`
*   **Settings:** `settings:view:system`, `settings:edit:system`
*   **Admin Panel:** `page:view:admin_dashboard`, `page:view:user_management`, `page:view:department_management`, `page:view:role_management`, `page:view:activity_logs`, `page:view:backup_restore`, `page:view:recycle_bin`
*   **RBAC Management:** `role:create`, `role:edit`, `role:delete`, `permission:assign` (Assign permissions *to* roles)

**Implementation Guidelines:**
1.  **Backend First:** Implement the database schema changes, entities, RBAC module, services, and core guard logic.
2.  **Define Initial Data:** Seed the database with core permissions and default roles (e.g., 'Super Admin' with all permissions, 'Standard User' with basic task/note permissions).
3.  **Apply Guards:** Start applying `@Permissions` or `@Roles` decorators to backend controllers/handlers.
4.  **Frontend Admin UI:** Build the admin panel sections for managing roles and permissions.
5.  **Frontend Enforcement:** Implement the permission fetching on login and the `usePermissions` hook/component for conditional rendering.
6.  **Refactor Existing Checks:** Gradually replace hardcoded role checks (`if user.role === 'admin'`) with permission-based checks using the new system.

**Verification Checkpoint:**
*   Can Admins create/edit/delete roles? (To be verified)
*   Can Admins assign/revoke permissions to roles? (To be verified)
*   Can Admins assign roles to users? (To be verified)
*   Is access to API endpoints correctly restricted by permissions/roles? (To be verified)
*   Are UI elements (buttons, menus) shown/hidden based on user permissions? (To be verified)
*   Is page access controlled based on permissions/roles? (To be verified)
*   Does the system handle users with potentially multiple roles (if implemented)? (To be verified) 