import type { IMailThread } from 'src/types/mail';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  thread: IMailThread;
  selected: boolean;
  onClick: () => void;
};

export function MailThreadItem({ thread, selected, onClick }: Props) {
  const { latestEmail, emails, unreadCount, isStarred } = thread;

  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={[
        (theme) => ({
          px: 2,
          py: 1.5,
          gap: 2,
          borderRadius: 1,
          minHeight: 72,
          flexDirection: 'column',
          alignItems: 'flex-start',
          border: `1px solid ${selected ? theme.vars.palette.primary.main : 'transparent'}`,
          bgcolor: selected ? 'action.selected' : 'transparent',
          ...(latestEmail.isUnread && {
            bgcolor: 'action.hover',
            fontWeight: 'fontWeightSemiBold',
          }),
        }),
      ]}
    >
      <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
        <Avatar
          alt={latestEmail.from.name}
          src={latestEmail.from.avatarUrl || undefined}
          sx={{ width: 40, height: 40 }}
        >
          {latestEmail.from.name.charAt(0).toUpperCase()}
        </Avatar>

        <Stack sx={{ flex: '1 1 auto', minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={[
                (theme) => ({
                  flex: '1 1 auto',
                  ...theme.mixins.maxLine({ line: 1 }),
                  fontWeight: latestEmail.isUnread ? 'fontWeightSemiBold' : 'fontWeightMedium',
                }),
              ]}
            >
              {thread.subject || '(No Subject)'}
            </Typography>

            {isStarred && (
              <Iconify icon="eva:star-fill" width={16} sx={{ color: 'warning.main', flexShrink: 0 }} />
            )}

            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', flexShrink: 0 }}
            >
              {fDateTime(latestEmail.createdAt)}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="body2"
              sx={[
                (theme) => ({
                  flex: '1 1 auto',
                  ...theme.mixins.maxLine({ line: 1 }),
                  color: 'text.secondary',
                }),
              ]}
            >
              {latestEmail.from.name || latestEmail.from.email}
            </Typography>

            {emails.length > 1 && (
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 0.5,
                  bgcolor: 'action.selected',
                  typography: 'caption',
                  color: 'text.secondary',
                  flexShrink: 0,
                }}
              >
                {emails.length}
              </Box>
            )}

            {unreadCount > 0 && (
              <Box
                sx={{
                  minWidth: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  typography: 'caption',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 'fontWeightSemiBold',
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Stack>

          <Typography
            variant="caption"
            sx={[
              (theme) => ({
                mt: 0.5,
                ...theme.mixins.maxLine({ line: 1 }),
                color: 'text.disabled',
              }),
            ]}
          >
            {latestEmail.message?.replace(/<[^>]*>/g, '').substring(0, 60) || 'No content'}
            {latestEmail.message && latestEmail.message.length > 60 ? '...' : ''}
          </Typography>
        </Stack>
      </Stack>
    </ListItemButton>
  );
}
