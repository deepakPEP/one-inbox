import type { IMail, IMailLabel } from 'src/types/mail';

import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback } from 'react';
import { getEmailAttachments, downloadAttachment, getThreadFromBackend } from 'src/actions/mail';
import useSWR from 'swr';
import { fetcher, endpoints } from 'src/lib/axios';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import Checkbox from '@mui/material/Checkbox';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { darken, lighten, alpha as hexAlpha } from '@mui/material/styles';

import { fDateTime } from 'src/utils/format-time';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Editor } from 'src/components/editor';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { FileThumbnail } from 'src/components/file-thumbnail';
import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

type Props = {
  mail?: IMail;
  error?: string;
  loading?: boolean;
  accountId?: string;
  renderLabel?: (id: string) => IMailLabel | undefined;
  onReply?: (mail: IMail) => void;
  onForward?: (mail: IMail) => void;
  threadEmails?: IMail[];
};

export function MailDetails({ mail, renderLabel, error, loading, accountId, onReply, onForward, threadEmails }: Props) {
  const showAttachments = useBoolean(true);
  const isStarred = useBoolean(mail?.isStarred);
  const isImportant = useBoolean(mail?.isImportant);
  const [emailAttachments, setEmailAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Fetch attachments when mail or accountId changes
  useEffect(() => {
    if (mail?.id && accountId) {
      // Always try to fetch attachments if hasAttachment is true, or if no attachments are present
      const shouldFetch = mail?.hasAttachment || !mail?.attachments || mail.attachments.length === 0;
      
      if (shouldFetch) {
        setAttachmentsLoading(true);
        getEmailAttachments(accountId, mail.id)
          .then((attachments) => {
            const fetchedAttachments = Array.isArray(attachments) ? attachments : [];
            // Use fetched attachments if available, otherwise fall back to mail attachments
            setEmailAttachments(fetchedAttachments.length > 0 ? fetchedAttachments : (mail?.attachments || []));
          })
          .catch((err) => {
            console.error('Failed to fetch attachments:', err);
            // Fall back to attachments from mail object if API call fails
            setEmailAttachments(mail?.attachments || []);
          })
          .finally(() => {
            setAttachmentsLoading(false);
          });
      } else {
        // If attachments are already present in mail object, use them
        setEmailAttachments(mail.attachments || []);
        setAttachmentsLoading(false);
      }
    } else {
      setEmailAttachments(mail?.attachments || []);
      setAttachmentsLoading(false);
    }
  }, [mail?.id, accountId, mail?.hasAttachment, mail?.attachments]);

  const handleDownloadAttachment = useCallback(
    async (attachmentId: string, filename: string) => {
      if (!accountId || !mail?.id) return;
      
      try {
        await downloadAttachment(accountId, mail.id, attachmentId, filename);
      } catch (error) {
        console.error('Failed to download attachment:', error);
      }
    },
    [accountId, mail?.id]
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <EmptyContent
        title={error}
        imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-email-disabled.svg`}
      />
    );
  }

  const renderHead = () => (
    <>
      <Box sx={{ gap: 1, flexGrow: 1, display: 'flex' }}>
        {mail?.labelIds.map((labelId) => {
          const label = renderLabel?.(labelId);

          if (!label) return null;

          return (
            <Label
              key={label.id}
              sx={[
                (theme) => ({
                  color: darken(label.color, 0.24),
                  bgcolor: hexAlpha(label.color, 0.16),
                  ...theme.applyStyles('dark', {
                    color: lighten(label.color, 0.24),
                  }),
                }),
              ]}
            >
              {label.name}
            </Label>
          );
        })}
      </Box>

      <Box
        sx={{ display: 'flex', flex: '1 1 auto', alignItems: 'center', justifyContent: 'flex-end' }}
      >
        <Checkbox
          color="warning"
          icon={<Iconify icon="eva:star-outline" />}
          checkedIcon={<Iconify icon="eva:star-fill" />}
          checked={isStarred.value}
          onChange={isStarred.onToggle}
          slotProps={{
            input: {
              id: 'starred-checkbox',
              'aria-label': 'Starred checkbox',
            },
          }}
        />

        <Checkbox
          color="warning"
          icon={<Iconify icon="ic:round-label-important" />}
          checkedIcon={<Iconify icon="ic:round-label-important" />}
          checked={isImportant.value}
          onChange={isImportant.onToggle}
          slotProps={{
            input: {
              id: 'important-checkbox',
              'aria-label': 'Important checkbox',
            },
          }}
        />

        <Tooltip title="Archive">
          <IconButton>
            <Iconify icon="solar:archive-down-minimlistic-bold" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Mark Unread">
          <IconButton>
            <Iconify icon="solar:letter-unread-bold" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Trash">
          <IconButton>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>

        <IconButton>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Box>
    </>
  );

  const renderSubject = () => (
    <>
      <Typography
        variant="subtitle2"
        sx={[
          (theme) => ({
            ...theme.mixins.maxLine({ line: 2 }),
            flex: '1 1 auto',
          }),
        ]}
      >
        Re: {mail?.subject}
      </Typography>

      <Stack spacing={0.5}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {onReply && mail && (
            <IconButton size="small" onClick={() => onReply(mail)}>
              <Iconify width={18} icon="solar:reply-bold" />
            </IconButton>
          )}

          {onForward && mail && (
            <IconButton size="small" onClick={() => onForward(mail)}>
              <Iconify width={18} icon="solar:forward-bold" />
            </IconButton>
          )}
        </Box>

        <Typography variant="caption" noWrap sx={{ color: 'text.disabled' }}>
          {fDateTime(mail?.createdAt)}
        </Typography>
      </Stack>
    </>
  );

  const renderSender = () => (
    <>
      <Avatar
        alt={mail?.from.name}
        src={mail?.from.avatarUrl ? `${mail?.from.avatarUrl}` : ''}
        sx={{ mr: 2 }}
      >
        {mail?.from.name.charAt(0).toUpperCase()}
      </Avatar>

      <Stack spacing={0.5} sx={{ width: 0, flexGrow: 1 }}>
        <Box sx={{ gap: 0.5, display: 'flex' }}>
          <Typography component="span" variant="subtitle2" sx={{ flexShrink: 0 }}>
            {mail?.from.name}
          </Typography>
          <Typography component="span" noWrap variant="body2" sx={{ color: 'text.secondary' }}>
            {`<${mail?.from.email}>`}
          </Typography>
        </Box>

        <Typography noWrap component="span" variant="caption" sx={{ color: 'text.secondary' }}>
          {`To: `}
          {mail?.to.map((person) => (
            <Link key={person.email} color="inherit" sx={{ '&:hover': { color: 'text.primary' } }}>
              {`${person.email}, `}
            </Link>
          ))}
        </Typography>
      </Stack>
    </>
  );

  const renderAttachments = () => {
    const attachments = emailAttachments.length > 0 ? emailAttachments : (mail?.attachments || []);
    const hasAttachments = attachments.length > 0 || mail?.hasAttachment;
    
    // Show loading state if we're fetching attachments or if hasAttachment is true but no attachments yet
    if (attachmentsLoading || (mail?.hasAttachment && attachments.length === 0 && !emailAttachments.length)) {
      return (
        <Stack spacing={1} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.neutral' }}>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Loading attachments...
            </Typography>
          </Box>
        </Stack>
      );
    }
    
    // Only return null if we're sure there are no attachments
    if (!hasAttachments || attachments.length === 0) return null;

    return (
      <Stack spacing={1} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.neutral' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ButtonBase
            onClick={showAttachments.onToggle}
            sx={{ borderRadius: 0.5, typography: 'caption', color: 'text.secondary' }}
          >
            <Iconify icon="eva:attach-2-fill" sx={{ mr: 0.5 }} />
            {attachmentsLoading ? 'Loading...' : `${attachments.length} attachment${attachments.length !== 1 ? 's' : ''}`}
            <Iconify
              icon={
                showAttachments.value ? 'eva:arrow-ios-upward-fill' : 'eva:arrow-ios-downward-fill'
              }
              width={16}
              sx={{ ml: 0.5 }}
            />
          </ButtonBase>

          {attachments.length > 0 && (
            <ButtonBase
              onClick={() => {
                // Download all attachments
                attachments.forEach((att) => {
                  const attachmentId = att.attachmentId || att.id || att.attachment_id;
                  const filename = att.fileName || att.name || att.filename || `attachment_${attachmentId}`;
                  if (attachmentId) {
                    handleDownloadAttachment(attachmentId, filename);
                  }
                });
              }}
              sx={{
                py: 0.5,
                gap: 0.5,
                px: 0.75,
                borderRadius: 0.75,
                typography: 'caption',
                fontWeight: 'fontWeightSemiBold',
              }}
            >
              <Iconify width={18} icon="eva:cloud-download-fill" /> Download All
            </ButtonBase>
          )}
        </Box>

        <Collapse in={showAttachments.value} unmountOnExit timeout="auto">
          {attachmentsLoading ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Loading attachments...
              </Typography>
            </Box>
          ) : attachments.length > 0 ? (
            <Box sx={{ gap: 0.75, display: 'flex', flexWrap: 'wrap' }}>
              {attachments.map((attachment, index) => {
                const attachmentId = attachment.attachmentId || attachment.id || attachment.attachment_id || '';
                const filename = attachment.fileName || attachment.name || attachment.filename || `attachment_${attachmentId}`;
                const fileUrl = attachment.fileUrl || attachment.url || attachment.preview || '';
                
                return (
                  <FileThumbnail
                    key={attachmentId || index}
                    tooltip
                    showImage
                    file={fileUrl}
                    onDownload={() => handleDownloadAttachment(attachmentId, filename)}
                    slotProps={{ icon: { sx: { width: 24, height: 24 } } }}
                    sx={{ width: 48, height: 48, bgcolor: 'background.paper', cursor: 'pointer' }}
                  />
                );
              })}
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                No attachments found
              </Typography>
            </Box>
          )}
        </Collapse>
      </Stack>
    );
  };

  const renderContent = () => {
    const content = mail?.message || '';
    console.log('📧 MailDetails - Rendering content:', {
      hasMail: !!mail,
      mailId: mail?.id,
      hasContent: !!content,
      contentLength: content.length,
      contentPreview: content.substring(0, 200),
      contentType: content.includes('<') && content.includes('>') ? 'HTML' : 'Text',
    });

    if (!content || content.trim() === '' || content === 'No content available') {
      return (
        <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No content available for this email.
          </Typography>
          {mail?.id && accountId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Email ID: {mail.id}
            </Typography>
          )}
        </Box>
      );
    }

    const isHtml = content.includes('<') && (content.includes('</') || content.includes('/>') || content.includes('<div') || content.includes('<p') || content.includes('<br') || content.includes('<html') || content.includes('<!DOCTYPE'));

    if (isHtml) {
      return (
        <Scrollbar sx={{ flex: '1 1 auto', px: 2 }}>
          <Box
            sx={{
              '& *': {
                maxWidth: '100%',
                wordBreak: 'break-word',
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
              },
              '& table': {
                maxWidth: '100%',
                overflow: 'auto',
                display: 'block',
              },
              '& blockquote': {
                borderLeft: '3px solid #ccc',
                paddingLeft: '12px',
                marginLeft: 0,
                color: '#555',
                fontSize: '13px',
              },
              '& .gmail_quote': {
                borderLeft: '3px solid #ccc',
                paddingLeft: '12px',
                marginLeft: 0,
                color: '#555',
                fontSize: '13px',
              },
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Scrollbar>
      );
    }

    return (
      <Scrollbar sx={{ flex: '1 1 auto', px: 2 }}>
        <Markdown children={content} sx={{ '& p': { typography: 'body2', mb: 1 } }} />
      </Scrollbar>
    );
  };

  const renderEditor = () => (
    <>
      <Editor sx={{ maxHeight: 320 }} />

      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton>
          <Iconify icon="solar:gallery-add-bold" />
        </IconButton>

        <IconButton>
          <Iconify icon="eva:attach-2-fill" />
        </IconButton>

        <Stack sx={{ flexGrow: 1 }} />

        <Button color="primary" variant="contained" endIcon={<Iconify icon="custom:send-fill" />}>
          Send
        </Button>
      </Box>
    </>
  );

  return (
    mail && (
      <>
        <Box
          sx={{
            pl: 2,
            pr: 1,
            py: 1,
            gap: 1,
            minHeight: 56,
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {renderHead()}
        </Box>

        <Box
          sx={[
            (theme) => ({
              p: 2,
              gap: 2,
              flexShrink: 0,
              display: 'flex',
              borderTop: `1px dashed ${theme.vars.palette.divider}`,
              borderBottom: `1px dashed ${theme.vars.palette.divider}`,
            }),
          ]}
        >
          {renderSubject()}
        </Box>

        {threadEmails && threadEmails.length > 1 && (
          <Box sx={{ px: 2, py: 1.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`, bgcolor: 'background.neutral' }}>
            <Scrollbar sx={{ maxHeight: 200 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {threadEmails.map((threadMail) => (
                  <ButtonBase
                    key={threadMail.id}
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('id', threadMail.id);
                      window.history.pushState({ id: threadMail.id }, '', url.toString());
                      window.dispatchEvent(new CustomEvent('mailIdChanged', { detail: { id: threadMail.id } }));
                    }}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1,
                      border: (theme) => `1px solid ${threadMail.id === mail?.id ? theme.vars.palette.primary.main : theme.vars.palette.divider}`,
                      bgcolor: threadMail.id === mail?.id ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Iconify 
                      icon="solar:letter-bold"
                      width={14}
                      sx={{ opacity: threadMail.id === mail?.id ? 1 : 0.5 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: threadMail.id === mail?.id ? 'fontWeightSemiBold' : 'fontWeightMedium' }}>
                      {threadMail.from.name || threadMail.from.email.split('@')[0]}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fDateTime(threadMail.createdAt)}
                    </Typography>
                    {threadMail.isUnread && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: 'info.main',
                        }}
                      />
                    )}
                  </ButtonBase>
                ))}
              </Stack>
            </Scrollbar>
          </Box>
        )}

        <Box
          sx={{
            pt: 2,
            px: 2,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {renderSender()}
        </Box>

        {(mail?.hasAttachment || emailAttachments.length > 0 || (mail?.attachments && mail.attachments.length > 0)) && (
          <Stack sx={{ px: 2, mt: 2 }}> {renderAttachments()} </Stack>
        )}

        <Box sx={{ mt: 3, flex: '1 1 240px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderContent()}
        </Box>

        <Stack spacing={2} sx={{ flexShrink: 0, p: 2 }}>
          {renderEditor()}
        </Stack>
      </>
    )
  );
}
