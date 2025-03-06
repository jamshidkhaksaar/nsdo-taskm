import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Backup';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import axios from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { SettingsService } from '../../services/settings';

const DRAWER_WIDTH = 240;

interface SettingsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  settings: {
    id: string;
    label: string;
    type: 'switch' | 'text' | 'number';
    value: any;
    description?: string;
  }[];
}

const settingsSections: SettingsSection[] = [
  {
    id: 'security',
    title: 'Security Settings',
    icon: <SecurityIcon />,
    settings: [
      {
        id: 'twoFactor',
        label: 'Two-Factor Authentication',
        type: 'switch',
        value: true,
        description: 'Require 2FA for all admin users',
      },
      {
        id: 'passwordExpiry',
        label: 'Password Expiry (days)',
        type: 'number',
        value: 90,
        description: 'Days before password must be changed',
      },
      {
        id: 'maxLoginAttempts',
        label: 'Max Login Attempts',
        type: 'number',
        value: 5,
        description: 'Maximum failed login attempts before lockout',
      },
    ],
  },
  {
    id: 'backup',
    title: 'Backup Settings',
    icon: <BackupIcon />,
    settings: [
      {
        id: 'autoBackup',
        label: 'Automatic Backups',
        type: 'switch',
        value: true,
        description: 'Enable automatic system backups',
      },
      {
        id: 'backupFrequency',
        label: 'Backup Frequency (hours)',
        type: 'number',
        value: 24,
        description: 'How often to create backups',
      },
      {
        id: 'retentionPeriod',
        label: 'Retention Period (days)',
        type: 'number',
        value: 30,
        description: 'How long to keep backups',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notification Settings',
    icon: <NotificationsIcon />,
    settings: [
      {
        id: 'emailNotifications',
        label: 'Email Notifications',
        type: 'switch',
        value: true,
        description: 'Send email notifications for important events',
      },
      {
        id: 'smtpServer',
        label: 'SMTP Server',
        type: 'text',
        value: 'smtp.example.com',
        description: 'Email server hostname',
      },
      {
        id: 'smtpPort',
        label: 'SMTP Port',
        type: 'number',
        value: 587,
        description: 'Email server port',
      },
      {
        id: 'smtpUsername',
        label: 'SMTP Username',
        type: 'text',
        value: '',
        description: 'Email server username',
      },
      {
        id: 'smtpPassword',
        label: 'SMTP Password',
        type: 'text',
        value: '',
        description: 'Email server password',
      },
      {
        id: 'smtpUseTls',
        label: 'Use TLS',
        type: 'switch',
        value: true,
        description: 'Enable TLS encryption',
      },
    ],
  },
  {
    id: 'api',
    title: 'API Settings',
    icon: <IntegrationInstructionsIcon />,
    settings: [
      {
        id: 'apiEnabled',
        label: 'Enable API Access',
        type: 'switch',
        value: true,
        description: 'Allow external API access',
      },
      {
        id: 'apiKey',
        label: 'API Key',
        type: 'text',
        value: '',
        description: 'Your API key for external integrations',
      },
      {
        id: 'weatherApiEnabled',
        label: 'Enable Weather API',
        type: 'switch',
        value: true,
        description: 'Enable WeatherAPI.com integration',
      },
      {
        id: 'weatherApiKey',
        label: 'Weather API Key',
        type: 'text',
        value: '',
        description: 'Your WeatherAPI.com API key',
      },
      {
        id: 'apiRateLimit',
        label: 'Rate Limit',
        type: 'number',
        value: 100,
        description: 'Maximum requests per minute',
      },
      {
        id: 'apiAllowedIps',
        label: 'Allowed IP Addresses',
        type: 'text',
        value: '',
        description: 'Comma-separated list of allowed IP addresses',
      },
    ],
  },
];

// Add this interface for snackbar state
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

// Add mapping for frontend to backend field names
const securitySettingsMap = {
  twoFactor: 'two_factor_enabled',
  passwordExpiry: 'password_expiry_days',
  maxLoginAttempts: 'max_login_attempts',
  lockoutDuration: 'lockout_duration_minutes',
  passwordComplexity: 'password_complexity_required',
  sessionTimeout: 'session_timeout_minutes'
};

// Add backup settings mapping
const backupSettingsMap = {
  autoBackup: 'auto_backup_enabled',
  backupFrequency: 'backup_frequency_hours',
  retentionPeriod: 'backup_retention_days',
  backupLocation: 'backup_location'
};

// Add notification settings mapping after the backup settings map
const notificationSettingsMap = {
  emailNotifications: 'email_notifications_enabled',
  smtpServer: 'smtp_server',
  smtpPort: 'smtp_port',
  smtpUsername: 'smtp_username',
  smtpPassword: 'smtp_password',
  smtpUseTls: 'smtp_use_tls'
};

// Add API settings mapping after the notification settings map
const apiSettingsMap = {
  apiEnabled: 'api_enabled',
  apiKey: 'api_key',
  weatherApiEnabled: 'weather_api_enabled',
  weatherApiKey: 'weather_api_key',
  apiRateLimit: 'api_rate_limit',
  apiAllowedIps: 'api_allowed_ips'
};

const SystemSettings: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [notifications, setNotifications] = useState(3);
  
  const [settings, setSettings] = useState(settingsSections);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [generatingApiKey, setGeneratingApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Function to fetch settings
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Fetch security settings
        const securitySettings = await SettingsService.getSecuritySettings();
        console.log('Security settings loaded:', securitySettings);
        
        // Fetch backup settings
        const backupSettings = await SettingsService.getBackupSettings();
        console.log('Backup settings loaded:', backupSettings);
        
        // Fetch notification settings
        const notificationSettings = await SettingsService.getNotificationSettings();
        console.log('Notification settings loaded:', notificationSettings);
        
        // Fetch API settings
        const apiSettings = await SettingsService.getApiSettings();
        console.log('API settings loaded:', apiSettings);
        
        // Map the settings to the UI format
        const mappedSettings = settingsSections.map(section => {
          if (section.id === 'security') {
            return {
              ...section,
              settings: section.settings.map(setting => {
                const backendField = securitySettingsMap[setting.id as keyof typeof securitySettingsMap];
                if (backendField && securitySettings[backendField] !== undefined) {
                  return { ...setting, value: securitySettings[backendField] };
                }
                return setting;
              })
            };
          } else if (section.id === 'backup') {
            return {
              ...section,
              settings: section.settings.map(setting => {
                const backendField = backupSettingsMap[setting.id as keyof typeof backupSettingsMap];
                if (backendField && backupSettings[backendField] !== undefined) {
                  return { ...setting, value: backupSettings[backendField] };
                }
                return setting;
              })
            };
          } else if (section.id === 'notifications') {
            return {
              ...section,
              settings: section.settings.map(setting => {
                const backendField = notificationSettingsMap[setting.id as keyof typeof notificationSettingsMap];
                if (backendField && notificationSettings[backendField] !== undefined) {
                  return { ...setting, value: notificationSettings[backendField] };
                }
                return setting;
              })
            };
          } else if (section.id === 'api') {
            return {
              ...section,
              settings: section.settings.map(setting => {
                const backendField = apiSettingsMap[setting.id as keyof typeof apiSettingsMap];
                if (backendField && apiSettings[backendField] !== undefined) {
                  return { ...setting, value: apiSettings[backendField] };
                }
                return setting;
              })
            };
          }
          return section;
        });
        
        setSettings(mappedSettings);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSettingChange = async (sectionId: string, settingId: string, value: any) => {
    try {
      setSaving(true);
      
      // Find the section and setting
      const section = settings.find(s => s.id === sectionId);
      if (!section) {
        throw new Error(`Section ${sectionId} not found`);
      }
      
      const setting = section.settings.find(s => s.id === settingId);
      if (!setting) {
        throw new Error(`Setting ${settingId} not found in section ${sectionId}`);
      }
      
      // Update the setting value locally
      setting.value = value;
      
      // Trigger re-render
      setSettings([...settings]);
      
      console.log(`Updating ${sectionId} setting ${settingId} to:`, value);
      
      // Now update on the server based on the section
      if (sectionId === 'security') {
        const backendFieldName = securitySettingsMap[settingId as keyof typeof securitySettingsMap];
        if (backendFieldName) {
          // Convert value types appropriately
          let processedValue = value;
          if (typeof setting.value === 'number') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await SettingsService.updateSecuritySettings({
            [backendFieldName]: processedValue
          });

          setSnackbar({
            open: true,
            message: 'Security setting updated successfully',
            severity: 'success'
          });

          console.log('Security setting updated:', data);
        }
      }
      else if (sectionId === 'backup') {
        const backendFieldName = backupSettingsMap[settingId as keyof typeof backupSettingsMap];
        if (backendFieldName) {
          // Convert value types appropriately
          let processedValue = value;
          if (typeof setting.value === 'number') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await SettingsService.updateBackupSettings({
            [backendFieldName]: processedValue
          });

          setSnackbar({
            open: true,
            message: 'Backup setting updated successfully',
            severity: 'success'
          });

          console.log('Backup setting updated:', data);
        }
      }
      else if (sectionId === 'notifications') {
        const backendFieldName = notificationSettingsMap[settingId as keyof typeof notificationSettingsMap];
        if (backendFieldName) {
          // Convert value types appropriately
          let processedValue = value;
          if (settingId === 'smtpPort') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await SettingsService.updateNotificationSettings({
            [backendFieldName]: processedValue
          });

          setSnackbar({
            open: true,
            message: 'Notification setting updated successfully',
            severity: 'success'
          });

          console.log('Notification setting updated:', data);
        }
      }
      else if (sectionId === 'api') {
        const backendFieldName = apiSettingsMap[settingId as keyof typeof apiSettingsMap];
        if (backendFieldName) {
          // Convert value types appropriately
          let processedValue = value;
          if (settingId === 'apiRateLimit') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await SettingsService.updateApiSettings({
            [backendFieldName]: processedValue
          });

          setSnackbar({
            open: true,
            message: 'API setting updated successfully',
            severity: 'success'
          });

          console.log('API setting updated:', data);
        }
      }
    } catch (error) {
      console.error(`Error updating ${sectionId} settings:`, error);
      setSnackbar({
        open: true,
        message: `Failed to update ${sectionId} setting`,
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSnackbar({
        open: true,
        message: 'Saving settings...',
        severity: 'info'
      });
      
      // Save security settings
      const securitySection = settings.find(s => s.id === 'security');
      if (securitySection) {
        const securitySettings = securitySection.settings.reduce((acc, setting) => {
          const backendFieldName = securitySettingsMap[setting.id as keyof typeof securitySettingsMap];
          if (backendFieldName) {
            let processedValue = setting.value;
            if (setting.type === 'number') {
              processedValue = parseInt(setting.value, 10);
            }
            acc[backendFieldName] = processedValue;
          }
          return acc;
        }, {} as Record<string, any>);

        await SettingsService.updateSecuritySettings(securitySettings);
      }

      // Save backup settings
      const backupSection = settings.find(s => s.id === 'backup');
      if (backupSection) {
        const backupSettings = backupSection.settings.reduce((acc, setting) => {
          const backendFieldName = backupSettingsMap[setting.id as keyof typeof backupSettingsMap];
          if (backendFieldName) {
            let processedValue = setting.value;
            if (setting.type === 'number') {
              processedValue = parseInt(setting.value, 10);
            }
            acc[backendFieldName] = processedValue;
          }
          return acc;
        }, {} as Record<string, any>);

        await SettingsService.updateBackupSettings(backupSettings);
      }

      // Save notification settings
      const notificationSection = settings.find(s => s.id === 'notifications');
      if (notificationSection) {
        const notificationSettings = notificationSection.settings.reduce((acc, setting) => {
          const backendFieldName = notificationSettingsMap[setting.id as keyof typeof notificationSettingsMap];
          if (backendFieldName) {
            let processedValue = setting.value;
            if (setting.type === 'number') {
              processedValue = parseInt(setting.value, 10);
            }
            acc[backendFieldName] = processedValue;
          }
          return acc;
        }, {} as Record<string, any>);

        await SettingsService.updateNotificationSettings(notificationSettings);
      }

      // Save API settings
      const apiSection = settings.find(s => s.id === 'api');
      if (apiSection) {
        const apiSettings = apiSection.settings.reduce((acc, setting) => {
          const backendFieldName = apiSettingsMap[setting.id as keyof typeof apiSettingsMap];
          if (backendFieldName) {
            let processedValue = setting.value;
            if (setting.type === 'number') {
              processedValue = parseInt(setting.value, 10);
            }
            acc[backendFieldName] = processedValue;
          }
          return acc;
        }, {} as Record<string, any>);

        await SettingsService.updateApiSettings(apiSettings);
      }

      setSnackbar({
        open: true,
        message: 'All settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Add test email function
  const handleTestEmailSettings = async () => {
    try {
      setTestingEmail(true);
      
      // Get notification settings
      const notificationSection = settings.find(s => s.id === 'notifications');
      if (!notificationSection) {
        throw new Error('Notification settings not found');
      }
      
      // Convert to backend format
      const notificationSettings = notificationSection.settings.reduce((acc, setting) => {
        const backendFieldName = notificationSettingsMap[setting.id as keyof typeof notificationSettingsMap];
        if (backendFieldName) {
          let processedValue = setting.value;
          if (setting.type === 'number') {
            processedValue = parseInt(setting.value, 10);
          }
          acc[backendFieldName] = processedValue;
        }
        return acc;
      }, {} as Record<string, any>);
      
      // Send test email
      const response = await SettingsService.testEmailSettings(notificationSettings);
      
      setSnackbar({
        open: true,
        message: 'Test email sent successfully!',
        severity: 'success'
      });
      
      console.log('Test email response:', response.data);
    } catch (error) {
      console.error('Error sending test email:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send test email',
        severity: 'error'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  // Add generate API key function
  const handleGenerateApiKey = async () => {
    try {
      setGeneratingApiKey(true);
      
      // Generate new API key
      const { data } = await SettingsService.generateApiKey();
      
      // Update local state
      setSettings(prevSettings => 
        prevSettings.map(section => {
          if (section.id === 'api') {
            return {
              ...section,
              settings: section.settings.map(setting => {
                if (setting.id === 'apiKey') {
                  return { ...setting, value: data.api_key };
                }
                return setting;
              })
            };
          }
          return section;
        })
      );
      
      setSnackbar({
        open: true,
        message: 'New API key generated!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error generating API key:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate API key',
        severity: 'error'
      });
    } finally {
      setGeneratingApiKey(false);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    // Handle logout logic here
    navigate('/login');
  };

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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: '#fff' }}>
        System Settings
      </Typography>
      <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
        Configure system-wide settings and preferences
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            background: 'rgba(33, 150, 243, 0.8)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              background: 'rgba(33, 150, 243, 1)',
            },
          }}
        >
          Save All Changes
        </Button>
      </Box>

      {settings.map((section) => (
        <Accordion
          key={section.id}
          sx={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            mb: 2,
            '&:before': {
              display: 'none',
            },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#fff' }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              },
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: '#fff',
              '& .MuiSvgIcon-root': {
                color: section.id === 'security' ? '#2196f3' : 
                       section.id === 'backup' ? '#4caf50' : 
                       section.id === 'notifications' ? '#ff9800' : 
                       '#9c27b0'
              }
            }}>
              {section.icon}
              <Typography sx={{ ml: 2, fontWeight: 500 }}>
                {section.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              {section.settings.map((setting) => (
                <Box key={setting.id} sx={{ mb: 3 }}>
                  {setting.type === 'switch' ? (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={setting.value}
                          onChange={(e) => handleSettingChange(section.id, setting.id, e.target.checked)}
                          sx={{ 
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: section.id === 'security' ? '#2196f3' : 
                                     section.id === 'backup' ? '#4caf50' : 
                                     section.id === 'notifications' ? '#ff9800' : 
                                     '#9c27b0'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: section.id === 'security' ? 'rgba(33, 150, 243, 0.5)' : 
                                              section.id === 'backup' ? 'rgba(76, 175, 80, 0.5)' : 
                                              section.id === 'notifications' ? 'rgba(255, 152, 0, 0.5)' : 
                                              'rgba(156, 39, 176, 0.5)'
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ color: '#fff' }}>{setting.label}</Typography>
                          {setting.description && (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {setting.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ) : (
                    <Box>
                      <Typography sx={{ color: '#fff', mb: 1 }}>{setting.label}</Typography>
                      {setting.description && (
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: 1 }}>
                          {setting.description}
                        </Typography>
                      )}
                      <TextField
                        fullWidth
                        type={setting.type}
                        value={setting.value}
                        onChange={(e) => handleSettingChange(section.id, setting.id, e.target.value)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: section.id === 'security' ? '#2196f3' : 
                                          section.id === 'backup' ? '#4caf50' : 
                                          section.id === 'notifications' ? '#ff9800' : 
                                          '#9c27b0',
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </FormGroup>

            {section.id === 'notifications' && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleTestEmailSettings}
                  disabled={testingEmail}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                >
                  {testingEmail ? 'Sending...' : 'Test Email Settings'}
                </Button>
              </Box>
            )}
            
            {section.id === 'api' && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleGenerateApiKey}
                  disabled={generatingApiKey}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                    },
                  }}
                >
                  {generatingApiKey ? 'Generating...' : 'Generate New API Key'}
                </Button>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          elevation={6}
          variant="filled"
          sx={{
            minWidth: '300px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500,
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );

  return (
    <ModernDashboardLayout
      sidebar={
        <Sidebar
          open={sidebarOpen}
          onToggleDrawer={handleToggleSidebar}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar 
          username={user?.username || 'Admin'}
          notificationCount={notifications}
          onToggleSidebar={handleToggleSidebar}
          onNotificationClick={handleNotificationClick}
          onLogout={handleLogout}
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick}
          onHelpClick={handleHelpClick}
        />
      }
      mainContent={mainContent}
      sidebarOpen={sidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default SystemSettings; 