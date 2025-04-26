import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { EmailTemplate } from '../../pages/admin/EmailConfiguration'; // Adjust path if needed
import axios from '../../utils/axios';

interface EditTemplateModalProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
  onSave: (updatedTemplate: EmailTemplate) => void; // Callback on successful save
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ open, onClose, template, onSave }) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (template) {
      setSubject(template.subject);
      setDescription(template.description || '');
      setBodyHtml(template.bodyHtml);
      setError(null); // Clear error when a new template is loaded
    } else {
      // Reset fields if no template is provided (e.g., modal closed)
      setSubject('');
      setDescription('');
      setBodyHtml('');
      setError(null);
    }
  }, [template]);

  const handleSave = async () => {
    if (!template) return;

    setLoading(true);
    setError(null);
    const updatedData = { subject, description, bodyHtml };

    try {
      const response = await axios.put(`/email-templates/${template.templateKey}`, updatedData);
      setLoading(false);
      onSave(response.data); // Pass the updated template back
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error('Failed to update template:', err);
      setError(err.response?.data?.message || 'Failed to update template. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while loading
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Template: {template?.templateKey.replace(/_/g, ' ')}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
          <TextField
            label="Subject"
            fullWidth
            margin="normal"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Description (Optional)"
            fullWidth
            margin="normal"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Body (HTML)"
            fullWidth
            margin="normal"
            multiline
            rows={15} // Adjust rows as needed
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            disabled={loading}
            // Consider using a proper code editor component (like Monaco) here for better HTML editing
            sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace' } }} 
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditTemplateModal; 