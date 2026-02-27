import type { IMailLabel } from 'src/types/mail';

import { useCallback, useState } from 'react';
import { usePopover } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { CustomPopover } from 'src/components/custom-popover';

import { logoutAccount } from 'src/actions/mail';

import { MailNavItem } from './mail-nav-item';
import { MailAddAccount } from './mail-add-account';
import { MailNavItemSkeleton } from './mail-skeleton';

// ----------------------------------------------------------------------

type Props = {
  isEmpty: boolean;
  openNav: boolean;
  loading: boolean;
  labels: IMailLabel[];
  selectedLabelId: string;
  accounts: Array<{
    accountId?: string;
    account_key?: string;
    accountKey?: string;
    emailAddress?: string;
    emailid?: string;
    email?: string;
    emailId?: string;
  }>;
  selectedAccountId: string;
  accountsLoading: boolean;
  onCloseNav: () => void;
  onToggleCompose: () => void;
  onClickLabel: (labelId: string) => void;
  onSelectAccount: (accountId: string) => void;
  onAccountAdded?: () => void;
};

export function MailNav({
  isEmpty,
  loading,
  labels,
  openNav,
  onCloseNav,
  onClickLabel,
  selectedLabelId,
  onToggleCompose,
  accounts,
  selectedAccountId,
  accountsLoading,
  onSelectAccount,
  onAccountAdded,
}: Props) {
  const accountMenu = usePopover();
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  const getAccountEmail = (account: any) =>
    account.emailAddress || account.emailid || account.email || account.emailId || 'Unknown';

  const getAccountId = (account: any) =>
    account.accountId || account.account_key || account.accountKey || '';

  const selectedAccount = accounts.find((acc) => getAccountId(acc) === selectedAccountId);
  const selectedEmail = selectedAccount ? getAccountEmail(selectedAccount) : 'Select Account';
  const renderLoading = () => (
    <Stack sx={{ flex: '1 1 auto', px: { xs: 2.5, md: 1.5 } }}>
      <MailNavItemSkeleton />
    </Stack>
  );

  const renderEmpty = () => (
    <Stack sx={{ flex: '1 1 auto', px: { xs: 2.5, md: 1.5 } }}>
      <EmptyContent
        title="No labels"
        imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-folder-empty.svg`}
      />
    </Stack>
  );

  const renderList = () =>
    isEmpty ? (
      renderEmpty()
    ) : (
      <Scrollbar sx={{ flex: '1 1 0' }}>
        <nav>
          <Box component="ul" sx={{ pb: 1.5, px: { xs: 1.5, md: 0.5 } }}>
            {labels.map((label) => (
              <MailNavItem
                key={label.id}
                label={label}
                selected={selectedLabelId === label.id}
                onClickNavItem={() => onClickLabel(label.id)}
              />
            ))}
          </Box>
        </nav>
      </Scrollbar>
    );

  const renderAccountDropdown = () => (
    <>
      <Box sx={(theme) => ({ p: { xs: 2.5, md: theme.spacing(2, 1.5) } })}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={(e) => accountMenu.onOpen(e)}
          endIcon={<Iconify icon={accountMenu.open ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'} />}
          disabled={accountsLoading}
          sx={{
            justifyContent: 'space-between',
            textTransform: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Iconify icon="solar:letter-bold" />
            <Typography variant="subtitle2">Email</Typography>
            {accounts.length > 0 && (
              <Typography variant="caption" sx={{ ml: 0.5, opacity: 0.7 }}>
                ({accounts.length})
              </Typography>
            )}
          </Box>
        </Button>
      </Box>

      <CustomPopover
        open={accountMenu.open}
        anchorEl={accountMenu.anchorEl}
        onClose={accountMenu.onClose}
        slotProps={{
          paper: { sx: { p: 0, ml: 0, mt: 0.5, minWidth: 200 } },
          arrow: { placement: 'top-left' },
        }}
      >
        <MenuList>
          {accountsLoading ? (
            <MenuItem disabled>
              <Typography variant="body2">Loading accounts...</Typography>
            </MenuItem>
          ) : accounts.length === 0 ? (
            <MenuItem disabled>
              <Typography variant="body2">No accounts found</Typography>
            </MenuItem>
          ) : (
            accounts.map((account) => {
              const accountId = getAccountId(account);
              const email = getAccountEmail(account);
              const isSelected = accountId === selectedAccountId;
              return (
                <Box key={accountId}>
                  <MenuItem
                    selected={isSelected}
                    onClick={() => {
                      onSelectAccount(accountId);
                      accountMenu.onClose();
                    }}
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <Typography variant="body2">{email}</Typography>
                    <Iconify
                      {...({ icon: 'eva:log-out-outline' } as any)}
                      width={16}
                      sx={{ ml: 1, color: 'error.main' }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to logout from ${email}?`)) {
                          try {
                            await logoutAccount(accountId);
                            accountMenu.onClose();
                            // Refresh accounts list
                            if (onAccountAdded) {
                              onAccountAdded();
                            }
                            // If this was the selected account, switch to first available
                            if (isSelected && accounts.length > 1) {
                              const otherAccount = accounts.find((acc) => getAccountId(acc) !== accountId);
                              if (otherAccount) {
                                onSelectAccount(getAccountId(otherAccount));
                              }
                            }
                          } catch (error) {
                            console.error('Failed to logout account:', error);
                            alert('Failed to logout account. Please try again.');
                          }
                        }
                      }}
                    />
                  </MenuItem>
                </Box>
              );
            })
          )}
          <MenuItem
            onClick={(e) => {
              accountMenu.onClose();
              setTimeout(() => {
                setAddAccountOpen(true);
              }, 100);
            }}
            sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 0.5 }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Add Account
            </Typography>
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );

  const renderContent = () => (
    <>
      {renderAccountDropdown()}

      <Box sx={(theme) => ({ p: { xs: 2.5, md: theme.spacing(2, 1.5) } })}>
        <Button
          fullWidth
          color="inherit"
          variant="contained"
          startIcon={<Iconify icon="solar:pen-bold" />}
          onClick={onToggleCompose}
        >
          Compose
        </Button>
      </Box>

      {loading ? renderLoading() : renderList()}
    </>
  );

  const handleAccountAdded = useCallback(() => {
    if (onAccountAdded) {
      onAccountAdded();
    }
    setAddAccountOpen(false);
  }, [onAccountAdded]);

  const handleCloseAddAccount = useCallback(() => {
    setAddAccountOpen(false);
  }, []);

  return (
    <>
      {renderContent()}

      <Drawer
        open={openNav}
        onClose={onCloseNav}
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 280 } },
        }}
      >
        {renderContent()}
      </Drawer>

      <MailAddAccount
        open={addAccountOpen}
        onClose={handleCloseAddAccount}
        onAccountAdded={handleAccountAdded}
      />
    </>
  );
}
