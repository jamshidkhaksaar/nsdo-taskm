import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import { usePermissions } from './hooks/usePermissions';

const SystemSetup: React.FC = () => {
  const {
    loading,
    error,
    initializeRbac,
    migrateToRbac
  } = usePermissions();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'initialize' | 'migrate' | null>(null);

  const handleOpenConfirm = (action: 'initialize' | 'migrate') => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmAction === 'initialize') {
      await initializeRbac();
    } else if (confirmAction === 'migrate') {
      await migrateToRbac();
    }
    setConfirmDialogOpen(false);
  };

  return (
    <Box>
      <Typography variant="h6" component="h2" sx={{ color: '#fff', mb: 3 }}>
        RBAC System Setup
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        <Card sx={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Initialize RBAC System
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Set up the initial RBAC configuration with default roles and permissions for your system.
              This is typically done once during system setup.
            </Typography>
            <Button
              variant="contained"
              disabled={loading}
              onClick={() => handleOpenConfirm('initialize')}
              sx={{
                background: 'rgba(33, 150, 243, 0.8)',
                '&:hover': {
                  background: 'rgba(33, 150, 243, 1)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Initialize RBAC'}
            </Button>
          </CardContent>
        </Card>

        <Card sx={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Migrate Existing Users
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Migrate existing users to the RBAC system. This will assign appropriate roles to users
              based on their current permissions in the system.
            </Typography>
            <Button
              variant="contained"
              disabled={loading}
              onClick={() => handleOpenConfirm('migrate')}
              sx={{
                background: 'rgba(76, 175, 80, 0.8)',
                '&:hover': {
                  background: 'rgba(76, 175, 80, 1)',
                }
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Migrate Users'}
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(25, 32, 45, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Confirm Action</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {confirmAction === 'initialize' ? (
              'Are you sure you want to initialize the RBAC system? This will create default roles and permissions.'
            ) : (
              'Are you sure you want to migrate existing users to the RBAC system? This will assign roles based on current permissions.'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={loading}
            sx={{
              background: confirmAction === 'initialize' ? 'rgba(33, 150, 243, 0.8)' : 'rgba(76, 175, 80, 0.8)',
              '&:hover': {
                background: confirmAction === 'initialize' ? 'rgba(33, 150, 243, 1)' : 'rgba(76, 175, 80, 1)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSetup; 