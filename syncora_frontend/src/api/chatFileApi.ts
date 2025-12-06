import axios from '@/lib/axios';

export interface ChatFileDto {
  id: string;
  messageId?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl: string;
}

export const uploadChatFile = async (file: File, messageId?: string): Promise<ChatFileDto> => {
  const formData = new FormData();
  formData.append('file', file);
  if (messageId) {
    formData.append('messageId', messageId);
  }

  const response = await axios.post<ChatFileDto>('/chat/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const downloadChatFile = async (fileId: string): Promise<Blob> => {
  const response = await axios.get(`/chat/files/${fileId}/download`, {
    responseType: 'blob',
  });
  return response.data;
};

export const deleteChatFile = async (fileId: string): Promise<void> => {
  await axios.delete(`/chat/files/${fileId}`);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
