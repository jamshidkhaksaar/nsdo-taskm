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
import { useNavigate, useLocation } from 'react-router-dom';
import { clearError, setCredentials, logout } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { AuthUser } from '../types/auth';
import logo from '../assets/images/logo.png';
import { loadFull } from "tsparticles";
import type { Engine, Container as ParticlesContainer } from "tsparticles-engine";
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
import { Turnstile } from '@marsidev/react-turnstile';
import TwoFactorAuthPopup from '../components/auth/TwoFactorAuthPopup';

interface LoginFormInputs {
  username: string;
  password: string;
  rememberMe: boolean;
  captchaToken?: string;
}

interface TwoFactorFormInputs {
  verificationCode: string;
  rememberDevice: boolean;
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

const Login: React.FC = () => {
  console.log('[Login.tsx] Login component rendering/re-rendering START');

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const glassStyles = getGlassmorphismStyles(theme);

  // --- State Variables ---
  const [localIsLoading, setLocalIsLoading] = useState(true); // For initial cosmetic load
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState<LoginFormInputs | null>(null);
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null); // Store UserID for 2FA calls
  const [twoFactorMethod, setTwoFactorMethod] = useState<string | undefined>(undefined); // 'app' or 'email'
  const [captchaToken, setCaptchaToken] = useState<string | null>("captcha-disabled-for-dev"); // Temporary
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [is2FASubmitting, setIs2FASubmitting] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);

  const { user, isAuthenticated, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const from = (location.state as any)?.from?.pathname || '/dashboard';
  const turnstileSiteKey = import.meta.env.VITE_APP_TURNSTILE_SITE_KEY;

  // Define particles callbacks
  const particlesInit = useCallback(async (engine: Engine) => {
    console.log("Particles engine init");
    await loadFull(engine);
  }, []);
  const particlesLoaded = useCallback(async (container: ParticlesContainer | undefined) => {
    console.log("Particles container loaded, ID:", container?.id);
  }, []);

  // --- Effects ---
  // Initial cosmetic loading (1 second)
  useEffect(() => {
    console.log('[Login.tsx] Initial 1s localIsLoading effect. Current localIsLoading:', localIsLoading);
    const timer = setTimeout(() => {
      console.log('[Login.tsx] Initial 1s localIsLoading timer FINISHED. Setting localIsLoading to false.');
      setLocalIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // Runs once on mount

  // Handle actions based on authentication state
  useEffect(() => {
    console.log(`[Login.tsx] Auth effect. isAuthenticated: ${isAuthenticated}, user: ${!!user}, path: ${location.pathname}, authLoading: ${authLoading}`);
    if (isAuthenticated) {
      if (location.pathname === '/login') {
        // Authenticated but on the login page. This might be after a successful login 
        // before redirect, or user manually navigated here.
        // If user object is present & role is fine, navigation will happen based on 'from'.
        // If role is problematic (e.g. empty), we want to allow the form to be shown if localIsLoading is false.
        console.warn('[Login.tsx] Auth effect: Authenticated and on /login page.');
        if (user && (!user.role || typeof user.role !== 'string' || user.role.trim() === '')) {
            console.warn('[Login.tsx] Auth effect: Authenticated user on /login has problematic role. Ensuring localIsLoading is false to show form.');
            if (localIsLoading) setLocalIsLoading(false); // Override initial load if role is bad
        } else if (user) { // Role seems okay, proceed with normal redirect logic
            const redirectTo = from === '/login' ? '/dashboard' : from;
            console.log(`[Login.tsx] Auth effect: Authenticated user (role ok) on /login, redirecting to: ${redirectTo}`);
            navigate(redirectTo, { replace: true });
        } else { // Authenticated but no user object - this is an inconsistent state.
            console.error('[Login.tsx] Auth effect: Authenticated but no user object on /login. Dispatching logout.');
            dispatch(logout());
            if (localIsLoading) setLocalIsLoading(false); // Ensure loading screen hides
        }
      } else { // Authenticated and NOT on /login page - normal redirect to intended page.
        const redirectTo = from === '/login' ? '/dashboard' : from;
        console.log(`[Login.tsx] Auth effect: Authenticated and NOT on /login. Redirecting to: ${redirectTo}`);
        navigate(redirectTo, { replace: true });
      }
    } else {
      // Not authenticated. Ensure localIsLoading can complete its 1s timer.
      // If localIsLoading is already false, do nothing here.
      console.log('[Login.tsx] Auth effect: Not authenticated.');
    }
  }, [isAuthenticated, user, authLoading, navigate, location, from, dispatch, localIsLoading]);

  // Clear error on unmount
  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  // --- Form Setup ---
  const { register, handleSubmit: formSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
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

  // --- Event Handlers (onSubmit, handleSuccessfulLogin, handleLoginError etc.) ---
  // Ensure these functions use setLocalIsLoading(true/false) appropriately if they manage a loading state during API calls
  // For example, in onSubmit: setLocalIsLoading(true) at start, setLocalIsLoading(false) in finally.
  // However, the main submit button uses `authLoading || isSubmitting` for its disabled/spinner state.

  const handleSuccessfulLogin = (responseData: any) => {
    console.log('[Login.tsx] Entering handleSuccessfulLogin. Response data:', JSON.stringify(responseData, null, 2));
    const accessToken = responseData.access || responseData.token || responseData.accessToken;
    const refreshToken = responseData.refresh || responseData.refreshToken;
    const rawUserData = responseData.user || {}; 
    if (!accessToken) {
      setError('Invalid response from server: No access token provided');
      return;
    }

    // Extract permissions
    let permissions: string[] = [];
    if (rawUserData.role && typeof rawUserData.role === 'object' && Array.isArray(rawUserData.role.permissions)) {
      permissions = rawUserData.role.permissions.map((perm: any) => perm.name).filter((name: any) => typeof name === 'string');
    } else if (Array.isArray(rawUserData.permissions)) { // Fallback if permissions are directly on user
      permissions = rawUserData.permissions.map((perm: any) => typeof perm === 'string' ? perm : perm.name).filter((name: any) => typeof name === 'string');
    }
    console.log('[Login.tsx] Extracted permissions:', permissions);

    const processedUser: AuthUser = {
      ...rawUserData, // Spread raw user data first
      id: String(rawUserData.id || ''), 
      email: rawUserData.email || '',
      first_name: rawUserData.first_name || '', 
      last_name: rawUserData.last_name || '',
      username: rawUserData.username || '', 
      created_at: rawUserData.created_at || new Date().toISOString(),
      updated_at: rawUserData.updated_at || new Date().toISOString(),
      role: (rawUserData.role && typeof rawUserData.role === 'object' && rawUserData.role.name) 
            ? String(rawUserData.role.name) 
            : (typeof rawUserData.role === 'string' ? rawUserData.role : 'user'),
      permissions: permissions, // Assign extracted permissions
      // Ensure all BaseUser fields are present even if not in rawUserData, or TS will complain
      department: rawUserData.department || undefined,
      avatar: rawUserData.avatar || undefined,
    };

    console.log('[Login.tsx] Processed user for Redux store:', JSON.stringify(processedUser, null, 2));

    dispatch(setCredentials({ 
      user: processedUser, 
      token: accessToken, 
      refreshToken: refreshToken 
    }));
    
    // No longer setting localIsLoading here, auth effect handles it.
    // setShow2FADialog(false); // Close 2FA dialog if it was open

    // Navigation is handled by the useEffect hook watching isAuthenticated
    // navigate(from, { replace: true }); 
    // Let's be very explicit that the 'from' could be /login itself, if so, default to /dashboard
    const redirectTo = from === '/login' ? '/dashboard' : from;
    console.log(`[Login.tsx] Successful login, attempting to navigate to: ${redirectTo}`);
    // navigate(redirectTo, { replace: true }); // This is now handled by useEffect
  };

  const handleLoginError = (errorData: any) => {
    console.error('[Login.tsx] handleLoginError invoked:', errorData);
    // Simplified: Set error string based on errorData
    if (typeof errorData === 'string') setError(errorData);
    else if (errorData?.message) setError(errorData.message);
    else setError('Login failed. Please check details and try again.');
  };

  const onSubmit = async (data: LoginFormInputs) => {
    console.log('[Login.tsx] onSubmit function entered. Data:', JSON.stringify(data, null, 2));
    setError(''); // Clear previous errors
    // authLoading will be true via Redux if loginAsync is dispatched. We don't need setLocalIsLoading(true) here for the API call itself.

    // if (!captchaToken) {
    //   console.warn('[Login.tsx] onSubmit: captchaToken is missing. Aborting.');
    //   setError('CAPTCHA verification incomplete. Please wait or refresh.');
    //   return;
    // }
    // console.log('[Login.tsx] onSubmit: Captcha token present:', captchaToken);

    try {
      if (data.rememberMe) localStorage.setItem('rememberedUsername', data.username);
      else localStorage.removeItem('rememberedUsername');
      setLoginCredentials(data); // For 2FA if needed

      // We are not using loginAsync from slice here directly, but AuthService.login
      // AuthService.login itself does not set authLoading in Redux. So, the button spinner is from isSubmitting.
      const response = await AuthService.login(data.username, data.password, captchaToken);
      console.log('[Login.tsx] AuthService.login response in onSubmit:', JSON.stringify(response, null, 2));
      console.log('[Login.tsx] Raw response.method from AuthService.login:', response.method);

      // UPDATED CHECK: Use 'twoFactorRequired' and capture 'userId'
      if (response.twoFactorRequired && response.userId) {
        console.log('[Login.tsx] 2FA is needed. Storing userId and showing 2FA dialog. UserId:', response.userId);
        setLoginCredentials(data); // Keep original credentials
        setTwoFactorUserId(response.userId); // Store the userId
        // Set the 2FA method, fallback to 'app' if response.method is undefined
        setTwoFactorMethod(response.method || 'app'); 
        setShow2FADialog(true); 
      } else if (response.access) { // If not 2FA, expect access token for successful login
        console.log('[Login.tsx] No 2FA needed or already handled. Calling handleSuccessfulLogin.');
        handleSuccessfulLogin(response);
      } else {
        // Handle unexpected response (neither 2FA required nor tokens)
        console.error('[Login.tsx] Unexpected login response:', response);
        handleLoginError('Unexpected response from server during login.');
      }
    } catch (err: any) {
      console.error('[Login.tsx] Error in onSubmit after AuthService.login call:', err);
      if (err.response) console.error('[Login.tsx] Error response data:', JSON.stringify(err.response.data, null, 2));
      handleLoginError(err.response?.data || err.message || 'An unexpected error occurred during login.');
    }
    // No finally block needed to set localIsLoading false, as primary loading is authLoading/isSubmitting for button
  };

  const handleRequestEmailCode = async () => {
    if (!twoFactorUserId) {
      setError('User information not available to resend code. Please try logging in again.');
      return;
    }
    setIsResendingCode(true);
    setError('');
    try {
      // Use the new service method that only requires userId
      const response = await AuthService.resendLoginOtp(twoFactorUserId);
      // Assuming the popup itself will show success/error messages from its own state
      // Or, we can set a general success message here if needed.
      console.log(response.message); // Or display it in a snackbar
      // No need to set success on the main login form, popup handles its feedback.
    } catch (err: any) {
      setError(err.message || 'Failed to resend 2FA code. Please try again.');
    } finally {
      setIsResendingCode(false);
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

  // Define onSubmit2FA (REMOVE duplicate useState calls from here)
  const onSubmit2FA = async (data: TwoFactorFormInputs) => {
    if (!twoFactorUserId) {
      setError('User ID for 2FA not found. Please login again.');
      setShow2FADialog(false);
      return;
    }
    if (!loginCredentials) {
        setError('Login session expired (credentials missing). Please login again.');
        setShow2FADialog(false);
        return;
    }
    console.log('[Login.tsx] onSubmit2FA called with data:', data, 'for userId:', twoFactorUserId);
    setError('');
    setIs2FASubmitting(true); // Start 2FA submission loading

    // Captcha token is usually for the primary login, not typically re-used for 2FA step.
    // If your backend AuthService.login2FA *requires* it, ensure it's available or re-fetched.
    // For now, assuming it's not needed based on typical 2FA flows.
    /*
    if (!captchaToken) {
      setError('CAPTCHA verification incomplete or expired. Please refresh or re-verify.');
      setIs2FASubmitting(false);
      return;
    }
    */

    try {
      const loginResponse = await AuthService.login2FA(
        twoFactorUserId,
        data.verificationCode,
        data.rememberDevice 
      );
      console.log('[Login.tsx] 2FA login response:', loginResponse);
      handleSuccessfulLogin(loginResponse);
      setShow2FADialog(false);
    } catch (err: any) {
      console.error('[Login.tsx] 2FA verification failed:', err);
      if (err.response && err.response.status === 401) {
        setError('Invalid verification code. Please try again.');
      } else {
        setError(err.response?.data?.message || err.message || 'An error occurred during 2FA verification');
      }
    } finally {
      setIs2FASubmitting(false); // Stop 2FA submission loading
    }
  };

  // Log validation errors if any
  if (Object.keys(errors).length > 0) {
    console.warn('[Login.tsx] Form validation errors:', errors);
  }

  // Log button disabled state
  console.log(`[Login.tsx] Submit button state: localIsLoading=${localIsLoading}, authLoading=${authLoading}, captchaToken=${captchaToken}, isSubmitting=${isSubmitting}`);

  // --- Render Logic ---
  console.log(`[Login.tsx] Pre-return: localIsLoading=${localIsLoading}, authLoading=${authLoading}, isAuthenticated=${isAuthenticated}, userExists=${!!user}`);
  console.log(`[Login.tsx] twoFactorMethod state just before main return:`, twoFactorMethod); // Log here

  if (localIsLoading && !isAuthenticated) {
    return <LoadingScreen message="Initializing login..." />;
  }

  // If authenticated and user object exists with a role, useEffect will navigate.
  // If authenticated but user object is problematic (e.g. no role after login), 
  // we might fall through here. LoadingScreen for authLoading handles this better.
  if (authLoading && !error) {
      return <LoadingScreen message="Authenticating..." />;
  }

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
        noValidate
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
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            autoComplete="username"
            autoFocus
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
            InputLabelProps={{ sx: glassStyles.inputLabel }}
            InputProps={{ sx: glassStyles.input }}
            sx={{ width: '100%' }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            InputLabelProps={{ sx: glassStyles.inputLabel }}
            InputProps={{
              sx: glassStyles.input,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    sx={{ color: glassStyles.text.muted.color }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: '100%' }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox 
                value="remember"
                {...register('rememberMe')}
                sx={{ 
                  color: glassStyles.text.muted.color,
                  '&.Mui-checked': { color: glassStyles.text.primary.color }
                }}
              />
            }
            label="Remember me"
            sx={{ label: { color: glassStyles.text.secondary.color } }}
          />
          <MuiLink 
            component="button"
            variant="body2" 
            onClick={handleOpenForgotPassword}
            sx={{ 
              color: glassStyles.text.primary.color,
              cursor: 'pointer', 
              textDecoration: 'none', 
              '&:hover': { textDecoration: 'underline' } 
            }}
          >
            Forgot password?
          </MuiLink>
        </Box>

        <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
          {/* {turnstileSiteKey ? (
            <Turnstile 
              siteKey={turnstileSiteKey}
              onSuccess={(token) => {
                console.log('[Login.tsx] Turnstile onSuccess. Token received:', token);
                setCaptchaToken(token);
                console.log('[Login.tsx] Turnstile Success - Captcha token SHOULD be set. Button should enable if not (authLoading || isSubmitting).');
              }}
              onError={() => { 
                console.warn('[Login.tsx] Turnstile onError triggered.'); 
                setError('CAPTCHA challenge failed. Please refresh.'); 
                setCaptchaToken(null);
              }}
              onExpire={() => { 
                console.warn('[Login.tsx] Turnstile onExpire triggered.'); 
                setError('CAPTCHA expired. Please refresh.'); 
                setCaptchaToken(null);
              }}
              options={{
                theme: theme.palette.mode,
                size: 'normal'
              }}
            />
          ) : (
            <Alert severity="warning">
              CAPTCHA is not configured. Please contact support.
            </Alert>
          )} */}
          <Alert severity="info">CAPTCHA temporarily disabled for development.</Alert>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={glassStyles.button}
          // disabled={authLoading || isSubmitting || !captchaToken}
          disabled={authLoading || isSubmitting}
        >
          {(authLoading || isSubmitting) ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
        </Button>

      </Box>
      
      {console.log('[Login.tsx] twoFactorMethod state before passing to TwoFactorAuthPopup:', twoFactorMethod)}
      <TwoFactorAuthPopup
        open={show2FADialog}
        onClose={() => {
          setShow2FADialog(false);
          setError(''); // Clear any 2FA specific errors when closing manually
        }}
        onSubmit={onSubmit2FA}
        loading={is2FASubmitting} // Use dedicated loading state for 2FA
        error={error} // Pass the general error state, which onSubmit2FA updates
        twoFactorMethod={twoFactorMethod as 'app' | 'email'} // Pass the determined method
        onResendEmailCode={handleRequestEmailCode}
        isResendingEmail={isResendingCode}
      />
      
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
              sx: glassStyles.inputLabel
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
