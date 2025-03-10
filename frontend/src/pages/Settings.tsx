import React, { useState, useEffect } from 'react';
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
import { standardBackgroundStyle } from '../utils/backgroundStyles';
import { getGlassmorphismStyles } from '../utils/glassmorphismStyles';

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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [exportOption] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState('app');
  const [emailSent, setEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
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
      setTwoFactorMethod(status.method || 'app');
      
      // Clear QR code if 2FA is already enabled (no need to show it again)
      if (status.enabled) {
        setQrCode('');
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
      // Don't update the UI state on error to prevent flickering
    }
  };

  const handleSetup2FA = async () => {
    try {
      console.log(`Setting up 2FA to ${!twoFactorEnabled ? 'enabled' : 'disabled'}`);
      const newEnabledState = !twoFactorEnabled; // Store the new state we're setting
      const response = await SettingsService.setup2FA(newEnabledState, twoFactorMethod);
      
      console.log('2FA setup response:', response);
      
      if (newEnabledState) {
        if (twoFactorMethod === 'app' && response.qr_code) {
          setQrCode(response.qr_code);
          setSuccess('Please scan the QR code with your authenticator app and enter the verification code below.');
        } else if (twoFactorMethod === 'email' && response.message) {
          setEmailSent(true);
          setSuccess(response.message);
        } else {
          setError('Failed to set up 2FA. Please try again.');
          // Don't change the enabled state if setup failed
          return;
        }
      } else {
        setQrCode('');
        setEmailSent(false);
        setSuccess('Two-factor authentication has been disabled.');
      }
      
      // Update the UI state to match what we just set
      setTwoFactorEnabled(newEnabledState);
      
      // If we just disabled 2FA, fetch the latest status
      if (!newEnabledState) {
        await fetch2FAStatus();
      }
      
    } catch (err: any) {
      console.error('Error setting up 2FA:', err);
      setError(err.response?.data?.message || 'Failed to setup 2FA. Please try again.');
      // Don't update the state on error
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode || verificationCode.trim() === '') {
      setVerificationError('Verification code is required');
      return;
    }
    
    try {
      console.log(`Verifying code: ${verificationCode.substring(0, 2)}***`);
      const response = await SettingsService.verify2FA(verificationCode, rememberMe);
      console.log('Verification response:', response);
      
      if (response.success) {
        setTwoFactorEnabled(true);
        setVerificationCode('');
        setQrCode('');
        setEmailSent(false);
        setSuccess('Two-factor authentication has been successfully enabled!');
        
        // Fetch the updated status to ensure the UI is in sync with the server
        try {
          const status = await SettingsService.get2FAStatus();
          setTwoFactorEnabled(status.enabled);
          setTwoFactorMethod(status.method || 'app');
          console.log('Updated 2FA status after verification:', status);
        } catch (statusError) {
          console.error('Failed to fetch updated 2FA status:', statusError);
        }
      } else {
        setVerificationError(response.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during 2FA verification:', error);
      setVerificationError('Failed to verify the code. Please try again.');
    }
  };

  const handleSendEmailCode = async () => {
    try {
      const response = await SettingsService.send2FACode(user?.email || '');
      setEmailSent(true);
      setSuccess('Verification code sent to your email.');
    } catch (error) {
      console.error('Error sending email code:', error);
      setError('Failed to send verification code. Please try again.');
    }
  };

  // Commenting out unused function to suppress ESLint warnings
  /*
  const handleDownload = async () => {
    setLoading(true);
    try {
      // Convert the export option to the format expected by the service
      const format = exportOption === 'all' || exportOption === 'tasks' ? 'csv' : 'pdf';
      const blob = await SettingsService.downloadTasks(format);
      
      if (!(blob instanceof Blob)) {
        throw new Error('Download failed');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks_export.${format}`;
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setSuccess('Downloaded successfully');
    } catch (error) {
      console.error('Error during download:', error);
      setError('Failed to download data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  */

  const handleLogout = () => {
    try {
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleDrawer = () => {
    setOpen(!open);
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      ...standardBackgroundStyle
    }}>
      <Sidebar
        open={open}
        onToggleDrawer={toggleDrawer}
        onLogout={handleLogout}
        drawerWidth={DRAWER_WIDTH}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'white', mb: 3 }}>
            Settings
          </Typography>
          
          <Card sx={{ ...glassStyles.card, mb: 4 }}>
            <CardContent>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="settings tabs"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: 'white',
                    },
                  },
                }}
              >
                <Tab label="Account" icon={<LockIcon />} iconPosition="start" />
                <Tab label="Security" icon={<SecurityIcon />} iconPosition="start" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Change Password
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                  </Alert>
                )}
                
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
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={twoFactorEnabled}
                            onChange={handleSetup2FA} 
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'white',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: theme => theme.palette.primary.main,
                              }
                            }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Enable Two-Factor Authentication</Typography>}
                      />
                    </FormControl>
                    
                    {!twoFactorEnabled && (
                      <FormControl component="fieldset" sx={{ mb: 2, display: 'block' }}>
                        <Typography variant="body1" gutterBottom sx={{ color: 'white', mb: 1 }}>
                          Select 2FA Method:
                        </Typography>
                        <RadioGroup
                          value={twoFactorMethod}
                          onChange={(e) => setTwoFactorMethod(e.target.value)}
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
                      </FormControl>
                    )}
                    
                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                        {success}
                      </Alert>
                    )}
                    
                    {twoFactorEnabled && twoFactorMethod === 'app' && (
                      <Box sx={{ mt: 2, p: 2, ...glassStyles.card }}>
                        <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                          Scan this QR code with your authenticator app:
                        </Typography>
                        <Box sx={{ textAlign: 'center', my: 2 }}>
                          {qrCode ? (
                            <img src={qrCode} alt="2FA QR Code" style={{ width: '200px', height: '200px' }} />
                          ) : (
                            <Box 
                              sx={{ 
                                width: 200, 
                                height: 200, 
                                bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                mx: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'rgba(255, 255, 255, 0.7)',
                                borderRadius: 1
                              }}
                            >
                              QR Code will appear here
                            </Box>
                          )}
                        </Box>
                        <TextField
                          label="Verification Code"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          fullWidth
                          margin="normal"
                          InputLabelProps={{
                            style: glassStyles.inputLabel
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': glassStyles.input,
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: 'white',
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: theme => theme.palette.primary.main,
                                }
                              }}
                            />
                          }
                          label={<Typography sx={{ color: 'white' }}>Remember this browser for 90 days</Typography>}
                        />
                        <Button 
                          variant="contained" 
                          onClick={handleVerify2FA}
                          sx={glassStyles.button}
                          fullWidth
                        >
                          Verify and Enable
                        </Button>
                      </Box>
                    )}
                    
                    {twoFactorEnabled && twoFactorMethod === 'email' && (
                      <Box sx={{ mt: 2, p: 2, ...glassStyles.card }}>
                        <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                          Email Verification:
                        </Typography>
                        <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          A verification code will be sent to your email ({user?.email}) when you log in from a new device or browser.
                        </Typography>
                        
                        {!emailSent ? (
                          <Button 
                            variant="contained" 
                            onClick={handleSendEmailCode}
                            sx={{ ...glassStyles.button, mt: 2 }}
                            fullWidth
                          >
                            Send Test Code
                          </Button>
                        ) : (
                          <>
                            <TextField
                              label="Verification Code"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              fullWidth
                              margin="normal"
                              InputLabelProps={{
                                style: glassStyles.inputLabel
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': glassStyles.input,
                              }}
                            />
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={rememberMe}
                                  onChange={(e) => setRememberMe(e.target.checked)}
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: 'white',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                      backgroundColor: theme => theme.palette.primary.main,
                                    }
                                  }}
                                />
                              }
                              label={<Typography sx={{ color: 'white' }}>Remember this browser for 90 days</Typography>}
                            />
                            <Button 
                              variant="contained" 
                              onClick={handleVerify2FA}
                              sx={glassStyles.button}
                              fullWidth
                            >
                              Verify and Enable
                            </Button>
                          </>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default Settings; 