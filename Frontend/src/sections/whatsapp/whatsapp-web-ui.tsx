import { useState, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';

import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  timestamp: number;
  lastMessage: {
    id: string;
    body: string;
    timestamp: number;
    from: string;
    fromMe: boolean;
  } | null;
  contact: {
    id: string;
    name: string;
    number: string;
    isBusiness: boolean;
    profilePicUrl?: string | null;
  };
}

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: string;
  fromMe: boolean;
  hasMedia?: boolean;
  hasDownloadableMedia?: boolean;
  caption?: string;
  hasQuotedMsg?: boolean;
  quotedMessage?: {
    id: string;
    body: string;
    from: string;
    fromMe: boolean;
  };
  ack?: number;
}

interface Contact {
  id: string;
  name: string | null;
  number: string;
  pushname: string | null;
  isBusiness: boolean;
  isUser: boolean;
  profilePicUrl?: string | null;
}

interface WhatsAppWebUIProps {
  accountId: string;
  accountName: string;
  phoneNumber?: string;
  onBack: () => void;
}

const NON_DOWNLOADABLE_TYPES = [
  'interactive', 'button', 'template',
  'location', 'vcard', 'call_log', 'e2e_notification',
  'notification_template', 'gp2', 'revoked',
];

const EMOJI_CATEGORIES = [
  {
    label: '😊 Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲',
             '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬',
             '🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤧','🥵','🥶','🥴','😵','🤯','😎','🥸','🤓',
             '🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖',
             '😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽'],
  },
  {
    label: '👍 Gestures',
    emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️',
             '👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦶',
             '👂','🦻','👃','🫀','🫁','🧠','🦷','🦴','👀','👁️','👅','👄'],
  },
  {
    label: '❤️ Hearts',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟',
             '☮️','✝️','☪️','🕉️','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏'],
  },
  {
    label: '🎉 Celebration',
    emojis: ['🎉','🎊','🎈','🎁','🎀','🎗️','🎟️','🎫','🏆','🥇','🥈','🥉','🏅','🎖️','🎪','🤹','🎭','🎨',
             '🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'],
  },
  {
    label: '🌟 Nature',
    emojis: ['🌸','🌺','🌻','🌹','🌷','🌼','💐','🍀','🌿','🍃','🍂','🍁','🌱','🌲','🌳','🌴','🌵','🌾',
             '☀️','🌤️','⛅','🌥️','☁️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️','☃️','⛄','🌬️','💨','🌊','🌈','⚡'],
  },
  {
    label: '🍕 Food',
    emojis: ['🍕','🍔','🍟','🌭','🌮','🌯','🥙','🧆','🥚','🍳','🥘','🍲','🥣','🥗','🍿','🧂','🥫','🍱',
             '🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣','🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦪','🍦',
             '🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯','☕','🍵','🧃','🥤','🧋'],
  },
  {
    label: '✈️ Travel',
    emojis: ['✈️','🚀','🛸','🚁','🛺','🚂','🚃','🚄','🚅','🚆','🚇','🚈','🚉','🚊','🚝','🚞','🚋','🚌',
             '🚍','🚎','🚐','🚑','🚒','🚓','🚔','🚕','🚖','🚗','🚘','🚙','🛻','🚚','🚛','🚜','🏎️','🏍️',
             '🛵','🦽','🦼','🛺','🚲','🛴','🛹','🛼','🚏','🛣️','🛤️','⛽','🚨','🚥','🚦','🛑','🚧'],
  },
  {
    label: '💼 Objects',
    emojis: ['💼','👜','👛','👓','🕶️','🥽','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲',
             '🩳','👙','👚','👛','👜','👝','🎒','🧳','👒','🎩','🧢','⛑️','📱','💻','⌨️','🖥️','🖨️','🖱️',
             '🖲️','💾','💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠','📺','📻','🧭'],
  },
];

