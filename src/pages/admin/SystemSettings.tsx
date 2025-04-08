import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery, useTheme, Paper, Switch, FormControlLabel, TextField, Button } from '@mui/material';
import { AppDispatch, RootState } from '../../../frontend/src/store';
import { logout } from '../../../frontend/src/store/slices/authSlice';

const SystemSettings: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [maxUsers, setMaxUsers] = useState(100);
    const [apiKey, setApiKey] = useState('**************'); // Masked example

    const handleSaveSettings = () => {
        console.log('Saving settings:', { maintenanceMode, maxUsers, apiKey });
        // Add API call logic here to save settings
        // Example: dispatch(saveSystemSettings({ maintenanceMode, maxUsers, apiKey }));
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>System Settings</Typography>
            <Paper sx={{ p: 3, background: 'rgba(255, 255, 255, 0.05)', maxWidth: 800, color: 'white' }}>
                <Typography variant="h6" gutterBottom>General Settings</Typography>
                <FormControlLabel
                    control={<Switch checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} sx={{ color: 'primary.main' }} />}
                    label="Maintenance Mode"
                    sx={{ mb: 2, display: 'block' }}
                />
                <TextField
                    label="Maximum Concurrent Users"
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ style: { color: '#ccc' } }}
                    sx={{ input: { color: 'white' }, mb: 2 }}
                />
                 <TextField
                    label="External API Key"
                    type="password" // Use password type to mask
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ style: { color: '#ccc' } }}
                    sx={{ input: { color: 'white' }, mb: 3 }}
                />
                <Button variant="contained" onClick={handleSaveSettings}>
                    Save Settings
                </Button>
            </Paper>
        </Box>
    );
};

export default SystemSettings;