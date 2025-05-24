Product Requirements Document (PRD) for Task Creation and Notification System
1. Introduction
This PRD outlines the requirements for the task creation and notification system within the Task Manager application. The focus is on the logic and functionality related to task creation, assignment, delegation, deletion, and notifications. The system will integrate with the existing Dashboard, which includes a "Task List" tab with predefined task categories, and will support additional pages such as Departments, Users, Provinces, and Tasks Overview. A future "Board View" tab will be referenced but not fully detailed, as its implementation is deferred.
2. Objectives

Enable users to create and assign tasks to themselves, other users, departments, and provincial departments, with appropriate visibility in the Dashboard.
Implement task delegation with creator approval and clear status tracking.
Provide a secure deletion process with reason logging and recycle bin integration.
Deliver real-time notifications and email alerts for task-related activities.
Ensure role-based access control (RBAC) aligns with the admin panel visualizer for seamless permission management.
Support a user-friendly interface consistent with the existing app design (as per the screenshot).

3. Scope
3.1 In-Scope

Task creation logic for personal tasks, user-assigned tasks, department tasks, and provincial department tasks.
Task assignment and delegation workflows with approval mechanisms.
Task deletion with reason requirements and recycle bin functionality.
Notification and email system for task updates.
Integration with the Dashboard "Task List" tab and supporting pages (Departments, Users, Provinces, Tasks Overview).
Access control and visibility rules based on user roles (User, Leadership, Admin).

3.2 Out-of-Scope

Full implementation of the "Board View" tab (to be addressed later).
Non-task-related features (e.g., user profile management beyond task assignment).
Detailed UI/UX design beyond task creation and notification logic.

4. System Overview
4.1 Dashboard - Task List Tab
The Dashboard includes a "Task List" tab with the following categories:

My Personal Tasks: Tasks created by the user for themselves.
Tasks Assigned to Me: Tasks assigned to the user by others.
Department Tasks: Tasks assigned to the user’s department.
Tasks I Created/Assigned: Tasks created or assigned by the user to others, departments, or provinces.
Tasks Delegated to Me: Tasks delegated to the user by others.
Tasks I Delegated: Tasks the user has delegated to others.

4.2 Other Pages

Departments: For assigning tasks to one or multiple departments.
Users: For assigning tasks to one or multiple users.
Provinces: For assigning tasks to multiple provinces and their departments.
Tasks Overview: A leadership-focused page for monitoring task performance (includes deleted and delegated task tabs).

4.3 Board View Tab

A Kanban-style tab to be implemented later, allowing users to manage their own tasks and delegated tasks (noted for future reference).

5. Functional Requirements
5.1 Task Creation and Assignment
5.1.1 Personal Tasks

Description: Users can create tasks for themselves.
Process: Users initiate task creation from the Dashboard "Task List" tab via a "+ Add Task" button or similar UI element, filling a dialog with task details (e.g., title, description, due date).
Visibility: Tasks appear in "My Personal Tasks" for the creator.

5.1.2 Tasks Assigned to Users

Description: Users can assign tasks to one or multiple other users.
Process:
Navigate to the "Users" page.
Select one or multiple users from a list (e.g., via checkboxes).
Open a dialog to input task details and assign the task.


Visibility:
Tasks appear in "Tasks Assigned to Me" for each assignee.
Tasks appear as a single entry in "Tasks I Created/Assigned" for the creator, regardless of the number of assignees.


Dialog Details: Clicking the task in "Tasks I Created/Assigned" opens a dialog showing individual statuses (e.g., "John: In Progress, Erik: Pending, Rike: Completed, Chris: Delegated to Mike").

5.1.3 Department Tasks

Description: Users can assign tasks to one or multiple departments.
Process:
Navigate to the "Departments" page.
Select one or multiple departments from a list.
Open a dialog to input task details and assign the task.


Visibility:
Tasks appear in "Department Tasks" for members of the selected departments.
Tasks appear as a single entry in "Tasks I Created/Assigned" for the creator.



5.1.4 Provincial Department Tasks

Description: Users can assign tasks to multiple provinces and their departments.
Process:
Navigate to the "Provinces" page.
Select multiple provinces, then select departments within each province.
Open a dialog to input task details and assign a single task to all selected entities.


Visibility:
Tasks appear as a single entry in "Tasks I Created/Assigned" for the creator.
Clicking the task opens a dialog showing statuses per province and department (e.g., "Kabul - Finance: In Progress, Herat - HR: Completed").


Note: Tasks are visible in "Department Tasks" for members of the selected provincial departments.

5.1.5 Task Status Tracking

Single Entry Rule: A task assigned to multiple users, departments, or provincial departments appears only once in "Tasks I Created/Assigned" to avoid duplication.
Dialog Information: The task dialog displays detailed statuses for all assignees (users, departments, or provincial departments) to indicate progress.

5.2 Task Delegation

Description: Users can delegate tasks assigned to them to other users (not departments).
Process:
From "Tasks Assigned to Me" or "Tasks Delegated to Me," users select a task and choose to delegate it.
A dialog prompts for a reason for delegation and the target user.
The task creator receives a notification and email to approve or reject the delegation request.


