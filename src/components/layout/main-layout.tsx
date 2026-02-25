import { Outlet } from 'react-router';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';

import { AppHeader } from './header';
import { AppSidebar } from './sidebar';

// ----------------------------------------------------------------------

const LayoutRoot = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden',
}));

const LayoutContent = styled(Box)(() => ({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
}));

const MainContent = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
}));

// ----------------------------------------------------------------------

export function MainLayout() {
  const sidebarOpen = useBoolean();

  return (
    <LayoutRoot>
      <AppHeader onOpenSidebar={sidebarOpen.onTrue} />
      <LayoutContent>
        <AppSidebar open={sidebarOpen.value} onClose={sidebarOpen.onFalse} />
        <MainContent>
          <Outlet />
        </MainContent>
      </LayoutContent>
    </LayoutRoot>
  );
}
