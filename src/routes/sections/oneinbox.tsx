import type { RouteObject } from 'react-router';

import { MainLayout } from 'src/components/layout';

import { ChatView } from 'src/sections/chat/view';
import { MailView } from 'src/sections/mail/view';

// ----------------------------------------------------------------------

export const oneinboxRoutes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <MailView /> },
      { path: 'mail', element: <MailView /> },
      { path: 'chat', element: <ChatView /> },
    ],
  },
];
