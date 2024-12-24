import React from 'react';
import {
  Box,
  List,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
} from '@mui/material';

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
  return (
    <Box
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: 2,
        p: 2,
        height: '100%',
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Departments List
      </Typography>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
      <List>
        {departments.map((dept) => (
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