import type { SWRConfiguration } from 'swr';
import type { IMail, IMailLabel, IMailThread } from 'src/types/mail';

import useSWR from 'swr';
import { keyBy } from 'es-toolkit';
import { useMemo } from 'react';

import axiosInstance, { fetcher, endpoints } from 'src/lib/axios';

// ─────────────────────────────────────────────────────────────────────────────
// SWR base options – revalidateIfStale MUST be true so switching back to a
// previously-viewed folder always shows the latest data instead of cache.
// ─────────────────────────────────────────────────────────────────────────────
const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,        // ← was false: caused "old emails" bug
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Folder alias map  (backend + frontend share the same contract)
// ─────────────────────────────────────────────────────────────────────────────
export const FOLDER_ALIASES: Record<string, string[]> = {
  INBOX:     ['INBOX', 'IN BOX', 'INBOX '],
  SENT:      ['SENT', 'SENT ITEMS', 'SENT MAIL', 'SENT ITEM', 'SENT MESSAGES', 'SENT MESSAGE'],
  DRAFTS:    ['DRAFTS', 'DRAFT', 'DRAFTS '],
  TRASH:     ['TRASH', 'DELETED', 'DELETED ITEMS', 'BIN'],
  SPAM:      ['SPAM', 'JUNK', 'JUNK MAIL', 'JUNK E-MAIL'],
  STARRED:   ['STARRED', 'STAR', 'FLAGGED'],
  IMPORTANT: ['IMPORTANT', 'PRIORITY'],
};

/** Maps any raw Zoho folder name → lowercase frontend folder slug */
export function mapFolderToSlug(raw: string): string {
  const upper = (raw || '').toUpperCase().trim();
  for (const [canonical, aliases] of Object.entries(FOLDER_ALIASES)) {
    if (aliases.includes(upper) || (canonical === 'SENT' && upper.includes('SENT'))) {
      return canonical.toLowerCase();
    }
  }
  return upper.toLowerCase();
}

/** Returns true if folderName matches the target canonical folder */
export function folderMatches(folderName: string, target: string): boolean {
  const upper = (folderName || '').toUpperCase().trim();
  const tUpper = target.toUpperCase();
  const aliases = FOLDER_ALIASES[tUpper] || [tUpper];
  return aliases.includes(upper) || (tUpper === 'SENT' && upper.includes('SENT'));
}

// ─────────────────────────────────────────────────────────────────────────────
// useGetLabels
// ─────────────────────────────────────────────────────────────────────────────
type LabelsData = { labels: IMailLabel[] };

