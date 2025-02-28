import React, { useState } from 'react';
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
  Link as MuiLink,
  Paper,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth';
import logo from '../assets/images/logo.png';

// Define the form schema with Zod
const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
    .regex(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormInputs = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setLoading(true);
      setFormError('');
      
      console.log('Attempting registration with:', { 
        username: data.username, 
        email: data.email, 
        password: '***'
      });
      
      // Call the register method from AuthService
      await AuthService.register({
        username: data.username,
        email: data.email,
        password: data.password
      });
      
      setSuccess(true);
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Failed to register. Please try again.';
      
      if (err.response) {
        if (err.response.status === 409) {
          errorMessage = 'Username or email already exists. Please try another.';
        } else if (err.response.status === 400) {
          // Handle validation errors
          if (err.response.data?.message) {
            if (Array.isArray(err.response.data.message)) {
              errorMessage = err.response.data.message.join(', ');
            } else {
              errorMessage = err.response.data.message;
            }
          } else {
            errorMessage = 'Invalid input. Please check your data and try again.';
          }
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Please check if the server is running.';
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
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
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '40px 30px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
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
            variant="h4"
            sx={{
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            Create Account
          </Typography>
          
          <Typography
            variant="body1"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '20px',
            }}
          >
            Sign up to start using the task management system
          </Typography>
        </Box>

        {formError && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              width: '100%',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <AlertTitle>Registration Failed</AlertTitle>
            {formError}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              width: '100%',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <AlertTitle>Registration Successful</AlertTitle>
            Your account has been created. Redirecting to login page...
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <TextField
            {...register('username')}
            fullWidth
            label="Username"
            variant="outlined"
            autoComplete="username"
            error={!!errors.username}
            helperText={errors.username?.message}
            disabled={loading || success}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
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
            {...register('email')}
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={loading || success}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
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
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={loading || success}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
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
            {...register('confirmPassword')}
            fullWidth
            label="Confirm Password"
            type="password"
            variant="outlined"
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            disabled={loading || success}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: 'rgba(255, 255, 255, 0.9)',
                }
              },
              '& .MuiOutlinedInput-input': {
                color: '#fff',
              },
              '& .MuiFormHelperText-root': {
                color: theme.palette.error.light,
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || success}
            sx={{
              py: 1.5,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              fontSize: '1.1rem',
              textTransform: 'none',
              fontWeight: 600,
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
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Sign Up'
            )}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Already have an account?{' '}
              <MuiLink
                component={Link}
                to="/login"
                sx={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontWeight: 'bold',
                  '&:hover': {
                    textDecoration: 'underline',
                  }
                }}
              >
                Sign In
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register; 