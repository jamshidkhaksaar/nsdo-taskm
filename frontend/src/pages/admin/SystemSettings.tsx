import React, { useState } from 'react';
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
        id: 'emailServer',
        label: 'SMTP Server',
        type: 'text',
        value: 'smtp.example.com',
        description: 'Email server configuration',
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
        value: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description: 'Your API key for external integrations',
      },
    ],
  },
];

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState(settingsSections);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as const });

  const handleSettingChange = (sectionId: string, settingId: string, value: any) => {
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
  };

  const handleSave = () => {
    // Implement save logic here
    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success',
    });
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
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default SystemSettings; 