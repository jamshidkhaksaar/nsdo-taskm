import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Tab,
  Tabs,
  FormControl,
  FormControlLabel,
  Switch,
  RadioGroup,
  Radio,
  CircularProgress,
  useTheme,
  Checkbox,
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { SettingsService } from '../services/settings';
import { getGlassmorphismStyles } from '../utils/glassmorphismStyles';
import ModernDashboardLayout from '../components/dashboard/ModernDashboardLayout';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import { alpha } from '@mui/material/styles';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const DRAWER_WIDTH = 240;

const Settings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [configured2FAMethod, setConfigured2FAMethod] = useState<'app' | 'email' | null>(null);
  const [setupStage, setSetupStage] = useState<'none' | 'selectingMethod' | 'awaitingAppVerification' | 'awaitingEmailVerification' | 'verifying'>('none');
  const [selectedSetupMethod, setSelectedSetupMethod] = useState<'app' | 'email'>('app');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberDeviceForSetup, setRememberDeviceForSetup] = useState(true);
  const [loading, setLoading] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [notifications, setNotifications] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);
  
  const theme = useTheme();
  const glassStyles = getGlassmorphismStyles(theme);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  React.useEffect(() => {
    document.title = `Settings - ${user?.username || 'User'}`;
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await SettingsService.updatePassword(currentPassword, newPassword, confirmPassword);
      setSuccess('Password updated successfully - you will not be logged out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch 2FA status
        await fetch2FAStatus();
        
        // Fetch other settings if needed
        // ...
        
      } catch (error) {
        console.error('Error fetching initial settings data:', error);
      }
    };
    
    fetchInitialData();
    
    // Set up a periodic check for 2FA status (every 30 seconds) to keep UI in sync
    const interval = setInterval(() => {
      fetch2FAStatus().catch(error => 
        console.error('Error in periodic 2FA status check:', error)
      );
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetch2FAStatus = async () => {
    try {
      const status = await SettingsService.get2FAStatus();
      console.log('Fetched 2FA status:', status);
      setTwoFactorEnabled(status.enabled);
      setConfigured2FAMethod(status.method as ('app' | 'email' | null) || null);
      if (status.enabled) {
        setSetupStage('none');
        setQrCodeUrl(null);
        setVerificationCode('');
      }
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleInitiate2FASetup = async () => {
    setError(null);
    setSuccess(null);
    setTwoFaLoading(true);
    setQrCodeUrl(null);
    setVerificationCode('');

    try {
      console.log(`Initiating 2FA setup with method: ${selectedSetupMethod}`);
      const response = await SettingsService.setup2FA(true, selectedSetupMethod);
      console.log('2FA setup initiation response:', response);

      if (selectedSetupMethod === 'app') {
        if (response.qr_code) {
          setQrCodeUrl(response.qr_code);
          setSetupStage('awaitingAppVerification');
          setSuccess('Scan the QR code with your authenticator app and enter the verification code.');
        } else {
          throw new Error('QR code was not returned for app-based 2FA setup.');
        }
      } else if (selectedSetupMethod === 'email') {
        setSetupStage('awaitingEmailVerification');
        setSuccess(response.message || 'A verification code has been sent to your email.');
      }
    } catch (err: any) {
      console.error('Error initiating 2FA setup:', err);
      setError(err.response?.data?.message || 'Failed to initiate 2FA setup. Please try again.');
      setSetupStage('selectingMethod');
    } finally {
      setTwoFaLoading(false);
    }
  };
  
  const handleDisable2FA = async () => {
    setError(null);
    setSuccess(null);
    setTwoFaLoading(true);
    try {
      await SettingsService.setup2FA(false);
      setSuccess('Two-Factor Authentication has been disabled.');
      setTwoFactorEnabled(false);
      setConfigured2FAMethod(null);
      setSetupStage('none');
      setQrCodeUrl(null);
      await fetch2FAStatus();
    } catch (err: any) {
      console.error('Error disabling 2FA:', err);
      setError(err.response?.data?.message || 'Failed to disable 2FA. Please try again.');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerifyAndActivate2FA = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError('Verification code must be 6 digits.');
      return;
    }
    setError(null);
    setSuccess(null);
    setTwoFaLoading(true);
    try {
      const verificationResult = await SettingsService.verify2FA(verificationCode.trim(), rememberDeviceForSetup);
      if (verificationResult.success) {
        setSuccess('Two-Factor Authentication has been successfully enabled!');
        setTwoFactorEnabled(true);
        setConfigured2FAMethod(selectedSetupMethod);
        setSetupStage('none');
        setQrCodeUrl(null);
        setVerificationCode('');
        await fetch2FAStatus();
      } else {
        setError(verificationResult.message || 'Verification failed. Please check the code and try again.');
      }
    } catch (err: any) {
      console.error('Error verifying 2FA code:', err);
      setError(err.response?.data?.message || 'Failed to verify the code. Please try again.');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleResendEmailCodeForSetup = async () => {
    setError(null);
    setSuccess(null);
    setTwoFaLoading(true);
    try {
      const response = await SettingsService.setup2FA(true, 'email');
      setSuccess(response.message || 'A new verification code has been sent to your email.');
    } catch (err: any) {
      console.error('Error resending 2FA email code:', err);
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setTwoFaLoading(false);
    }
  };
  
  const cancelSetup = () => {
    setSetupStage('none');
    setQrCodeUrl(null);
    setVerificationCode('');
    setError(null);
    setSuccess(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  const handleNotificationClick = () => {
    setNotifications(0);
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const mainContent = (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="lg">
        <Card sx={{
          borderRadius: 2,
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          mb: 4,
        }}>
          <CardContent>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
              Account Settings
            </Typography>
            
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="settings tabs"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: 'white',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#2196f3',
                },
                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                mb: 2,
              }}
            >
              <Tab 
                icon={<LockIcon />} 
                label="Password" 
                id="settings-tab-0"
                aria-controls="settings-tabpanel-0"
              />
              <Tab 
                icon={<SecurityIcon />} 
                label="Security" 
                id="settings-tab-1"
                aria-controls="settings-tabpanel-1"
              />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Change Password
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputLabelProps={{
                      style: glassStyles.inputLabel
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': glassStyles.input,
                    }}
                  />
                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputLabelProps={{
                      style: glassStyles.inputLabel
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': glassStyles.input,
                    }}
                  />
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    InputLabelProps={{
                      style: glassStyles.inputLabel
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': glassStyles.input,
                    }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Button 
                      variant="contained" 
                      onClick={handleChangePassword}
                      disabled={loading}
                      sx={glassStyles.button}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Change Password'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                Two-Factor Authentication
              </Typography>
              
              {/* Loading indicator for 2FA operations */}
              {twoFaLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

              {/* Error and Success Alerts */}
              {error && (
                <Alert severity="error" sx={{ mb: 2, backgroundColor: 'rgba(211, 47, 47, 0.1)', color: '#ff5252' }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2, backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#69f0ae' }} onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {/* === Case 1: 2FA IS ENABLED === */}
              {twoFactorEnabled && configured2FAMethod && (
                <Box>
                  <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
                    Two-Factor Authentication is currently <strong style={{ color: theme.palette.success.light }}>ENABLED</strong>.
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                    Method: <strong style={{ textTransform: 'capitalize' }}>{configured2FAMethod}</strong>
                  </Typography>
                  <Button 
                    variant="contained" 
                    onClick={handleDisable2FA}
                    disabled={twoFaLoading}
                    sx={{ ...glassStyles.button, backgroundColor: theme.palette.error.main, '&:hover': { backgroundColor: theme.palette.error.dark } }}
                  >
                    {twoFaLoading ? <CircularProgress size={24} /> : 'Disable Two-Factor Authentication'}
                  </Button>
                </Box>
              )}

              {/* === Case 2: 2FA IS DISABLED (or setup was cancelled/failed) === */}
              {/* This section handles the entire enabling process from scratch or re-enabling */}
              {!twoFactorEnabled && (
                <Box>
                  {setupStage === 'none' && (
                    <>
                      <Typography variant="body1" sx={{ color: 'white', mb: 2 }}>
                        Enhance your account security by enabling Two-Factor Authentication.
                      </Typography>
                      <Button 
                        variant="contained" 
                        onClick={() => {
                          setError(null); 
                          setSuccess(null); 
                          setSetupStage('selectingMethod');
                        }}
                        disabled={twoFaLoading}
                        sx={glassStyles.button}
                      >
                        Enable Two-Factor Authentication
                      </Button>
                    </>
                  )}

                  {setupStage === 'selectingMethod' && (
                    <FormControl component="fieldset" sx={{ mb: 2, display: 'block' }}>
                      <Typography variant="body1" gutterBottom sx={{ color: 'white', mb: 1 }}>
                        Select 2FA Method:
                      </Typography>
                      <RadioGroup
                        value={selectedSetupMethod}
                        onChange={(e) => setSelectedSetupMethod(e.target.value as 'app' | 'email')}
                        row
                      >
                        <FormControlLabel 
                          value="app" 
                          control={<Radio sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: 'white' } }} />} 
                          label={<Typography sx={{ color: 'white' }}>Authenticator App</Typography>} 
                        />
                        <FormControlLabel 
                          value="email" 
                          control={<Radio sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: 'white' } }} />} 
                          label={<Typography sx={{ color: 'white' }}>Email</Typography>} 
                        />
                      </RadioGroup>
                      <Box sx={{mt: 2, display: 'flex', gap: 2}}>
                        <Button 
                          variant="contained" 
                          onClick={handleInitiate2FASetup}
                          disabled={twoFaLoading}
                          sx={glassStyles.button}
                        >
                          {twoFaLoading ? <CircularProgress size={24} /> : `Setup with ${selectedSetupMethod === 'app' ? 'Authenticator App' : 'Email'}`}
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={cancelSetup}
                          disabled={twoFaLoading}
                          sx={{ ...glassStyles.button, borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </FormControl>
                  )}

                  {/* Stages for App Verification */}
                  {setupStage === 'awaitingAppVerification' && qrCodeUrl && (
                    <Box sx={{ mt: 2, p: 2, ...glassStyles.card }}>
                      <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                        Scan this QR code with your authenticator app:
                      </Typography>
                      <Box sx={{ textAlign: 'center', my: 2 }}>
                        <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: '200px', height: '200px', background: 'white', padding: '10px', borderRadius: '8px' }} />
                      </Box>
                      <TextField
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ style: glassStyles.inputLabel }}
                        sx={{ '& .MuiOutlinedInput-root': glassStyles.input }}
                        inputProps={{ maxLength: 6, pattern: "\\d*" }}
                      />
                      <FormControlLabel
                        control={
                          <Switch /* Using Switch from MUI, not Checkbox */
                            checked={rememberDeviceForSetup}
                            onChange={(e) => setRememberDeviceForSetup(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: theme.palette.primary.main }
                            }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Remember this browser for 90 days</Typography>}
                      />
                      <Box sx={{mt: 2, display: 'flex', gap: 2}}>
                        <Button 
                          variant="contained" 
                          onClick={handleVerifyAndActivate2FA}
                          disabled={twoFaLoading || verificationCode.length !== 6}
                          sx={glassStyles.button}
                        >
                          {twoFaLoading ? <CircularProgress size={24} /> : 'Verify and Enable'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={cancelSetup}
                          disabled={twoFaLoading}
                          sx={{ ...glassStyles.button, borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
                        >
                          Cancel Setup
                        </Button>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Stages for Email Verification */}
                  {setupStage === 'awaitingEmailVerification' && (
                    <Box sx={{ mt: 2, p: 2, ...glassStyles.card }}>
                      <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                        A verification code has been sent to your email ({user?.email}).
                      </Typography>
                      <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                        Enter the code below to complete setup.
                      </Typography>
                      <TextField
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ style: glassStyles.inputLabel }}
                        sx={{ '& .MuiOutlinedInput-root': glassStyles.input }}
                        inputProps={{ maxLength: 6, pattern: "\\d*" }}
                      />
                      <FormControlLabel
                        control={
                          <Switch /* Using Switch from MUI, not Checkbox */
                            checked={rememberDeviceForSetup}
                            onChange={(e) => setRememberDeviceForSetup(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: 'white' },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: theme.palette.primary.main }
                            }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Remember this browser for 90 days</Typography>}
                      />
                      <Box sx={{mt: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center'}}>
                        <Button 
                          variant="contained" 
                          onClick={handleVerifyAndActivate2FA}
                          disabled={twoFaLoading || verificationCode.length !== 6}
                          sx={glassStyles.button}
                        >
                          {twoFaLoading ? <CircularProgress size={24} /> : 'Verify and Enable'}
                        </Button>
                        <Button
                          variant="text"
                          onClick={handleResendEmailCodeForSetup}
                          disabled={twoFaLoading}
                          sx={{ color: theme.palette.info.light, textTransform: 'none' }}
                        >
                          {twoFaLoading ? <CircularProgress size={20} /> : 'Resend Code'}
                        </Button>
                      </Box>
                      <Button 
                        variant="outlined" 
                        onClick={cancelSetup}
                        disabled={twoFaLoading}
                        fullWidth
                        sx={{ ...glassStyles.button, borderColor: 'rgba(255,255,255,0.5)', color: 'white', mt: 2 }}
                      >
                        Cancel Setup
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={isSidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username={user?.username || 'User'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={handleNotificationClick}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onHelpClick={handleHelpClick}
          onToggleTopWidgets={handleToggleTopWidgets}
          topWidgetsVisible={topWidgetsVisible}
        />
      }
      mainContent={mainContent}
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default Settings; 