import type { RouteObject } from 'react-router';

import { MailView } from 'src/sections/mail/view';
import { ChatView } from 'src/sections/chat/view';

// ----------------------------------------------------------------------

export const oneinboxRoutes: RouteObject[] = [
  {
    path: '/',
    children: [
      { index: true, element: <MailView /> },
      { path: 'mail', element: <MailView /> },
      { path: 'chat', element: <ChatView /> },
    ],
  },
];
