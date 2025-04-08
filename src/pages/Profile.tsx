import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, useMediaQuery, useTheme, Paper, Avatar, TextField, Button } from '@mui/material';
import { AppDispatch, RootState } from '../../frontend/src/store';
import { logout } from '../../frontend/src/store/slices/authSlice';

const Profile: React.FC = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Updating profile with:', { username, email });
        // Add API call logic here to update profile
        // Example: dispatch(updateUserProfile({ username, email }));
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>Profile Settings</Typography>
            <Paper elevation={3} sx={{ p: 3, mt: 2, maxWidth: 600, mx: 'auto', background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Box component="form" onSubmit={handleUpdateProfile}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </Avatar>
                        <Typography variant="h6">{username || 'User'}</Typography>
                    </Box>
                    <TextField
                        label="Username"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        InputLabelProps={{ style: { color: '#ccc' } }}
                        sx={{ input: { color: 'white' } }}
                    />
                    <TextField
                        label="Email"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputLabelProps={{ style: { color: '#ccc' } }}
                        sx={{ input: { color: 'white' } }}
                    />
                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                        Update Profile
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Profile;