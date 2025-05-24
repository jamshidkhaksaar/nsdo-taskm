import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, Button, 
  CircularProgress, 
} from '@mui/material';
import dayjs, { Dayjs } from 'dayjs';
import { TaskService } from '@/services/task';
import { TaskStatus, TaskPriority, TaskType, CreateTask } from '@/types/index';
import useReferenceData from '@/hooks/useReferenceData';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { selectAuthUser } from '@/store/slices/authSlice';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  initialStatus?: TaskStatus;
  initialType?: TaskType;
  dialogType: 'create' | 'assign';
  initialAssignedUserIds?: string[];
  initialAssignedDepartmentIds?: string[];
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  open,
  onClose,
  onTaskCreated,
  initialStatus = TaskStatus.PENDING,
  initialType = TaskType.USER,
  dialogType,
  initialAssignedUserIds = [],
  initialAssignedDepartmentIds = [],
}) => {
  const { users } = useReferenceData();
  const { error: formError, handleError, clearError: clearFormError } = useErrorHandler();
  const currentUser = useSelector(selectAuthUser);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>(initialType);
  const [assignedToUserIds, setAssignedToUserIds] = useState<string[]>(initialAssignedUserIds);
  const [assignedToDepartmentIds, setAssignedToDepartmentIds] = useState<string[]>(initialAssignedDepartmentIds);
  const [assignedToProvinceId, setAssignedToProvinceId] = useState<string | null>(null);
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  const isAssignmentFixed = dialogType === 'assign' && 
    (initialAssignedUserIds.length > 0 || initialAssignedDepartmentIds.length > 0);
  
  const isPersonalOnly = initialType === TaskType.PERSONAL && !isAssignmentFixed;

  const resetForm = useCallback(() => {
    if (open && !isFormInitialized) {
      setTitle('');
      setDescription('');
      setDueDate(null);
      setPriority(TaskPriority.MEDIUM);
      setLoading(false);
      clearFormError();

      let determinedTaskType = initialType;

      if (dialogType === 'assign') {
        if (initialAssignedUserIds.length > 0) {
          determinedTaskType = TaskType.USER;
        } else if (initialAssignedDepartmentIds.length > 0) {
          determinedTaskType = TaskType.DEPARTMENT;
        }
      }
      setTaskType(determinedTaskType);

      setAssignedToUserIds(initialAssignedUserIds);
      setAssignedToDepartmentIds(initialAssignedDepartmentIds);
      
      setAssignedToProvinceId(null);

      if (!isAssignmentFixed) {
        setAssignedToUserIds([]);
        setAssignedToDepartmentIds([]);
      }
      
      setIsFormInitialized(true);
    }
  }, [
    open, 
    isFormInitialized, 
    dialogType, 
    initialType, 
    initialAssignedUserIds, 
    initialAssignedDepartmentIds, 
    clearFormError,
    isAssignmentFixed
  ]);

  useEffect(() => {
    resetForm();
    
    if (!open) {
      setIsFormInitialized(false);
    }
  }, [open, resetForm]);

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

    const creatorId = currentUser?.id;
    if (!creatorId) {
      handleError('Unable to identify the current user. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);

    const newTaskPayload: Omit<CreateTask, 'status' | 'createdById'> = {
      title,
      description,
      priority,
      type: taskType,
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









