import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Button, CircularProgress } from '@mui/material';
import { getProvinces, getDepartmentsByProvince } from '../services/provinceService/index';
import { useNavigate } from 'react-router-dom';

interface Province {
  id: string;
  name: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

const ProvincePage: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getProvinces()
      .then(data => setProvinces(data))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProvince = (province: Province) => {
    setSelectedProvince(province);
    setLoading(true);
    getDepartmentsByProvince(province.id)
      .then(data => setDepartments(data))
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Provinces
      </Typography>
      {loading && <CircularProgress />}
      <List>
        {provinces.map(province => (
          <ListItem
            button
            key={province.id}
            selected={selectedProvince?.id === province.id}
            onClick={() => handleSelectProvince(province)}
          >
            <ListItemText primary={province.name} secondary={province.description} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      {selectedProvince && (
        <>
          <Typography variant="h5" gutterBottom>
            Departments in {selectedProvince.name}
          </Typography>
          <List>
            {departments.map(dept => (
              <ListItem key={dept.id}>
                <ListItemText primary={dept.name} secondary={dept.description} />
                {/* Placeholder for task assignment button */}
                <Button variant="outlined" onClick={() => {/* TODO: open task assignment dialog */}}>
                  Assign Task
                </Button>
              </ListItem>
            ))}
          </List>
          {/* Placeholder for province-level task assignment */}
          <Button variant="contained" sx={{ mt: 2 }}>
            Assign Task to Province
          </Button>
        </>
      )}
    </Box>
  );
};

export default ProvincePage;