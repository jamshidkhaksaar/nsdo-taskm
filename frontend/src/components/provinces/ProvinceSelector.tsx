import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox,
  Radio,
  CircularProgress,
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchProvinces } from '../../store/slices/provinceSlice';
import { Province } from '@/types';
import { getGlassmorphismStyles } from '@/utils/glassmorphismStyles';

interface ProvinceSelectorProps {
  multiple?: boolean;
  onChange: (selectedProvinces: string[] | string) => void;
  selectedProvinces?: string[] | string;
  title?: string;
}

const ProvinceSelector: React.FC<ProvinceSelectorProps> = ({ 
  multiple = false, 
  onChange, 
  selectedProvinces = multiple ? [] : '',
  title = 'Select Province' 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { provinces, loading } = useSelector((state: RootState) => state.provinces);
  const [selected, setSelected] = useState<string[] | string>(selectedProvinces);

  useEffect(() => {
    dispatch(fetchProvinces());
  }, [dispatch]);

  useEffect(() => {
    setSelected(selectedProvinces);
  }, [selectedProvinces]);

  const handleProvinceSelect = (provinceId: string) => {
    if (multiple) {
      const currentSelected = selected as string[];
      const newSelected = currentSelected.includes(provinceId)
        ? currentSelected.filter(id => id !== provinceId)
        : [...currentSelected, provinceId];
      setSelected(newSelected);
      onChange(newSelected);
    } else {
      setSelected(provinceId);
      onChange(provinceId);
    }
  };

  const isProvinceSelected = (provinceId: string) => {
    if (multiple) {
      return (selected as string[]).includes(provinceId);
    }
    return selected === provinceId;
  };

  return (
    <Paper elevation={0} sx={{ ...getGlassmorphismStyles().card, p: 2, color: '#fff' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        {title}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} sx={{ color: '#fff' }} />
        </Box>
      ) : (
        <List component="nav" dense>
          {provinces.map((province: Province) => (
            <ListItem
              key={province.id}
              button
              onClick={() => handleProvinceSelect(province.id)}
              sx={{
                ...getGlassmorphismStyles().card,
                mb: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.25) !important',
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1) !important',
                }
              }}
            >
              {multiple ? (
                <Checkbox
                  checked={isProvinceSelected(province.id)}
                  edge="start"
                  sx={{ color: '#fff' }}
                />
              ) : (
                <Radio
                  checked={isProvinceSelected(province.id)}
                  edge="start"
                  sx={{ color: '#fff' }}
                />
              )}
              <ListItemText
                primary={province.name}
                sx={{
                  '.MuiListItemText-primary': { color: '#fff' },
                  '.MuiListItemText-secondary': { color: 'rgba(255, 255, 255, 0.7)' }
                }}
              />
            </ListItem>
          ))}
          {provinces.length === 0 && (
            <ListItem>
              <ListItemText 
                primary="No provinces found." 
                sx={{ '.MuiListItemText-primary': { color: '#fff' } }} 
              />
            </ListItem>
          )}
        </List>
      )}
    </Paper>
  );
};

export default ProvinceSelector; 