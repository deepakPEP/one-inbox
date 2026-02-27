import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import logoImage from 'src/assets/icons/logo.png';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const HeaderRoot = styled('header')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  display: 'flex',
  alignItems: 'center',
  height: 64,
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderBottom: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
}));

const HeaderContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  justifyContent: 'space-between',
}));

const LogoContainer = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}));

const Logo = styled('img')(() => ({
  height: 32,
  width: 'auto',
}));

const LanguageCurrencyContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginLeft: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const ActionsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.5),
  },
}));

// ----------------------------------------------------------------------

type AppHeaderProps = {
  onOpenSidebar?: () => void;
};

export function AppHeader({ onOpenSidebar }: AppHeaderProps) {
  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [languageAnchor, setLanguageAnchor] = useState<null | HTMLElement>(null);
  const [currencyAnchor, setCurrencyAnchor] = useState<null | HTMLElement>(null);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleCurrencyClick = (event: React.MouseEvent<HTMLElement>) => {
    setCurrencyAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchor(null);
  };

  const handleCurrencyClose = () => {
    setCurrencyAnchor(null);
  };

  return (
    <HeaderRoot>
      <HeaderContainer>
        {/* Left Section - Logo and Language/Currency */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!mdUp && onOpenSidebar && (
            <IconButton onClick={onOpenSidebar} sx={{ mr: 1 }}>
              <Iconify icon="custom:menu-duotone" width={24} />
            </IconButton>
          )}
          <LogoContainer>
            <Logo src={logoImage} alt="Pepagera" />
          </LogoContainer>

        </Box>

        {/* Right Section - Actions */}
        <ActionsContainer>
          <Button
            variant="outlined"
            size="small"
            sx={{
              mr: 1,
              display: { xs: 'none', sm: 'inline-flex' },
            }}
          >
            Post Buying Requirement
          </Button>

          <IconButton sx={{ position: 'relative', mr: { xs: 0.5, sm: 1 } }}>
            <Badge badgeContent={3} color="error">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                RFQ
              </Typography>
            </Badge>
          </IconButton>

          <Button
            variant="contained"
            color="error"
            size="small"
            sx={{
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              px: { xs: 1, sm: 2 },
            }}
          >
            Sign In
          </Button>
        </ActionsContainer>
      </HeaderContainer>
    </HeaderRoot>
  );
}
