import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
};

export function WhatsAppAddAccount({ open, onClose, onAccountAdded }: Props) {
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'connected'>('idle');
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const apiUrl = CONFIG.serverUrl || 'http://localhost:3000';

  const checkStatus = useCallback(async () => {
    if (!accountId) return;

    try {
      const response = await fetch(`${apiUrl}/whatsapp/web/${accountId}/status`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.isReady && data.phoneNumber) {
        setStatus('connected');
        setPhoneNumber(data.phoneNumber);
        // Call onAccountAdded immediately to refresh the account list
        onAccountAdded();
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else if (data.isReady && !data.phoneNumber) {
        // Client is ready but phone number not yet available, keep checking
        console.log('Client ready but phone number not available yet');
      }
    } catch (err: any) {
      console.log('Status check:', err.message);
    }
  }, [accountId, apiUrl, onAccountAdded]); 

  const fetchQRCode = useCallback(async () => {
    if (!accountId) return;

    try {
      const response = await fetch(`${apiUrl}/whatsapp/web/${accountId}/qr`);
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.qrCode) {
        setQrCode(data.qrCode);
        setStatus('ready');
        setError(null);
      } else if (data.status === 'generating') {
        setStatus('generating');
      }
    } catch (err: any) {
      console.error('Failed to fetch QR code:', err);
    }
  }, [accountId, apiUrl]);

  useEffect(() => {
    if (accountId && status === 'generating') {
      // Poll for QR code every 3 seconds
      const qrInterval = setInterval(fetchQRCode, 3000);
      return () => clearInterval(qrInterval);
    }
  }, [accountId, status, fetchQRCode]);

  useEffect(() => {
    if (accountId && qrCode && status === 'ready') {
      // Poll for status every 2 seconds once QR is ready
      const statusInterval = setInterval(checkStatus, 2000);
      return () => clearInterval(statusInterval);
    }
  }, [accountId, qrCode, status, checkStatus]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setAccountName('');
      setError(null);
      setQrCode(null);
      setAccountId(null);
      setStatus('idle');
      setPhoneNumber(null);
      onClose();
    }
  }, [loading, onClose]);

  const handleCreateAccount = useCallback(async () => {
    setError(null);
    setLoading(true);
    setStatus('generating');

    try {
      const response = await fetch(`${apiUrl}/whatsapp/web/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountName: accountName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create WhatsApp Web client');
      }

      setAccountId(data.accountId);
      
      // If QR code is already available, set it
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setStatus('ready');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create WhatsApp connection');
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  }, [accountName, apiUrl]);

  const handleRefreshQR = useCallback(async () => {
    if (accountId) {
      setStatus('generating');
      setQrCode(null);
      setError(null);
      
      // Destroy the old client and create a new one
      try {
        await fetch(`${apiUrl}/whatsapp/web/${accountId}`, {
          method: 'DELETE',
        });
        
        // Wait a bit before creating new client
        setTimeout(async () => {
          const response = await fetch(`${apiUrl}/whatsapp/web/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accountName: accountName.trim() || undefined,
            }),
          });
          
          const data = await response.json();
          if (response.ok && data.accountId) {
            setAccountId(data.accountId);
            if (data.qrCode) {
              setQrCode(data.qrCode);
              setStatus('ready');
            }
          } else {
            setError(data.message || data.error || 'Failed to refresh QR code');
            setStatus('ready');
          }
        }, 1000);
      } catch (err: any) {
        setError('Failed to refresh QR code. Please try again.');
        setStatus('ready');
      }
    }
  }, [accountId, accountName, apiUrl]);

  if (status === 'connected' && phoneNumber) {
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
              WhatsApp Connected Successfully!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Your WhatsApp account is now connected
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Phone: {phoneNumber}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (qrCode && status === 'ready') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'success.lighter',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon="solar:phone-bold" width={24} sx={{ color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="h6">Scan QR Code</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Connect your WhatsApp account
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
            <Alert severity="info" sx={{ width: '100%' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Open WhatsApp on your phone and scan this QR code to connect your account.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                <strong>Important:</strong> Make sure to scan the QR code within 20 seconds. If it expires, click "Refresh QR Code".
              </Typography>
            </Alert>

            <Box
              sx={{
                p: 2,
                border: '2px solid',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                component="img"
                src={qrCode}
                alt="WhatsApp QR Code"
                sx={{
                  width: 300,
                  height: 300,
                  maxWidth: '100%',
                }}
              />
            </Box>

            <Box
              sx={{
                p: 2,
                bgcolor: 'info.lighter',
                borderRadius: 2,
                width: '100%',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="eva:info-outline" width={16} />
                How to scan:
              </Typography>
              <Box component="ol" sx={{ m: 0, pl: 2.5, '& li': { mb: 0.5 } }}>
                <Typography component="li" variant="body2">
                  Open WhatsApp on your phone
                </Typography>
                <Typography component="li" variant="body2">
                  Tap Menu (⋮) or Settings
                </Typography>
                <Typography component="li" variant="body2">
                  Tap Linked Devices
                </Typography>
                <Typography component="li" variant="body2">
                  Tap Link a Device
                </Typography>
                <Typography component="li" variant="body2">
                  Point your phone at this screen to capture the code
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleRefreshQR} variant="outlined">
            Refresh QR Code
          </Button>
        </DialogActions>
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
              bgcolor: 'success.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:phone-bold" width={24} sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="h6">Add WhatsApp Account</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Connect your WhatsApp using QR code
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateAccount();
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              <Typography variant="body2">
                Scan a QR code with your phone to connect your WhatsApp account. No API credentials needed!
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Account Name (Optional)"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="My WhatsApp"
            />

            {status === 'generating' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Generating QR code...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading || status === 'generating'}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || status === 'generating'}
            startIcon={
              loading || status === 'generating' ? (
                <CircularProgress size={16} />
              ) : (
                <Iconify icon="solar:add-circle-bold" width={16} />
              )
            }
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#20BA5A' } }}
          >
            {loading || status === 'generating' ? 'Generating QR Code...' : 'Generate QR Code'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