export function useGetLabels() {
  const url = endpoints.mail.labels;
  const { data, isLoading, error, isValidating } = useSWR<LabelsData>(url, fetcher, {
    ...swrOptions,
    onError: (err) => { /* silence 404 */ },
  });
  return useMemo(() => ({
    labels: data?.labels || [],
    labelsLoading: isLoading,
    labelsError: error && (error as any).response?.status !== 404 ? error : null,
    labelsValidating: isValidating,
    labelsEmpty: !isLoading && !isValidating && !data?.labels?.length,
  }), [data?.labels, error, isLoading, isValidating]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useGetMails / useGetMail  (legacy – kept for compatibility)
// ─────────────────────────────────────────────────────────────────────────────
type MailsData = { mails: IMail[] };
type MailData  = { mail: IMail };

export function useGetMails(labelId: string) {
  const url = labelId ? [endpoints.mail.list, { params: { labelId } }] : '';
  const { data, isLoading, error, isValidating } = useSWR<MailsData>(url, fetcher, swrOptions);
  return useMemo(() => {
    const byId  = data?.mails?.length ? keyBy(data.mails, (o) => o.id) : {};
    const allIds = Object.keys(byId);
    return { mails: { byId, allIds }, mailsLoading: isLoading, mailsError: error, mailsValidating: isValidating, mailsEmpty: !isLoading && !isValidating && !allIds.length };
  }, [data?.mails, error, isLoading, isValidating]);
}

export function useGetMail(mailId: string) {
  const url = mailId ? [endpoints.mail.details, { params: { mailId } }] : '';
  const { data, isLoading, error, isValidating } = useSWR<MailData>(url, fetcher, swrOptions);
  return useMemo(() => ({
    mail: data?.mail, mailLoading: isLoading, mailError: error, mailValidating: isValidating,
    mailEmpty: !isLoading && !isValidating && !data?.mail,
  }), [data?.mail, error, isLoading, isValidating]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useGetAccounts
// ─────────────────────────────────────────────────────────────────────────────
type Account = {
  accountId?: string; account_key?: string; accountKey?: string;
  emailAddress?: string; emailid?: string; email?: string; emailId?: string;
  displayName?: string; accountType?: string;
};

export function useGetAccounts() {
  const { data, isLoading, error, isValidating, mutate } = useSWR<any>(
    endpoints.mail.accounts, fetcher,
    { ...swrOptions, revalidateOnFocus: true, revalidateOnReconnect: true }
  );
  return useMemo(() => {
    let accounts: Account[] = [];
    if (Array.isArray(data)) accounts = data;
    else if (data && typeof data === 'object') accounts = (data as any).accounts || (data as any).data || [];
    return { accounts, accountsLoading: isLoading, accountsError: error, accountsValidating: isValidating, accountsEmpty: !isLoading && !isValidating && !accounts.length, refetchAccounts: mutate };
  }, [data, error, isLoading, isValidating, mutate]);
}

// ─────────────────────────────────────────────────────────────────────────────
// useGetFolders
// ─────────────────────────────────────────────────────────────────────────────
export function useGetFolders(accountId: string) {
  const url = accountId ? [endpoints.mail.folders(accountId), {}] : '';
  const { data, isLoading, error, isValidating } = useSWR<any[]>(url, fetcher, swrOptions);

  return useMemo(() => {
    let folders: any[] = [];
    if (Array.isArray(data)) folders = data;
    else if (data && typeof data === 'object') folders = (data as any).data || (data as any).folders || [];

    const defaultLabels = [
      { id: 'all',       type: 'system', name: 'All',       color: '#00AB55' },
      { id: 'inbox',     type: 'system', name: 'Inbox',     color: '#1890FF' },
      { id: 'sent',      type: 'system', name: 'Sent',      color: '#00AB55' },
      { id: 'drafts',    type: 'system', name: 'Drafts',    color: '#FFC107' },
      { id: 'trash',     type: 'system', name: 'Trash',     color: '#FF5630' },
      { id: 'spam',      type: 'system', name: 'Spam',      color: '#FF5630' },
      { id: 'important', type: 'system', name: 'Important', color: '#FF5630' },
      { id: 'starred',   type: 'system', name: 'Starred',   color: '#FFC107' },
    ];

    const systemIds = new Set(defaultLabels.map((l) => l.id.toLowerCase()));
    const backendLabels = folders
      .map((folder) => {
        const id   = folder.folderId || folder.id || folder.name || '';
        const name = folder.folderName || folder.name || id;
        const slug = mapFolderToSlug(String(id));
        return { id: slug, type: 'folder', name, color: '#00AB55', unreadCount: folder.unreadCount || 0, originalFolderId: id };
      })
      .filter((l) => !systemIds.has(l.id.toLowerCase()));

    return {
      labels: [...defaultLabels, ...backendLabels],
      folders,
      foldersLoading: isLoading, foldersError: error, foldersValidating: isValidating,
      foldersEmpty: !isLoading && !isValidating && !folders.length,
    };
  }, [data, error, isLoading, isValidating]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Email transformation helpers
// ─────────────────────────────────────────────────────────────────────────────
type BackendEmail = {
  messageId?: string; id?: string; message_id?: string;
  accountId?: string;
  folderId?: string | number; folder_id?: string | number;
  folderName?: string; folder_name?: string; mailbox?: string; folder?: string;
  _folderName?: string;                           // ← backend-set tag
  fromAddress?: string | string[]; from?: string | string[]; from_address?: string | string[];
  toAddress?: string | string[];   to?: string | string[];   to_address?: string | string[];
  ccAddress?: string | string[];   bccAddress?: string | string[];
  subject?: string;
  content?: string; body?: string; htmlContent?: string; textContent?: string;
  message?: string; bodyText?: string; summary?: string;
  receivedTime?: number; received_time?: number; date?: number;
  receivedDate?: number; timestamp?: number;
  hasAttachment?: boolean; has_attachment?: boolean;
  isRead?: boolean; is_read?: boolean;
  isFlagged?: boolean; is_flagged?: boolean; flagged?: boolean;
  labels?: string[];
};

function decodeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

/** Strips HTML tags for plain-text preview */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseZohoTimestamp(value: any): number {
  if (!value) return Date.now();
  if (typeof value === 'number') {
    if (value > 1e12) return value;
    if (value > 1e9)  return value * 1000;
    return Date.now();
  }
  if (typeof value === 'string') {
    const n = Number(value);
    if (!isNaN(n) && n > 0) {
      if (n > 1e12) return n;
      if (n > 1e9)  return n * 1000;
    }
    const d = new Date(value).getTime();
    if (!isNaN(d) && d > 0) return d;
  }
  return Date.now();
}

function extractEmail(str: string): string {
  if (!str) return '';
  const decoded = decodeHtml(String(str));
  const match   = decoded.match(/<([^>]+)>/);
  return match ? match[1].trim() : decoded.trim();
}

function extractName(str: string): string {
  if (!str) return '';
  const decoded = decodeHtml(String(str));
  const name    = decoded.split('<')[0].trim();
  return name || decoded;
}

function normaliseAttachment(att: any, index: number, emailId: string) {
  const id   = att.attachmentId || att.id || att.attachment_id || `${emailId}_att_${index}`;
  const name = att.fileName || att.name || att.filename || att.attachmentName || `attachment_${index}`;
  const size = att.size ?? att.fileSize ?? att.attachmentSize ?? 0;
  const type = att.contentType || att.type || att.mimeType || 'application/octet-stream';
  return {
    id: String(id), name, size, type,
    path:     att.path    || att.url     || att.preview || '',
    preview:  att.preview || att.thumbnail || att.url  || '',
    createdAt: Date.now(), modifiedAt: Date.now(),
  };
}

function transformEmail(email: BackendEmail, accountId: string): IMail {
  const emailAny = email as any;
  const messageId = email.messageId || email.id || email.message_id || `${Date.now()}-${Math.random()}`;

  const fromRaw  = email.fromAddress || email.from || email.from_address || '';
  const fromStr  = Array.isArray(fromRaw) ? decodeHtml(fromRaw[0] || '') : decodeHtml(fromRaw);
  const toRaw    = email.toAddress || email.to || email.to_address || '';
  const toArr    = (Array.isArray(toRaw) ? toRaw : [toRaw]).map(decodeHtml);

  // Prefer HTML content for the full message; use plain text for preview
  const rawContent =
    email.htmlContent || email.content || email.body ||
    email.textContent || email.message || email.bodyText || email.summary || '';

  const previewText = stripHtml(rawContent).slice(0, 200);

  const ts     = parseZohoTimestamp(email.receivedTime ?? email.received_time ?? email.date ?? email.receivedDate ?? email.timestamp);
  const isRead = email.isRead ?? email.is_read ?? true;

  // Starred: isFlagged field OR starred in labels
  const labels    = email.labels || [];
  const isFlagged = !!(email.isFlagged ?? emailAny.is_flagged ?? emailAny.flagged ?? false);
  const isStarred = isFlagged || labels.some((l: string) => l && ['starred', 'star', 'flagged'].includes(l.toLowerCase()));
  const isImportant = labels.some((l: string) => l && ['important', 'priority'].includes(l.toLowerCase()));

  const rawAttachments: any[] = emailAny.attachments || emailAny.attachment || [];
  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments.map((att, i) => normaliseAttachment(att, i, messageId))
    : [];

  return {
    id:       messageId,
    folder:   'inbox',   // will be overwritten after determination
    subject:  email.subject || '(No Subject)',
    message:  rawContent  || 'No content available',  // full HTML for detail view
    isUnread: !isRead,
    from:     { name: extractName(fromStr), email: extractEmail(fromStr), avatarUrl: null },
    to:       toArr.map((a) => ({ name: extractName(a), email: extractEmail(a), avatarUrl: null })),
    labelIds: labels,
    isStarred,
    isImportant,
    createdAt: ts,
    attachments,
    hasAttachment: !!(email.hasAttachment ?? email.has_attachment) || attachments.length > 0,
    // extra preview field so list items can show stripped text without re-parsing HTML
    preview: previewText,
  } as IMail & { preview: string };
}

// ─────────────────────────────────────────────────────────────────────────────
// Thread helpers
// ─────────────────────────────────────────────────────────────────────────────
function normalizeSubject(s: string): string {
  if (!s) return '';
  return s.replace(/^(Re:|RE:|Fwd:|FWD:|Fw:|FW:)\s*/gi, '')
          .replace(/^(Re:|RE:|Fwd:|FWD:|Fw:|FW:)\s*/gi, '')
          .trim().toLowerCase();
}

function threadKey(email: IMail): string {
  const addresses = new Set<string>();
  if (email.from?.email) addresses.add(email.from.email.toLowerCase().trim());
  email.to?.forEach((t) => { if (t?.email) addresses.add(t.email.toLowerCase().trim()); });
  return `${normalizeSubject(email.subject)}::${Array.from(addresses).sort().join(',')}`;
}

export function groupEmailsIntoThreads(emails: IMail[]): IMailThread[] {
  const map = new Map<string, IMail[]>();
  emails.forEach((e) => {
    const k = threadKey(e);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(e);
  });

  return Array.from(map.entries())
    .map(([tid, items]) => {
      const sorted = [...items].sort((a, b) => {
        const aTime = a.createdAt ? +a.createdAt : 0;
        const bTime = b.createdAt ? +b.createdAt : 0;
        return aTime - bTime;
      });
      const latest = sorted[sorted.length - 1];
      const participants = new Set<string>();
      sorted.forEach((e) => {
        if (e.from?.email) participants.add(e.from.email.toLowerCase().trim());
        e.to?.forEach((t) => { if (t?.email) participants.add(t.email.toLowerCase().trim()); });
      });
      return {
        threadId:     tid,
        subject:      latest.subject || '(No Subject)',
        participants: Array.from(participants),
        emails:       sorted,
        latestEmail:  latest,
        unreadCount:  sorted.filter((e) => e.isUnread).length,
        isStarred:    sorted.some((e) => e.isStarred),
      };
    })
    .sort((a, b) => {
      const aTime = a.latestEmail?.createdAt ? +a.latestEmail.createdAt : 0;
      const bTime = b.latestEmail?.createdAt ? +b.latestEmail.createdAt : 0;
      return bTime - aTime;
    });
}
// ─────────────────────────────────────────────────────────────────────────────
export function useGetMailsFromBackend(accountId: string, folderId: string = 'inbox') {
  // ── Normalise folder slug ────────────────────────────────────────────────
  const folderSlug   = (folderId || 'inbox').toLowerCase();
  const folderUpper  = folderSlug.toUpperCase();
  const isVirtualFolder = folderUpper === 'STARRED' || folderUpper === 'IMPORTANT' || folderUpper === 'ALL';

  // For virtual folders (STARRED/IMPORTANT) we fetch ALL and filter client-side.
  // For real folders we pass the folderId to the backend.
  const backendFolderId = isVirtualFolder ? '' : folderSlug;
  const folderParam = backendFolderId ? `&folderId=${encodeURIComponent(backendFolderId)}` : '';

  // ── SWR key — MUST include folderId so each folder has its own cache slot ──
  const emailsUrl = accountId
    ? [`${endpoints.mail.accountEmails(accountId)}?limit=500${folderParam}`, { _folder: folderSlug }]
    : null;

  const { data, isLoading, error, isValidating, mutate } = useSWR<any>(
    emailsUrl, fetcher,
    {
      ...swrOptions,
      revalidateOnFocus: true,
      refreshInterval: 30000,   // poll every 30 s for real-time updates
    }
  );

  // ── Folders for folderId→name mapping ───────────────────────────────────
  const { data: foldersData } = useSWR<any[]>(
    accountId ? [endpoints.mail.folders(accountId), {}] : null,
    fetcher,
    { ...swrOptions, revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Build  numericId → UPPER-NAME  map
  const folderIdToName = useMemo(() => {
    const m: Record<string, string> = {};
    if (Array.isArray(foldersData)) {
      foldersData.forEach((f: any) => {
        const id   = String(f.folderId || f.id || f.folder_id || '');
        const name = (f.folderName || f.name || f.folder_name || '').toUpperCase().trim();
        if (id && name) { m[id] = name; m[name] = name; }
      });
    }
    return m;
  }, [foldersData]);

  // ── Transform + filter ───────────────────────────────────────────────────
  const memoizedValue = useMemo(() => {
    let raw: BackendEmail[] = [];
    if (Array.isArray(data))                                raw = data;
    else if (data && typeof data === 'object')              raw = (data as any).data ?? (data as any).emails ?? [];

    let mails = raw.map((email) => {
      const transformed = transformEmail(email, accountId);
      const ea = email as any;

      // ── Determine folder name for this email ──────────────────────────
      // Priority: _folderName (set by backend) > folderName field > numeric folderId lookup
      const backendTag  = (ea._folderName   || '').toUpperCase().trim();
      const directName  = (ea.folderName    || ea.folder_name || '').toUpperCase().trim();
      const numericId   = String(ea.folderId || ea.folder_id  || ea.mailbox || '');
      const mappedName  = numericId ? (folderIdToName[numericId] || '') : '';

      const resolvedFolder = backendTag || directName || mappedName || '';

      // Attach folder info to the transformed mail
      (transformed as any)._folderName      = resolvedFolder;   // ← for filter below
      (transformed as any)._originalFolder  = resolvedFolder;
      (transformed as any)._originalFolderId = numericId;

      // Set the frontend folder slug
      transformed.folder = resolvedFolder ? mapFolderToSlug(resolvedFolder) : 'inbox';

      return transformed;
    });

    // ── Client-side filter ─────────────────────────────────────────────
    if (folderUpper !== 'ALL') {
      mails = mails.filter((mail) => {
        // Flag-based virtual folders
        if (folderUpper === 'STARRED')   return !!(mail as any).isStarred;
        if (folderUpper === 'IMPORTANT') return !!(mail as any).isImportant || !!(mail as any).isStarred;

        const ef = ((mail as any)._folderName || '').toUpperCase();

        // If backend tagged it, trust the tag
        if (ef) return folderMatches(ef, folderUpper);

        // Fallback: use the mapped folder slug
        return folderMatches((mail.folder || '').toUpperCase(), folderUpper);
      });
    }

    // ── Sort newest first ──────────────────────────────────────────────
    mails.sort((a, b) => {
      const tA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt as any).getTime();
      const tB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt as any).getTime();
      return tB - tA;   // ← newest first
    });

    // Cap at 500
    if (mails.length > 500) mails = mails.slice(0, 500);

    const byId  = mails.length ? keyBy(mails, (m) => m.id) : {};
    const allIds = Object.keys(byId);
    const threads = groupEmailsIntoThreads(mails);

    return {
      mails: { byId, allIds },
      threads,
      mailsLoading:    isLoading,
      mailsError:      error,
      mailsValidating: isValidating,
      mailsEmpty:      !isLoading && !isValidating && !allIds.length,
      refetchMails:    mutate,
    };
  }, [data, error, isLoading, isValidating, accountId, folderUpper, folderIdToName, mutate]);

  return memoizedValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// useGetMailFromBackend  — single email detail
// ─────────────────────────────────────────────────────────────────────────────
export function useGetMailFromBackend(accountId: string, messageId: string) {
  const valid = !!(accountId?.trim() && messageId?.trim());
  const key   = valid ? [endpoints.mail.accountEmail(accountId.trim(), messageId.trim()), {}] : null;

  const { data, isLoading, error, isValidating } = useSWR<any>(key, fetcher, {
    ...swrOptions,
    revalidateOnFocus: true,
    shouldRetryOnError: (err: any) => {
      const s = err?.response?.status || err?.status;
      return s !== 400 && s !== 404;
    },
  });

  return useMemo(() => {
    const isInvalid = error?.response?.data?.data?.moreInfo === 'messageId is invalid' || error?.response?.status === 400;
    let email: BackendEmail | undefined;
    if (data) {
      if (Array.isArray(data))              email = data[0];
      else if ('data' in data && data.data) email = (data as any).data;
      else                                  email = data as BackendEmail;
    }
    return {
      mail:           email ? transformEmail(email, accountId) : undefined,
      mailLoading:    isLoading,
      mailError:      isInvalid ? undefined : error,
      mailValidating: isValidating,
      mailEmpty:      !isLoading && !isValidating && !email && !isInvalid,
    };
  }, [data, error, isLoading, isValidating, accountId]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Thread helpers (backend-fetched)
// ─────────────────────────────────────────────────────────────────────────────
export async function getAllThreadsFromBackend(accountId: string, folderId?: string, limit = 200): Promise<any[]> {
  const p = new URLSearchParams();
  if (folderId && folderId.toUpperCase() !== 'ALL') p.append('folderId', folderId);
  p.append('limit', String(limit));
  p.append('includesent', 'true');
  const res = await axiosInstance.get(`${endpoints.mail.getAllThreads(accountId)}?${p.toString()}`);
  return res.data.data || res.data || [];
}

export async function getThreadFromBackend(accountId: string, threadId: string, limit = 200): Promise<any[]> {
  const res = await axiosInstance.get(`${endpoints.mail.getThread(accountId, threadId)}?limit=${limit}`);
  return res.data.data || res.data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Action helpers
// ─────────────────────────────────────────────────────────────────────────────
export async function sendEmailViaBackend(accountId: string, emailData: {
  toAddress: string; subject: string; content: string;
  fromAddress?: string; ccAddress?: string[]; bccAddress?: string[];
  attachments?: File[];
}) {
  if (emailData.attachments?.length) {
    const fd = new FormData();
    fd.append('toAddress', emailData.toAddress);
    fd.append('subject',   emailData.subject);
    fd.append('content',   emailData.content);
    if (emailData.fromAddress) fd.append('fromAddress', emailData.fromAddress);
    emailData.ccAddress?.forEach((a) => fd.append('ccAddress[]', a));
    emailData.bccAddress?.forEach((a) => fd.append('bccAddress[]', a));
    emailData.attachments.forEach((f) => fd.append('attachments', f));
    const res = await axiosInstance.post(endpoints.mail.sendEmail(accountId), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
  const res = await axiosInstance.post(endpoints.mail.sendEmail(accountId), emailData);
  return res.data;
}

export async function markEmailAsRead(accountId: string, messageId: string) {
  const res = await axiosInstance.put(endpoints.mail.markRead(accountId, messageId), { status: true });
  return res.data;
}

export async function deleteEmailViaBackend(accountId: string, messageId: string, folderId?: string) {
  const url = folderId
    ? `${endpoints.mail.deleteEmail(accountId, messageId)}?folderId=${folderId}`
    : endpoints.mail.deleteEmail(accountId, messageId);
  return (await axiosInstance.delete(url)).data;
}

export async function replyEmailViaBackend(accountId: string, messageId: string, replyData: {
  content: string; subject?: string; toAddress?: string; fromAddress?: string; attachments?: File[];
}) {
  const fd = new FormData();
  fd.append('content', replyData.content);
  if (replyData.subject)     fd.append('subject',     replyData.subject);
  if (replyData.toAddress)   fd.append('toAddress',   replyData.toAddress);
  if (replyData.fromAddress) fd.append('fromAddress', replyData.fromAddress);
  replyData.attachments?.forEach((f) => fd.append('attachments', f));
  const res = await axiosInstance.post(endpoints.mail.replyEmail(accountId, messageId), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function forwardEmailViaBackend(accountId: string, messageId: string, forwardData: {
  toAddress: string; content: string; subject?: string; fromAddress?: string;
  ccAddress?: string[]; bccAddress?: string[]; attachments?: File[];
}) {
  if (forwardData.attachments?.length) {
    const fd = new FormData();
    fd.append('toAddress', forwardData.toAddress);
    fd.append('content',   forwardData.content);
    if (forwardData.subject)     fd.append('subject',     forwardData.subject);
    if (forwardData.fromAddress) fd.append('fromAddress', forwardData.fromAddress);
    forwardData.ccAddress?.forEach((a) => fd.append('ccAddress[]', a));
    forwardData.bccAddress?.forEach((a) => fd.append('bccAddress[]', a));
    forwardData.attachments.forEach((f) => fd.append('attachments', f));
    const res = await axiosInstance.post(endpoints.mail.forwardEmail(accountId, messageId), fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
  const res = await axiosInstance.post(endpoints.mail.forwardEmail(accountId, messageId), forwardData);
  return res.data;
}

export async function getEmailAttachments(accountId: string, messageId: string) {
  const res = await axiosInstance.get(endpoints.mail.getAttachments(accountId, messageId));
  const raw = res.data;
  if (Array.isArray(raw))              return raw;
  if (Array.isArray(raw?.data))        return raw.data;
  if (Array.isArray(raw?.attachments)) return raw.attachments;
  return [];
}

export async function downloadAttachment(accountId: string, messageId: string, attachmentId: string, filename?: string): Promise<void> {
  const res = await axiosInstance.get(endpoints.mail.downloadAttachment(accountId, messageId, attachmentId), { responseType: 'blob' });
  const cd  = res.headers['content-disposition'] || '';
  const m   = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  const fn  = filename || (m ? m[1].replace(/['"]/g, '') : null) || `attachment_${attachmentId}`;
  const url = window.URL.createObjectURL(res.data as Blob);
  const a   = document.createElement('a');
  a.href = url; a.download = fn;
  document.body.appendChild(a); a.click(); a.remove();
  window.URL.revokeObjectURL(url);
}

export async function getAttachmentBlobUrl(accountId: string, messageId: string, attachmentId: string): Promise<string> {
  const res = await axiosInstance.get(endpoints.mail.downloadAttachment(accountId, messageId, attachmentId), { responseType: 'blob' });
  return window.URL.createObjectURL(res.data as Blob);
}

export async function getFolder(accountId: string, folderId: string) {
  return (await axiosInstance.get(endpoints.mail.getFolder(accountId, folderId))).data;
}

export async function downloadInlineImage(accountId: string, folderId: string, messageId: string, contentId: string, fileName?: string): Promise<Blob> {
  const res = await axiosInstance.get(
    endpoints.mail.downloadInlineImage(accountId, folderId, messageId, contentId),
    { params: fileName ? { fileName } : {}, responseType: 'blob' }
  );
  return res.data;
}

export async function logoutAccount(accountId: string) {
  return (await axiosInstance.delete(endpoints.mail.logoutAccount(accountId))).data;
}

export async function getSignatures(accountId: string) {
  return (await axiosInstance.get(endpoints.mail.getSignatures(accountId))).data;
}

export async function getSignature(accountId: string, signatureId: string) {
  return (await axiosInstance.get(endpoints.mail.getSignature(accountId, signatureId))).data;
}
