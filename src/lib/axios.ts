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

/**
 * Optional: Add token (if using auth)
 *
 axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
*
*/

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message || error?.message || 'Something went wrong!';
    console.error('Axios error:', message);
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

    // Check if we should use mock data
    const mockData = getMockData<T>(url, config);
    if (mockData !== null) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockData;
    }

    // Use real API
    const res = await axiosInstance.get<T>(url, config);

    return res.data;
  } catch (error) {
    console.error('Fetcher failed:', error);
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
