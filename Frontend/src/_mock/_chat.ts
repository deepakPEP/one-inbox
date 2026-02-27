import type { IChatConversation, IChatParticipant } from 'src/types/chat';

import { fSub } from 'src/utils/format-time';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const _chatContacts: IChatParticipant[] = Array.from({ length: 20 }, (_, index) => {
  const status =
    (index % 2 && 'online') || (index % 3 && 'offline') || (index % 4 && 'always') || 'busy';

  return {
    id: _mock.id(index),
    status,
    role: _mock.role(index),
    email: _mock.email(index),
    name: _mock.fullName(index),
    phoneNumber: _mock.phoneNumber(index),
    lastActivity: _mock.time(index),
    avatarUrl: _mock.image.avatar(index),
    address: _mock.fullAddress(index),
  };
});

// ----------------------------------------------------------------------

export const _conversations: IChatConversation[] = Array.from({ length: 8 }, (_, index) => {
  const setIndex = index % 8;
  const conversationIndex = index;

  const participants = [
    _chatContacts[conversationIndex],
    {
      id: '8864c717-587d-472a-929a-8a5ef48278cc',
      name: 'You',
      role: 'admin',
      email: 'demo@minimals.cc',
      address: '',
      avatarUrl: _mock.image.avatar(conversationIndex + 1),
      phoneNumber: '',
      lastActivity: fSub({ days: 0 }),
      status: 'online' as const,
    },
  ];

  const messages = Array.from({ length: 3 }, (__, msgIndex) => ({
    id: _mock.id(msgIndex),
    body: _mock.sentence(msgIndex),
    contentType: 'text',
    attachments: [],
    createdAt: fSub({ hours: msgIndex }),
    senderId: participants[msgIndex % 2].id,
  }));

  return {
    id: _mock.id(conversationIndex),
    type: conversationIndex % 2 ? 'group' : 'single',
    unreadCount: conversationIndex % 3,
    participants,
    messages,
  };
});
