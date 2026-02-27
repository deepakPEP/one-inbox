import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';
import { _mailLabels, _mails } from 'src/_mock/_mail';
import { _chatContacts, _conversations } from 'src/_mock/_chat';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({
  baseURL: CONFIG.serverUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log the base URL on initialization
console.log('🔧 Axios Instance initialized:', {
  baseURL: CONFIG.serverUrl,
  hasBaseURL: !!CONFIG.serverUrl,
  envVar: import.meta.env.VITE_SERVER_URL,
});

axiosInstance.interceptors.request.use(
  (config) => {
    console.log('📤 Axios Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ''}${config.url || ''}`,
    });
    return config;
  },
  (error) => {
    console.error('❌ Axios Request Error:', error);
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 Axios Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
    });
    return response;
  },
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    console.error('❌ Axios Response Error:', {
      message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
    });
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

/**
 * Mock API handler - returns mock data when serverUrl is empty
 */
function getMockData<T>(url: string, config?: AxiosRequestConfig): T | null {
  if (CONFIG.serverUrl) {
    return null; // Use real API when serverUrl is configured
  }

  // Mail endpoints
  if (url === '/api/mail/labels') {
    return { labels: _mailLabels } as T;
  }

  if (url === '/api/mail/list') {
    const labelId = config?.params?.labelId || 'inbox';
    const filteredMails = labelId === 'all' 
      ? _mails 
      : _mails.filter((mail) => mail.labelIds.includes(labelId) || mail.folder === labelId);
    return { mails: filteredMails } as T;
  }

  if (url === '/api/mail/details') {
    const mailId = config?.params?.mailId;
    const mail = _mails.find((m) => m.id === mailId);
    return mail ? ({ mail } as T) : null;
  }

  // Chat endpoints
  if (url === '/api/chat') {
    const endpoint = config?.params?.endpoint;
    const conversationId = config?.params?.conversationId;

    if (endpoint === 'contacts') {
      return { contacts: _chatContacts } as T;
    }

    if (endpoint === 'conversations') {
      return { conversations: _conversations } as T;
    }

    if (endpoint === 'conversation' && conversationId) {
      const conversation = _conversations.find((c) => c.id === conversationId);
      return conversation ? ({ conversation } as T) : null;
    }
  }

  return null;
}

// ----------------------------------------------------------------------

export const fetcher = async <T = unknown>(
  args: string | [string, AxiosRequestConfig]
): Promise<T> => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args, {}];

    const fullUrl = `${CONFIG.serverUrl || ''}${url}`;
    console.log('🔵 Fetcher - Making request:', {
      url,
      baseURL: CONFIG.serverUrl,
      fullUrl,
      hasBaseURL: !!CONFIG.serverUrl,
      config,
    });

    const mockData = getMockData<T>(url, config);
    if (mockData !== null) {
      console.log('🟡 Fetcher - Using mock data for:', url);
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockData;
    }

    if (!CONFIG.serverUrl) {
      console.error('❌ Fetcher - No serverUrl configured! Set VITE_SERVER_URL in .env file');
      throw new Error('Server URL is not configured. Please set VITE_SERVER_URL in your .env file');
    }

    // Use real API
    console.log('🟢 Fetcher - Calling backend API:', fullUrl);
    const res = await axiosInstance.get<T>(url, config);
    console.log('✅ Fetcher - Response received:', {
      url,
      status: res.status,
      data: res.data,
      dataType: typeof res.data,
      isArray: Array.isArray(res.data),
    });

    return res.data;
  } catch (error: any) {
    console.error('❌ Fetcher failed:', {
      url: Array.isArray(args) ? args[0] : args,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      config: error.config,
    });
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    accounts: '/zoho-mail/accounts',
    accountEmails: (accountId: string, folderId?: string) => `/zoho-mail/accounts/${accountId}/emails`,
    accountEmail: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}`,
    sendEmail: (accountId: string) => `/zoho-mail/accounts/${accountId}/send`,
    folders: (accountId: string) => `/zoho-mail/accounts/${accountId}/folders`,
    markRead: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}/read`,
    deleteEmail: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}`,
    replyEmail: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}/reply`,
    forwardEmail: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}/forward`,
    getAttachments: (accountId: string, messageId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}/attachments`,
    downloadAttachment: (accountId: string, messageId: string, attachmentId: string) => `/zoho-mail/accounts/${accountId}/emails/${messageId}/attachments/${attachmentId}/download`,
    getAllThreads: (accountId: string) => `/zoho-mail/accounts/${accountId}/threads`,
    getThread: (accountId: string, threadId: string) => `/zoho-mail/accounts/${accountId}/threads/${threadId}`,
    getFolder: (accountId: string, folderId: string) => `/zoho-mail/accounts/${accountId}/folders/${folderId}`,
    downloadInlineImage: (accountId: string, folderId: string, messageId: string, contentId: string) => `/zoho-mail/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content/${contentId}`,
    logoutAccount: (accountId: string) => `/zoho-mail/accounts/${accountId}`,
    getSignatures: (accountId: string) => `/zoho-mail/accounts/${accountId}/signatures`,
    getSignature: (accountId: string, signatureId: string) => `/zoho-mail/accounts/${accountId}/signatures/${signatureId}`,
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
} as const;
