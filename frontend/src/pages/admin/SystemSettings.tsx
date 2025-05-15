import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  // Paper, // Removed unused
  // Grid, // Removed unused
  // Select, // Removed unused
  // MenuItem, // Removed unused
  // InputLabel, // Removed unused
  // FormControl, // Removed unused
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Backup';
import NotificationsIcon from '@mui/icons-material/Notifications';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import { SettingsService, NotificationSettings } from '../../services/settings';

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
};

const SystemSettings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(3);
  
  const [settings, setSettings] = useState(() => settingsSections.filter(section => section.id !== 'api')); // Filter out API section initially
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [testingEmail, setTestingEmail] = useState(false);
  const [generatingApiKey, setGeneratingApiKey] = useState(false); // Keep state, but button removed
  const [topWidgetsVisible, setTopWidgetsVisible] = useState(true);

  // Add this callback
  const handleToggleTopWidgets = useCallback(() => {
    setTopWidgetsVisible(prev => !prev);
  }, []);

  useEffect(() => {
    // Function to fetch settings
    const fetchSettings = async () => {
      try {
        // Fetch security settings
        const securitySettings = await SettingsService.getSecuritySettings();
        console.log('Security settings loaded:', securitySettings);
        
        // Fetch backup settings
        const backupSettings = await SettingsService.getBackupSettings();
        console.log('Backup settings loaded:', backupSettings);
        
        // Fetch notification settings
        const notificationSettings = await SettingsService.getNotificationSettings();
        console.log('Notification settings loaded:', notificationSettings);
        
        // Map the settings to the UI format
        const updatedSettings = settingsSections
          .filter(section => section.id !== 'api') // Filter out API section
          .map(section => {
            let settingsData: any = {};
            let map: any = {};
            if (section.id === 'security') {
              settingsData = securitySettings;
              map = securitySettingsMap;
            } else if (section.id === 'backup') {
              settingsData = backupSettings;
              map = backupSettingsMap;
            } else if (section.id === 'notifications') {
              settingsData = notificationSettings;
              map = notificationSettingsMap;
            }
            
            return {
              ...section,
              settings: section.settings.map(setting => {
                const backendKey = map[setting.id as keyof typeof map];
                if (backendKey && settingsData && backendKey in settingsData) {
                  return { ...setting, value: settingsData[backendKey] };
                }
                return setting;
              })
            };
        });

        setSettings(updatedSettings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSnackbar({ open: true, message: 'Failed to load settings.', severity: 'error' });
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = (sectionId: string, settingId: string, value: any) => {
    setSettings(prevSettings =>
      prevSettings.map(section =>
        section.id === sectionId
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.id === settingId ? { ...setting, value } : setting
              ),
            }
          : section
      )
    );
  };

  const handleSave = async () => {
    const updates: Promise<any>[] = [];
    settings.forEach(section => {
      // Assuming you have initial fetched settings stored somewhere to compare against
      // This example just saves everything shown
      const changedSettings: any = {};
      section.settings.forEach(s => { changedSettings[s.id] = s.value; });

      if (section.id === 'security') {
        const securityPayload = mapSettingsToPayload(changedSettings, securitySettingsMap);
        console.log('Updating security settings with payload:', securityPayload);
        updates.push(SettingsService.updateSecuritySettings(securityPayload));
      } else if (section.id === 'backup') {
        const backupPayload = mapSettingsToPayload(changedSettings, backupSettingsMap);
        console.log('Updating backup settings with payload:', backupPayload);
        updates.push(SettingsService.updateBackupSettings(backupPayload));
      } else if (section.id === 'notifications') {
        const notificationPayload = mapSettingsToPayload(changedSettings, notificationSettingsMap);
        console.log('Updating notification settings with payload:', notificationPayload);
        updates.push(SettingsService.updateNotificationSettings(notificationPayload));
      }
    });

    if (updates.length > 0) {
      setGeneratingApiKey(true);
      try {
        await Promise.all(updates);
        setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
      } catch (error) {
        console.error('Error saving settings:', error);
        setSnackbar({ open: true, message: 'Failed to save settings.', severity: 'error' });
      } finally {
        setGeneratingApiKey(false);
      }
    } else {
      setSnackbar({ open: true, message: 'No changes to save.', severity: 'info' });
    }
  };
  
  // Helper function to map frontend state to backend DTO
  const mapSettingsToPayload = (changedSettings: any, map: any) => {
    const payload: any = {};
    for (const key in changedSettings) {
      if (map[key]) {
        payload[map[key]] = changedSettings[key];
      }
    }
    return payload;
  };

  const handleTestEmailSettings = async () => {
    setTestingEmail(true);
    try {
      // Find the notification settings from the current state
      const notificationSection = settings.find(sec => sec.id === 'notifications');
      const currentNotificationSettings: Partial<NotificationSettings> = {};
      if (notificationSection) {
        notificationSection.settings.forEach(setting => {
          // Assuming a map like notificationSettingsMap exists and is in scope
          // to convert frontend IDs (e.g., emailNotifications) to backend fields (e.g., email_notifications_enabled)
          // For this example, we'll assume direct mapping or that the map is handled by the service if necessary
          // but ideally, the payload should match what the backend endpoint expects.
          // Let's construct a payload based on the NotificationSettings interface keys for now.
          if (setting.id === 'emailNotifications') currentNotificationSettings.emailNotifications = setting.value;
          // Add other relevant notification settings here if needed by the testEmailSettings endpoint
        });
      }

      const result = await SettingsService.testEmailSettings(currentNotificationSettings);
      if (result.success) {
        setSnackbar({ open: true, message: 'Test email sent successfully!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: result.message || 'Failed to send test email.', severity: 'error' });
      }
    } catch (error) {
      console.error('Error testing email settings:', error);
      setSnackbar({ open: true, message: 'Failed to send test email.', severity: 'error' });
    } finally {
      setTestingEmail(false);
    }
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
          {generatingApiKey ? <CircularProgress size={24} /> : 'Save All Changes'}
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
                  {testingEmail ? <CircularProgress size={24} /> : 'Test Email Settings'}
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
          open={isSidebarOpen}
          onToggleDrawer={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          drawerWidth={DRAWER_WIDTH}
        />
      }
      topBar={
        <DashboardTopBar
          username={user?.username || 'Admin'}
          notificationCount={notifications}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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

export default SystemSettings;