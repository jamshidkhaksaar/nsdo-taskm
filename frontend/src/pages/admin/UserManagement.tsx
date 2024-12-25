import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import BlockIcon from '@mui/icons-material/Block';
import AdminLayout from '../../layouts/AdminLayout';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    department: 'IT',
    status: 'active',
    lastLogin: '2024-03-10 14:30',
  },
  // Add more mock users...
];

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    // Implement user selection logic
  };

  const handleEditUser = (userId: string) => {
    setSelectedUser(userId);
    // Implement edit logic
  };

  const handleDeleteUser = (userId: string) => {
    // Implement delete logic
  };

  const handleResetPassword = (userId: string) => {
    // Implement password reset logic
  };

  const handleToggleStatus = (userId: string) => {
    // Implement status toggle logic
  };

  return (
    <AdminLayout>
      <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
        User Management
        {selectedUser && (
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
            Selected User: {mockUsers.find(u => u.id === selectedUser)?.name}
          </Typography>
        )}
      </Typography>

      <Card sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        mb: 3,
      }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search users..."
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
            <Grid item>
              <Button
                variant="contained"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Add New User
              </Button>
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
              <TableCell sx={{ color: '#fff' }}>Name</TableCell>
              <TableCell sx={{ color: '#fff' }}>Email</TableCell>
              <TableCell sx={{ color: '#fff' }}>Role</TableCell>
              <TableCell sx={{ color: '#fff' }}>Department</TableCell>
              <TableCell sx={{ color: '#fff' }}>Status</TableCell>
              <TableCell sx={{ color: '#fff' }}>Last Login</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockUsers.map((user) => (
              <TableRow 
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedUser === user.id ? 
                    'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <TableCell sx={{ color: '#fff' }}>{user.name}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.email}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.role}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.department}</TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    color={user.status === 'active' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{user.lastLogin}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditUser(user.id)}
                    sx={{ color: '#fff' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleResetPassword(user.id)}
                    sx={{ color: '#fff' }}
                  >
                    <LockResetIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleToggleStatus(user.id)}
                    sx={{ color: '#fff' }}
                  >
                    <BlockIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteUser(user.id)}
                    sx={{ color: '#fff' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AdminLayout>
  );
};

export default UserManagement; 