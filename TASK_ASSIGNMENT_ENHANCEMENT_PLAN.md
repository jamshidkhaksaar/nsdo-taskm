# Task Assignment Enhancement Plan

## Overview

This plan details the enhanced, flexible task assignment system for the organization's Task Management App. The goal is a robust, role-driven workflow combining clear permissions, precise task targeting, and traceable delegation. Key features include:
- Four distinct task assignment contexts: Personal (from Dashboard), Department (from Departments page), User-to-User (from Users page), and Province-Department (from Provinces page).
- Admin management of Provinces and their associated Departments.
- A centralized Dashboard for users to view created, assigned, and delegated tasks.
- Specific functionalities for Department Heads to manage tasks assigned to their department.
- Clearly defined permissions for task creators and assignees.

---

## 1. Data Model Changes (Database Schema)

- **Province Entity**
  - `id`: Primary Key
  - `name`: String
  - `description`: Text (Optional)
- **Department Entity**
  - `id`: Primary Key
  - `name`: String
  - `description`: Text (Optional)
  - `provinceId`: Foreign Key referencing `Province.id` (nullable, or a dedicated 'General' province if needed)
- **User Entity** (Assuming exists)
  - `id`: Primary Key
  - `name`: String
  - `departmentId`: Foreign Key referencing `Department.id` (for department head logic)
  - `role`: Enum/String (e.g., 'Admin', 'User', 'DepartmentHead')
- **Task Entity**
  - `id`: Primary Key
  - `title`: String
  - `description`: Text
  - `type`: Enum ('personal', 'department', 'user', 'province_department') - *Reflects assignment context*
  - `status`: Enum ('Pending', 'In Progress', 'Completed', 'Cancelled') - *Assignee can change to 'In Progress', 'Completed'*
  - `priority`: Enum ('Low', 'Medium', 'High') - *Assignee can change*
  - `dueDate`: DateTime (Optional)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
  - `createdByUserId`: Foreign Key referencing `User.id` (The Creator/Assigner)
  - `assignedToUserIds`: Array of User IDs (for 'user' type tasks, potentially for delegation)
  - `assignedToDepartmentIds`: Array of Department IDs (for 'department' and 'province_department' types)
  - `assignedToProvinceId`: Foreign Key referencing `Province.id` (for 'province_department' type)
  - `delegatedFromTaskId`: Foreign Key referencing `Task.id` (Nullable, points to the original task if this is a delegated copy/subtask)
  - `delegatedByUserId`: Foreign Key referencing `User.id` (Nullable, user who delegated it)
  - `isDelegated`: Boolean (Indicates if task results from delegation)

*Note: The dashboard labels will be computed dynamically in the backend/frontend based on these fields.*

---

## 2. Backend API Changes

- **Admin - Province Management**
  - `POST /api/admin/provinces`: Create province
  - `GET /api/admin/provinces`: List provinces
  - `GET /api/admin/provinces/{id}`: Get province details
  - `PUT /api/admin/provinces/{id}`: Update province
  - `DELETE /api/admin/provinces/{id}`: Delete province
  - `GET /api/admin/provinces/{id}/departments`: List departments in a province
  - `POST /api/admin/provinces/{id}/departments`: Add existing department(s) to a province
  - `DELETE /api/admin/provinces/{provinceId}/departments/{departmentId}`: Remove department from province
- **Admin - Department Management** (Existing CRUD assumed, ensure province linking)
  - `PUT /api/admin/departments/{id}`: Update department (can include setting `provinceId`)
- **Admin - User Management** (Existing CRUD assumed)
  - Ensure user creation/update includes department assignment and role.
- **Task Creation/Assignment**
  - `POST /api/tasks`: Unified endpoint for creating tasks. Request body includes `title`, `description`, `priority`, `dueDate`, and context-specific assignment fields:
    - Personal: Implicitly `createdByUserId` = current user.
    - User: `assignedToUserIds: [userId1, userId2, ...]`
    - Department: `assignedToDepartmentIds: [deptId1, deptId2, ...]`
    - Province-Department: `assignedToProvinceId: provinceId`, `assignedToDepartmentIds: [deptId1, deptId2, ...]` (within that province)
