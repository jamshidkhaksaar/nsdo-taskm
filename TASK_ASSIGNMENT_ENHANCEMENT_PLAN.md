# Task Assignment Enhancement Plan

## Overview

This plan describes the new, flexible task assignment system to meet customer needs, including:
- Four types of tasks: user (personal), department/unit, user-to-user (single/multiple), and province/department-in-province.
- Province and department management.
- Province page for task assignment and browsing.
- Task delegation.
- Dashboard labeling for task context.
- Required changes to backend, frontend, and database schema.

---

## 1. Data Model Changes

- **Province Entity**
  - id, name, description
- **Department Entity**
  - Add `provinceId` foreign key (many departments per province)
- **Task Entity**
  - `type`: enum ('user', 'department', 'user_to_user', 'province')
  - `assignedToUserIds`: array of user IDs (for user-to-user and delegation)
  - `assignedToDepartmentIds`: array of department IDs (for department/province tasks)
  - `assignedToProvinceId`: province ID (for province tasks)
  - `delegatedByUserId`: user ID (if delegated)
  - `createdByUserId`: user ID
  - `labels`: computed for dashboard display

---

## 2. Backend API Changes

- **Province Management**
  - CRUD endpoints for provinces
  - Endpoint to assign departments to a province
- **Task Assignment**
  - Flexible task creation endpoint supporting all assignment types
  - Endpoints to fetch tasks by user, department, province, or delegation
  - Endpoint to delegate a task to other users
- **Department Management**
  - CRUD endpoints (already exist, add province assignment)
- **Dashboard APIs**
  - Endpoints to fetch tasks with context labels for dashboard

---

## 3. Frontend UI/UX Changes

- **Settings Page**
  - Manage provinces and assign departments to provinces
- **Province Page**
  - List provinces in sidebar
  - On selecting a province, show departments and allow task assignment to department(s) or the whole province
- **Task Creation**
  - From user dashboard: create personal tasks
  - From department page: assign to department(s)
  - From province page: assign to province or departments in province
  - From user profile or user list: assign to user(s)
- **Delegation**
  - UI for users to delegate tasks assigned to them
- **Dashboard**
  - Show tasks with labels:
    - "Myself" for personal tasks
    - "Assigned by [username]" for tasks assigned to user
    - "Assigned to [department] by myself" for department tasks
    - "Assigned to [province], [departments] by myself" for province tasks
    - "Delegated to [user]" for delegated tasks

---

## 4. Database Migration/Seed Strategy

- Migration to add Province entity and provinceId to Department
- Migration to update Task entity for new assignment fields
- Seed script to create initial provinces and assign departments

---

## 5. TODO Checklist

### Data Model & Backend
- [ ] Add Province entity/model
- [ ] Add provinceId to Department entity/model
- [ ] Update Task entity/model for flexible assignment
- [ ] Create migrations for new/updated entities
- [ ] Implement CRUD endpoints for Province
- [ ] Implement department-province assignment endpoints
- [ ] Update task creation endpoint for all assignment types
- [ ] Implement task delegation endpoint
- [ ] Update dashboard/task fetch endpoints for new labels

### Frontend
- [ ] Create Settings page for province/department management
- [ ] Create Province page with department listing and task assignment
- [ ] Update sidebar to include provinces
- [ ] Update task creation flows for all assignment types
- [ ] Add delegation UI for tasks
- [ ] Update dashboard to show context labels

### General
- [ ] Write/Update documentation for new features
- [ ] Add tests for new backend and frontend logic
- [ ] Update API docs (Swagger/OpenAPI)

---

## 6. Enhancements & Notes

- Consider permissions: who can assign tasks to provinces/departments/users.
- Ensure all assignment types are covered in UI and API.
- Make task assignment flows intuitive and context-aware.
- Allow for future expansion (e.g., multi-province tasks, recurring tasks).

---

## Progress Tracking

- Keep this file updated as features are implemented or requirements change.
- Mark TODOs as complete when done.