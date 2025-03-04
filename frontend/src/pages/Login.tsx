import React, { useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  AlertTitle,
  useTheme,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
  alpha,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { loginAsync, clearError } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import logo from '../assets/images/logo.png';
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import type { Container as ParticlesContainer, Engine } from "tsparticles-engine";
import { keyframes } from '@mui/system';
import LoadingScreen from '../components/LoadingScreen';
import { Link } from 'react-router-dom';
import { standardBackgroundStyleNoPosition } from '../utils/backgroundStyles';
import { getGlassmorphismStyles } from '../utils/glassmorphismStyles';
import LoginFooter from '../components/LoginFooter';
import axiosInstance from '../utils/axios';
import axios from 'axios';
import { setCredentials } from '../store/slices/authSlice';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

interface LoginFormInputs {
  username: string;
  password: string;
  rememberMe: boolean;
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false)
}) as z.ZodType<LoginFormInputs>;

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const glassStyles = getGlassmorphismStyles(theme);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: ParticlesContainer | undefined) => {
    console.log("Particles loaded", container);
  }, []);

  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: localStorage.getItem('rememberedUsername') || '',
      password: '',
      rememberMe: localStorage.getItem('rememberedUsername') ? true : false
    }
  });

  const { isAuthenticated, loading, error: reduxError } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Clear any auth errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      // Handle "Remember Me" functionality
      if (data.rememberMe) {
        localStorage.setItem('rememberedUsername', data.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      console.log('Attempting login with:', { username: data.username, password: '***' });
      setIsLoading(true);
      
      try {
        // Use our configured axios instance instead of the default axios
        const response = await axiosInstance.post('/api/auth/login', { 
          username: data.username, 
          password: data.password 
        });
        
        console.log('Login response:', response.data);
        
        if (response.data) {
          // Extract tokens and user data
          const accessToken = response.data.access || response.data.accessToken || response.data.token;
          const refreshToken = response.data.refresh || response.data.refreshToken || '';
          const userData = response.data.user || {};
          
          if (!accessToken) {
            throw new Error('No access token received from server');
          }
          
          // Store tokens in localStorage
          localStorage.setItem('access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken);
          }
          
          // Store user data
          if (userData) {
            localStorage.setItem('user', JSON.stringify(userData));
          }
          
          // Set token in axios headers - use our configured instance
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          // Dispatch login action to Redux
          dispatch(setCredentials({
            user: userData,
            token: accessToken
          }));
          
          // Redirect to dashboard
          console.log('Login successful, navigating to:', from);
          navigate(from, { replace: true });
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err: any) {
        console.error('Login error:', err);
        
        // Handle different error types
        if (axios.isAxiosError(err)) {
          if (err.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const errorMessage = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
            setError(errorMessage);
            dispatch({ type: 'auth/loginAsync/rejected', payload: errorMessage });
          } else if (err.request) {
            // The request was made but no response was received
            setError('No response from server. Please check your connection.');
            dispatch({ type: 'auth/loginAsync/rejected', payload: 'No response from server. Please check your connection.' });
          } else {
            // Something happened in setting up the request that triggered an Error
            setError(err.message || 'An error occurred during login');
            dispatch({ type: 'auth/loginAsync/rejected', payload: err.message || 'An error occurred during login' });
          }
        } else {
          setError(err.message || 'An unknown error occurred');
          dispatch({ type: 'auth/loginAsync/rejected', payload: err.message || 'An unknown error occurred' });
        }
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setIsLoading(false);
    }
  };

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  const slideIn = keyframes`
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  `;

  // Add a function to toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        ...standardBackgroundStyleNoPosition,
        overflow: 'hidden',
      }}
    >
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: false,
          background: {
            color: {
              value: "transparent",
            },
          },
          fpsLimit: 60,
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.2,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 0.5,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 50,
            },
            opacity: {
              value: 0.3,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 3 },
            },
          },
          detectRetina: true,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />
      
      <Box
        component="form"
        onSubmit={formSubmit(onSubmit)}
        sx={{
          width: '100%',
          maxWidth: '450px',
          ...glassStyles.form,
          padding: '40px',
          position: 'relative',
          zIndex: 2,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              width: '120px',
              marginBottom: '20px',
              animation: `${slideIn} 0.8s ease-out`,
            }}
          />
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              ...glassStyles.text.primary,
              mb: 1,
              animation: `${slideIn} 0.8s ease-out`,
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body1"
            sx={{
              ...glassStyles.text.secondary,
              textAlign: 'center',
              animation: `${slideIn} 0.8s ease-out`,
            }}
          >
            Sign in to continue to your dashboard
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              animation: `${fadeIn} 0.5s ease-out`,
              '& .MuiAlert-message': {
                width: '100%',
              },
              backgroundColor: 'rgba(211, 47, 47, 0.15)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              border: '1px solid rgba(211, 47, 47, 0.3)',
              '& .MuiAlert-icon': {
                color: '#fff'
              }
            }}
          >
            <AlertTitle sx={{ color: '#fff' }}>Error</AlertTitle>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            label="Username"
            fullWidth
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            variant="outlined"
            InputLabelProps={{
              style: glassStyles.inputLabel
            }}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': glassStyles.input,
            }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            variant="outlined"
            InputLabelProps={{
              style: glassStyles.inputLabel
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    title={showPassword ? "Hide password" : "Show password"}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': glassStyles.input,
            }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox 
                {...register('rememberMe')} 
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-checked': {
                    color: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              />
            }
            label={<Typography sx={glassStyles.text.secondary}>Remember me</Typography>}
          />
          <MuiLink
            component={Link}
            to="/forgot-password"
            sx={{
              ...glassStyles.text.secondary,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
                color: 'white',
              },
            }}
          >
            Forgot password?
          </MuiLink>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{
            py: 1.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            ...glassStyles.button,
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Sign In'
          )}
        </Button>

        <Box
          sx={{
            mt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={glassStyles.text.muted}>
            Don't have an account?{' '}
            <MuiLink
              component={Link}
              to="/register"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'white',
                },
              }}
            >
              Sign up
            </MuiLink>
          </Typography>
        </Box>
      </Box>
      
      <LoginFooter />
    </Box>
  );
};


export default Login;
