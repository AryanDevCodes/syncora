import axios from '@/lib/axios';

export interface EmailDto {
  id: string;
  from: string;
  fromName: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  isRead: boolean;
  isStarred: boolean;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive';
  labels?: string[];
  attachments?: EmailAttachment[];
  sentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url: string;
}

export interface EmailComposeRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  attachments?: File[];
  isDraft?: boolean;
}

export interface EmailFilterParams {
  folder?: string;
  isRead?: boolean;
  isStarred?: boolean;
  search?: string;
  label?: string;
  from?: string;
  page?: number;
  size?: number;
}

export const emailApi = {
  // Get emails by folder
  getEmails: async (params: EmailFilterParams = {}): Promise<EmailDto[]> => {
    const response = await axios.get('/emails', { params });
    return response.data.data || response.data;
  },

  // Get single email
  getEmail: async (id: string): Promise<EmailDto> => {
    const response = await axios.get(`/emails/${id}`);
    return response.data.data || response.data;
  },

  // Send email
  sendEmail: async (request: EmailComposeRequest): Promise<EmailDto> => {
    const response = await axios.post('/emails/send', request);
    return response.data.data || response.data;
  },

  // Save draft
  saveDraft: async (request: EmailComposeRequest): Promise<EmailDto> => {
    const response = await axios.post('/emails/drafts', request);
    return response.data.data || response.data;
  },

  // Update email (mark read, star, etc)
  updateEmail: async (id: string, updates: Partial<EmailDto>): Promise<EmailDto> => {
    const response = await axios.patch(`/emails/${id}`, updates);
    return response.data.data || response.data;
  },

  // Mark as read/unread
  markAsRead: async (id: string, isRead: boolean): Promise<void> => {
    await axios.patch(`/emails/${id}/read`, { isRead });
  },

  // Toggle star
  toggleStar: async (id: string): Promise<void> => {
    await axios.patch(`/emails/${id}/star`);
  },

  // Move to folder
  moveToFolder: async (id: string, folder: string): Promise<void> => {
    await axios.patch(`/emails/${id}/folder`, { folder });
  },

  // Bulk operations
  bulkMarkAsRead: async (ids: string[], isRead: boolean): Promise<void> => {
    await axios.post('/emails/bulk/read', { ids, isRead });
  },

  bulkMoveToFolder: async (ids: string[], folder: string): Promise<void> => {
    await axios.post('/emails/bulk/move', { ids, folder });
  },

  bulkDelete: async (ids: string[]): Promise<void> => {
    await axios.post('/emails/bulk/delete', { ids });
  },

  // Delete email
  deleteEmail: async (id: string): Promise<void> => {
    await axios.delete(`/emails/${id}`);
  },

  // Search emails
  searchEmails: async (query: string): Promise<EmailDto[]> => {
    const response = await axios.get('/emails/search', { params: { q: query } });
    return response.data.data || response.data;
  },

  // Get email count by folder
  getEmailCounts: async (): Promise<Record<string, number>> => {
    const response = await axios.get('/emails/counts');
    return response.data.data || response.data;
  },
};