Visibility:
Upon approval, the task appears in "Tasks Delegated to Me" for the delegatee and "Tasks I Delegated" for the delegator.


Restrictions:
Departments cannot delegate tasks to other departments.
Delegation requires task creator approval, with the reason logged in the task dialog.



5.3 Task Deletion

Personal Tasks:
Users can delete their own tasks from "My Personal Tasks."
A dialog requires a reason for deletion.
Deleted tasks move to the recycle bin.


Assigned Tasks:
Only the task creator can delete tasks from "Tasks I Created/Assigned" (assigned to users, departments, or provinces).
A dialog requires a reason for deletion.
Deleted tasks move to the recycle bin.


Restrictions:
Assignees (users or department members) cannot delete tasks assigned to them.


Recycle Bin:
Accessible via the "Tasks Overview" page for Leadership and Admin roles.
Admins can restore deleted tasks.



5.4 Notifications and Emails

Triggers:
Task status changes (e.g., Pending to In Progress, Completed).
Delegation requests and approvals/rejections.
Deletion requests with reasons.
Comments added to tasks.


Recipients:
Task creator receives notifications and emails for all updates to their tasks.
Assignees and delegatees receive relevant updates (e.g., assignment, delegation approval).


Content:
Includes task title, status, reason (if applicable), and action links (e.g., approve/reject delegation).



5.5 Tasks Overview Page

Purpose: For Leadership roles to monitor task performance.
Tabs:
Pending, In Progress, Completed: Displays tasks with filters by user, department, or province.
Deleted Tasks: Fetches data from the recycle bin, showing deletion reasons.
Delegated Tasks: Shows who assigned tasks to whom (including provinces/departments) and delegation reasons.


Features:
Statistics and performance metrics (e.g., task completion rates).
Clickable names (users, departments, provinces) for detailed views.


UI/UX: Comprehensive design with charts, filters, and a clean layout.

5.6 Board View Tab (Future Reference)

Description: A Kanban-style tab for users to manage their own tasks.
Visibility: Users see only "My Personal Tasks," "Tasks Delegated to Me," and "Department Tasks."
Actions:
Move personal tasks between Pending, In Progress, and Completed.
Cancel/delete personal tasks with a reason (moves to recycle bin).
Move delegated tasks to In Progress or Completed; cancellation requires creator approval with a reason.


Dialog: Clicking a task opens a dialog with details and actions based on task type.

6. Access Control (RBAC)
6.1 Roles and Permissions

User Role:
Pages: Dashboard, Departments, Users, Provinces.
Visibility: Own tasks ("My Personal Tasks," "Tasks Assigned to Me," "Tasks Delegated to Me," "Tasks I Delegated"), created/assigned tasks ("Tasks I Created/Assigned"), and own department tasks ("Department Tasks").


Leadership Role:
Pages: Dashboard, Departments, Users, Provinces, Tasks Overview.
Visibility: All tasks via "Tasks Overview"; same task management capabilities as User role elsewhere.


Admin Role:
Pages: Full access to all pages and functionalities.
Visibility: All tasks across all levels.



6.2 RBAC Integration

Permissions must synchronize with the admin panel visualizer to enforce role-based access accurately.

7. UI/UX Considerations

Design Inspiration: Based on the provided screenshot of the Dashboard "Task List" tab:
Dark theme with gradient backgrounds and white text.
Left sidebar navigation (Dashboard, Departments, Users, Provinces, Tasks Overview, Admin Panel).
Task categories with icons and counts (e.g., "Tasks Assigned to Me - 2").
"+ Add Task" buttons for task creation.


Key Elements:
Intuitive dialogs for task creation, assignment, delegation, and deletion (with reason fields).
Clear status indicators in task dialogs (e.g., "John: In Progress").
Comprehensive "Tasks Overview" page with charts and filters for leadership.



8. Non-Functional Requirements

Performance: Task creation and list loading should complete within 2 seconds.
Scalability: Support 10,000+ users and tasks.
Security: RBAC enforcement to prevent unauthorized access or actions.
Usability: Consistent, intuitive navigation and feedback aligned with the screenshot’s design.

9. Acceptance Criteria

Users can create personal tasks that appear in "My Personal Tasks."
Tasks assigned to users appear in "Tasks Assigned to Me" and as a single entry in "Tasks I Created/Assigned" with detailed statuses in the dialog.
Department tasks appear in "Department Tasks" and "Tasks I Created/Assigned."
Provincial department tasks appear as a single entry in "Tasks I Created/Assigned" with dialog details.
Delegation requires creator approval, with tasks appearing in "Tasks Delegated to Me" and "Tasks I Delegated" upon approval.
Only creators can delete assigned tasks, and users can delete personal tasks, with reasons logged and tasks moved to the recycle bin.
Notifications and emails are sent for all task updates.
Access controls restrict visibility per role, with Leadership seeing all tasks in "Tasks Overview."

10. Appendix

Screenshot Reference: The provided image of the Dashboard "Task List" tab informs the UI design and task category layout.
Future Work: Implement the "Board View" tab with Kanban functionality post-initial release.

