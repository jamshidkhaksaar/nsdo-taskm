import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText,
  Checkbox,
  CircularProgress,
  Divider,
  Button
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchDepartments } from '../../store/slices/departmentSlice';
import { Department } from '@/types';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';

interface DepartmentSelectorProps {
  provinceIds: string | string[];
  multiple?: boolean;
  onChange: (selectedDepartments: string[]) => void;
  selectedDepartments?: string[];
  title?: string;
  showAssignButton?: boolean;
  onAssignClick?: () => void;
}

const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  provinceIds,
  multiple = true,
  onChange,
  selectedDepartments = [],
  title = 'Select Departments',
  showAssignButton = true,
  onAssignClick
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { departments, loading } = useSelector((state: RootState) => state.departments);
  const [selected, setSelected] = useState<string[]>(selectedDepartments);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    setSelected(selectedDepartments);
  }, [selectedDepartments]);

  const handleDepartmentToggle = (departmentId: string) => {
    const currentSelected = [...selected];
    const newSelected = currentSelected.includes(departmentId)
      ? currentSelected.filter(id => id !== departmentId)
      : [...currentSelected, departmentId];
    
    setSelected(newSelected);
    onChange(newSelected);
  };

  // Filter departments for the selected province(s)
  const filteredDepartments = React.useMemo(() => {
    if (!provinceIds || (Array.isArray(provinceIds) && provinceIds.length === 0)) {
      return [];
    }
    
    const provinceIdArray = Array.isArray(provinceIds) ? provinceIds : [provinceIds];
    
    return departments.filter((dept: Department) => 
      dept.provinceId && provinceIdArray.includes(dept.provinceId)
    );
  }, [provinceIds, departments]);

  return (
    <Paper elevation={0} sx={{ ...getGlassmorphismStyles().card, p: 2, minHeight: '300px', color: '#fff' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        {title}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ color: '#fff' }} />
        </Box>
      ) : (
        <>
          {!provinceIds || (Array.isArray(provinceIds) && provinceIds.length === 0) ? (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Please select a province first to view its departments.
            </Typography>
          ) : (
            <>
              <List dense>
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((dept: Department) => (
                    <ListItem
                      key={dept.id}
                      button
                      onClick={() => handleDepartmentToggle(dept.id)}
                      sx={{
                        ...getGlassmorphismStyles().card,
                        mb: 1,
                        borderRadius: 1,
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                        }
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={selected.includes(dept.id)}
                        sx={{ color: '#fff' }}
                      />
                      <ListItemText
                        primary={dept.name}
                        sx={{
                          '.MuiListItemText-primary': { color: '#fff' }
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No departments found for the selected province(s)."
                      sx={{ '.MuiListItemText-primary': { color: '#fff' } }}
                    />
                  </ListItem>
                )}
              </List>

              {showAssignButton && filteredDepartments.length > 0 && (
                <>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={onAssignClick}
                      disabled={selected.length === 0}
                      sx={{ color: '#fff' }}
                    >
                      Assign Task to Selected Department(s)
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
};

export default DepartmentSelector; 