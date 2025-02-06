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
} from '@mui/material';
import {
  Lock as LockIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { SettingsService } from '../services/settings';

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
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [open, setOpen] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [processing2FA, setProcessing2FA] = useState(false);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  React.useEffect(() => {
    document.title = `Settings - ${user?.username || 'User'}`;
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
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
        const blob = await SettingsService.downloadTasks(downloadFormat as 'csv' | 'pdf');
        
        if (!(blob instanceof Blob)) {
            throw new Error('Invalid response format');
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tasks.${downloadFormat}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('File downloaded successfully');
    } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to download file';
        console.error('Download error details:', {
            status: err.response?.status,
            message: errorMessage,
            error: err
        });
        setError(errorMessage);
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
      position: 'relative',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Ccircle cx='20' cy='20' r='1' fill='rgba(255,255,255,0.3)'/%3E%3Cpath d='M0 20h40M20 0v40' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/svg%3E")
        `,
        backgroundSize: '40px 40px',
        opacity: 0.5,
        pointerEvents: 'none',
        zIndex: 0,
      },
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
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1,
          pl: { sm: open ? `${DRAWER_WIDTH}px` : '73px' },
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
            Settings for {user?.username}
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

          <Card sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}>
            <CardContent>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  borderBottom: 1,
                  borderColor: 'divider',
                  '& .MuiTab-root': { color: '#fff' },
                  '& .Mui-selected': { color: '#fff' },
                }}
              >
                <Tab icon={<LockIcon />} label="Password" />
                <Tab icon={<SecurityIcon />} label="2FA Settings" />
                <Tab icon={<DownloadIcon />} label="Download Tasks" />
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <form onSubmit={handlePasswordUpdate}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Update Password'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    {initializing ? (
                      <CircularProgress />
                    ) : (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={twoFactorEnabled}
                            onChange={() => {
                              if (!processing2FA) {
                                handleSetup2FA();
                              }
                            }}
                            disabled={processing2FA || loading}
                          />
                        }
                        label={
                          processing2FA 
                            ? "Setting up 2FA..." 
                            : "Enable Two-Factor Authentication"
                        }
                      />
                    )}
                  </Grid>
                  {qrCode && (
                    <Grid item xs={12}>
                      <Box sx={{ textAlign: 'center', my: 2 }}>
                        <Typography variant="body1" gutterBottom>
                          1. Scan this QR code with your authenticator app (e.g., Google Authenticator)
                        </Typography>
                        <img src={qrCode} alt="2FA QR Code" style={{ margin: '20px 0' }} />
                        <Typography variant="body1" gutterBottom>
                          2. Enter the 6-digit code from your authenticator app below
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        error={!!error}
                        helperText={error}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleVerify2FA}
                        disabled={loading || !verificationCode.trim()}
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Verify'}
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>

              <TabPanel value={tabValue} index={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                        Download Format
                      </Typography>
                      <RadioGroup
                        value={downloadFormat}
                        onChange={(e) => setDownloadFormat(e.target.value)}
                      >
                        <FormControlLabel
                          value="csv"
                          control={<Radio />}
                          label="CSV"
                        />
                        <FormControlLabel
                          value="pdf"
                          control={<Radio />}
                          label="PDF"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      onClick={handleDownload}
                      disabled={loading}
                      startIcon={<DownloadIcon />}
                      sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Download Tasks'}
                    </Button>
                  </Grid>
                </Grid>
              </TabPanel>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Footer open={open} drawerWidth={DRAWER_WIDTH} />
    </Box>
  );
};

export default Settings; 