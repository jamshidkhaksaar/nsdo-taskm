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
  useTheme,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate, useLocation } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import logo from '../assets/images/logo.png';
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import type { Container as ParticlesContainer, Engine } from "tsparticles-engine";
import { keyframes } from '@mui/system';
import LoadingScreen from '../components/LoadingScreen';
import { AuthService } from '../services/auth';

interface LoginFormInputs {
  username: string;
  password: string;
  verificationCode?: string;
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  verificationCode: z.string().optional()
}) as z.ZodType<LoginFormInputs>;

const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState('');
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const [need2FA, setNeed2FA] = useState(false);
  const [loading, setLoading] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: ParticlesContainer | undefined) => {
    console.log("Particles loaded", container);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      verificationCode: ''
    }
  });

  const { isAuthenticated, error: authError } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setLoading(true);
      setFormError('');
      dispatch(loginStart());
      
      const response = await AuthService.login(
        data.username, 
        data.password, 
        need2FA ? data.verificationCode : undefined
      );
      
      if (response.need_2fa) {
        setNeed2FA(true);
        setLoading(false);
        return;
      }

      // Store tokens
      localStorage.setItem('token', response.access);
      localStorage.setItem('user', JSON.stringify(response.user));

      dispatch(loginSuccess({
        user: response.user,
        token: response.access
      }));
      
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || 'Invalid username or password';
      dispatch(loginFailure(errorMessage));
      setFormError(errorMessage);
    } finally {
      setLoading(false);
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

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
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
          fpsLimit: 120,
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.3,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 2,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
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
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '50px 35px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <img
            src={logo}
            alt="Company Logo"
            style={{
              maxWidth: '150px',
              marginBottom: '20px'
            }}
          />
          
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              opacity: 0.9,
              marginBottom: '8px',
              fontWeight: '500',
              animation: `${fadeIn} 0.8s ease-out`,
            }}
          >
            Welcome to
          </Typography>
          
          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: '700',
              marginBottom: '16px',
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: `${slideIn} 1s ease-out`,
            }}
          >
            NSDO
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              opacity: 0.95,
              marginBottom: '24px',
              fontWeight: '500',
              animation: `${fadeIn} 1.2s ease-out`,
            }}
          >
            Task Management & Planner
          </Typography>

          <Typography
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              animation: `${fadeIn} 1.4s ease-out`,
            }}
          >
            Sign In
          </Typography>
        </Box>

        {(formError || authError) && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff'
            }}
          >
            {formError || authError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {!need2FA ? (
            <>
              <TextField
                {...register('username')}
                fullWidth
                label="Username"
                variant="outlined"
                autoComplete="username"
                error={!!errors.username}
                helperText={errors.username?.message}
                disabled={loading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#fff',
                  },
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.error.light,
                  }
                }}
              />

              <TextField
                {...register('password')}
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                disabled={loading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#fff',
                  },
                  '& .MuiFormHelperText-root': {
                    color: theme.palette.error.light,
                  }
                }}
              />
            </>
          ) : (
            <TextField
              {...register('verificationCode')}
              fullWidth
              label="2FA Verification Code"
              variant="outlined"
              autoComplete="verification-code"
              error={!!errors.verificationCode}
              helperText={errors.verificationCode?.message}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiOutlinedInput-input': {
                  color: '#fff',
                },
                '& .MuiFormHelperText-root': {
                  color: theme.palette.error.light,
                }
              }}
            />
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.5,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '1.1rem',
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.2)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.5)',
              }
            }}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : need2FA ? (
              'Verify'
            ) : (
              'Sign In'
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;