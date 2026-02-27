import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { useState, useEffect, useCallback, useRef } from 'react';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Portal from '@mui/material/Portal';
import Backdrop from '@mui/material/Backdrop';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { sendEmailViaBackend, replyEmailViaBackend, forwardEmailViaBackend } from 'src/actions/mail';

import { Editor } from 'src/components/editor';
import { Iconify } from 'src/components/iconify';

const POSITION = 20;

type Props = {
  onCloseCompose: () => void;
  accountId: string;
  accountEmail?: string;
  initialTo?: string;
  initialSubject?: string;
  initialContent?: string;
  replyMessageId?: string;
  forwardMessageId?: string;
};

export function MailCompose({
  onCloseCompose,
  accountId,
  accountEmail,
  initialTo = '',
  initialSubject = '',
  initialContent = '',
  replyMessageId,
  forwardMessageId,
}: Props) {
  const smUp = useMediaQuery((theme) => theme.breakpoints.up('sm'));

  const fullScreen = useBoolean();
  const sending = useBoolean();

  const [message, setMessage] = useState(initialContent);
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTo) setTo(initialTo);
    if (initialSubject) setSubject(initialSubject);
    if (initialContent) setMessage(initialContent);
  }, [initialTo, initialSubject, initialContent]);

  const handleChangeMessage = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments((prev) => [...prev, ...Array.from(files)]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    if (!to || !subject || !message || !accountId) {
      return;
    }

    sending.onTrue();
    try {
      const ccAddresses = cc ? cc.split(',').map((addr) => addr.trim()).filter(Boolean) : undefined;
      const bccAddresses = bcc ? bcc.split(',').map((addr) => addr.trim()).filter(Boolean) : undefined;

      // Pass File objects directly for upload
      const attachmentFiles = attachments.length > 0 ? attachments : undefined;

      // Send email and capture response to check for upload warnings
      let responseData: any = null;
      if (replyMessageId) {
        responseData = await replyEmailViaBackend(accountId, replyMessageId, {
          content: message,
          subject: subject.trim(),
          toAddress: to.trim(),
          fromAddress: accountEmail,
          attachments: attachmentFiles,
        });
      } else if (forwardMessageId) {
        responseData = await forwardEmailViaBackend(accountId, forwardMessageId, {
          toAddress: to.trim(),
          subject: subject.trim(),
          content: message,
          fromAddress: accountEmail,
          ccAddress: ccAddresses,
          bccAddress: bccAddresses,
          attachments: attachmentFiles,
        });
      } else {
        responseData = await sendEmailViaBackend(accountId, {
          toAddress: to.trim(),
          subject: subject.trim(),
          content: message,
          fromAddress: accountEmail,
          ccAddress: ccAddresses,
          bccAddress: bccAddresses,
          attachments: attachmentFiles,
        });
      }

      // Show warning if some attachments failed to upload
      if (responseData?.uploadWarnings?.length > 0 || responseData?.failedAttachments?.length > 0) {
        const failedNames = responseData.failedAttachments
          ?.map((f: any) => f.file?.originalname || f.originalname || 'Unknown')
          .join(', ') || 'some attachments';
        
        const isUploadRuleError = responseData.failedAttachments?.some(
          (f: any) => f.error?.errorCode === 'MA_9002' || f.error?.moreInfo === 'UPLOAD_RULE_NOT_CONFIGURED',
        );

        if (isUploadRuleError) {
          alert(
            `Email sent successfully, but the following attachment(s) could not be included: ${failedNames}\n\n` +
            `To enable attachment uploads:\n` +
            `1. Log in to Zoho Mail 360 Admin Console\n` +
            `2. Go to Settings → API Configuration\n` +
            `3. Enable "Attachment Upload" rule\n` +
            `4. Save the configuration`,
          );
        } else {
          alert(
            `Email sent successfully, but the following attachment(s) could not be included: ${failedNames}`,
          );
        }
      }

      onCloseCompose();
      setTo('');
      setSubject('');
      setMessage('');
      setCc('');
      setBcc('');
      setAttachments([]);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to send email';
      const errorDetails = error?.response?.data?.details;
      
      // Check if it's an upload rule error
      if (error?.response?.data?.errorCode === 'MA_9002' || error?.response?.data?.moreInfo === 'UPLOAD_RULE_NOT_CONFIGURED') {
        alert(
          `Cannot send email with attachments: ${errorMessage}\n\n` +
          `To enable attachment uploads:\n` +
          `1. Log in to Zoho Mail 360 Admin Console\n` +
          `2. Go to Settings → API Configuration\n` +
          `3. Enable "Attachment Upload" rule\n` +
          `4. Save the configuration\n\n` +
          `You can still send emails without attachments.`,
        );
      } else {
        alert(`Failed to send email: ${errorMessage}${errorDetails ? `\n\n${errorDetails}` : ''}`);
      }
      console.error('Failed to send email:', error);
    } finally {
      sending.onFalse();
    }
  }, [to, subject, message, cc, bcc, accountId, attachments, replyMessageId, sending, onCloseCompose]);

  useEffect(() => {
    document.body.style.overflow = fullScreen.value ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullScreen.value]);

  return (
    <Portal>
      <Backdrop 
        open 
        onClick={onCloseCompose}
        sx={[(theme) => ({ 
          zIndex: theme.zIndex.modal - 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        })]} 
      />

      <Paper
        onClick={(e) => e.stopPropagation()}
        sx={[
          (theme) => ({
            maxWidth: 560,
            right: POSITION,
            borderRadius: 2,
            display: 'flex',
            bottom: POSITION,
            position: 'fixed',
            overflow: 'hidden',
            flexDirection: 'column',
            zIndex: theme.zIndex.modal,
            width: `calc(100% - ${POSITION * 2}px)`,
            boxShadow: theme.vars.customShadows.dropdown,
            backgroundColor: 'background.paper',
            ...(fullScreen.value && { 
              maxWidth: 1, 
              height: `calc(100% - ${POSITION * 2}px)`,
              top: POSITION,
              left: POSITION,
              right: POSITION,
              bottom: POSITION,
            }),
          }),
        ]}
      >
        <Box
          sx={[
            (theme) => ({
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'background.neutral',
              p: theme.spacing(1.5, 1, 1.5, 2),
            }),
          ]}
        >
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            New message
          </Typography>

          <IconButton onClick={fullScreen.onToggle}>
            <Iconify icon={fullScreen.value ? 'eva:collapse-fill' : 'eva:expand-fill'} />
          </IconButton>

          <IconButton onClick={onCloseCompose}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Box>

        <InputBase
          id="mail-compose-to"
          placeholder="To"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          endAdornment={
            <Box sx={{ gap: 0.5, display: 'flex', typography: 'subtitle2' }}>
              <Box
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => setShowCc(!showCc)}
              >
                Cc
              </Box>
              <Box
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => setShowBcc(!showBcc)}
              >
                Bcc
              </Box>
            </Box>
          }
          sx={[
            (theme) => ({
              px: 2,
              height: 48,
              borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        />

        {showCc && (
          <InputBase
            id="mail-compose-cc"
            placeholder="Cc"
            value={cc}
            onChange={(e) => setCc(e.target.value)}
            sx={[
              (theme) => ({
                px: 2,
                height: 48,
                borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          />
        )}

        {showBcc && (
          <InputBase
            id="mail-compose-bcc"
            placeholder="Bcc"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            sx={[
              (theme) => ({
                px: 2,
                height: 48,
                borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
              }),
            ]}
          />
        )}

        <InputBase
          id="mail-compose-subject"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          sx={[
            (theme) => ({
              px: 2,
              height: 48,
              borderBottom: `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }),
          ]}
        />

        <Box
          sx={{
            p: 2,
            gap: 2,
            display: 'flex',
            flex: '1 1 auto',
            overflow: 'hidden',
            flexDirection: 'column',
          }}
        >
          <Editor
            value={message}
            onChange={handleChangeMessage}
            placeholder="Type a message"
            slotProps={{
              wrapper: { ...(fullScreen.value && { minHeight: 0, flex: '1 1 auto' }) },
            }}
            sx={{
              maxHeight: 480,
              ...(fullScreen.value && { maxHeight: 1, flex: '1 1 auto' }),
            }}
          />

          {attachments.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {attachments.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'background.neutral',
                  }}
                >
                  <Iconify icon="eva:attach-2-fill" width={20} />
                  <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveAttachment(index)}
                    sx={{ ml: 'auto' }}
                  >
                    <Iconify icon="mingcute:close-line" width={16} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            <IconButton onClick={() => fileInputRef.current?.click()}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>

            <IconButton onClick={() => fileInputRef.current?.click()}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="contained"
              color="primary"
              disabled={sending.value || !to || !subject || !message || !accountId}
              onClick={handleSend}
              endIcon={<Iconify icon="custom:send-fill" />}
            >
              {sending.value ? 'Sending...' : 'Send'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Portal>
  );
}
