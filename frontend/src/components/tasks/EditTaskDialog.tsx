import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TaskService } from '@/services/task';
import { Task, TaskStatus, TaskPriority, TaskType } from '@/types/task'; // Import Task types
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
          setAssignedToUserIds(taskDetails.assignedToUsers?.map(u => u.id) ?? taskDetails.assigned_to ?? []);
          setAssignedToDepartmentIds(taskDetails.assignedToDepartmentIds ?? []);
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
      dueDate: (dueDate ? dayjs(dueDate).toISOString() : null) !== task.dueDate ? (dueDate ? dayjs(dueDate).toISOString() : null) : undefined,
      // Include assignee updates if they differ from the original task
      assignedToUserIds: task.type === TaskType.USER && JSON.stringify(assignedToUserIds) !== JSON.stringify(task.assignedToUsers?.map(u=>u.id) ?? task.assigned_to ?? []) ? assignedToUserIds : undefined,
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

  const renderFormContent = () => {
      if (loadingFetch) return <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>;
      if (fetchError) return <Alert severity="error" sx={{ mt: 2 }}>{fetchError}</Alert>;
      if (!task) return <Typography sx={{ mt: 2 }}>Loading task data...</Typography>; // Should be brief

      return (
          <>
            <TextField
                autoFocus
                margin="dense"
                label="Task Title"
                type="text"
                fullWidth
                variant="outlined"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loadingUpdate}
            />
            <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loadingUpdate}
            />

            {/* Assume Task Type is not editable */}
            <TextField
                margin="dense"
                label="Task Type"
                type="text"
                fullWidth
                variant="outlined"
                value={task.type || 'N/A'}
                disabled
                InputLabelProps={{ shrink: true }}
            />

            {/* Conditional Assignment Fields (similar to Create Dialog) */}
             {loadingRefData ? <CircularProgress size={20} sx={{ display: 'block', margin: '10px auto' }} /> : <>
                {task.type === TaskType.PROVINCE_DEPARTMENT && (
                    <FormControl fullWidth margin="dense" disabled={loadingUpdate}> 
                        <InputLabel>Province</InputLabel>
                        <Select /* ... options ... */ value={assignedToProvinceId || ''} onChange={(e) => setAssignedToProvinceId(e.target.value as string)} />
                    </FormControl>
                )}
                {(task.type === TaskType.DEPARTMENT || task.type === TaskType.PROVINCE_DEPARTMENT) && (
                    <FormControl fullWidth margin="dense" disabled={loadingUpdate || (task.type === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId)}>
                        <InputLabel>Department(s)</InputLabel>
                        <Select multiple /* ... options ... */ value={assignedToDepartmentIds} onChange={(e) => setAssignedToDepartmentIds(e.target.value as string[])} />
                    </FormControl>
                )}
                {task.type === TaskType.USER && (
                    <FormControl fullWidth margin="dense" disabled={loadingUpdate}>
                        <InputLabel>Assign to User(s)</InputLabel>
                        <Select multiple /* ... options ... */ value={assignedToUserIds} onChange={(e) => setAssignedToUserIds(e.target.value as string[])} />
                    </FormControl>
                )}
            </>}

            <FormControl fullWidth margin="dense" disabled={loadingUpdate}>
                <InputLabel>Priority</InputLabel>
                <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                    <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                    <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                    <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                </Select>
            </FormControl>

            <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                sx={{ width: '100%', mt: 1 }}
                disabled={loadingUpdate}
            />

            {formError && (
                <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
            )}
        </>
      );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disabled={loadingUpdate}>
            <DialogTitle>Edit Task {taskId ? `(ID: ${taskId})` : ''}</DialogTitle>
            <DialogContent>
                {renderFormContent()}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loadingUpdate}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={loadingUpdate || loadingFetch || !task}>
                    {loadingUpdate ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    </LocalizationProvider>
  );
};

export default EditTaskDialog; 