import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useMediaQuery from '@mui/material/useMediaQuery';
import ListItemButton from '@mui/material/ListItemButton';

import { useState } from 'react';

import { paths } from 'src/routes/paths';
import { usePathname, useRouter } from 'src/routes/hooks';

import { Iconify, type IconifyName } from 'src/components/iconify';

import { WhatsAppAddAccount } from 'src/sections/whatsapp/whatsapp-add-account';

// ----------------------------------------------------------------------

const SidebarRoot = styled('aside')(({ theme }) => ({
  width: 280,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRight: `1px solid ${theme.palette.divider}`,
  overflow: 'auto',
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const SidebarTitle = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  letterSpacing: 1,
  marginBottom: theme.spacing(1),
}));

const NavItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  minHeight: 48,
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(0.5, 1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  ...(active && {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.error.contrastText,
    },
  }),
  ...(!active && {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  }),
}));

const NavIcon = styled(ListItemIcon)(() => ({
  minWidth: 40,
}));

// ----------------------------------------------------------------------

type NavSection = {
  title: string;
  items: {
    title: string;
    path: string;
    icon: IconifyName;
  }[];
};

const navSections: NavSection[] = [
  {
    title: 'Mail',
    items: [
      {
        title: 'Mail',
        path: paths.dashboard.mail,
        icon: 'solar:letter-bold',
      },
    ],
  },
  {
    title: 'Chat',
    items: [
      {
        title: 'Chat',
        path: paths.dashboard.chat,
        icon: 'solar:chat-round-dots-bold',
      },
    ],
  },
  {
    title: 'WhatsApp',
    items: [
      {
        title: 'WhatsApp',
        path: paths.dashboard.whatsapp,
        icon: 'solar:phone-bold',
      },
    ],
  },
];

// ----------------------------------------------------------------------

type AppSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export function AppSidebar({ open = false, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  const handleNavClick = (path: string) => {
    router.push(path);
    if (!mdUp && onClose) {
      onClose();
    }
  };

  const handleWhatsAppAccountAdded = () => {
    setWhatsappDialogOpen(false);
    // Optionally refresh or show success message
  };

  const renderContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {navSections.map((section, sectionIndex) => (
          <Box key={section.title}>
            <Box sx={{ px: 2, py: 1 }}>
              <SidebarTitle>{section.title}</SidebarTitle>
            </Box>
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = 
                  pathname === item.path || 
                  (item.path === paths.dashboard.mail && pathname === '/') ||
                  (item.path === paths.dashboard.chat && pathname.startsWith(paths.dashboard.chat)) ||
                  (item.path === paths.dashboard.whatsapp && pathname.startsWith(paths.dashboard.whatsapp));

                return (
                  <ListItem key={item.path} disablePadding>
                    <NavItem
                      active={isActive}
                      onClick={() => handleNavClick(item.path)}
                    >
                      <NavIcon>
                        <Iconify icon={item.icon} width={24} />
                      </NavIcon>
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                        }}
                      />
                    </NavItem>
                  </ListItem>
                );
              })}
            </List>
            {sectionIndex < navSections.length - 1 && <Divider sx={{ my: 1 }} />}
          </Box>
        ))}
      </Box>
      
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="solar:phone-bold" width={20} />}
          onClick={() => setWhatsappDialogOpen(true)}
          sx={{ 
            bgcolor: '#25D366', 
            '&:hover': { bgcolor: '#20BA5A' },
            color: 'white'
          }}
        >
          Add WhatsApp Account
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
      <SidebarRoot>{renderContent()}</SidebarRoot>

      <Drawer
        open={open}
        onClose={onClose}
        variant="temporary"
        ModalProps={{
          keepMounted: true,
        }}
        slotProps={{
          paper: {
            sx: {
              width: 280,
            },
          },
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
        }}
      >
        {renderContent()}
      </Drawer>

      <WhatsAppAddAccount
        open={whatsappDialogOpen}
        onClose={() => setWhatsappDialogOpen(false)}
        onAccountAdded={handleWhatsAppAccountAdded}
      />
    </>
  );
}
