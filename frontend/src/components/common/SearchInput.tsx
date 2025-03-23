import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  fullWidth = true
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const clearSearch = () => {
    onChange('');
  };

  return (
    <TextField
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      fullWidth={fullWidth}
      variant="outlined"
      size="small"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton 
              edge="end" 
              onClick={clearSearch}
              size="small"
              sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderRadius: 1,
          color: '#fff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(25, 118, 210, 0.5)',
          },
        },
      }}
      sx={{
        '& .MuiInputLabel-root': {
          color: 'rgba(255, 255, 255, 0.5)',
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: 'rgba(255, 255, 255, 0.7)',
        },
      }}
    />
  );
};

export default SearchInput; 