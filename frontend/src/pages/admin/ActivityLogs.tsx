import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AdminLayout from '../../layouts/AdminLayout';

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  status: 'success' | 'warning' | 'error';
  details: string;
}

const mockLogs: ActivityLog[] = [
  {
    id: '1',
    user: 'John Doe',
    action: 'User Login',
    target: 'System',
    timestamp: '2024-03-15 10:30:45',
    ipAddress: '192.168.1.100',
    status: 'success',
    details: 'Successful login from Chrome browser',
  },
  {
    id: '2',
    user: 'Jane Smith',
    action: 'Update Task',
    target: 'Task #123',
    timestamp: '2024-03-15 10:25:30',
    ipAddress: '192.168.1.101',
    status: 'warning',
    details: 'Changed task deadline',
  },
  {
    id: '3',
    user: 'Mike Johnson',
    action: 'Delete User',
    target: 'User #456',
    timestamp: '2024-03-15 10:20:15',
    ipAddress: '192.168.1.102',
    status: 'error',
    details: 'Unauthorized deletion attempt',
  },
];

const ActivityLogs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: ActivityLog['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
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

      <TableContainer component={Card} sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}>
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
            {mockLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell sx={{ color: '#fff' }}>{log.timestamp}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{log.user}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{log.action}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{log.target}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{log.ipAddress}</TableCell>
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
                    onClick={handleMenuOpen}
                    sx={{ color: '#fff' }}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#fff',
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Export Log</MenuItem>
      </Menu>
    </AdminLayout>
  );
};

export default ActivityLogs; 