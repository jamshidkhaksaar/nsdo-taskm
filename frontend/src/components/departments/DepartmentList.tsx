import React, { useState } from 'react';
import {
  Box,
  List,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
} from '@mui/material';
import TextField from '@mui/material/TextField';

interface Department {
  id: string;
  name: string;
  tasksCount: number;
}

interface DepartmentListProps {
  departments: Department[];
  selectedDepartment: string | null;
  onSelectDepartment: (id: string) => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        borderRadius: 2,
        p: 2,
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ color: '#fff' }}>
          Departments List
        </Typography>
        <Box
          sx={{
            background: 'rgba(255, 255, 255, 0.12)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '12px',
            px: 1.5,
            py: 0.5,
            fontSize: '0.8rem',
          }}
        >
          {filteredDepartments.length}
        </Box>
      </Box>
      <TextField
        variant="outlined"
        size="small"
        placeholder="Search departments"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
        sx={{
          mb: 2,
          input: { color: '#fff' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: 'rgba(255, 255, 255, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: '#fff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
            },
          },
        }}
        InputProps={{
          style: { color: '#fff' },
        }}
      />
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
      <List>
        {filteredDepartments.map((dept) => (
          <ListItemButton
            key={dept.id}
            selected={selectedDepartment === dept.id}
            onClick={() => onSelectDepartment(dept.id)}
            sx={{
              borderRadius: 1,
              mb: 1,
              '&.Mui-selected': {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <ListItemText
              primary={dept.name}
              secondary={`${dept.tasksCount} tasks`}
              sx={{
                '& .MuiListItemText-primary': {
                  color: '#fff',
                },
                '& .MuiListItemText-secondary': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
};

export default DepartmentList; 