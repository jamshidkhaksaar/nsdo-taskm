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
  TextField,
  InputAdornment,
  Box,
  LinearProgress,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminLayout from '../../layouts/AdminLayout';

interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  membersCount: number;
  activeProjects: number;
  completionRate: number;
  members: {
    id: string;
    name: string;
    avatar?: string;
  }[];
}

const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Program',
    description: 'Main program development and implementation',
    head: 'John Doe',
    membersCount: 15,
    activeProjects: 8,
    completionRate: 75,
    members: [
      { id: '1', name: 'John Doe' },
      { id: '2', name: 'Jane Smith' },
      { id: '3', name: 'Mike Johnson' },
    ],
  },
  // Add more mock departments...
];

const DepartmentManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const handleEditDepartment = (deptId: string) => {
    setSelectedDepartment(deptId);
    // Implement edit logic
  };

  const handleDeleteDepartment = (deptId: string) => {
    // Implement delete logic
  };

  const handleViewMembers = (deptId: string) => {
    // Implement view members logic
  };

  const handleViewPerformance = (deptId: string) => {
    // Implement view performance logic
  };

  const handleDepartmentSelect = (deptId: string) => {
    setSelectedDepartment(deptId);
    // Implement department selection logic
  };

  return (
    <AdminLayout>
      <Typography variant="h4" sx={{ color: '#fff', mb: 4 }}>
        Department Management
        {selectedDepartment && (
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
            Selected Department: {mockDepartments.find(d => d.id === selectedDepartment)?.name}
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
                placeholder="Search departments..."
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
                Add New Department
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
              <TableCell sx={{ color: '#fff' }}>Department</TableCell>
              <TableCell sx={{ color: '#fff' }}>Head</TableCell>
              <TableCell sx={{ color: '#fff' }}>Members</TableCell>
              <TableCell sx={{ color: '#fff' }}>Active Projects</TableCell>
              <TableCell sx={{ color: '#fff' }}>Completion Rate</TableCell>
              <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockDepartments.map((dept) => (
              <TableRow 
                key={dept.id}
                onClick={() => handleDepartmentSelect(dept.id)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: selectedDepartment === dept.id ? 
                    'rgba(255, 255, 255, 0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              >
                <TableCell>
                  <Box>
                    <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                      {dept.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {dept.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{dept.head}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AvatarGroup max={3} sx={{
                      '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' }
                    }}>
                      {dept.members.map((member) => (
                        <Avatar key={member.id} src={member.avatar}>
                          {member.name.charAt(0)}
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {dept.membersCount} members
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{dept.activeProjects}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={dept.completionRate}
                      sx={{
                        width: 100,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#4CAF50',
                        },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#fff' }}>
                      {dept.completionRate}%
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleEditDepartment(dept.id)}
                    sx={{ color: '#fff' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleViewMembers(dept.id)}
                    sx={{ color: '#fff' }}
                  >
                    <GroupIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleViewPerformance(dept.id)}
                    sx={{ color: '#fff' }}
                  >
                    <AssessmentIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteDepartment(dept.id)}
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

export default DepartmentManagement; 