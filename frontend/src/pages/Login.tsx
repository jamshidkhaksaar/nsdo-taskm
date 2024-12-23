import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  useTheme,
  Paper,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../services/api';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import logo from '../assets/images/logo.png';

// Zod validation schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const theme = useTheme();
  const particlesRef = useRef<HTMLDivElement>(null);

  // Always call hooks in the same order
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  });

  const { isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  // Use effect to create particle background
  useEffect(() => {
    const loadParticles = async () => {
      try {
        // Dynamically import particles.js
        await import('particles.js');

        // Check if window.particlesJS exists
        if (window.particlesJS && particlesRef.current) {
          window.particlesJS('particles-js', {
            particles: {
              number: { value: 80, density: { enable: true, value_area: 800 } },
              color: { value: theme.palette.primary.light },
              shape: { type: "circle" },
              opacity: { value: 0.5, random: false },
              size: { value: 3, random: true },
              line_linked: {
                enable: true,
                distance: 150,
                color: theme.palette.primary.light,
                opacity: 0.4,
                width: 1
              },
              move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false,
              }
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
                resize: true
              },
              modes: {
                repulse: { distance: 100, duration: 0.4 },
                push: { particles_nb: 4 }
              }
            },
            retina_detect: true
          });
        } else {
          console.error('particlesJS is not available');
        }
      } catch (error) {
        console.error('Failed to load particles.js:', error);
      }
    };

    loadParticles();

    // Cleanup function
    return () => {
      if (window.particlesJS && window.particlesJS.destroy) {
        window.particlesJS.destroy();
      }
    };
  }, [theme]);

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      dispatch(loginStart());
      const response = await login(data.username, data.password);
      dispatch(loginSuccess({
        user: response.data.user,
        token: response.data.token
      }));
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      if (error.response) {
        errorMessage = error.response.data.message || 'Login failed';
      }
      dispatch(loginFailure(errorMessage));
    }
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100vh', 
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div 
        id="particles-js" 
        ref={particlesRef}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 0,
          backgroundColor: theme.palette.primary.dark,
        }} 
      />
      <Paper 
        elevation={12}
        sx={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 400,
          p: 4,
          borderRadius: 4,
          backgroundColor: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center' 
        }}>
          <img 
            src={logo} 
            alt="Company Logo" 
            style={{ 
              maxWidth: '200px', 
              marginBottom: theme.spacing(2) 
            }} 
          />
          <Typography 
            component="h1" 
            variant="h5" 
            sx={{ 
              mb: 3, 
              color: theme.palette.primary.main,
              fontWeight: 'bold'
            }}
          >
            Sign In
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ width: '100%', mb: 2 }}
            >
              {error}
            </Alert>
          )}
          
          <Box 
            component="form" 
            onSubmit={handleSubmit(onSubmit)} 
            sx={{ width: '100%' }}
          >
            <TextField
              {...register('username')}
              margin="normal"
              required
              fullWidth
              label="Username"
              autoComplete="username"
              autoFocus
              error={!!errors.username}
              helperText={errors.username?.message}
              disabled={loading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            <TextField
              {...register('password')}
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={loading}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;