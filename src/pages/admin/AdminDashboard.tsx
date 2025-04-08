import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery, useTheme, Paper, Grid } from '@mui/material';
import { AppDispatch, RootState } from '../../../frontend/src/store';
import { logout } from '../../../frontend/src/store/slices/authSlice';

const AdminDashboard: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
            <Grid container spacing={3}>
                {/* Example Admin Widgets/Summaries */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                        <Typography variant="h6">User Count</Typography>
                        <Typography variant="h4"> {/* Fetch real count */} 123</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                        <Typography variant="h6">Active Tasks</Typography>
                        <Typography variant="h4"> {/* Fetch real count */} 45</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', color: 'white' }}>
                        <Typography variant="h6">System Status</Typography>
                        <Typography variant="body1" color="success.main">OK</Typography>
                    </Paper>
                </Grid>
                {/* Add more admin-specific widgets or charts here */}
            </Grid>
        </Box>
    );
};

export default AdminDashboard;