import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery, useTheme, Paper, List, ListItem, ListItemText } from '@mui/material';
import { AppDispatch, RootState } from '../../../frontend/src/store';
import { logout } from '../../../frontend/src/store/slices/authSlice';

// Example Log structure
interface ActivityLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details?: string;
}

const ActivityLogs: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    // --- Page Specific State (Example Logs) ---
    const [logs, setLogs] = useState<ActivityLog[]>([
        { id: '1', timestamp: new Date().toISOString(), user: 'admin', action: 'User login', details: 'User admin logged in from 192.168.1.100' },
        { id: '2', timestamp: new Date(Date.now() - 60000).toISOString(), user: 'jane.doe', action: 'Task created', details: 'Task #123 assigned to john.smith' },
        { id: '3', timestamp: new Date(Date.now() - 120000).toISOString(), user: 'system', action: 'Backup completed' },
    ]);
    const [loading, setLoading] = useState(false); // Set to true if fetching logs

    // --- Main Content for Activity Logs ---
    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Activity Logs</Typography>
            <Paper sx={{ p: 2, background: 'rgba(255, 255, 255, 0.05)', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto', color: 'white' }}>
                {loading ? (
                    <Typography>Loading logs...</Typography>
                ) : (
                    <List dense>
                        {logs.map((log) => (
                            <ListItem key={log.id} divider sx={{ alignItems: 'flex-start' }}>
                                <ListItemText
                                    primary={`${log.action} by ${log.user}`}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" sx={{ display: 'block', color: '#bbb' }}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </Typography>
                                            {log.details}
                                        </>
                                    }
                                    primaryTypographyProps={{ color: 'white' }}
                                    secondaryTypographyProps={{ color: '#ccc' }}
                                />
                            </ListItem>
                        ))}
                        {logs.length === 0 && (
                            <ListItem>
                                <ListItemText primary="No activity logs found." sx={{ color: '#ccc' }} />
                            </ListItem>
                        )}
                    </List>
                )}
            </Paper>
        </Box>
    );
};

export default ActivityLogs;