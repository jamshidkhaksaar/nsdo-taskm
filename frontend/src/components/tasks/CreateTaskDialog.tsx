import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert,
  Typography
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TaskService } from '@/services/task';
import { Task, TaskStatus, TaskPriority, TaskType, CreateTask, Department } from '@/types/index';
import { Province } from '@/types/province';
import useReferenceData from '@/hooks/useReferenceData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { User } from '@/types/user';
import { AuthUser } from '@/types/auth';
import { selectAuthUser } from '@/store/slices/authSlice';
import { glassmorphismCardStyle } from '@/utils/glassmorphismStyles';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialStatus?: TaskStatus;
  initialType?: TaskType;
  dialogType: 'create' | 'assign';
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  initialStatus = TaskStatus.PENDING,
  initialType = TaskType.USER,
  dialogType,
}) => {
  const { users, departments, provinces, loading: loadingRefData } = useReferenceData();
  const { error: formError, handleError, clearError: clearFormError } = useErrorHandler();
  const currentUser = useSelector(selectAuthUser) as AuthUser | null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>(initialType);
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>([]);
  const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>([]);
  const [assignedToProvinceId, setAssignedToProvinceId] = useState<string | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>(departments);

  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority(TaskPriority.MEDIUM);
      setStatus(initialStatus);
      setTaskType(initialType);
      setAssignedToUserIds([]);
      setAssignedToDepartmentIds([]);
      setAssignedToProvinceId(null);
      setAvailableDepartments(departments);
      clearFormError();
      setLoading(false);
    }
  }, [open, initialStatus, initialType, departments, clearFormError]);

  useEffect(() => {
    if (taskType === TaskType.PROVINCE_DEPARTMENT && assignedToProvinceId) {
        const filtered = departments.filter(d => d.provinceId === assignedToProvinceId);
        setAvailableDepartments(filtered);
        setAssignedToDepartmentIds(prev => prev.filter(deptId => filtered.some(d => d.id === deptId)));
    } else {
        setAvailableDepartments(departments);
    }
  }, [assignedToProvinceId, taskType, departments]);

  const handleSubmit = async () => {
    clearFormError();
    if (!title) {
      handleError('Title is required.');
      return;
    }
    if (taskType === TaskType.USER && assignedToUserIds.length === 0 && dialogType !== 'create' && initialType !== TaskType.PERSONAL) {
      handleError('Please select at least one user to assign the task to.');
      return;
    }
    if ((taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) && assignedToDepartmentIds.length === 0) {
        handleError('Please select at least one department to assign the task to.');
        return;
    }
     if (taskType === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId) {
        handleError('Please select a province when assigning to a province/department.');
        return;
    }

    if (!currentUser?.id) {
      handleError('Unable to identify the current user. Please log in again.');
      setLoading(false);
      return;
    }

    const creatorId = currentUser.id;

    setLoading(true);

    // Revert AGAIN: Do not send createdById, as the backend DTO forbids it.
    // Backend service MUST handle setting it from the authenticated user.
    const newTaskPayload: Omit<CreateTask, 'status' | 'type' | 'createdById'> = {
      title,
      description,
      priority,
      dueDate: dueDate ? dayjs(dueDate).toISOString() : undefined,
      assignedToUserIds: taskType === TaskType.USER ? assignedToUserIds : undefined,
      assignedToDepartmentIds: (taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) ? assignedToDepartmentIds : undefined,
      assignedToProvinceId: taskType === TaskType.PROVINCE_DEPARTMENT ? assignedToProvinceId : undefined,
    };

    console.log("Submitting new task:", newTaskPayload);
    try {
      // Pass the payload which no longer includes createdById
      await TaskService.createTask(newTaskPayload);
      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      const backendError = err.response?.data?.message || err.message;
      handleError(backendError || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => (
        <>
          <TextField autoFocus margin="dense" label="Task Title" type="text" fullWidth variant="outlined" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={loading} sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' } }} InputLabelProps={{ shrink: true }} />
          <TextField margin="dense" label="Description" type="text" fullWidth multiline rows={4} variant="outlined" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} sx={{ textarea: { color: 'text.primary' }, label: { color: 'text.secondary' } }} InputLabelProps={{ shrink: true }} />
          <FormControl fullWidth margin="dense" disabled={loading || dialogType === 'assign'}>
            <InputLabel sx={{ color: 'text.secondary' }}>Task Type</InputLabel>
            <Select value={taskType} label="Task Type" onChange={(e) => setTaskType(e.target.value as TaskType)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                <MenuItem value={TaskType.PERSONAL}>Personal Task</MenuItem>
                <MenuItem value={TaskType.USER}>Assign to User(s)</MenuItem>
                <MenuItem value={TaskType.DEPARTMENT}>Assign to Department(s)</MenuItem>
                <MenuItem value={TaskType.PROVINCE_DEPARTMENT}>Assign to Province Department(s)</MenuItem>
            </Select>
          </FormControl>
          {loadingRefData ? <CircularProgress size={20} sx={{ display: 'block', margin: '10px auto' }} /> : <>
              {taskType === TaskType.PROVINCE_DEPARTMENT && (
                  <FormControl fullWidth margin="dense" disabled={loading}>
                      <InputLabel sx={{ color: 'text.secondary' }}>Province</InputLabel>
                      <Select value={assignedToProvinceId || ''} label="Province" onChange={(e) => setAssignedToProvinceId(e.target.value as string)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                          <MenuItem value=""><em>None</em></MenuItem>
                          {provinces.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                      </Select>
                  </FormControl>
              )}
              {(taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) && (
                  <FormControl fullWidth margin="dense" disabled={loading || (taskType === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId)}>
                      <InputLabel sx={{ color: 'text.secondary' }}>Department(s)</InputLabel>
                      <Select multiple value={assignedToDepartmentIds} onChange={(e) => setAssignedToDepartmentIds(e.target.value as string[])} label="Department(s)" renderValue={(selected) => selected.map(id => departments.find(d => d.id === id)?.name || id).join(', ')} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                          {availableDepartments.map((dept) => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
                      </Select>
                  </FormControl>
              )}
              {taskType === TaskType.USER && (
                  <FormControl fullWidth margin="dense" disabled={loading}>
                      <InputLabel sx={{ color: 'text.secondary' }}>Assign to User(s)</InputLabel>
                      <Select multiple value={assignedToUserIds} onChange={(e) => setAssignedToUserIds(e.target.value as string[])} label="Assign to User(s)" renderValue={(selected) => selected.map(id => { const u = users.find(usr => usr.id === id); return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username : id; }).join(', ')} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                          {users.map((user) => <MenuItem key={user.id} value={user.id}>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username} ({user.email})</MenuItem>)}
                      </Select>
                  </FormControl>
              )}
          </>}
          <FormControl fullWidth margin="dense" disabled={loading}>
            <InputLabel sx={{ color: 'text.secondary' }}>Priority</InputLabel>
            <Select value={priority} label="Priority" onChange={(e) => setPriority(e.target.value as TaskPriority)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" disabled={loading}>
            <InputLabel sx={{ color: 'text.secondary' }}>Status</InputLabel>
            <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as TaskStatus)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                <MenuItem value={TaskStatus.PENDING}>Pending</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
              label="Due Date"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              sx={{
                width: '100%', mt: 1,
                '& .MuiInputBase-root': { color: 'text.primary' },
                '& .MuiInputBase-input': { color: 'text.primary' },
                '& .MuiInputLabel-root': { color: 'text.secondary' },
                 '& .MuiSvgIcon-root': { color: 'text.secondary' }
            }}
          />
          {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
          )}
      </>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    ...glassmorphismCardStyle,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                }
            }}
        >
            <DialogTitle sx={{ color: '#fff' }}>
               {taskType === TaskType.PERSONAL ? 'Create Personal Task' :
                dialogType === 'create' ? 'Create New Task' : 'Assign Task'}
            </DialogTitle>
            <DialogContent>
                {renderFormContent()}
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px'}}>
                <Button onClick={onClose} disabled={loading} sx={{ color: '#ccc' }}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Create Task'}
                </Button>
            </DialogActions>
        </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTaskDialog;









