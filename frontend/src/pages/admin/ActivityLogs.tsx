import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import AdminLayout from '../../layouts/AdminLayout';
import axios from '../../utils/axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ActivityLog {
  id: string;
  user: string | null;
  action: string;
  target: string;
  timestamp: string;
  ip_address: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

const ActivityLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get auth state from Redux
  const auth = useSelector((state: RootState) => state.auth);

  const getStatusColor = (status: ActivityLog['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const fetchLogs = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (timeRange !== 'all') params.append('time_range', timeRange);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      // Debug logging
      console.log('Auth state:', {
        isAuthenticated: auth.isAuthenticated,
        user: auth.user,
        token: auth.token
      });
      console.log('Making API request to:', `/api/activity-logs/?${params.toString()}`);
      
      const response = await axios.get(`/api/activity-logs/?${params.toString()}`);
      console.log('API Response:', response);
      setLogs(response.data);
    } catch (error: any) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      setError(error.response?.data?.error || 'Failed to fetch activity logs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, timeRange, actionFilter, statusFilter, auth]);

  useEffect(() => {
    if (auth.isAuthenticated && auth.token) {
      fetchLogs();
    } else {
      console.log('Not authenticated or missing token');
    }
  }, [fetchLogs, auth.isAuthenticated, auth.token]);

  const handleDeleteLog = async (logId: string) => {
    try {
      await axios.delete(`/api/activity-logs/${logId}/`);
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLogs.length === 0) return;

    try {
      await axios.post('/api/activity-logs/bulk_delete/', {
        log_ids: selectedLogs
      });
      setSelectedLogs([]);
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.post('/api/activity-logs/delete_all/');
      await fetchLogs();
    } catch (error) {
      console.error('Error deleting all logs:', error);
    }
  };

  return (
    <AdminLayout>
      <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
        Activity Logs
      </Typography>

      <Card sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        mb: 3,
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                    '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: '#fff' }}>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    sx={{
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                    }}
                  >
                    <MenuItem value="1h">Last Hour</MenuItem>
                    <MenuItem value="24h">Last 24 Hours</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: '#fff' }}>Action</InputLabel>
                  <Select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    sx={{
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                    }}
                  >
                    <MenuItem value="all">All Actions</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="update">Update</MenuItem>
                    <MenuItem value="delete">Delete</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ color: '#fff' }}>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="error">Error</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {selectedLogs.length > 0 && (
          <Button
            variant="contained"
            color="error"
            onClick={handleBulkDelete}
            startIcon={<DeleteIcon />}
          >
            Delete Selected ({selectedLogs.length})
          </Button>
        )}
        
        <Tooltip title="Delete all logs">
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAll}
            startIcon={<DeleteSweepIcon />}
          >
            Delete All Logs
          </Button>
        </Tooltip>
      </Box>

      <Paper component={Card} sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        position: 'relative',
      }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#fff' }}>Timestamp</TableCell>
                <TableCell sx={{ color: '#fff' }}>User</TableCell>
                <TableCell sx={{ color: '#fff' }}>Action</TableCell>
                <TableCell sx={{ color: '#fff' }}>Target</TableCell>
                <TableCell sx={{ color: '#fff' }}>IP Address</TableCell>
                <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                <TableCell sx={{ color: '#fff' }}>Details</TableCell>
                <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={8} 
                    align="center"
                    sx={{ color: '#fff', py: 4 }}
                  >
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow 
                    key={log.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#fff' }}>{log.timestamp}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.user}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.action}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.target}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.ip_address}</TableCell>
                    <TableCell>
                      <Chip
                        label={log.status}
                        color={getStatusColor(log.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.details}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleDeleteLog(log.id)}
                        sx={{ color: '#fff' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </AdminLayout>
  );
};

export default ActivityLogs; 