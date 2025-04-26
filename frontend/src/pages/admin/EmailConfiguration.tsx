import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Snackbar, 
  Alert, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  CircularProgress 
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useNavigate } from 'react-router-dom';
import ModernDashboardLayout from '../../components/dashboard/ModernDashboardLayout';
import Sidebar from '../../components/Sidebar';
import DashboardTopBar from '../../components/dashboard/DashboardTopBar';
import axios from '../../utils/axios'; // Use configured axios
import EditTemplateModal from '../../components/dialogs/EditTemplateModal'; // Import the modal

// Define interfaces for settings and templates
interface Setting {
  key: string;
  value: string;
  description?: string;
}

// Export EmailTemplate interface so modal can import it
export interface EmailTemplate {
  templateKey: string;
  subject: string;
  bodyHtml: string;
  description?: string;
  updatedAt: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

const DRAWER_WIDTH = 240;

// Add card style for glassmorphism
const cardStyle = {
  background: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(8px)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  boxShadow: 'none',
};

const EmailConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [sendgridApiKey, setSendgridApiKey] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for modal visibility
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null); // State for template being edited
  const [testingEmail, setTestingEmail] = useState(false); // State for test email loading
  const [testRecipientEmail, setTestRecipientEmail] = useState(''); // State for test email input

  console.log('EmailConfiguration component mounted');
  console.log('Current location:', window.location.pathname);
  console.log('User role:', user?.role || localStorage.getItem('user_role'));

  // Add debug ref to track component renders
  const renderCount = React.useRef(0);
  React.useEffect(() => {
    renderCount.current += 1;
    console.log(`EmailConfiguration render #${renderCount.current}`);
    
    return () => {
      console.log('EmailConfiguration component unmounting');
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchSettings();
    fetchEmailTemplates();
  }, []);

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await axios.get('/settings');
      const settingsMap = response.data.reduce((acc: Record<string, string>, setting: Setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      setSendgridApiKey(settingsMap['SENDGRID_API_KEY'] || '');
      setEmailFromAddress(settingsMap['EMAIL_FROM_ADDRESS'] || '');
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSnackbar({ open: true, message: 'Failed to load settings', severity: 'error' });
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchEmailTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await axios.get('/email-templates');
      setEmailTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch email templates:', error);
      setSnackbar({ open: true, message: 'Failed to load email templates', severity: 'error' });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSaveSmtpSettings = async () => {
    console.log('Attempting to save SMTP settings...'); // Log start
    setLoadingSettings(true);
    const settingsToUpdate = [
      { key: 'SENDGRID_API_KEY', value: sendgridApiKey },
      { key: 'EMAIL_FROM_ADDRESS', value: emailFromAddress }
    ];
    console.log('Settings to update:', settingsToUpdate); // Log data
    try {
      await axios.put('/settings', { settings: settingsToUpdate }); 
      console.log('Save request successful'); // Log success
      setSnackbar({ open: true, message: 'SMTP settings saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Failed to save SMTP settings:', error); // Log error
      setSnackbar({ open: true, message: 'Failed to save SMTP settings', severity: 'error' });
    } finally {
      setLoadingSettings(false);
      console.log('Finished saving attempt.'); // Log end
    }
  };

  // Send Test Email Handler
  const handleSendTestEmail = async () => {
    const recipient = testRecipientEmail.trim(); // Get email from state

    // Basic email validation regex
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!recipient || !emailRegex.test(recipient)) {
      setSnackbar({ open: true, message: 'Please enter a valid email address for the test.', severity: 'warning' });
      return;
    }

    setTestingEmail(true);
    setSnackbar({ open: true, message: `Sending test email to ${recipient}...`, severity: 'info' });
    try {
      const response = await axios.post('/settings/test-sendgrid', { recipientEmail: recipient });
      if (response.data.success) {
        setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: response.data.message || 'Failed to send test email.', severity: 'error' });
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'An error occurred while sending the test email.', severity: 'error' });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleEditTemplate = (templateKey: string) => {
    const templateToEdit = emailTemplates.find(t => t.templateKey === templateKey);
    if (templateToEdit) {
      setSelectedTemplate(templateToEdit);
      setIsEditModalOpen(true);
    } else {
      console.error('Template not found:', templateKey);
      setSnackbar({ open: true, message: 'Error: Template not found', severity: 'error' });
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTemplate(null);
  };

  // Handle successful save from modal
  const handleTemplateSave = (updatedTemplate: EmailTemplate) => {
    setEmailTemplates(prevTemplates => 
      prevTemplates.map(t => 
        t.templateKey === updatedTemplate.templateKey ? updatedTemplate : t
      )
    );
    setSnackbar({ open: true, message: 'Template updated successfully', severity: 'success' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // --- Top Bar Handlers ---
  const handleToggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const handleLogout = () => navigate('/login');
  const handleNotificationClick = () => setNotifications(0);
  const handleProfileClick = () => navigate('/profile');
  const handleSettingsClick = () => navigate('/admin/settings'); 
  const handleHelpClick = () => {};
  // --- End Top Bar Handlers ---

  const renderSmtpSettings = () => (
    <Paper sx={{ ...cardStyle, p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>SendGrid Configuration</Typography>
      {loadingSettings ? <CircularProgress sx={{ color: '#fff' }} /> : (
        <Box component="form" noValidate autoComplete="off">
          <TextField
            label="SendGrid API Key"
            fullWidth
            margin="normal"
            type="password" // Hide the key by default
            value={sendgridApiKey}
            onChange={(e) => setSendgridApiKey(e.target.value)}
            helperText="Enter your SendGrid API key for sending emails."
            sx={{ 
              '& label': { color: 'rgba(255, 255, 255, 0.7)' }, 
              '& label.Mui-focused': { color: '#fff' }, 
              '& .MuiInputBase-root': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' },
              },
              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' }
            }}
          />
          <TextField
            label="Default From Email Address"
            fullWidth
            margin="normal"
            value={emailFromAddress}
            onChange={(e) => setEmailFromAddress(e.target.value)}
            helperText="The default email address emails will be sent from."
            sx={{ 
              '& label': { color: 'rgba(255, 255, 255, 0.7)' }, 
              '& label.Mui-focused': { color: '#fff' }, 
              '& .MuiInputBase-root': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' },
              },
              '& .MuiFormHelperText-root': { color: 'rgba(255, 255, 255, 0.5)' }
            }}
          />
          <Button 
            variant="contained" 
            sx={{ 
              mt: 2, 
              background: 'rgba(33, 150, 243, 0.8)', 
              backdropFilter: 'blur(8px)',
              '&:hover': {
                background: 'rgba(33, 150, 243, 1)',
              }
            }} 
            onClick={handleSaveSmtpSettings}
            disabled={loadingSettings}
          >
            Save SMTP Settings
          </Button>
          
          {/* Add Test Email Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 2 }}>
            <TextField
              label="Recipient for Test Email"
              variant="outlined"
              size="small"
              value={testRecipientEmail}
              onChange={(e) => setTestRecipientEmail(e.target.value)}
              disabled={testingEmail || loadingSettings}
              sx={{ 
                flexGrow: 1,
                '& label': { color: 'rgba(255, 255, 255, 0.7)' }, 
                '& label.Mui-focused': { color: '#fff' }, 
                '& .MuiInputBase-root': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.4)' },
                  '&.Mui-focused fieldset': { borderColor: '#fff' },
                },
              }}
            />
            <Button 
              variant="outlined" 
              sx={{ 
                // mt: 2, 
                // ml: 2, // Remove specific margins, use gap from Box
                color: '#fff', 
                borderColor: 'rgba(255, 255, 255, 0.3)',
                whiteSpace: 'nowrap', // Prevent wrapping
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.8)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)'
                }
              }} 
              onClick={handleSendTestEmail}
              disabled={loadingSettings || testingEmail || !testRecipientEmail.trim()} // Disable if saving, testing, or field is empty
              startIcon={testingEmail ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Send Test Email
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );

  const renderEmailTemplates = () => (
    <Paper sx={{ ...cardStyle, p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>Email Templates</Typography>
      {loadingTemplates ? <CircularProgress sx={{ color: '#fff' }} /> : (
        <List>
          {emailTemplates.map((template) => (
            <ListItem 
              key={template.templateKey} 
              divider
              sx={{ borderBottomColor: 'rgba(255, 255, 255, 0.12)' }}
              secondaryAction={
                <IconButton edge="end" aria-label="edit" onClick={() => handleEditTemplate(template.templateKey)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <EditIcon />
                </IconButton>
              }
            >
              <ListItemText 
                primary={template.templateKey.replace(/_/g, ' ')} 
                secondary={template.description || 'No description'}
                primaryTypographyProps={{ color: '#fff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.5)' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );

  const renderContent = () => (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
        Email Configuration
      </Typography>
      <Box sx={{ 
        borderColor: 'rgba(255, 255, 255, 0.12)', 
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '12px 12px 0 0',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        overflow: 'hidden',
        p: 1
      }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          aria-label="Email configuration tabs"
          sx={{ 
            '& .MuiTabs-indicator': { backgroundColor: '#fff' },
            '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
            '& .Mui-selected': { color: '#fff' }
          }}
        >
          <Tab label="SMTP Settings" />
          <Tab label="Email Templates" />
        </Tabs>
      </Box>
      {currentTab === 0 && renderSmtpSettings()}
      {currentTab === 1 && renderEmailTemplates()}
    </Container>
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
          onProfileClick={handleProfileClick}
          onSettingsClick={handleSettingsClick} 
          onHelpClick={handleHelpClick}
          onLogout={handleLogout}
          onToggleTopWidgets={() => {}} // Placeholder
          topWidgetsVisible={true} // Placeholder
        />
      }
      mainContent={
        <>
          {renderContent()}
          <Snackbar 
            open={snackbar.open} 
            autoHideDuration={6000} 
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
          {/* Add the Edit Template Modal */}
          <EditTemplateModal 
            open={isEditModalOpen}
            onClose={handleCloseEditModal}
            template={selectedTemplate}
            onSave={handleTemplateSave}
          />
        </>
      }
      sidebarOpen={isSidebarOpen}
      drawerWidth={DRAWER_WIDTH}
    />
  );
};

export default EmailConfiguration; 