- **Task Viewing/Fetching**
  - `GET /api/tasks/dashboard`: Fetch tasks for the current user's dashboard (includes created, assigned, delegated). Requires logic to compute context labels.
  - `GET /api/tasks/assigned-to-me`: Fetch tasks explicitly assigned to the current user.
  - `GET /api/tasks/created-by-me`: Fetch tasks created by the current user.
  - `GET /api/departments/{id}/tasks`: Fetch tasks assigned to a specific department.
  - `GET /api/users/{id}/tasks`: Fetch tasks assigned to a specific user.
  - `GET /api/provinces/{id}/tasks`: Fetch tasks assigned to departments within a specific province.
- **Task Actions**
  - `GET /api/tasks/{id}`: Get task details.
  - `PUT /api/tasks/{id}`: Edit task (Creator only: title, description, assignees, due date).
  - `PATCH /api/tasks/{id}/status`: Update status (Assignee: 'In Progress', 'Completed').
  - `PATCH /api/tasks/{id}/priority`: Update priority (Assignee only).
  - `POST /api/tasks/{id}/cancel`: Cancel task (Creator only).
  - `DELETE /api/tasks/{id}`: Delete task (Creator only).
- **Delegation**
  - `POST /api/tasks/{id}/delegate`: Delegate a task assigned to the current user (or a Dept Head delegating a dept task) to one or more users. Creates a new linked task or updates delegation fields. Requires careful design.
  - `GET /api/tasks/delegated-by-me`: Tasks the current user has delegated.
  - `GET /api/tasks/delegated-to-me`: Delegated tasks assigned to the current user.

---

## 3. Frontend UI/UX Changes

- **Admin Panel**
  - Section for Province Management (Create, List, Edit, Delete Provinces).
  - Interface within Province Management to view and assign/unassign Departments to a selected Province.
  - Existing Department Management updated to show/edit Province link.
  - Existing User Management updated to show/edit Department and Role.
- **Main Application**
  - **Sidebar Navigation**: Add "Provinces" entry.
  - **Dashboard**:
    - Primary view showing a mix of tasks relevant to the user.
    - Clear labeling/sectioning for:
      - "My Tasks" (Personal tasks created by the user for themselves).
      - "Tasks I Created/Assigned" (Tasks assigned to others/departments/provinces).
      - "Tasks Assigned To Me" (Tasks directly assigned to the user).
      - "Tasks Delegated By Me" (Tasks the user has further assigned).
      - "Tasks Delegated To Me" (Tasks assigned via delegation).
    - Task list items should show key metadata (Title, Assignee(s)/Department(s)/Province, Creator, Status, Priority, Due Date). Exclude description for summary view.
    - Button/Action to create a new "Personal Task".
  - **Departments Page**:
    - List all departments.
    - On selecting department(s), provide an action/button to "Assign Task" to the selected department(s).
    - View tasks assigned to a specific department (requires permissions).
    - *Department Head View*: Show tasks assigned to their department(s). Provide action to delegate a department task to user(s) within their department.
  - **Users Page**:
    - List users (potentially filterable by department).
    - On selecting user(s), provide an action/button to "Assign Task" to the selected user(s).
  - **Provinces Page**:
    - List all provinces.
    - On selecting a province, display its associated departments.
    - Provide an action/button to "Assign Task" to selected department(s) *within that specific province*.
  - **Task Detail View**:
    - Show all task details.
    - Actions based on role:
      - Creator: Edit, Delete, Cancel buttons.
      - Assignee: Edit Priority, Update Status dropdown/buttons ('In Progress', 'Completed').
      - Delegator (Dept Head or User): Delegate button (if applicable).
  - **Task Creation/Assignment Forms**: Context-aware forms depending on where the creation is initiated (Dashboard, Departments, Users, Provinces page) to pre-fill or guide the assignment type.
  - **Delegation UI**: A modal or dedicated view triggered from a task (likely in Task Detail View) allowing the user to select other user(s) to delegate the task to.

