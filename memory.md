# Memory of Changes Made

## 2023-05-15: Implemented Task Assignment Enhancement Frontend

### Changes Made
- Updated Task types in `frontend/src/types/task.ts` to match backend implementation
- Created new Provinces page in `frontend/src/pages/Provinces.tsx` for province-department task assignment
- Enhanced CreateTaskDialog component to support province selection and multiple department selection
- Improved TaskViewDialog component with better task delegation UI
- Updated TaskService to support the new delegation API endpoint

### Status
- Frontend implementation for task assignment enhancement is complete
- The UI now supports all four assignment contexts: Personal, Department, User-to-User, and Province-Department
- Task delegation functionality is implemented

### Next Steps
- Test the changes by creating tasks in different contexts
- Verify that task delegation works correctly

## 2025-04-13: Fixed Dashboard Task Lists Display Issue

### Problem
In the Dashboard's Task Lists tab, the "Created By" and "Assigned To" fields were not showing the correct information because the backend was not loading the related entities when retrieving tasks.

### Solution
Modified the `findAll` and `findOne` methods in `backend-nest\src\tasks\tasks.service.ts` to load the necessary relations:
- Added `leftJoinAndSelect` for 'createdBy', 'assignedToUsers', and 'department' relations in the `findAll` method
- Added `relations: ['createdBy', 'assignedToUsers', 'department']` to the `findOne` method

This ensures that when tasks are retrieved from the database, the related user and department information is also loaded, allowing the frontend to display the correct "Created By" and "Assigned To" information.

### Status
The changes have been implemented and the backend server has been restarted. The existing tasks in the database don't have the `createdById` field populated (it's null), which is why they still don't show the "Created By" information. However, newly created tasks should now correctly show both the "Created By" and "Assigned To" information.

### Next Steps
Test the changes by creating a new task and verifying that the "Created By" and "Assigned To" fields are properly populated.
