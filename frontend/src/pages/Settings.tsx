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
  Download as DownloadIcon,
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
  const [exportOption, setExportOption] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [processing2FA, setProcessing2FA] = useState(false);
  
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
    try {
      await SettingsService.updatePassword(currentPassword, newPassword, confirmPassword);
      setSuccess('Password updated successfully');
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
    const fetch2FAStatus = async () => {
      try {
        const status = await SettingsService.get2FAStatus();
        setTwoFactorEnabled(status.enabled);
      } catch (err) {
        console.error('Failed to fetch 2FA status:', err);
      } finally {
        setInitializing(false);
      }
    };
    fetch2FAStatus();
  }, []);

  const handleSetup2FA = async () => {
    setProcessing2FA(true);
    setError(null);
    try {
      const response = await SettingsService.setup2FA(!twoFactorEnabled);
      if (response.qr_code) {
        setQrCode(response.qr_code);
        setSuccess('2FA setup initiated successfully. Please scan the QR code and verify.');
      } else {
        setTwoFactorEnabled(false);
        setQrCode(null);
        setSuccess('2FA disabled successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to setup 2FA');
      setTwoFactorEnabled(false);
      console.error('Error setting up 2FA:', err);
    } finally {
      setProcessing2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await SettingsService.verify2FA(verificationCode);
      setSuccess('2FA verified and enabled successfully');
      setVerificationCode('');
      setTwoFactorEnabled(true);
      setQrCode(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify 2FA code');
      setTwoFactorEnabled(false);
    } finally {
      setLoading(false);
    }
  };

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
      link.setAttribute('download', `${exportOption}_data.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Data downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download data');
    } finally {
      setLoading(false);
    }
  };

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
                <Tab label="Data" icon={<DownloadIcon />} iconPosition="start" />
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
                            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: 'white',
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: 'rgba(255, 255, 255, 0.5)',
                              },
                            }}
                          />
                        }
                        label={<Typography sx={{ color: 'white' }}>Enable Two-Factor Authentication</Typography>}
                      />
                    </FormControl>
                    
                    {twoFactorEnabled && (
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
                  </Grid>
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
                  Data Export
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset" sx={{ mb: 2 }}>
                      <Typography variant="body1" gutterBottom sx={{ color: 'white' }}>
                        Select data to export:
                      </Typography>
                      <RadioGroup
                        value={exportOption}
                        onChange={(e) => setExportOption(e.target.value)}
                      >
                        <FormControlLabel 
                          value="all" 
                          control={<Radio sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: 'white' } }} />} 
                          label={<Typography sx={{ color: 'white' }}>All Data</Typography>} 
                        />
                        <FormControlLabel 
                          value="tasks" 
                          control={<Radio sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: 'white' } }} />} 
                          label={<Typography sx={{ color: 'white' }}>Tasks Only</Typography>} 
                        />
                        <FormControlLabel 
                          value="profile" 
                          control={<Radio sx={{ color: 'rgba(255, 255, 255, 0.7)', '&.Mui-checked': { color: 'white' } }} />} 
                          label={<Typography sx={{ color: 'white' }}>Profile Only</Typography>} 
                        />
                      </RadioGroup>
                    </FormControl>
                    
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        variant="contained" 
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        sx={glassStyles.button}
                      >
                        Export Data
                      </Button>
                    </Box>
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