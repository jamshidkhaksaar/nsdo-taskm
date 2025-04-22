import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Typography
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TaskService } from '@/services/task';
import { Task, TaskStatus, TaskPriority, TaskType, Department } from '@/types/index'; // Import Task types
import useReferenceData from '@/hooks/useReferenceData'; // For assignee selectors
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface EditTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskUpdated: () => void; // Callback after successful update
  taskId: string | null;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({ open, onClose, onTaskUpdated, taskId }) => {

  const { users, departments, provinces, loading: loadingRefData } = useReferenceData();
  const { error: formError, handleError, clearError: clearFormError } = useErrorHandler();

  // Task Data State
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  // Note: Status might not be editable here by the creator? Plan implies only assignee changes status.
  // const [status, setStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  // Note: Task Type is likely not editable after creation.
  // const [taskType, setTaskType] = useState<TaskType>(TaskType.USER);

  // Assignment State (only relevant if assignees are editable by creator)
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>([]);
  const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>([]);
  const [assignedToProvinceId, setAssignedToProvinceId] = useState<string | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>(departments);

  // Loading/Error State
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch Task Details
  useEffect(() => {
    if (open && taskId) {
      const fetchDetails = async () => {
        setLoadingFetch(true);
        setFetchError(null);
        clearFormError();
        setTask(null);
        try {
          const taskDetails = await TaskService.getTaskDetails(taskId);
          setTask(taskDetails);
          // Initialize form state
          setTitle(taskDetails.title || '');
          setDescription(taskDetails.description || '');
          setPriority(taskDetails.priority || TaskPriority.MEDIUM);
          setDueDate(taskDetails.dueDate ? dayjs(taskDetails.dueDate) : null);
          // setStatus(taskDetails.status || TaskStatus.PENDING);
          // setTaskType(taskDetails.type || TaskType.USER);

          // Initialize assignment state based on fetched task
          setAssignedToUserIds((taskDetails.assignedToUsers?.map(u => String(u.id)) ?? (taskDetails.assignedToUserIds ?? [])).map(String));
          setAssignedToDepartmentIds((taskDetails.assignedToDepartmentIds ?? []).map(String));
          setAssignedToProvinceId(taskDetails.assignedToProvinceId ?? null);

        } catch (err: any) {
          console.error("[EditTaskDialog] Fetch error:", err);
          setFetchError(`Failed to load task details: ${err.message || 'Unknown error'}`);
        } finally {
          setLoadingFetch(false);
        }
      };
      fetchDetails();
    } else {
        // Reset when closing or taskId is null
        setTask(null);
        setTitle('');
        // ... reset other fields
    }
  }, [open, taskId, clearFormError]);
  
  // Update available departments when province changes (same as Create dialog)
  useEffect(() => {
    if (task?.type === TaskType.PROVINCE_DEPARTMENT && assignedToProvinceId) {
        const filtered = departments.filter(d => d.provinceId === assignedToProvinceId);
        setAvailableDepartments(filtered);
        setAssignedToDepartmentIds(prev => prev.filter(deptId => filtered.some(d => d.id === deptId)));
    } else {
        setAvailableDepartments(departments);
    }
  }, [assignedToProvinceId, task?.type, departments]);

  const handleSave = async () => {
    if (!task || !taskId) return;

    clearFormError();
    if (!title) {
      handleError('Title is required.');
      return;
    }
    // Add other validation as needed (e.g., for assignees based on type)

    setLoadingUpdate(true);

    const updatedData: Partial<Task> = {
      title: title !== task.title ? title : undefined,
      description: description !== task.description ? description : undefined,
      priority: priority !== task.priority ? priority : undefined,
      dueDate: 
        // Convert both values to ISO string or null for comparison
        (dueDate ? dayjs(dueDate).format('YYYY-MM-DD') : null) !== 
        (task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : null) 
          ? (dueDate ? dayjs(dueDate).toISOString() : null) 
          : undefined,
      // Include assignee updates if they differ from the original task
      assignedToUserIds: task.type === TaskType.USER && JSON.stringify(assignedToUserIds) !== JSON.stringify(task.assignedToUsers?.map(u=>u.id) ?? task.assignedToUserIds ?? []) ? assignedToUserIds : undefined,
      assignedToDepartmentIds: (task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) && JSON.stringify(assignedToDepartmentIds) !== JSON.stringify(task.assignedToDepartmentIds ?? []) ? assignedToDepartmentIds : undefined,
      assignedToProvinceId: task.type === TaskType.PROVINCE_DEPARTMENT && assignedToProvinceId !== task.assignedToProvinceId ? assignedToProvinceId : undefined,
    };

    // Remove undefined fields (only send changed data)
    Object.keys(updatedData).forEach(key => updatedData[key as keyof Partial<Task>] === undefined && delete updatedData[key as keyof Partial<Task>]);

    if (Object.keys(updatedData).length === 0) {
        console.log("[EditTaskDialog] No changes detected.");
        setLoadingUpdate(false);
        onClose(); // Close if no changes
        return;
    }

    console.log("[EditTaskDialog] Submitting updates:", updatedData);

    try {
      await TaskService.updateTaskDetails(taskId, updatedData);
      onTaskUpdated(); // Notify parent to refresh
      onClose();
    } catch (err: any) {
      console.error('[EditTaskDialog] Update error:', err);
      handleError(`Failed to update task: ${err.message || 'Unknown error'}`);
    } finally {
      setLoadingUpdate(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={false}
      keepMounted
    >
        <DialogTitle>Edit Task {taskId ? `(ID: ${taskId})` : ''}</DialogTitle>
        <DialogContent>
          {loadingFetch ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
          ) : fetchError ? (
            <Alert severity="error" sx={{ mt: 2 }}>{fetchError}</Alert>
          ) : !task ? (
            <Typography sx={{ mt: 2 }}>Loading task data...</Typography>
          ) : (
            <div className="task-edit-form" style={{ padding: '10px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="task-title" style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                  Task Title *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff'
                  }}
                  disabled={loadingUpdate}
                  required
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="task-description" style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                  Description
                </label>
                <textarea
                  id="task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff'
                  }}
                  disabled={loadingUpdate}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="task-type" style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                  Task Type
                </label>
                <input
                  id="task-type"
                  type="text"
                  value={task.type || 'N/A'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: '#ccc'
                  }}
                  disabled
                  readOnly
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="task-priority" style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff'
                  }}
                  disabled={loadingUpdate}
                >
                  <option value={TaskPriority.LOW}>Low</option>
                  <option value={TaskPriority.MEDIUM}>Medium</option>
                  <option value={TaskPriority.HIGH}>High</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="task-due-date" style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>
                  Due Date
                </label>
                <input
                  id="task-due-date"
                  type="date"
                  value={dueDate ? dueDate.format('YYYY-MM-DD') : ''}
                  onChange={(e) => {
                    const newValue = e.target.value ? dayjs(e.target.value) : null;
                    setDueDate(newValue);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    color: '#fff'
                  }}
                  disabled={loadingUpdate}
                />
              </div>
              
              {formError && (
                <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#f44336', borderRadius: '4px' }}>
                  {formError}
                </div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={loadingUpdate}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={loadingUpdate || loadingFetch || !task}>
                {loadingUpdate ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
        </DialogActions>
    </Dialog>
  );
};

export default EditTaskDialog; 