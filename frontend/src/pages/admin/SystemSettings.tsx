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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Backup';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import AdminLayout from '../../layouts/AdminLayout';
import axios from '../../utils/axios';

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
  const [settings, setSettings] = useState(settingsSections);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Update useEffect to fetch notification settings too
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fetch all settings
        const [securityResponse, backupResponse, notificationResponse, apiResponse] = await Promise.all([
          axios.get('/api/security-settings/1/'),
          axios.get('/api/backup-settings/1/'),
          axios.get('/api/notification-settings/1/'),
          axios.get('/api/api-settings/1/')
        ]);
        
        // Update settings in state
        setSettings(prevSettings => 
          prevSettings.map(section => {
            if (section.id === 'security') {
              return {
                ...section,
                settings: section.settings.map(setting => {
                  const backendField = securitySettingsMap[setting.id as keyof typeof securitySettingsMap];
                  if (backendField && backendField in securityResponse.data) {
                    return {
                      ...setting,
                      value: securityResponse.data[backendField]
                    };
                  }
                  return setting;
                })
              };
            }
            if (section.id === 'backup') {
              return {
                ...section,
                settings: section.settings.map(setting => {
                  const backendField = backupSettingsMap[setting.id as keyof typeof backupSettingsMap];
                  if (backendField && backendField in backupResponse.data) {
                    return {
                      ...setting,
                      value: backupResponse.data[backendField]
                    };
                  }
                  return setting;
                })
              };
            }
            if (section.id === 'notifications') {
              return {
                ...section,
                settings: section.settings.map(setting => {
                  const backendField = notificationSettingsMap[setting.id as keyof typeof notificationSettingsMap];
                  if (backendField && backendField in notificationResponse.data) {
                    return {
                      ...setting,
                      value: notificationResponse.data[backendField]
                    };
                  }
                  return setting;
                })
              };
            }
            if (section.id === 'api') {
              return {
                ...section,
                settings: section.settings.map(setting => {
                  const backendField = apiSettingsMap[setting.id as keyof typeof apiSettingsMap];
                  if (backendField && backendField in apiResponse.data) {
                    return {
                      ...setting,
                      value: apiResponse.data[backendField]
                    };
                  }
                  return setting;
                })
              };
            }
            return section;
          })
        );
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to fetch settings',
          severity: 'error'
        });
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = async (sectionId: string, settingId: string, value: any) => {
    // Update local state first
    setSettings(prevSettings => 
      prevSettings.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            settings: section.settings.map(setting => 
              setting.id === settingId ? { ...setting, value } : setting
            ),
          };
        }
        return section;
      })
    );

    try {
      if (sectionId === 'security') {
        const backendFieldName = securitySettingsMap[settingId as keyof typeof securitySettingsMap];
        if (backendFieldName) {
          // Convert value types appropriately
          let processedValue = value;
          if (settingId === 'passwordExpiry' || settingId === 'maxLoginAttempts') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await axios.patch('/api/security-settings/1/', {
            [backendFieldName]: processedValue
          });

          setSnackbar({
            open: true,
            message: 'Setting updated successfully',
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
          if (settingId === 'backupFrequency' || settingId === 'retentionPeriod') {
            processedValue = parseInt(value, 10);
          }

          const { data } = await axios.patch('/api/backup-settings/1/', {
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

          const { data } = await axios.patch('/api/notification-settings/1/', {
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

          const { data } = await axios.patch('/api/api-settings/1/', {
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
      // Revert local state on error
      setSettings(prevSettings => 
        prevSettings.map(section => {
          if (section.id === sectionId) {
            return {
              ...section,
              settings: section.settings.map(setting => {
                if (setting.id === settingId) {
                  return {
                    ...setting,
                    value: setting.value // Revert to previous value
                  };
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
        message: `Failed to update ${settingId}`,
        severity: 'error'
      });
    }
  };

  const handleSave = async () => {
    try {
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

        await axios.patch('/api/security-settings/1/', securitySettings);
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

        await axios.patch('/api/backup-settings/1/', backupSettings);
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

        await axios.patch('/api/notification-settings/1/', notificationSettings);
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

        await axios.patch('/api/api-settings/1/', apiSettings);
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
    }
  };

  return (
    <AdminLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#fff' }}>
          System Settings
        </Typography>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          Save Changes
        </Button>
      </Box>

      {settings.map((section) => (
        <Accordion
          key={section.id}
          sx={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            mb: 2,
            '&:before': {
              display: 'none',
            },
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
            {section.icon}
            <Typography sx={{ color: '#fff', fontWeight: 500 }}>
              {section.title}
            </Typography>
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
                          sx={{ '& .MuiSwitch-track': { backgroundColor: 'rgba(255, 255, 255, 0.3)' } }}
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
                            color: '#fff',
                            '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                            '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                            '&.Mui-focused fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      ))}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          mb: 4,
          mr: 4,
        }}
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
            '& .MuiAlert-action': {
              padding: '0 8px',
            },
            ...(snackbar.severity === 'success' && {
              backgroundColor: '#2e7d32',
              color: '#fff'
            }),
            ...(snackbar.severity === 'error' && {
              backgroundColor: '#d32f2f',
              color: '#fff'
            }),
            ...(snackbar.severity === 'warning' && {
              backgroundColor: '#ed6c02',
              color: '#fff'
            }),
            ...(snackbar.severity === 'info' && {
              backgroundColor: '#0288d1',
              color: '#fff'
            })
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default SystemSettings; 