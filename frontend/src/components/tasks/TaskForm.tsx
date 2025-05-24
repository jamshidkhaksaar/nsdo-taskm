import React, { useState, useEffect } from 'react';
// Import from the consolidated index file
import { Task, TaskStatus, TaskPriority, TaskType, CreateTask, TaskUpdate, User, Department, Province, UpdateTaskAssignmentsDto } from '../../types/index';
// Assuming addTask/updateTask service functions expect types defined in index.ts
import { addTask, updateTask, updateTaskAssignments } from '../../services/tasks.service';
// Import User and Department if needed for assignment dropdowns
import { getUsers } from '../../services/users.service';
import { getDepartments } from '../../services/departments.service';
import { getProvinces } from '../../services/provinces.service';

interface TaskFormProps {
  task: Task | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Use TaskStatus from index.ts (e.g., PENDING)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  // Use TaskPriority from index.ts (e.g., MEDIUM)
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<string | null>(null);
  // Use TaskType from index.ts (e.g., PERSONAL)
  const [type, setType] = useState<TaskType>(TaskType.PERSONAL);
  
  // --- New State for Assignments ---
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>([]);
  const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>([]);
  const [assignedToProvinceId, setAssignedToProvinceId] = useState<string | null>(null);

  // --- State for Dropdown Data ---
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingDropdownData, setLoadingDropdownData] = useState<boolean>(true);

  const [initialType, setInitialType] = useState<TaskType | null>(null);
  const [initialAssignedToUserIds, setInitialAssignedToUserIds] = useState<string[]>([]);
  const [initialAssignedToDepartmentIds, setInitialAssignedToDepartmentIds] = useState<string[]>([]);
  const [initialAssignedToProvinceId, setInitialAssignedToProvinceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingDropdownData(true);
      try {
        const usersData = await getUsers(); 
        const departmentsData = await getDepartments();
        const provincesData = await getProvinces();
        setUsers(usersData.data);
        setDepartments(departmentsData);
        setProvinces(provincesData);
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
        setError("Failed to load selection data. Some options may be unavailable.");
      } finally {
        setLoadingDropdownData(false);
      }
    };

    fetchData();

    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : null);
      setType(task.type);
      
      const currentAssignedUsers = task.assignedToUsers?.map(u => u.id) || [];
      const currentAssignedDepts = task.assignedToDepartments?.map(d => d.id) || [];
      const currentAssignedProv = task.assignedToProvinceId || null;

      setAssignedToUserIds(currentAssignedUsers);
      setAssignedToDepartmentIds(currentAssignedDepts);
      setAssignedToProvinceId(currentAssignedProv);

      // Store initial assignment state for comparison on submit
      setInitialType(task.type);
      setInitialAssignedToUserIds(currentAssignedUsers);
      setInitialAssignedToDepartmentIds(currentAssignedDepts);
      setInitialAssignedToProvinceId(currentAssignedProv);

    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setStatus(TaskStatus.PENDING);
      setPriority(TaskPriority.MEDIUM);
      setDueDate(null);
      setType(TaskType.PERSONAL);
      setAssignedToUserIds([]);
      setAssignedToDepartmentIds([]);
      setAssignedToProvinceId(null);
      setInitialType(null);
      setInitialAssignedToUserIds([]);
      setInitialAssignedToDepartmentIds([]);
      setInitialAssignedToProvinceId(null);
    }
  }, [task]);

  const handleTypeChange = (newType: TaskType) => {
    setType(newType);
    // When type changes, clear out existing selections to avoid sending mixed/invalid data
    setAssignedToUserIds([]);
    setAssignedToDepartmentIds([]);
    setAssignedToProvinceId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (task) { // Editing existing task
        // Prepare DTO for updating assignments
        const assignmentData: UpdateTaskAssignmentsDto = {};
        let assignmentsChanged = false;

        // Only include fields in DTO if they have changed or are part of the current task type logic
        if (type !== initialType) assignmentsChanged = true;
        
        if (type === TaskType.USER) {
          if (JSON.stringify(assignedToUserIds.sort()) !== JSON.stringify(initialAssignedToUserIds.sort())) assignmentsChanged = true;
          assignmentData.assignedToUserIds = assignedToUserIds;
        } else {
          assignmentData.assignedToUserIds = []; // Ensure it's cleared if not USER type
        }

        if (type === TaskType.DEPARTMENT) {
          if (JSON.stringify(assignedToDepartmentIds.sort()) !== JSON.stringify(initialAssignedToDepartmentIds.sort())) assignmentsChanged = true;
          assignmentData.assignedToDepartmentIds = assignedToDepartmentIds;
          assignmentData.assignedToProvinceId = null; // Explicitly set province to null
        } else if (type === TaskType.PROVINCE_DEPARTMENT) {
          if (JSON.stringify(assignedToDepartmentIds.sort()) !== JSON.stringify(initialAssignedToDepartmentIds.sort()) || assignedToProvinceId !== initialAssignedToProvinceId) assignmentsChanged = true;
          assignmentData.assignedToDepartmentIds = assignedToDepartmentIds;
          assignmentData.assignedToProvinceId = assignedToProvinceId;
        } else {
          assignmentData.assignedToDepartmentIds = []; // Clear if not relevant type
          assignmentData.assignedToProvinceId = null;
        }
        
        if (type === TaskType.PERSONAL) { // Handle if changed to PERSONAL
             // assignmentsChanged is already true if type changed to PERSONAL
            assignmentData.assignedToUserIds = [];
            assignmentData.assignedToDepartmentIds = [];
            assignmentData.assignedToProvinceId = null;
        }

        // For now, we assume if the form is submitted in edit mode, it's for assignments.
        // A more robust solution would compare if *any* assignment related field changed.
        // The current logic for `assignmentsChanged` is a basic check.
        if (assignmentsChanged) {
            console.log("Submitting assignment changes:", assignmentData);
            await updateTaskAssignments(task.id, assignmentData);
            alert('Task assignments updated successfully');
        } else {
            // Optionally, if only non-assignment fields changed, call the original updateTask
            // For this iteration, we focus on assignments. If no assignment changes, maybe alert user or do nothing.
            const basicDataChanged = title !== task.title || description !== task.description || 
                                   status !== task.status || priority !== task.priority || 
                                   (dueDate ? new Date(dueDate).toISOString().split('T')[0] : null) !== (task.dueDate ? task.dueDate.split('T')[0] : null);
            if (basicDataChanged) {
                const updatePayload: TaskUpdate = { title, description, status, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : null };
                await updateTask(task.id, updatePayload);
                alert('Task details updated successfully');
            } else {
                 alert('No changes detected to update.');
            }
        }

      } else { // Creating new task
        const formattedDueDate = dueDate ? new Date(dueDate).toISOString() : null;
        // Ensure required fields for addTask service are definitely present
        const createPayload: CreateTask & { status: TaskStatus; priority: TaskPriority } = {
          title,
          description,
          status: status, // status is from state, will always be a TaskStatus
          priority: priority, // priority is from state, will always be a TaskPriority
          type,
          dueDate: formattedDueDate,
          assignedToUserIds: type === TaskType.USER ? assignedToUserIds : undefined,
          assignedToDepartmentIds: (type === TaskType.DEPARTMENT || type === TaskType.PROVINCE_DEPARTMENT) ? assignedToDepartmentIds : undefined,
          assignedToProvinceId: type === TaskType.PROVINCE_DEPARTMENT ? assignedToProvinceId : undefined,
        };
        console.log("### createPayload before addTask:", JSON.stringify(createPayload, null, 2)); // Added for debugging
        await addTask(createPayload as Omit<Task, "id" | "createdAt" | "updatedAt" | "createdById">); // Cast might still be needed if CreateTask has extra fields not in Task
        alert('Task added successfully');
      }
      onSuccess();
    } catch (err: any) {
      const message = err.message || 'An unknown error occurred';
      setError(task ? `Failed to update task: ${message}` : `Failed to add task: ${message}`);
      console.error(err);
      // alert(error); // alert(message) might be better
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {task ? 'Edit Task' : 'Add New Task'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={TaskStatus.PENDING}>Pending</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
                <option value={TaskStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              id="dueDate"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value || null)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="taskType" className="block text-sm font-medium text-gray-700">Task Type</label>
            <select
              id="taskType"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as TaskType)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={TaskType.PERSONAL}>Personal (Self-assigned)</option>
              <option value={TaskType.USER}>Assign to User(s)</option>
              <option value={TaskType.DEPARTMENT}>Assign to Department(s)</option>
              <option value={TaskType.PROVINCE_DEPARTMENT}>Assign to Provincial Department(s)</option>
            </select>
          </div>

          {/* Conditional Assignment Fields */}
          {loadingDropdownData && <p>Loading assignment options...</p>}

          {type === TaskType.USER && !loadingDropdownData && (
            <div className="mb-4">
              <label htmlFor="assignedToUserIds" className="block text-sm font-medium text-gray-700">Assign to Users</label>
              <select
                multiple
                id="assignedToUserIds"
                value={assignedToUserIds}
                onChange={(e) => setAssignedToUserIds(Array.from(e.target.selectedOptions, option => option.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.username} ({user.email})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple users.</p>
            </div>
          )}

          {type === TaskType.DEPARTMENT && !loadingDropdownData && (
            <div className="mb-4">
              <label htmlFor="assignedToDepartmentIds" className="block text-sm font-medium text-gray-700">Assign to Departments</label>
              <select
                multiple
                id="assignedToDepartmentIds"
                value={assignedToDepartmentIds}
                onChange={(e) => setAssignedToDepartmentIds(Array.from(e.target.selectedOptions, option => option.value))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple departments.</p>
            </div>
          )}
          
          {type === TaskType.PROVINCE_DEPARTMENT && !loadingDropdownData && (
            <div className="space-y-4 p-3 border border-dashed border-gray-300 rounded-md">
              <div>
                <label htmlFor="assignedToProvinceId" className="block text-sm font-medium text-gray-700">Assign to Province</label>
                <select
                  id="assignedToProvinceId"
                  value={assignedToProvinceId || ''}
                  onChange={(e) => {
                    const newProvinceId = e.target.value || null;
                    setAssignedToProvinceId(newProvinceId);
                    // When province changes, clear selected departments from other provinces
                    // Only keep departments that belong to the newly selected province, if any were already selected
                    const currentlySelectedDeptsInNewProvince = departments
                        .filter(dept => dept.provinceId === newProvinceId && assignedToDepartmentIds.includes(dept.id))
                        .map(dept => dept.id);
                    setAssignedToDepartmentIds(currentlySelectedDeptsInNewProvince);
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">-- Select Province --</option>
                  {provinces.map(prov => (
                    <option key={prov.id} value={prov.id}>{prov.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignedToDepartmentIdsProv" className="block text-sm font-medium text-gray-700">
                  Assign to Departments (in {provinces.find(p=>p.id === assignedToProvinceId)?.name || 'selected province'})
                </label>
                <select
                  multiple
                  id="assignedToDepartmentIdsProv"
                  value={assignedToDepartmentIds}
                  onChange={(e) => setAssignedToDepartmentIds(Array.from(e.target.selectedOptions, option => option.value))}
                  disabled={!assignedToProvinceId}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {departments
                    .filter(dept => dept.provinceId === assignedToProvinceId)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {!assignedToProvinceId && <p className="text-xs text-gray-500">Please select a province first.</p>}
                {assignedToProvinceId && departments.filter(dept => dept.provinceId === assignedToProvinceId).length === 0 && (
                  <p className="text-xs text-yellow-600">No departments found for the selected province.</p>
                )}
                 <p className="text-xs text-gray-500">Hold Ctrl/Cmd to select multiple departments.</p>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <div className="flex items-center justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={loading || loadingDropdownData}
            >
              {loading ? (task ? 'Updating...' : 'Adding...') : (task ? 'Save Changes' : 'Add Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm; 