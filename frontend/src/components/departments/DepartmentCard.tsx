import React from 'react';
import { Card, CardContent, Typography, Box, Avatar, Chip } from '@mui/material';
import { Department } from '../../types/department';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

interface DepartmentCardProps {
  department: Department;
  isSelected?: boolean;
  onClick?: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ 
  department, 
  isSelected = false,
  onClick
}) => {
  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        background: isSelected 
          ? 'linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.3))' 
          : 'rgba(17, 25, 40, 0.8)',
        borderLeft: isSelected ? '4px solid #1976d2' : '4px solid transparent',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: 'linear-gradient(to right, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.2))',
        }
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div" sx={{ color: '#fff', fontWeight: 'bold' }}>
            {department.name}
          </Typography>
          
          {department.manager && (
            <Avatar 
              src={department.manager.avatar} 
              alt={`${department.manager.first_name} ${department.manager.last_name}`}
              sx={{ width: 32, height: 32 }}
            >
              {department.manager.first_name.charAt(0)}
            </Avatar>
          )}
        </Box>
        
        {department.description && (
          <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mt: 1 }}>
            {department.description}
          </Typography>
        )}
        
        <Box display="flex" gap={2} mt={2}>
          <Chip
            icon={<PeopleIcon fontSize="small" />}
            label={`${department.members_count || 0} Members`}
            size="small"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)' }}
          />
          
          <Chip
            icon={<AssignmentIcon fontSize="small" />}
            label={`${department.tasks_count || 0} Tasks`}
            size="small"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.8)' }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DepartmentCard; 