export function WhatsAppWebUI({ accountId, accountName, phoneNumber, onBack }: WhatsAppWebUIProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ file: File; preview: string } | null>(null);
  const [attachMenuAnchor, setAttachMenuAnchor] = useState<HTMLElement | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const apiUrl = CONFIG.serverUrl || 'http://localhost:3000';

  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/chats`);
      if (!res.ok) throw new Error('Failed to fetch chats');
      const data = await res.json();
      setChats(data.chats || []);
    } catch (error: any) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/contacts`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      const data = await res.json();
      setContacts(data.contacts || []);
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (chatId: string, markAsRead: boolean = true) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/chats/${encodeURIComponent(chatId)}/messages?limit=100`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      const sorted = (data.messages || []).sort((a: any, b: any) => a.timestamp - b.timestamp);
      setMessages(sorted);

      if (markAsRead) {
        fetch(`${apiUrl}/whatsapp/web/${accountId}/chats/${encodeURIComponent(chatId)}/read`, {
          method: 'POST',
        }).catch(() => {});
        fetchChats();
      }

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchChats();
    fetchContacts();
    const interval = setInterval(fetchChats, 15000);
    return () => clearInterval(interval);
  }, [accountId]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id, true);
      const interval = setInterval(() => {
        fetchMessages(selectedChat.id, false);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChat?.id]);

  const sendMessage = async (overrideText?: string, mediaFile?: File) => {
    const textToSend = overrideText ?? messageText;
    if ((!textToSend.trim() && !mediaFile && !mediaPreview) || !selectedChat || sending) return;

    setSending(true);
    try {
      if (replyingTo && !mediaFile && !mediaPreview) {
        const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/reply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedChat.id,
            messageId: replyingTo.id,
            message: textToSend.trim(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to send reply');
        }
        setReplyingTo(null);
        setMessageText('');
        await fetchMessages(selectedChat.id, false);
        fetchChats();
        return;
      }

      const fileToSend = mediaFile || mediaPreview?.file;
      if (fileToSend) {
        const isImage = fileToSend.type.startsWith('image/');
        let base64: string;
        let mimetype = fileToSend.type || 'application/octet-stream';

        if (isImage) {
          const compressed = await compressImage(fileToSend, 8);
          base64 = compressed.base64;
          mimetype = fileToSend.type === 'image/gif' ? 'image/gif' : 'image/jpeg';
        } else {
          base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = () => reject(new Error('File read error'));
            reader.readAsDataURL(fileToSend);
          });
        }

        const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedChat.id,
            message: textToSend.trim(),
            media: {
              mimetype,
              data: base64,
              filename: fileToSend.name,
            },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to send file');
        }

        setMediaPreview(null);
        setMessageText('');
        await fetchMessages(selectedChat.id, false);
        fetchChats();
        return;
      }

      if (!textToSend.trim()) return;

      const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedChat.id,
          message: textToSend.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      setMessageText('');
      setShowEmojiPicker(false);
      await fetchMessages(selectedChat.id, false);
      fetchChats();

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }, 100);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const compressImage = (file: File, maxSizeMB: number = 8): Promise<{ blob: Blob; base64: string }> =>
    new Promise((resolve, reject) => {
      const isGif = file.type === 'image/gif';
      if (isGif) {
        const reader = new FileReader();
        reader.onload = () => {
          const b64 = (reader.result as string).split(',')[1];
          resolve({ blob: file, base64: b64 });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX_DIM = 1920;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const tryCompress = (quality: number) => {
          canvas.toBlob((blob) => {
            if (!blob) { reject(new Error('Canvas compression failed')); return; }
            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              tryCompress(quality - 0.2);
              return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve({ blob, base64: (reader.result as string).split(',')[1] });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, 'image/jpeg', quality);
        };
        tryCompress(0.85);
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMediaPreview({ file, preview: reader.result as string });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    sendMessage('', file);
    e.target.value = '';
  };

  const sendLocation = async () => {
    if (!selectedChat) return;
    setAttachMenuAnchor(null);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: selectedChat.id,
              message: '',
              location: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                description: 'My Location',
              },
            }),
          });
          if (!res.ok) throw new Error('Failed to send location');
          await fetchMessages(selectedChat.id, false);
          fetchChats();
        } catch (error: any) {
          alert(`Failed to send location: ${error.message}`);
        }
      },
      (err) => alert(`Could not get location: ${err.message}`),
    );
  };

  const startChatWithContact = async (contact: Contact) => {
    const contactNumber = contact.number || contact.id || '';
    const chatId = contact.id.includes('@') ? contact.id : `${contactNumber.replace(/\D/g, '')}@c.us`;
    const existing = chats.find((c) => c.id === chatId || c.id === contact.id);
    if (existing) {
      setSelectedChat(existing);
      setShowContacts(false);
      return;
    }
    const displayName = contact.name || contact.pushname || contactNumber || 'Unknown';
    const newChat: Chat = {
      id: chatId,
      name: displayName,
      isGroup: false,
      unreadCount: 0,
      timestamp: Date.now(),
      lastMessage: null,
      contact: {
        id: contact.id,
        name: displayName,
        number: contactNumber,
        isBusiness: contact.isBusiness,
        profilePicUrl: contact.profilePicUrl,
      },
    };
    setSelectedChat(newChat);
    setMessages([]);
    setShowContacts(false);
  };

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?\n\nThis will:\n• Disconnect WhatsApp\n• Delete your session\n• Remove all account data')) return;

    setLoggingOut(true);
    try {
      const res = await fetch(`${apiUrl}/whatsapp/web/${accountId}/logout`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({ success: true }));

      setChats([]);
      setContacts([]);
      setMessages([]);
      setSelectedChat(null);
      setMessageText('');
      setReplyingTo(null);
      setMediaPreview(null);
      setSearchQuery('');

      onBack();
    } catch (error: any) {
      console.error('Logout error:', error);
      setChats([]);
      setContacts([]);
      setMessages([]);
      setSelectedChat(null);
      onBack();
    } finally {
      setLoggingOut(false);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const filteredChats = chats.filter(
    (chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.contact.number || '').includes(searchQuery),
  );

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.pushname || '').toLowerCase().includes(q) ||
      c.number.includes(searchQuery)
    );
  });

  const canSend = messageText.trim().length > 0 || !!mediaPreview;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f5', overflow: 'hidden' }}>
      <Box
        sx={{
          width: 360,
          flexShrink: 0,
          bgcolor: '#ffffff',
          borderRight: '1px solid #e9edef',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 1.5, bgcolor: '#008069', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={onBack} sx={{ color: 'white' }}>
            <Iconify icon="eva:arrow-ios-back-fill" width={20} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight="bold" noWrap>{accountName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }} noWrap>{phoneNumber || 'WhatsApp Web'}</Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} disabled={loggingOut} sx={{ color: 'white' }}>
              {loggingOut ? (
                <CircularProgress size={16} sx={{ color: 'white' }} />
              ) : (
                <Iconify icon="solar:close-circle-bold" width={20} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ p: 1, bgcolor: '#f0f2f5', display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder={showContacts ? 'Search contacts' : 'Search chats'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              bgcolor: 'white',
              borderRadius: '20px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                '& fieldset': { border: 'none' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title={showContacts ? 'Show Chats' : 'Show Contacts'}>
            <IconButton
              size="small"
              onClick={() => { setShowContacts(!showContacts); setSearchQuery(''); }}
              sx={{ bgcolor: 'white', borderRadius: '50%', '&:hover': { bgcolor: '#f5f6f6' } }}
            >
              <Iconify icon={showContacts ? 'solar:chat-round-dots-bold' : 'solar:user-id-bold'} width={20} />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {showContacts ? (
            loadingContacts ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <List disablePadding>
                {filteredContacts.map((contact) => {
                  const displayName = contact.name || contact.pushname || contact.number || 'Unknown';
                  const displayNumber = contact.number || contact.id || '';
                  const avatarInitial = displayName.charAt(0).toUpperCase() || '?';
                  
                  return (
                    <ListItem key={contact.id} disablePadding divider>
                      <ListItemButton onClick={() => startChatWithContact(contact)}>
                        <ListItemAvatar>
                          <Avatar src={contact.profilePicUrl || undefined} sx={{ bgcolor: '#25D366', width: 46, height: 46 }}>
                            {avatarInitial}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="subtitle2" noWrap>{displayName}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary" noWrap>{displayNumber}</Typography>}
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            )
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filteredChats.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
              <Iconify icon="solar:chat-round-dots-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" color="text.secondary">No chats found</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filteredChats.map((chat) => (
                <ListItem key={chat.id} disablePadding divider>
                  <ListItemButton
                    selected={selectedChat?.id === chat.id}
                    onClick={() => setSelectedChat(chat)}
                    sx={{
                      '&.Mui-selected': { bgcolor: '#f0f2f5' },
                      '&:hover': { bgcolor: '#f5f6f6' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={chat.contact.profilePicUrl || undefined} sx={{ bgcolor: '#25D366', width: 46, height: 46 }}>
                        {chat.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: chat.unreadCount > 0 ? 700 : 400, flex: 1 }}>
                            {chat.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
                            {chat.timestamp ? formatTime(chat.timestamp) : ''}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ flex: 1, fontSize: '0.8rem' }}>
                            {chat.lastMessage
                              ? chat.lastMessage.fromMe
                                ? `You: ${chat.lastMessage.body.substring(0, 28)}${chat.lastMessage.body.length > 28 ? '…' : ''}`
                                : `${chat.lastMessage.body.substring(0, 28)}${chat.lastMessage.body.length > 28 ? '…' : ''}`
                              : 'No messages yet'}
                          </Typography>
                          {chat.unreadCount > 0 && (
                            <Badge
                              badgeContent={chat.unreadCount}
                              color="success"
                              sx={{ ml: 1, '& .MuiBadge-badge': { bgcolor: '#25D366' } }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#efeae2' }}>
        {selectedChat ? (
          <>
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: '#f0f2f5',
                borderBottom: '1px solid #e9edef',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
              }}
            >
              <Avatar src={selectedChat.contact.profilePicUrl || undefined} sx={{ bgcolor: '#25D366', width: 40, height: 40 }}>
                {selectedChat.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">{selectedChat.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedChat.isGroup ? 'Group' : (selectedChat.contact.number || selectedChat.contact.id || '')}
                </Typography>
              </Box>
              <Tooltip title="Voice call (not supported in web mode)">
                <span>
                  <IconButton size="small" disabled sx={{ opacity: 0.4 }}>
                    <Iconify icon="solar:phone-bold" width={20} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Video call (not supported in web mode)">
                <span>
                  <IconButton size="small" disabled sx={{ opacity: 0.4 }}>
                    <Iconify icon="solar:videocamera-record-bold" width={20} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>

            <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }}>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No messages yet. Say hello! 👋</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {messages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      accountId={accountId}
                      chatId={selectedChat.id}
                      apiUrl={apiUrl}
                      onReply={() => setReplyingTo(message)}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
              )}
            </Box>

            {replyingTo && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: '#f0f2f5',
                  borderTop: '1px solid #e9edef',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Box sx={{ flex: 1, pl: 1.5, borderLeft: '3px solid #25D366', borderRadius: '2px' }}>
                  <Typography variant="caption" fontWeight="bold" color="primary" display="block">
                    {replyingTo.fromMe ? 'You' : selectedChat.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {replyingTo.body || '[Media]'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyingTo(null)}>
                  <Iconify icon="solar:close-circle-bold" width={18} />
                </IconButton>
              </Box>
            )}

            {mediaPreview && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  bgcolor: '#f0f2f5',
                  borderTop: '1px solid #e9edef',
                  flexShrink: 0,
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Box
                    component="img"
                    src={mediaPreview.preview}
                    alt="Preview"
                    sx={{ maxWidth: 180, maxHeight: 180, borderRadius: 1, display: 'block' }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setMediaPreview(null)}
                    sx={{
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      bgcolor: 'error.main',
                      color: 'white',
                      width: 22,
                      height: 22,
                      '&:hover': { bgcolor: 'error.dark' },
                    }}
                  >
                    <Iconify icon="solar:close-circle-bold" width={14} />
                  </IconButton>
                </Box>
              </Box>
            )}

            <Box
              sx={{
                px: 1.5,
                py: 1,
                bgcolor: '#f0f2f5',
                borderTop: '1px solid #e9edef',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <input ref={fileInputRef} type="file" accept="image/*,video/*,image/gif,image/webp" style={{ display: 'none' }} onChange={handleImageSelect} />
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.ppt,.txt,.zip,.rar,.csv"
                style={{ display: 'none' }}
                onChange={handleDocSelect}
              />

              <IconButton
                size="small"
                onClick={(e) => setAttachMenuAnchor(e.currentTarget)}
                sx={{ flexShrink: 0, color: 'text.secondary' }}
              >
                <Iconify icon="eva:attach-2-fill" width={24} />
              </IconButton>

              <Menu
                anchorEl={attachMenuAnchor}
                open={!!attachMenuAnchor}
                onClose={() => setAttachMenuAnchor(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              >
                <MenuItem onClick={() => { fileInputRef.current?.click(); setAttachMenuAnchor(null); }}>
                  <Iconify icon="solar:gallery-add-bold" width={20} sx={{ mr: 1.5, color: '#9c27b0' }} />
                  Image / Video
                </MenuItem>
                <MenuItem onClick={() => { docInputRef.current?.click(); setAttachMenuAnchor(null); }}>
                  <Iconify icon="eva:attach-2-fill" width={20} sx={{ mr: 1.5, color: '#2196f3' }} />
                  Document
                </MenuItem>
                <MenuItem onClick={sendLocation}>
                  <Iconify icon="solar:phone-bold" width={20} sx={{ mr: 1.5, color: '#4caf50' }} />
                  Location
                </MenuItem>
              </Menu>

              <IconButton
                size="small"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                sx={{ flexShrink: 0, color: showEmojiPicker ? '#25D366' : 'text.secondary' }}
              >
                <Typography sx={{ fontSize: 22, lineHeight: 1 }}>😊</Typography>
              </IconButton>

              {showEmojiPicker && (
                <Box
                  onClick={() => setShowEmojiPicker(false)}
                  sx={{ position: 'fixed', inset: 0, zIndex: 1299 }}
                />
              )}

              {showEmojiPicker && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 64,
                    left: 48,
                    zIndex: 1300,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    p: 1,
                    width: 320,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography variant="caption" sx={{ px: 1, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Tap to insert emoji
                  </Typography>
                  {EMOJI_CATEGORIES.map((cat) => (
                    <Box key={cat.label} sx={{ mb: 1 }}>
                      <Typography variant="caption" sx={{ px: 0.5, color: 'text.disabled', fontWeight: 600 }}>
                        {cat.label}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                        {cat.emojis.map((emoji) => (
                          <Box
                            key={emoji}
                            component="button"
                            onClick={() => {
                              setMessageText((prev) => prev + emoji);
                              inputRef.current?.focus();
                            }}
                            sx={{
                              border: 'none',
                              background: 'none',
                              cursor: 'pointer',
                              fontSize: 22,
                              p: '4px',
                              borderRadius: 1,
                              lineHeight: 1,
                              '&:hover': { bgcolor: '#f0f2f5' },
                            }}
                          >
                            {emoji}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              <TextField
                inputRef={inputRef}
                fullWidth
                multiline
                maxRows={4}
                placeholder="Type a message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (canSend) sendMessage();
                  }
                }}
                sx={{
                  bgcolor: 'white',
                  borderRadius: '20px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '20px',
                    px: 1.5,
                    '& fieldset': { border: 'none' },
                  },
                }}
              />

              <IconButton
                onClick={() => sendMessage()}
                disabled={!canSend || sending}
                sx={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  bgcolor: canSend ? '#25D366' : '#e0e0e0',
                  color: canSend ? 'white' : '#9e9e9e',
                  transition: 'background-color 0.2s',
                  '&:hover': { bgcolor: canSend ? '#20BA5A' : '#e0e0e0' },
                  '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
                }}
              >
                {sending ? (
                  <CircularProgress size={18} sx={{ color: 'white' }} />
                ) : (
                  <Iconify icon="eva:arrow-forward-fill" width={20} />
                )}
              </IconButton>
            </Box>
          </>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Iconify icon="solar:chat-round-dots-bold" width={80} sx={{ color: '#ccc', mb: 2 }} />
              <Typography variant="h6">WhatsApp Web</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>Select a chat to start messaging</Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function MessageBubble({
  message,
  accountId,
  chatId,
  apiUrl,
  onReply,
}: {
  message: Message;
  accountId: string;
  chatId: string;
  apiUrl: string;
  onReply: () => void;
}) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const hasFetched = useRef(false);

  const msgType = (message.type || '').toLowerCase();
  const isSticker = msgType === 'sticker';
  const isNonDownloadable =
    !isSticker && (
      NON_DOWNLOADABLE_TYPES.includes(msgType) ||
      message.hasDownloadableMedia === false
    );

  useEffect(() => {
    // For stickers, always try to fetch media even if hasMedia is not set
    const shouldFetchMedia = isSticker || (message.hasMedia && !isNonDownloadable);
    if (!shouldFetchMedia || hasFetched.current || mediaUrl) return;
    hasFetched.current = true;
    setLoadingMedia(true);

    fetch(`${apiUrl}/whatsapp/web/${accountId}/media/${encodeURIComponent(message.id)}?chatId=${encodeURIComponent(chatId)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Media download failed');
        return res.json();
      })
      .then((media) => {
        if (media?.mimetype && media?.data) {
          setMediaUrl(`data:${media.mimetype};base64,${media.data}`);
        } else {
          setMediaError(true);
        }
      })
      .catch(() => setMediaError(true))
      .finally(() => setLoadingMedia(false));
  }, [message.id, message.hasMedia, isNonDownloadable, isSticker, accountId, chatId, apiUrl, mediaUrl]);

  const isImage = (msgType === 'image') || (mediaUrl?.startsWith('data:image'));
  const isVideo = msgType === 'video';
  const isAudio = msgType === 'audio' || msgType === 'ptt';
  const isDocument = msgType === 'document';
  const isLocation = msgType === 'location';

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isMe = message.fromMe === true;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        px: 1,
        mb: 0.25,
        '&:hover .msg-actions': { opacity: 1 },
      }}
    >
      <Box sx={{ maxWidth: '65%', position: 'relative' }}>
        <Card
          sx={{
            p: 0,
            bgcolor: isSticker ? 'transparent' : (isMe ? '#d9fdd3' : '#ffffff'),
            borderRadius: '8px',
            boxShadow: isSticker ? 'none' : '0 1px 0.5px rgba(0,0,0,0.13)',
            ...(isMe ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }),
            overflow: 'visible',
          }}
        >
          {message.hasQuotedMsg && message.quotedMessage && (
            <Box
              sx={{
                mx: 1.5,
                mt: 1,
                pl: 1,
                borderLeft: '3px solid',
                borderColor: isMe ? '#25D366' : '#aaa',
                bgcolor: isMe ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.04)',
                borderRadius: '4px',
                py: 0.5,
              }}
            >
              <Typography variant="caption" fontWeight="bold" color="text.secondary" display="block">
                {message.quotedMessage.fromMe ? 'You' : 'Contact'}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {message.quotedMessage.body || '[Media]'}
              </Typography>
            </Box>
          )}

          {isSticker && (
            <Box sx={{ p: 0.5, textAlign: 'center', bgcolor: 'transparent', minWidth: 80 }}>
              {loadingMedia && <CircularProgress size={40} sx={{ m: 2 }} />}
              {!loadingMedia && mediaUrl && !mediaError && (
                <Box
                  component="img"
                  src={mediaUrl}
                  alt="Sticker"
                  sx={{ width: 150, height: 150, objectFit: 'contain', display: 'block' }}
                  onError={() => setMediaError(true)}
                />
              )}
              {(!loadingMedia && (!mediaUrl || mediaError)) && (
                <Box sx={{ p: 1.5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 48, lineHeight: 1 }}>🏷️</Typography>
                  <Typography variant="caption" color="text.secondary">Sticker</Typography>
                </Box>
              )}
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', display: 'block', mt: 0.5 }}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          )}

          {isLocation && (
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ fontSize: 32, color: '#25D366' }}>📍</Box>
              <Box>
                <Typography variant="body2" fontWeight="bold">Location</Typography>
                <Typography variant="caption" color="text.secondary">{message.body || 'Shared location'}</Typography>
              </Box>
            </Box>
          )}

          {isDocument && (
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, bgcolor: '#25D366', borderRadius: 1, flexShrink: 0 }}>
                <Iconify icon="eva:attach-2-fill" width={24} sx={{ color: 'white' }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {message.body || 'Document'}
                </Typography>
                <Typography variant="caption" color="text.secondary">Document</Typography>
              </Box>
            </Box>
          )}

          {isAudio && (
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="solar:phone-bold" width={28} sx={{ color: '#25D366', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">Voice message</Typography>
                {mediaUrl && (
                  <Box component="audio" controls src={mediaUrl} sx={{ width: '100%', mt: 0.5 }} />
                )}
              </Box>
            </Box>
          )}

          {!isSticker && !isLocation && !isDocument && !isAudio && message.hasMedia && (
            <Box>
              {loadingMedia && (
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {!loadingMedia && mediaUrl && isImage && (
                <Box
                  component="img"
                  src={mediaUrl}
                  alt="Media"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: 280,
                    display: 'block',
                    objectFit: 'cover',
                    ...(isMe ? { borderTopRightRadius: 0 } : { borderTopLeftRadius: 0 }),
                  }}
                />
              )}
              {!loadingMedia && mediaUrl && isVideo && (
                <Box
                  component="video"
                  src={mediaUrl}
                  controls
                  sx={{ maxWidth: '100%', maxHeight: 280, display: 'block' }}
                />
              )}
              {!loadingMedia && !mediaUrl && !mediaError && isNonDownloadable && (
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="eva:attach-2-fill" width={24} sx={{ color: '#25D366' }} />
                  <Typography variant="body2" color="text.secondary">{message.type || 'Media'}</Typography>
                </Box>
              )}
              {!loadingMedia && mediaError && (
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="solar:close-circle-bold" width={20} sx={{ color: 'warning.main' }} />
                  <Typography variant="caption" color="text.secondary">Could not load media</Typography>
                </Box>
              )}
              {message.caption && (
                <Box sx={{ px: 1.5, pb: 0.5, pt: 0.5 }}>
                  <Typography variant="body2">{message.caption}</Typography>
                </Box>
              )}
            </Box>
          )}

          {!isSticker && !isLocation && !isDocument && !isAudio && !message.hasMedia && message.body && (
            <Box sx={{ px: 1.5, pt: 1, pb: 0.25 }}>
              <Typography
                variant="body2"
                sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.5 }}
              >
                {message.body}
              </Typography>
            </Box>
          )}

          {!isSticker && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, px: 1.5, pb: 0.75, pt: 0.25 }}>
              <Typography variant="caption" sx={{ fontSize: '11px', color: 'rgba(0,0,0,0.45)' }}>
                {formatTime(message.timestamp)}
              </Typography>

              {isMe && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {!message.ack || message.ack === 0 ? (
                    <Iconify icon="solar:clock-circle-bold" width={13} sx={{ color: 'rgba(0,0,0,0.45)' }} />
                  ) : message.ack === 1 ? (
                    <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'rgba(0,0,0,0.45)' }} />
                  ) : message.ack === 2 ? (
                    <Box sx={{ display: 'flex', width: 22 }}>
                      <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'rgba(0,0,0,0.45)', position: 'relative', left: 4 }} />
                      <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'rgba(0,0,0,0.45)', position: 'relative', left: -4 }} />
                    </Box>
                  ) : message.ack === 3 ? (
                    <Box sx={{ display: 'flex', width: 22 }}>
                      <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: '#53bdeb', position: 'relative', left: 4 }} />
                      <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: '#53bdeb', position: 'relative', left: -4 }} />
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          )}
        </Card>

        <Box
          className="msg-actions"
          sx={{
            position: 'absolute',
            top: 4,
            [isMe ? 'left' : 'right']: -36,
            opacity: 0,
            transition: 'opacity 0.15s',
          }}
        >
          <Tooltip title="Reply">
            <IconButton size="small" onClick={onReply} sx={{ bgcolor: 'white', boxShadow: 1, width: 28, height: 28 }}>
              <Iconify icon="solar:reply-bold" width={14} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
}