---

## 4. Database Migration/Seed Strategy

- Migration 1: Create `Provinces` table.
- Migration 2: Add `provinceId` foreign key column to `Departments` table.
- Migration 3: Modify `Tasks` table: add `type`, `assignedToUserIds`, `assignedToDepartmentIds`, `assignedToProvinceId`, `delegatedFromTaskId`, `delegatedByUserId`, `isDelegated`; potentially rename/adjust existing assignee fields if necessary; update `status` and add `priority` enums/types.
- Seed Script: Populate initial `Provinces` and potentially link existing `Departments`. (Use realistic sample data reflecting organizational structure, NO mock/stub data).

---

## 5. TODO Checklist (Track Progress Here)

### Data Model & Backend
- [x] Define/Implement `Province` entity/model and DB table.
- [x] Add `provinceId` relation to `Department` entity/model and DB table.
- [x] Update `Task` entity/model and DB table for flexible assignment and delegation fields.
- [x] Update `User` entity/model if needed (role, department link).
- [x] Create DB migrations for all schema changes.
- [x] Implement Admin CRUD endpoints for `Province`.
- [x] Implement Admin endpoints for department-province assignment.
- [ ] Update Admin `Department` endpoints for province linking.
- [ ] Implement unified `POST /api/tasks` endpoint for all assignment types.
- [ ] Implement task delegation logic and `POST /api/tasks/{id}/delegate` endpoint.
- [ ] Implement `GET /api/tasks/dashboard` endpoint with context logic.
- [ ] Implement other task fetching endpoints (`/assigned-to-me`, `/created-by-me`, department, user, province tasks).
- [ ] Implement Task Action endpoints (`GET`, `PUT`, `PATCH /status`, `PATCH /priority`, `POST /cancel`, `DELETE`) respecting permissions.
- [ ] Implement Delegation fetch endpoints (`/delegated-by-me`, `/delegated-to-me`).
- [ ] Add backend tests for all new/updated endpoints and logic.

### Frontend
- [ ] Create Admin UI for Province Management.
- [ ] Create Admin UI for Department-Province assignment.
- [ ] Update Admin Department UI for Province link.
- [ ] Add "Provinces" to main sidebar navigation.
- [ ] Implement Provinces Page (List provinces, show departments, assign task action).
- [ ] Update Departments Page (Assign task action, Dept Head view/delegation).
- [ ] Update Users Page (Assign task action).
- [ ] Implement enhanced Dashboard view with distinct sections/labels and personal task creation.
- [ ] Implement context-aware Task Creation forms.
- [ ] Update Task Detail view with role-based actions (Edit, Delete, Cancel, Update Status, Change Priority, Delegate).
- [ ] Implement Task Delegation UI (modal/view).
- [ ] Add frontend tests for new components and workflows.

### General
- [ ] Write/Update user documentation for new features.
- [ ] Update API documentation (Swagger/OpenAPI).
- [ ] Ensure NO mock/stub data is used in implementation for dev/prod. Use realistic seeding if necessary.

---

## 6. Permissions Summary

- **Admin**: Manage Provinces, Departments, Users, Province-Department links.
- **Task Creator**: Create tasks, Edit tasks (content, assignees, due date), Delete tasks, Cancel tasks.
- **Task Assignee**: View task, Change Priority, Update Status ('In Progress', 'Completed').
- **Department Head**: View all tasks assigned to their department, Delegate department tasks to users within their department.
- **User (General)**: Create personal tasks, Assign tasks (based on context pages: Users, Departments, Provinces), View tasks created by them, View tasks assigned to them, View tasks delegated to them, Delegate tasks assigned to them (if allowed).

---

## Progress Tracking

- This file will be updated by marking TODOs as complete `[x]` as features are implemented.