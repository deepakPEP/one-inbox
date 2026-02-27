import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { WhatsAppAddAccount } from '../whatsapp-add-account';
import { WhatsAppWebUI } from '../whatsapp-web-ui';

interface WhatsAppAccount {
  id: string;
  name: string;
  phoneNumber?: string;
  phoneNumberId?: string;
  apiVersion?: string;
  isActive: boolean;
  isReady?: boolean;
  method?: string;
}

export function WhatsAppView() {
  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null);
  const apiUrl = CONFIG.serverUrl || 'http://localhost:3000';

  const fetchAccounts = async () => {
    try {
      setLoading(true);

      const [cloudRes, webRes] = await Promise.all([
        fetch(`${apiUrl}/whatsapp/accounts`).catch(() => ({ ok: false, json: async () => [] } as any)),
        fetch(`${apiUrl}/whatsapp/web/accounts`).catch(() => ({ ok: false, json: async () => [] } as any)),
      ]);

      const cloudAccounts: WhatsAppAccount[] = cloudRes.ok ? await cloudRes.json() : [];
      const webAccounts: WhatsAppAccount[] = webRes.ok ? await webRes.json() : [];

      setAccounts([
        ...cloudAccounts.map((a) => ({ ...a, method: 'cloud-api' })),
        ...webAccounts.map((a) => ({ ...a, method: 'web-js' })),
      ]);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    const interval = setInterval(fetchAccounts, 8000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAccountAdded = () => {
    setShowAddForm(false);
    fetchAccounts();
    const t = setInterval(fetchAccounts, 2000);
    setTimeout(() => clearInterval(t), 30000);
  };

  const handleSelectAccount = (account: WhatsAppAccount) => {
    if (account.isReady || account.isActive) setSelectedAccount(account);
  };

  // ── When an account is selected, render WhatsAppWebUI as a full-screen overlay
  // The component uses position:fixed internally so no extra wrapper needed
  if (selectedAccount && (selectedAccount.isReady || selectedAccount.isActive)) {
    return (
      <WhatsAppWebUI
        accountId={selectedAccount.id}
        accountName={selectedAccount.name}
        phoneNumber={selectedAccount.phoneNumber}
        onBack={() => {
          setSelectedAccount(null);
          // Refresh accounts list after returning (e.g. after logout)
          setTimeout(fetchAccounts, 500);
        }}
      />
    );
  }

  return (
    <DashboardContent maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography variant="h4">WhatsApp</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" onClick={fetchAccounts} disabled={loading}>
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" width={20} />}
              onClick={() => setShowAddForm(true)}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
            >
              Add Account
            </Button>
          </Box>
        </Box>

        {/* Content */}
        {loading && accounts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Iconify icon="solar:chat-round-dots-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>No WhatsApp Accounts</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Get started by adding your first WhatsApp account
              </Typography>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:add-circle-bold" width={20} />}
                onClick={() => setShowAddForm(true)}
                sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1da851' } }}
              >
                Add Account
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {accounts.map((account) => {
              const isConnected = account.isReady || account.isActive;
              return (
                <Card
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  sx={{
                    cursor: isConnected ? 'pointer' : 'not-allowed',
                    opacity: isConnected ? 1 : 0.55,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: isConnected ? 6 : 1 },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Left side */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            bgcolor: '#25D366',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Iconify icon="solar:chat-round-dots-bold" width={26} sx={{ color: '#fff' }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{account.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {account.phoneNumber || 'No phone number'}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {account.method === 'cloud-api' ? 'Cloud API' : account.method === 'web-js' ? 'QR Code (whatsapp-web.js)' : 'Unknown method'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Right side — status badge */}
                      <Box
                        sx={{
                          px: 2, py: 0.5, borderRadius: 1,
                          bgcolor: isConnected ? 'success.lighter' : 'warning.lighter',
                          color: isConnected ? 'success.darker' : 'warning.darker',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700}>
                          {isConnected ? '● Connected' : '○ Connecting…'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      <WhatsAppAddAccount
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onAccountAdded={handleAccountAdded}
      />
    </DashboardContent>
  );
}
