import type { IMail, IMailLabel } from 'src/types/mail';

import { fSub } from 'src/utils/format-time';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const _mailLabels: IMailLabel[] = [
  { id: 'all', type: 'system', name: 'All', color: '#00AB55', unreadCount: 3 },
  { id: 'inbox', type: 'system', name: 'Inbox', color: '#1890FF', unreadCount: 1 },
  { id: 'sent', type: 'system', name: 'Sent', color: '#54D62C' },
  { id: 'drafts', type: 'system', name: 'Drafts', color: '#FFC107' },
  { id: 'trash', type: 'system', name: 'Trash', color: '#FF4842' },
  { id: 'spam', type: 'system', name: 'Spam', color: '#FF6C72', unreadCount: 1 },
  { id: 'important', type: 'system', name: 'Important', color: '#FF4C51', unreadCount: 1 },
  { id: 'starred', type: 'system', name: 'Starred', color: '#FFC107', unreadCount: 1 },
  { id: 'social', type: 'custom', name: 'Social', color: '#00AB55' },
  { id: 'promotions', type: 'custom', name: 'Promotions', color: '#FF9800', unreadCount: 2 },
  { id: 'forums', type: 'custom', name: 'Forums', color: '#FF4842', unreadCount: 1 },
];

// ----------------------------------------------------------------------

export const _mails: IMail[] = Array.from({ length: 5 }, (_, index) => {
  const setIndex = index % 5;
  const mailIndex = index;

  return {
    id: _mock.id(mailIndex),
    folder: 'inbox',
    subject: _mock.postTitle(mailIndex),
    message: _mock.description(mailIndex),
    isUnread: _mock.boolean(mailIndex),
    from: {
      name: _mock.fullName(mailIndex),
      email: _mock.email(mailIndex),
      avatarUrl: _mock.image.avatar(mailIndex),
    },
    to: [
      {
        name: 'demo@minimals.cc',
        email: 'demo@minimals.cc',
        avatarUrl: null,
      },
      {
        name: _mock.fullName(mailIndex + 1),
        email: _mock.email(mailIndex + 1),
        avatarUrl: null,
      },
    ],
    labelIds: _mailLabels.slice(0, 2).map((label) => label.id),
    isStarred: _mock.boolean(mailIndex),
    isImportant: _mock.boolean(mailIndex),
    createdAt: fSub({ days: mailIndex, hours: mailIndex }),
    attachments: [],
  };
});
