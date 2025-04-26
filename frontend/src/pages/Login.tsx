import React, { useCallback, useState, useEffect, Suspense, lazy } from 'react';
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
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate, useLocation, Link } from 'react-router-dom';
import { clearError, setCredentials } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import logo from '../assets/images/logo.png';
import { loadFull } from "tsparticles";
import { Engine, Container as ParticlesContainer } from "tsparticles-engine";
import Particles from 'react-tsparticles';
import { keyframes } from '@mui/system';
import LoadingScreen from '../components/LoadingScreen';
import LoginFooter from '../components/LoginFooter';
import axios from 'axios';
import axiosInstance from '../utils/axios';
import { AuthService } from '../services/AuthService';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { getGlassmorphismStyles } from '../utils/glassmorphismStyles';
import { standardBackgroundStyleNoPosition } from '../utils/backgroundStyles';

interface LoginFormInputs {
  username: string;
  password: string;
  rememberMe: boolean;
}

interface TwoFactorFormInputs {
  verificationCode: string;
  rememberDevice: boolean;
}

interface ForgotPasswordFormInputs {
  email: string;
}

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false)
}) as z.ZodType<LoginFormInputs>;

const twoFactorSchema = z.object({
  verificationCode: z.string().min(6, 'Verification code must be at least 6 characters'),
  rememberDevice: z.boolean().default(true)
}) as z.ZodType<TwoFactorFormInputs>;

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
}) as z.ZodType<ForgotPasswordFormInputs>;

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
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorMethod] = useState<string>('app');
  const [loginCredentials, setLoginCredentials] = useState<LoginFormInputs | null>(null);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');

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

  const {
    register: register2FA,
    handleSubmit: formSubmit2FA,
    formState: { errors: errors2FA }
  } = useForm<TwoFactorFormInputs>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      verificationCode: '',
      rememberDevice: true
    }
  });

  const { loading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      if (data.rememberMe) {
        localStorage.setItem('rememberedUsername', data.username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      setLoginCredentials(data);

      console.log('Attempting login with:', { username: data.username, password: '***' });
      setIsLoading(true);
      setError('');
      
      const loginPayload = {
        username: data.username,
        password: data.password
      };
      
      try {
        const healthCheck = await axios.get('http://localhost:3001/api/v1/health', {
          timeout: 3000
        });
        
        console.log('Backend health check:', healthCheck.status);
        
        if (healthCheck.status !== 200) {
          throw new Error('Backend service is not available');
        }
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        console.log('Using mock data for development testing');
      }
      
      try {
        console.log('Trying /api/auth/login endpoint...');
        
        const response = await axios({
          method: 'post',
          url: 'http://localhost:3001/api/v1/auth/login',
          data: loginPayload,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        console.log('Login response from /login:', response.data);
        
        handleSuccessfulLogin(response.data);
        return;
      } catch (loginError) {
        console.warn('Login via /api/auth/login failed, trying /api/auth/signin...', loginError);
        
        try {
          const signinResponse = await axios({
            method: 'post',
            url: 'http://localhost:3001/api/v1/auth/signin',
            data: loginPayload,
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          
          console.log('Login response from /signin:', signinResponse.data);
          
          handleSuccessfulLogin(signinResponse.data);
          return;
        } catch (signinError: any) {
          console.error('Both login attempts failed:', signinError);
          
          if (signinError.response && signinError.response.data && signinError.response.data.message && 
              signinError.response.data.message.includes('Expected property name')) {
            console.error('Backend JSON parsing error detected, trying with stringified payload');
            
            try {
              const stringifiedResponse = await axios({
                method: 'post',
                url: 'http://localhost:3001/api/v1/auth/signin',
                data: JSON.stringify(loginPayload),
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 5000
              });
              
              console.log('Login response with stringified payload:', stringifiedResponse.data);
              handleSuccessfulLogin(stringifiedResponse.data);
              return;
            } catch (finalError) {
              console.error('Final login attempt failed:', finalError);
              handleLoginError(finalError);
            }
          } else {
            handleLoginError(signinError);
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  const handleSuccessfulLogin = (responseData: any) => {
    try {
      console.log('Processing login response:', responseData);
      
      const accessToken = responseData.access || responseData.token || responseData.accessToken;
      const refreshToken = responseData.refresh || responseData.refreshToken;
      const userData = responseData.user || {};
      
      if (!accessToken) {
        setError('Invalid response from server: No access token provided');
        setIsLoading(false);
        return;
      }
      
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      dispatch(setCredentials({
        user: userData,
        token: accessToken,
        refreshToken: refreshToken
      }));
      
      console.log('Login successful, redirecting to:', from);
      setIsLoading(false);
      navigate(from);
    } catch (error) {
      console.error('Error processing login response:', error);
      setError('An error occurred while processing the login response');
      setIsLoading(false);
    }
  };
  
  const handleLoginError = (error: any) => {
    console.error('Login error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
        if (error.response.status === 400) {
          const errorMessage = error.response.data?.message || 
                               error.response.data?.error ||
                               'Invalid username or password. Please try again.';
          setError(`Login failed: ${errorMessage}`);
        } else if (error.response.status === 401) {
          setError('Authentication failed: Invalid username or password.');
        } else if (error.response.status === 403) {
          setError('Access denied: You do not have permission to log in.');
        } else if (error.response.status >= 500) {
          setError(`Server error (${error.response.status}): The server is experiencing issues. Please try again later.`);
        } else {
          const errorMessage = error.response.data?.message || 
                               error.response.data?.error || 
                               `Error ${error.response.status}: ${error.response.statusText}`;
          setError(errorMessage);
        }
      } else if (error.request) {
        if (error.code === 'ECONNABORTED') {
          setError('Request timeout: The server took too long to respond. Please check your connection and try again.');
        } else {
          setError('No response from server. Please check your connection and verify the backend service is running.');
        }
      } else {
        setError(error.message || 'An error occurred during login');
      }
    } else if (error instanceof TypeError && error.message.includes('Network')) {
      setError('Network error: Unable to connect to the server. Please check your internet connection.');
    } else {
      setError(error.message || 'An unknown error occurred');
    }
    
    setIsLoading(false);
  };

  const onSubmit2FA = async (data: TwoFactorFormInputs) => {
    if (!loginCredentials) {
      setError('Login credentials lost. Please try again.');
      setShow2FADialog(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.login(
        loginCredentials.username,
        loginCredentials.password,
        data.verificationCode,
        data.rememberDevice
      );

      console.log('2FA login response:', response);

      if (response) {
        const accessToken = response.access || response.token;
        const userData = response.user;
        
        if (!accessToken) {
          throw new Error('No access token received from server');
        }
        
        localStorage.setItem('access_token', accessToken);
        
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        dispatch(setCredentials({
          user: userData,
          token: accessToken
        }));
        
        setShow2FADialog(false);
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorMessage = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
          setError(errorMessage);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError(err.message || 'An error occurred during 2FA verification');
        }
      } else {
        setError(err.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestEmailCode = async () => {
    if (!loginCredentials) {
      setError('Login credentials lost. Please try again.');
      setShow2FADialog(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await AuthService.requestEmailCode(
        loginCredentials.username,
        loginCredentials.password
      );

      if (response.success) {
        setEmailCodeSent(true);
        setError('');
      } else {
        throw new Error(response.message || 'Failed to send email code');
      }
    } catch (err: any) {
      console.error('Email code request error:', err);
      
      if (axios.isAxiosError(err)) {
        if (err.response) {
          const errorMessage = err.response.data?.message || `Error ${err.response.status}: ${err.response.statusText}`;
          setError(errorMessage);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError(err.message || 'An error occurred requesting email code');
        }
      } else {
        setError(err.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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

  const handleOpenForgotPassword = () => {
    setIsForgotPasswordOpen(true);
    setForgotPasswordMessage('');
    setForgotPasswordError('');
  };

  const handleCloseForgotPassword = () => {
    setIsForgotPasswordOpen(false);
    setForgotPasswordEmail('');
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPasswordEmail || !/^\S+@\S+\.\S+$/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Please enter a valid email address.');
      return;
    }
    setForgotPasswordLoading(true);
    setForgotPasswordMessage('');
    setForgotPasswordError('');

    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email: forgotPasswordEmail });
      console.log(`Forgot password request successful for: ${forgotPasswordEmail}`, response.data);

      setForgotPasswordMessage(response.data.message || 'If an account with this email exists, a password reset link has been sent.');
      setTimeout(handleCloseForgotPassword, 3000);
      
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to send reset link. Please check the email address or try again later.';
      setForgotPasswordError(errorMessage);
    } finally {
      setForgotPasswordLoading(false);
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
            component="button"
            variant="body2"
            onClick={handleOpenForgotPassword}
            sx={{
              color: theme.palette.primary.light,
              cursor: 'pointer',
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
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
        </Box>
      </Box>
      
      <Dialog 
        open={show2FADialog} 
        onClose={() => setShow2FADialog(false)}
        PaperComponent={(props) => (
          <Paper 
            {...props} 
            sx={{
              ...glassStyles.card,
              maxWidth: '400px',
              width: '100%',
            }}
          />
        )}
      >
        <DialogTitle sx={{ ...glassStyles.text.primary, textAlign: 'center' }}>
          Two-Factor Authentication
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                backgroundColor: 'rgba(211, 47, 47, 0.15)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                '& .MuiAlert-icon': {
                  color: '#fff'
                }
              }}
            >
              {error}
            </Alert>
          )}
          
          <Typography sx={{ ...glassStyles.text.secondary, mb: 2 }}>
            {twoFactorMethod === 'app' 
              ? 'Enter the verification code from your authenticator app.' 
              : 'Enter the verification code sent to your email.'}
          </Typography>
          
          {twoFactorMethod === 'email' && !emailCodeSent && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                onClick={handleRequestEmailCode}
                disabled={isLoading}
                fullWidth
                sx={glassStyles.button}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Verification Code'}
              </Button>
            </Box>
          )}
          
          {(twoFactorMethod === 'app' || emailCodeSent) && (
            <Box component="form" onSubmit={formSubmit2FA(onSubmit2FA)}>
              <TextField
                label="Verification Code"
                fullWidth
                {...register2FA('verificationCode')}
                error={!!errors2FA.verificationCode}
                helperText={errors2FA.verificationCode?.message}
                variant="outlined"
                margin="normal"
                InputLabelProps={{
                  style: glassStyles.inputLabel
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': glassStyles.input,
                }}
              />
              
              <FormControlLabel
                control={
                  <Checkbox 
                    {...register2FA('rememberDevice')} 
                    defaultChecked
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&.Mui-checked': {
                        color: 'rgba(255, 255, 255, 0.9)',
                      },
                    }}
                  />
                }
                label={<Typography sx={glassStyles.text.secondary}>Remember this device for 90 days</Typography>}
              />
              
              <DialogActions sx={{ mt: 2, px: 0 }}>
                <Button 
                  onClick={() => setShow2FADialog(false)} 
                  sx={{ ...glassStyles.text.secondary, '&:hover': { color: 'white' } }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  sx={glassStyles.button}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Verify'}
                </Button>
              </DialogActions>
            </Box>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isForgotPasswordOpen} onClose={handleCloseForgotPassword} 
        PaperProps={{ 
          sx: {
            ...glassStyles.card,
            padding: 0,
            border: `1px solid rgba(255, 255, 255, 0.2)`
          } 
        }}
      >
        <DialogTitle sx={{ ...glassStyles.text.primary, p: 3, pb: 2, borderBottom: `1px solid rgba(255, 255, 255, 0.12)` }}>Reset Password</DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText sx={{ ...glassStyles.text.secondary, mb: 3 }}>
            Enter your email address below, and we'll send you a link to reset your password.
          </DialogContentText>
          
          {forgotPasswordMessage && (
            <Alert 
              severity="success" 
              icon={false}
              sx={{ 
                mb: 2, 
                backgroundColor: 'rgba(76, 175, 80, 0.15)',
                backdropFilter: 'blur(5px)',
                color: '#e8f5e9',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '8px',
              }}
            >
              {forgotPasswordMessage}
            </Alert>
          )}
          {forgotPasswordError && (
            <Alert 
              severity="error" 
              icon={false}
              sx={{ 
                mb: 2, 
                backgroundColor: 'rgba(211, 47, 47, 0.15)',
                backdropFilter: 'blur(5px)',
                color: '#ffcdd2',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                borderRadius: '8px',
              }}
            >
              {forgotPasswordError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            id="forgot-email"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={forgotPasswordEmail}
            onChange={(e) => {
              setForgotPasswordEmail(e.target.value);
              if (forgotPasswordError) setForgotPasswordError(''); 
            }}
            disabled={forgotPasswordLoading}
            InputLabelProps={{ 
              style: glassStyles.inputLabel
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': glassStyles.input
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, borderTop: `1px solid rgba(255, 255, 255, 0.12)` }}>
          <Button 
            onClick={handleCloseForgotPassword} 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              mr: 1, 
              textTransform: 'none',
              '&:hover': { 
                backgroundColor: 'rgba(255, 255, 255, 0.08)'
              } 
            }}
          >
              Cancel
          </Button> 
          <Button 
            onClick={handleForgotPasswordSubmit} 
            variant="contained" 
            disabled={forgotPasswordLoading || !forgotPasswordEmail}
            sx={{ 
              ...glassStyles.button,
              textTransform: 'none',
            }} 
          >
            {forgotPasswordLoading ? <CircularProgress size={24} sx={{ color: 'white' }}/> : 'Send Reset Link'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <LoginFooter />
    </Box>
  );
};

export default Login;
