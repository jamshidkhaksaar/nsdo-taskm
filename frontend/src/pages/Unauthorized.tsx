import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        textAlign: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          maxWidth: '500px',
          width: '100%',
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          You do not have the necessary permissions to access this page.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/dashboard"
          sx={{ mr: 1 }}
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outlined"
          component={Link}
          to="/login"
        >
          Login with a different account
        </Button>
      </Paper>
    </Box>
  );
};

export default Unauthorized; 