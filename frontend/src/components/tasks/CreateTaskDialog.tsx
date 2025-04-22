import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert,
  Typography, Chip
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
  initialAssignedUserIds?: string[];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  initialStatus = TaskStatus.PENDING,
  initialType = TaskType.USER,
  dialogType,
  initialAssignedUserIds = [],
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
  const derivedInitialType = dialogType === 'assign' && initialAssignedUserIds.length > 0 ? TaskType.USER : initialType;
  const [taskType, setTaskType] = useState<TaskType>(derivedInitialType);
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>(initialAssignedUserIds);
  const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>([]);
  const [assignedToProvinceId, setAssignedToProvinceId] = useState<string | null>(null);
  const [availableDepartments, setAvailableDepartments] = useState<Department[]>(departments);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const isAssignmentFixed = dialogType === 'assign' && initialAssignedUserIds.length > 0;
  const isPersonalOnly = initialType === TaskType.PERSONAL && !isAssignmentFixed;

  const resetForm = useCallback(() => {
    if (!isFormInitialized && open) {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority(TaskPriority.MEDIUM);
      setStatus(initialStatus);
      setLoading(false);
      clearFormError();

      const resetType = isAssignmentFixed ? TaskType.USER : initialType;
      setTaskType(resetType);

      if (!isAssignmentFixed) {
          setAssignedToUserIds([]);
          setAssignedToDepartmentIds([]);
          setAssignedToProvinceId(null);
          setAvailableDepartments(departments);
      } else {
          setAssignedToUserIds(initialAssignedUserIds);
          setAssignedToDepartmentIds([]);
          setAssignedToProvinceId(null);
      }
      
      setIsFormInitialized(true);
    }
  }, [open, initialStatus, initialType, departments, clearFormError, dialogType, initialAssignedUserIds, isAssignmentFixed, isFormInitialized]);

  useEffect(() => {
    resetForm();
    
    // Reset the initialization flag when dialog closes
    if (!open) {
      setIsFormInitialized(false);
    }
  }, [open, resetForm]);

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
    if (taskType === TaskType.USER && assignedToUserIds.length === 0 && !isAssignmentFixed) {
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

  const getUserDisplayName = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    if (!user) return userId;
    return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
  };

  const renderFormContent = () => (
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
            disabled={loading} 
            InputLabelProps={{ shrink: true }}
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
            disabled={loading} 
            InputLabelProps={{ shrink: true }}
          />

          {/* Task Type: Hide if assignment is fixed OR if forced personal */}
          {!isAssignmentFixed && !isPersonalOnly && (
              <FormControl fullWidth margin="dense" disabled={loading}>
                <InputLabel sx={{ color: 'text.secondary' }}>Task Type</InputLabel>
                <Select value={taskType} label="Task Type" onChange={(e) => setTaskType(e.target.value as TaskType)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                    <MenuItem value={TaskType.PERSONAL}>Personal Task</MenuItem>
                    <MenuItem value={TaskType.USER}>Assign to User(s)</MenuItem>
                    <MenuItem value={TaskType.DEPARTMENT}>Assign to Department(s)</MenuItem>
                    <MenuItem value={TaskType.PROVINCE_DEPARTMENT}>Assign to Province Department(s)</MenuItem>
                </Select>
              </FormControl>
          )}

          {/* Conditional Assignment Fields Wrapper */}
          {!isPersonalOnly && (
              <>
                  {loadingRefData ? <CircularProgress size={20} sx={{ display: 'block', margin: '10px auto' }} /> : <>
                      {/* Province Dropdown (Only if not fixed assignment AND type is ProvinceDept) */}
                      {taskType === TaskType.PROVINCE_DEPARTMENT && !isAssignmentFixed && (
                          <FormControl fullWidth margin="dense" disabled={loading}>
                              <InputLabel sx={{ color: 'text.secondary' }}>Province</InputLabel>
                              <Select value={assignedToProvinceId || ''} label="Province" onChange={(e) => setAssignedToProvinceId(e.target.value as string)} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                                  <MenuItem value=""><em>None</em></MenuItem>
                                  {provinces.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                              </Select>
                          </FormControl>
                      )}
                      {/* Department Dropdown (Only if not fixed assignment AND type is Dept or ProvinceDept) */}
                      {(taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) && !isAssignmentFixed && (
                          <FormControl fullWidth margin="dense" disabled={loading || (taskType === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId)}>
                              <InputLabel sx={{ color: 'text.secondary' }}>Department(s)</InputLabel>
                              <Select multiple value={assignedToDepartmentIds} onChange={(e) => setAssignedToDepartmentIds(e.target.value as string[])} label="Department(s)" renderValue={(selected) => selected.map(id => departments.find(d => d.id === id)?.name || id).join(', ')} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                                  {availableDepartments.map((dept) => <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>)}
                              </Select>
                          </FormControl>
                      )}
                      {/* User Assignment (Only if type is USER) */}
                      {taskType === TaskType.USER && (
                          isAssignmentFixed ? (
                              <Box sx={{ mt: 1, mb: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>Assigned To:</Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {assignedToUserIds.map(userId => (
                                          <Chip key={userId} label={getUserDisplayName(userId)} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', color: '#fff' }} />
                                      ))}
                                  </Box>
                              </Box>
                          ) : (
                              <FormControl fullWidth margin="dense" disabled={loading}>
                                  <InputLabel sx={{ color: 'text.secondary' }}>Assign to User(s)</InputLabel>
                                  <Select multiple value={assignedToUserIds} onChange={(e) => setAssignedToUserIds(e.target.value as string[])} label="Assign to User(s)" renderValue={(selected) => selected.map(getUserDisplayName).join(', ')} sx={{ '& .MuiSelect-select': { color: 'text.primary' }, svg: { color: 'text.secondary' } }}>
                                      {users.map((user) => <MenuItem key={user.id} value={user.id}>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username} ({user.email})</MenuItem>)}
                                  </Select>
                              </FormControl>
                          )
                      )}
                  </>}
              </>
          )}
          {/* --- End of Conditional Assignment Fields Wrapper --- */}
          
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                slotProps={{
                  textField: { 
                    fullWidth: true, 
                    margin: "dense",
                    variant: "outlined",
                    InputLabelProps: { shrink: true }
                  },
                  popper: {
                    style: { zIndex: 9999 }
                  }
                }}
                sx={{
                  width: '100%', 
                  mt: 1, 
                  mb: 1
                }}
            />
          </LocalizationProvider>
          {formError && (
              <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>
          )}
      </>
  );

  return (
    <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={false}
        keepMounted
    >
        <DialogTitle sx={{ color: '#fff' }}>
           {isPersonalOnly ? 'Create Personal Task' :
            isAssignmentFixed ? `Assign Task to ${getUserDisplayName(initialAssignedUserIds[0])}${initialAssignedUserIds.length > 1 ? '...' : ''}` :
            'Create New Task'}
        </DialogTitle>
        <DialogContent>
          <div className="task-create-form" style={{ padding: '10px 0' }}>
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            
            {formError && (
              <div style={{ marginTop: '16px', padding: '10px', backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#f44336', borderRadius: '4px' }}>
                {formError}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px'}}>
            <Button onClick={onClose} disabled={loading} sx={{ color: '#ccc' }}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 
                 isPersonalOnly ? 'Create Task' : 
                 isAssignmentFixed ? 'Assign Task' : 'Create Task'}
            </Button>
        </DialogActions>
    </Dialog>
  );
};

export default CreateTaskDialog;









