import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Link as MuiLink,
} from '@mui/material';

interface TwoFactorFormInputs {
  verificationCode: string;
}

// Define schemas based on the 2FA method
const appTwoFactorSchema = z.object({
  verificationCode: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits')
    .regex(/^\\d{6}$/, 'Code must be 6 digits'),
});

const emailTwoFactorSchema = z.object({
  verificationCode: z
    .string()
    .min(6, 'Code must be 6 characters')
    .max(6, 'Code must be 6 characters')
    .regex(/^[a-zA-Z0-9]{6}$/, 'Code must be 6 characters (alphanumeric)'),
});

interface TwoFactorAuthPopupProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TwoFactorFormInputs) => Promise<void>;
  loading: boolean;
  error?: string | null;
  twoFactorMethod?: 'app' | 'email'; // To slightly customize text or add resend button
  onResendEmailCode?: () => Promise<void>; // Optional handler for resending email code
  isResendingEmail?: boolean; // To show loading on resend button
}

const TwoFactorAuthPopup: React.FC<TwoFactorAuthPopupProps> = ({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  twoFactorMethod = 'app',
  onResendEmailCode,
  isResendingEmail = false,
}) => {
  // Determine the schema based on the 2FA method
  const currentSchema = twoFactorMethod === 'email' ? emailTwoFactorSchema : appTwoFactorSchema;

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    reset,
  } = useForm<TwoFactorFormInputs>({
    resolver: zodResolver(currentSchema), // Use the conditional schema
    defaultValues: {
      verificationCode: '',
    },
  });

  const handleFormSubmit = async (data: TwoFactorFormInputs) => {
    await onSubmit(data);
    // Do not reset form here if submission fails and dialog stays open,
    // so user can correct the code. Reset on successful close or explicit action.
  };
  
  React.useEffect(() => {
    if (!open) {
      reset({ verificationCode: '' });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Two-Factor Authentication</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {twoFactorMethod === 'email'
            ? 'A verification code has been sent to your email address.'
            : 'Enter the code from your authenticator app.'}
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {twoFactorMethod === 'email'
            ? 'Please enter the 6-character code below.'
            : 'Please enter the 6-digit code below.'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="verificationCode"
            label="Verification Code"
            autoComplete="one-time-code"
            autoFocus
            {...register('verificationCode')}
            error={!!formErrors.verificationCode || !!error}
            helperText={formErrors.verificationCode?.message || (error && !formErrors.verificationCode ? error : '')}
            disabled={loading}
            inputProps={{
              maxLength: 6,
              inputMode: twoFactorMethod === 'email' ? 'text' : 'numeric',
              pattern: twoFactorMethod === 'email' ? '^[a-zA-Z0-9]*$' : '[0-9]*',
            }}
          />
          
          {twoFactorMethod === 'email' && onResendEmailCode && (
            <Box sx={{ mt: 1, textAlign: 'right' }}>
              <MuiLink component="button" variant="body2" onClick={onResendEmailCode} disabled={loading || isResendingEmail}>
                {isResendingEmail ? <CircularProgress size={16} sx={{mr:1}} /> : null}
                Resend Code
              </MuiLink>
            </Box>
          )}

          <DialogActions sx={{ px: 0, pt: 2 }}>
            <Button onClick={onClose} color="inherit" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || isResendingEmail}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              Verify
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorAuthPopup; 