import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Box, CircularProgress
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { TaskService } from '@/services/task';
import { TaskStatus, TaskPriority, TaskType, Department, CreateTask } from '@/types/index';
import { User } from '@/types/user';
import { Province } from '@/types/province';
import useReferenceData from '../../hooks/useReferenceData';

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
      setLoading(false);
    }
  }, [open, initialStatus, initialType, departments]);

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
    setError(null);
    if (!title) {
      setError('Title is required.');
      return;
    }

    if (taskType === TaskType.USER && assignedToUserIds.length === 0) {
      setError('Please select at least one user to assign the task to.');
      return;
    }
    if ((taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) && assignedToDepartmentIds.length === 0) {
      setError('Please select at least one department to assign the task to.');
      return;
    }
    if (taskType === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId) {
      setError('Please select a province when assigning to a province/department.');
      return;
    }

    setLoading(true);

    const newTask: CreateTask = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? dayjs(dueDate).toISOString() : undefined,
      type: taskType,
      assignedToUserIds: taskType === TaskType.USER ? assignedToUserIds : undefined,
      assignedToDepartmentIds: (taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) ? assignedToDepartmentIds : undefined,
      assignedToProvinceId: taskType === TaskType.PROVINCE_DEPARTMENT ? assignedToProvinceId : undefined,
    };

    console.log("Submitting new task:", newTask);

    try {
      await TaskService.createTask(newTask);
      onTaskCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create task:', err);
      setError(err.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {taskType === TaskType.PERSONAL ? 'Create Personal Task' :
            dialogType === 'create' ? 'Create New Task' : 'Assign Task'}
        </DialogTitle>
        <DialogContent>
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
          />

          <FormControl fullWidth margin="dense" disabled={loading || dialogType === 'assign'}>
            <InputLabel>Task Type</InputLabel>
            <Select
              value={taskType}
              label="Task Type"
              onChange={(e) => setTaskType(e.target.value as TaskType)}
            >
              <MenuItem value={TaskType.PERSONAL}>Personal Task</MenuItem>
              <MenuItem value={TaskType.USER}>Assign to User(s)</MenuItem>
              <MenuItem value={TaskType.DEPARTMENT}>Assign to Department(s)</MenuItem>
              <MenuItem value={TaskType.PROVINCE_DEPARTMENT}>Assign to Province Department(s)</MenuItem>
            </Select>
          </FormControl>

          {loadingRefData ? <CircularProgress size={20} sx={{ display: 'block', margin: '10px auto' }} /> : <>
            {taskType === TaskType.PROVINCE_DEPARTMENT && (
              <FormControl fullWidth margin="dense" disabled={loading}>
                <InputLabel>Province</InputLabel>
                <Select
                  value={assignedToProvinceId || ''}
                  label="Province"
                  onChange={(e) => setAssignedToProvinceId(e.target.value as string)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {provinces.map((province) => (
                    <MenuItem key={province.id} value={province.id}>{province.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {(taskType === TaskType.DEPARTMENT || taskType === TaskType.PROVINCE_DEPARTMENT) && (
              <FormControl fullWidth margin="dense" disabled={loading || (taskType === TaskType.PROVINCE_DEPARTMENT && !assignedToProvinceId)}>
                <InputLabel>Department(s)</InputLabel>
                <Select
                  multiple
                  value={assignedToDepartmentIds}
                  onChange={(e) => setAssignedToDepartmentIds(e.target.value as string[])}
                  label="Department(s)"
                  renderValue={(selected) => selected.map(id => departments.find(d => d.id === id)?.name || id).join(', ')}
                >
                  {availableDepartments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {taskType === TaskType.USER && (
              <FormControl fullWidth margin="dense" disabled={loading}>
                <InputLabel>Assign to User(s)</InputLabel>
                <Select
                  multiple
                  value={assignedToUserIds}
                  onChange={(e) => setAssignedToUserIds(e.target.value as string[])}
                  label="Assign to User(s)"
                  renderValue={(selected) => selected.map(id => {
                    const user = users.find(u => u.id === id);
                    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : id;
                  }).join(', ')}
                >
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username} ({user.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </>}

          <FormControl fullWidth margin="dense" disabled={loading}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
              <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
              <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" disabled={loading}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <MenuItem value={TaskStatus.PENDING}>Pending</MenuItem>
            </Select>
          </FormControl>
          <DatePicker
            label="Due Date"
            value={dueDate}
            onChange={(newValue, context) => setDueDate(newValue)}
            sx={{ width: '100%', mt: 1 }}
            disabled={loading}
          />

          {error && (
            <Box sx={{ color: 'error.main', mt: 2 }}>{error}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateTaskDialog; 