import { useBoolean } from 'minimal-shared/hooks';
import { useEffect, useCallback, startTransition, useState } from 'react';

import type { IMail, IMailLabel } from 'src/types/mail';

import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import useMediaQuery from '@mui/material/useMediaQuery';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetMail,
  useGetMails,
  useGetLabels,
  useGetAccounts,
  useGetMailsFromBackend,
  useGetMailFromBackend,
  markEmailAsRead,
} from 'src/actions/mail';

import { MailNav } from '../mail-nav';
import { MailLayout } from '../layout';
import { MailList } from '../mail-list';
import { MailHeader } from '../mail-header';
import { MailCompose } from '../mail-compose';
import { MailDetails } from '../mail-details';

// ----------------------------------------------------------------------

const LABEL_INDEX = 'inbox';

function buildForwardContent(mail: IMail): string {
  const createdAt = typeof mail.createdAt === 'number' ? mail.createdAt : Date.now();
  const date = new Date(createdAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const from = mail.from.email;
  const to = mail.to.map((t) => t.email).join(', ');

  return `<br><br><div style="border-left:3px solid #ccc;padding-left:12px;color:#555;font-size:13px;"><p style="margin:0 0 6px 0;font-weight:600;">---------- Forwarded message ----------</p><p style="margin:2px 0;"><strong>From:</strong> ${from}</p><p style="margin:2px 0;"><strong>Date:</strong> ${date}</p><p style="margin:2px 0;"><strong>Subject:</strong> ${mail.subject}</p><p style="margin:2px 0 10px 0;"><strong>To:</strong> ${to}</p>${mail.message}</div>`;
}

export function MailView() {
  const router = useRouter();

  const mdUp = useMediaQuery((theme) => theme.breakpoints.up('md'));

  const searchParams = useSearchParams();
  const selectedLabelId = searchParams.get('label') ?? LABEL_INDEX;
  const selectedMailId = searchParams.get('id') ?? '';

  const openNav = useBoolean();
  const openMail = useBoolean();
  const openCompose = useBoolean();

  const { accounts, accountsLoading, accountsError, refetchAccounts } = useGetAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [composeMode, setComposeMode] = useState<'new' | 'reply' | 'forward'>('new');
  const [composeTarget, setComposeTarget] = useState<IMail | null>(null);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      const firstAccount = accounts[0];
      const accountId =
        firstAccount.accountId ||
        firstAccount.account_key ||
        firstAccount.accountKey ||
        '';
      if (accountId) {
        setSelectedAccountId(accountId);
      }
    }
  }, [accounts, selectedAccountId]);


  // Listen for mail ID changes from thread navigation
  useEffect(() => {
    const handleMailIdChange = (event: CustomEvent) => {
      if (event.detail?.id) {
        router.push(`?id=${event.detail.id}`, { replace: true });
      }
    };

    window.addEventListener('mailIdChanged', handleMailIdChange as EventListener);
    return () => {
      window.removeEventListener('mailIdChanged', handleMailIdChange as EventListener);
    };
  }, [router]);

  // Use hardcoded system labels with icons - no backend folder fetching needed
  const labels: IMailLabel[] = [
    { id: 'inbox', type: 'system', name: 'Inbox', color: '#1890FF' },
    { id: 'sent', type: 'system', name: 'Sent', color: '#00AB55' },
    { id: 'drafts', type: 'system', name: 'Drafts', color: '#FFC107' },
    { id: 'trash', type: 'system', name: 'Trash', color: '#FF5630' },
    { id: 'spam', type: 'system', name: 'Spam', color: '#FF5630' },
    { id: 'important', type: 'system', name: 'Important', color: '#FF5630' },
    { id: 'starred', type: 'system', name: 'Starred', color: '#FFC107' },
  ];
  const labelsLoading = false;
  const labelsEmpty = false;

  const getFolderIdForBackend = (labelId: string) => {
    const folderMap: Record<string, string> = {
      inbox: 'INBOX',
      sent: 'SENT',
      drafts: 'DRAFTS',
      trash: 'TRASH',
      spam: 'SPAM',
      important: 'IMPORTANT',
      starred: 'STARRED',
    };
    const mapped = folderMap[labelId.toLowerCase()];
    return mapped || labelId.toUpperCase();
  };

  const backendMailsData = useGetMailsFromBackend(
    selectedAccountId,
    selectedAccountId ? getFolderIdForBackend(selectedLabelId) : 'INBOX'
  );

  const { mail: backendMail, mailLoading: backendMailLoading, mailError: backendMailError } =
    useGetMailFromBackend(selectedAccountId, selectedMailId);

  const mails = selectedAccountId ? backendMailsData.mails : { byId: {}, allIds: [] };
  const threads = selectedAccountId ? (backendMailsData.threads || []) : [];
  const mailsLoading = selectedAccountId ? backendMailsData.mailsLoading : false;
  const mailsEmpty = selectedAccountId ? backendMailsData.mailsEmpty : true;

  const mailFromList = selectedMailId && selectedAccountId ? mails.byId[selectedMailId] : undefined;
  
  // Always prefer backendMail if available (has full content), otherwise use mailFromList
  const mail = selectedAccountId && selectedMailId 
    ? (backendMail || mailFromList) 
    : undefined;
  const mailLoading = selectedAccountId && selectedMailId ? backendMailLoading : false;
  const mailError = selectedAccountId && selectedMailId ? backendMailError : undefined;

  // Clear selected mail when account changes to prevent invalid messageId errors
  useEffect(() => {
    if (selectedAccountId && selectedMailId && !backendMailsData.mailsLoading) {
      // Check if the selected mail exists in the current account's mails
      const mailExists = mails.byId[selectedMailId];
      if (!mailExists && !backendMailLoading) {
        // Mail doesn't exist in current account, clear it
        const currentPath = selectedLabelId !== LABEL_INDEX 
          ? `${paths.dashboard.mail}?label=${selectedLabelId}` 
          : paths.dashboard.mail;
        startTransition(() => {
          router.push(currentPath, { replace: true });
        });
      }
    }
  }, [selectedAccountId, mails, selectedMailId, selectedLabelId, router, backendMailsData.mailsLoading, backendMailLoading]);

  const firstMailId = mails.allIds[0] || '';

  const handleToggleCompose = useCallback(() => {
    if (openNav.value) {
      openNav.onFalse();
    }
    openCompose.onToggle();
  }, [openCompose, openNav]);

  const handleClickLabel = useCallback(
    (labelId: string) => {
      if (!mdUp) {
        openNav.onFalse();
      }

      const redirectPath =
        labelId !== LABEL_INDEX ? `${paths.dashboard.mail}?label=${labelId}` : paths.dashboard.mail;

      if (selectedLabelId !== labelId) {
        startTransition(() => {
          router.push(redirectPath);
        });
      }
    },
    [mdUp, selectedLabelId, openNav, router]
  );

  const handleClickMail = useCallback(
    async (mailId: string) => {
      if (!mdUp) {
        openMail.onFalse();
      }

      const redirectPath =
        selectedLabelId !== LABEL_INDEX
          ? `${paths.dashboard.mail}?id=${mailId}&label=${selectedLabelId}`
          : `${paths.dashboard.mail}?id=${mailId}`;

      if (selectedMailId !== mailId) {
        startTransition(() => {
          router.push(redirectPath);
        });
      }

      if (selectedAccountId && mailId) {
        const selectedMail = mails.byId[mailId];

        if (selectedMail && selectedMail.isUnread) {
          try {
            await markEmailAsRead(selectedAccountId, mailId);
            backendMailsData.refetchMails();
          } catch (error) {
            // Silent error handling
          }
        }
      }
    },
    [mdUp, openMail, router, selectedLabelId, selectedMailId, selectedAccountId, mails, backendMailsData]
  );

  const handleReply = useCallback(
    (mailItem: IMail) => {
      openCompose.onTrue();
      setComposeMode('reply');
      setComposeTarget(mailItem);
    },
    [openCompose]
  );

  const handleForward = useCallback(
    (mailItem: IMail) => {
      openCompose.onTrue();
      setComposeMode('forward');
      setComposeTarget(mailItem);
    },
    [openCompose]
  );

  useEffect(() => {
    if (!selectedMailId && firstMailId) {
      handleClickMail(firstMailId);
    }
  }, [firstMailId, handleClickMail, selectedMailId]);

  const handleAccountChange = useCallback(
    (event: any) => {
      const accountId = event.target.value;
      setSelectedAccountId(accountId);
      if (selectedMailId) {
        startTransition(() => {
          router.push(paths.dashboard.mail);
        });
      }
    },
    [router, selectedMailId]
  );

  const getAccountEmail = (account: any) =>
    account.emailAddress ||
    account.emailid ||
    account.email ||
    account.emailId ||
    'Unknown';

  const getAccountId = (account: any) =>
    account.accountId || account.account_key || account.accountKey || '';

  return (
    <>
      <DashboardContent
        maxWidth={false}
        sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: { xs: 3, md: 5 } }}>
          <Typography variant="h4">Mail</Typography>
          {selectedAccountId && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {getAccountEmail(accounts.find((acc) => getAccountId(acc) === selectedAccountId) || {})}
            </Typography>
          )}
        </Box>

        <MailLayout
          sx={{
            p: 1,
            borderRadius: 2,
            flex: '1 1 auto',
            bgcolor: 'background.neutral',
          }}
          slots={{
            header: (
              <MailHeader
                onOpenNav={openNav.onTrue}
                onOpenMail={mailsEmpty ? undefined : openMail.onTrue}
                sx={{ display: { md: 'none' } }}
              />
            ),
            nav: (
              <MailNav
                labels={labels}
                isEmpty={labelsEmpty}
                loading={labelsLoading}
                openNav={openNav.value}
                onCloseNav={openNav.onFalse}
                selectedLabelId={selectedLabelId}
                onClickLabel={handleClickLabel}
                onToggleCompose={handleToggleCompose}
                accounts={accounts}
                selectedAccountId={selectedAccountId}
                accountsLoading={accountsLoading}
                onSelectAccount={setSelectedAccountId}
                onAccountAdded={refetchAccounts}
              />
            ),
            list: (
              <MailList
                mails={mails}
                threads={threads}
                isEmpty={mailsEmpty}
                loading={mailsLoading}
                openMail={openMail.value}
                onCloseMail={openMail.onFalse}
                onClickMail={handleClickMail}
                selectedLabelId={selectedLabelId}
                selectedMailId={selectedMailId}
                useThreadView={selectedLabelId === 'inbox' || selectedLabelId === 'sent'}
              />
            ),
            details: (
              <MailDetails
                mail={mail}
                error={mailError?.message}
                loading={mailLoading}
                accountId={selectedAccountId}
                renderLabel={(id: string) => labels.find((label: IMailLabel) => label.id === id)}
                onReply={handleReply}
                onForward={handleForward}
                threadEmails={mail && threads.length > 0 
                  ? threads.find(t => t.emails.some(e => e.id === mail.id))?.emails || []
                  : undefined}
              />
            ),
          }}
          slotProps={{
            list: {
              sx: [mailsEmpty && { display: 'flex', flex: '1 1 auto' }],
            },
            details: {
              sx: [mailsEmpty && { display: 'none' }],
            },
          }}
        />
      </DashboardContent>

      {openCompose.value && (
        <MailCompose
          onCloseCompose={() => {
            openCompose.onFalse();
            setComposeTarget(null);
            setComposeMode('new');
          }}
          accountId={selectedAccountId}
          accountEmail={
            selectedAccountId
              ? getAccountEmail(accounts.find((acc) => getAccountId(acc) === selectedAccountId) || {})
              : undefined
          }
          initialTo={
            composeMode === 'reply' && composeTarget
              ? composeTarget.from.email
              : composeMode === 'forward' && composeTarget
              ? ''
              : ''
          }
          initialSubject={
            composeMode === 'reply' && composeTarget
              ? composeTarget.subject.startsWith('Re:')
                ? composeTarget.subject
                : `Re: ${composeTarget.subject}`
              : composeMode === 'forward' && composeTarget
              ? composeTarget.subject.startsWith('Fwd:')
                ? composeTarget.subject
                : `Fwd: ${composeTarget.subject}`
              : ''
          }
          initialContent={
            composeMode === 'forward' && composeTarget
              ? buildForwardContent(composeTarget)
              : ''
          }
          replyMessageId={composeMode === 'reply' && composeTarget ? composeTarget.id : undefined}
          forwardMessageId={composeMode === 'forward' && composeTarget ? composeTarget.id : undefined}
        />
      )}
    </>
  );
}
