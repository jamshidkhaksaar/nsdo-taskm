import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography
} from '@mui/material';
import { Department } from '@/types';

// Define the shape of the department object expected, including the count
interface DepartmentWithCount extends Department {
  tasksCount: number;
}

interface DepartmentListProps {
  departments: DepartmentWithCount[];
  selectedDepartment: string | null;
  onSelectDepartment: (departmentId: string) => void;
}

const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
}) => {
  return (
    <Paper 
      elevation={0}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Departments
      </Typography>
      
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {departments.length === 0 ? (
          <Typography sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', mt: 2 }}>
            No departments found.
          </Typography>
        ) : (
          departments.map((dept) => (
            <ListItem
              key={dept.id}
              button
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
                secondary={`Tasks: ${dept.tasksCount}`}
                sx={{ 
                  '& .MuiListItemText-primary': { color: '#fff' },
                  '& .MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.6)' } 
                }}
              />
            </ListItem>
          ))
        )}
      </List>
    </Paper>
  );
};

export default DepartmentList; 