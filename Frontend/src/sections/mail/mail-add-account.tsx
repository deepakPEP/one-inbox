import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

import axiosInstance from 'src/lib/axios';

import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
};

export function MailAddAccount({ open, onClose, onAccountAdded }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('IMAP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const detectAccountType = (emailAddress: string) => {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') return 'GOOGLE';
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com') return 'MICROSOFT';
    if (domain === 'yahoo.com' || domain === 'ymail.com') return 'YAHOO';
    return 'IMAP';
  };

  const getImapServer = (emailAddress: string) => {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') return 'imap.gmail.com';
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com')
      return 'outlook.office365.com';
    if (domain === 'yahoo.com' || domain === 'ymail.com') return 'imap.mail.yahoo.com';
    return `imap.${domain}`;
  };

  const getSmtpServer = (emailAddress: string) => {
    const domain = emailAddress.split('@')[1]?.toLowerCase();
    if (domain === 'gmail.com') return 'smtp.gmail.com';
    if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com')
      return 'smtp.office365.com';
    if (domain === 'yahoo.com' || domain === 'ymail.com') return 'smtp.mail.yahoo.com';
    return `smtp.${domain}`;
  };

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const emailValue = e.target.value;
    setEmail(emailValue);
    if (emailValue.includes('@')) {
      setAccountType(detectAccountType(emailValue));
    }
  }, []);

  const handleClose = useCallback(() => {
    if (!loading) {
      setEmail('');
      setPassword('');
      setAccountType('IMAP');
      setError(null);
      setSuccess(false);
      onClose();
    }
  }, [loading, onClose]);

  const isGmail = accountType === 'GOOGLE';
  const isMicrosoft = accountType === 'MICROSOFT';
  const isYahoo = accountType === 'YAHOO';
  const needsAppPassword = isGmail || isMicrosoft || isYahoo;

  const getPasswordPlaceholder = () => {
    if (isGmail) return 'Gmail App Password (16 chars)';
    if (isMicrosoft) return 'App password or account password';
    if (isYahoo) return 'Yahoo App Password';
    return 'Enter your email password';
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      try {
        const credentialsPayload =
          accountType === 'IMAP'
            ? {
                email,
                password,
                host: getImapServer(email),
                imapServer: getImapServer(email),
                port: 993,
                imapPort: 993,
                smtpHost: getSmtpServer(email),
                smtp_server: getSmtpServer(email),
                smtpPort: 587,
                smtp_port: 587,
              }
            : {
                email,
                password,
              };

        console.log('Adding account with payload:', {
          accountType,
          emailAddress: email,
          displayName: email.split('@')[0],
          credentials: { ...credentialsPayload, password: '***' },
        });

        const response = await axiosInstance.post('/zoho-mail/accounts/sync', {
          accountType,
          emailAddress: email,
          displayName: email.split('@')[0],
          credentials: credentialsPayload,
        });

        console.log('Account added successfully:', response.data);

        setSuccess(true);
        setTimeout(() => {
          onAccountAdded();
          handleClose();
        }, 1500);
      } catch (err: any) {
        console.error('Error adding account:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        
        const errorData = err.response?.data || {};
        const msg = errorData.message || errorData.error || err.message || 'Failed to add email account';
        let errorMessage = msg;

        if (errorData.errorCode) {
          errorMessage = `${msg} (Error Code: ${errorData.errorCode})`;
        }

        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        }

        if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('auth')) {
          if (isGmail) {
            errorMessage =
              'Authentication failed. For Gmail you must use an App Password, not your regular password. Go to Google Account → Security → 2-Step Verification → App passwords to generate one.';
          } else if (isMicrosoft) {
            errorMessage =
              'Authentication failed. For Outlook/Microsoft accounts, use an App password from your Microsoft Account security settings.';
          }
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [email, password, accountType, isGmail, isMicrosoft, onAccountAdded, handleClose]
  );

  if (success) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Iconify icon="eva:checkmark-fill" width={32} sx={{ color: 'success.main' }} />
            </Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Email Added Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Loading your emails…
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: 'primary.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:letter-bold" width={24} sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="h6">Add Email Account</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Connect your email to sync and manage messages
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {needsAppPassword && (
            <Alert
              severity="warning"
              sx={{ '& .MuiAlert-message': { width: '100%' } }}
            >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {isGmail && 'Gmail requires an App Password'}
                  {isMicrosoft && 'Microsoft may require an App password'}
                  {isYahoo && 'Yahoo requires an App password'}
                </Typography>
                <Typography variant="body2" component="div">
                  {isGmail && (
                    <>
                      Google no longer allows regular passwords for third-party apps. You must generate an App Password:
                      <Box component="ol" sx={{ mt: 1, pl: 2 }}>
                        <li>Go to your Google Account → Security</li>
                        <li>Enable 2-Step Verification if not already</li>
                        <li>Under &quot;How you sign in&quot;, click App passwords</li>
                        <li>Generate a password for &quot;Mail&quot; → copy the 16-char code</li>
                        <li>Paste it below (spaces are OK)</li>
                      </Box>
                      <Button
                        size="small"
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        endIcon={<Iconify icon="eva:external-link-fill" />}
                        sx={{ mt: 1 }}
                      >
                        Open Google App Passwords
                      </Button>
                    </>
                  )}
                  {isMicrosoft && (
                    <>
                      If you have 2-factor authentication enabled, generate an App password from your Microsoft Account
                      security settings.
                    </>
                  )}
                  {isYahoo && (
                    <>Go to Yahoo Account Security and generate an app password for this application.</>
                  )}
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
              placeholder="your.email@example.com"
            />

            <TextField
              fullWidth
              label={needsAppPassword ? 'App Password' : 'Password'}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder={getPasswordPlaceholder()}
            />

            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select value={accountType} onChange={(e) => setAccountType(e.target.value)} label="Account Type">
                <MenuItem value="IMAP">IMAP (Generic / Custom Email)</MenuItem>
                <MenuItem value="GOOGLE">Google Gmail</MenuItem>
                <MenuItem value="MICROSOFT">Microsoft Outlook / Hotmail</MenuItem>
                <MenuItem value="YAHOO">Yahoo Mail</MenuItem>
              </Select>
              <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="eva:info-outline" width={14} />
                Auto-detected from email domain
              </Typography>
            </FormControl>

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : null}>
            {loading ? 'Adding Account…' : 'Add Email Account'}
          </Button>
        </DialogActions>
      </form>

      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', display: 'block' }}>
          Credentials are securely sent to Zoho Mail 360 for account synchronization
        </Typography>
      </Box>
    </Dialog>
  );
}
