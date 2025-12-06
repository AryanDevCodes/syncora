import axiosInstance from '@/lib/axios';

const BASE_URL = '/chats';

export interface ChatMessageDto {
  id: string;
  roomId: string;
  senderEmail: string;
  content: string;
  attachmentUrl?: string;
  type: string;
  sentAt: string;
  delivered: boolean;
  deliveredAt?: string;
  read: boolean;
  readAt?: string;
  // File attachment fields
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface ChatRoomDto {
  id: string;
  name: string;
  isGroup: boolean;
  memberEmails: string[];
  ownerEmail: string;
  createdAt: string;
  unreadCount: number;
  lastMessagePreview?: string;
  canRename: boolean;
  canDelete: boolean;
  visible: boolean;
  lastMessageTime?: string;
}

export interface MessageSendRequest {
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  // File attachment fields
  fileId?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface CreateRoomRequest {
  name: string;
  type: 'DIRECT' | 'GROUP';
  participants: string[];
}

export interface AddMembersRequest {
  memberEmails: string[];
}

// Get all chat rooms
export const getAllRooms = async (): Promise<ChatRoomDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}`);
  return response.data.data;
};

// Get messages for a specific room
export const getMessages = async (roomId: string): Promise<ChatMessageDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/${roomId}/message`);
  return response.data.data;
};

// Send a message
export const sendMessage = async (roomId: string, message: MessageSendRequest): Promise<ChatMessageDto> => {
  const response = await axiosInstance.post(`${BASE_URL}/${roomId}/send`, message);
  return response.data.data;
};

// Create direct chat
export const createDirectChat = async (peerEmail: string): Promise<ChatRoomDto> => {
  const response = await axiosInstance.post(`${BASE_URL}/direct/${peerEmail}`);
  return response.data.data;
};

// Create group chat
export const createGroupChat = async (name: string, members: string[]): Promise<ChatRoomDto> => {
  const response = await axiosInstance.post(`${BASE_URL}/group`, members, {
    params: { name }
  });
  return response.data.data;
};

// Search messages in a room
export const searchMessages = async (roomId: string, query: string): Promise<ChatMessageDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/${roomId}/search`, {
    params: { searchQuery: query }
  });
  return response.data.data;
};

// Create a room
export const createRoom = async (request: CreateRoomRequest): Promise<ChatRoomDto> => {
  const response = await axiosInstance.post(`${BASE_URL}/create`, request);
  return response.data.data;
};

// Rename room
export const renameRoom = async (roomId: string, newName: string): Promise<void> => {
  await axiosInstance.patch(`${BASE_URL}/${roomId}/rename`, null, {
    params: { newName }
  });
};

// Add members to room
export const addMembers = async (roomId: string, members: AddMembersRequest): Promise<ChatRoomDto> => {
  const response = await axiosInstance.post(`${BASE_URL}/${roomId}/members/add`, members);
  return response.data.data;
};

// Mark all messages as read
export const markAsRead = async (roomId: string): Promise<void> => {
  await axiosInstance.patch(`${BASE_URL}/${roomId}/mark-read`);
};

// Get all rooms
export const getRooms = async (): Promise<ChatRoomDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/rooms`);
  return response.data.data;
};

// Get group chats only
export const getGroupChats = async (): Promise<ChatRoomDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/groups`);
  return response.data.data;
};

// Get direct chats only
export const getDirectChats = async (): Promise<ChatRoomDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/directs`);
  return response.data.data;
};

// Filter rooms by type
export const filterRooms = async (type?: 'group' | 'direct' | 'all'): Promise<ChatRoomDto[]> => {
  const response = await axiosInstance.get(`${BASE_URL}/rooms/filter`, {
    params: { type }
  });
  return response.data.data;
};

// Mark messages as delivered
export const markDelivered = async (roomId: string): Promise<void> => {
  await axiosInstance.patch(`${BASE_URL}/${roomId}/delivered`);
};

// Mark messages as read (alternative)
export const markRead = async (roomId: string): Promise<void> => {
  await axiosInstance.patch(`${BASE_URL}/${roomId}/read`);
};

// Delete a message
export const deleteMessage = async (messageId: string, deleteForAll: boolean = false): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/message/${messageId}`, {
    params: { deleteForAll }
  });
};

// Delete a room
export const deleteRoom = async (roomId: string): Promise<void> => {
  await axiosInstance.delete(`${BASE_URL}/${roomId}/delete`);
};

// Get Ably token for chat
export interface AblyChatTokenResponse {
  token: string;
  clientId: string;
  success: boolean;
}

export const getAblyChatToken = async (): Promise<AblyChatTokenResponse> => {
  const response = await axiosInstance.post('/ably/tokens/chat');
  return response.data;
};

export const chatApi = {
  getAllRooms,
  getMessages,
  sendMessage,
  createDirectChat,
  createGroupChat,
  searchMessages,
  createRoom,
  renameRoom,
  addMembers,
  markAsRead,
  getRooms,
  getGroupChats,
  getDirectChats,
  filterRooms,
  markDelivered,
  markRead,
  deleteMessage,
  deleteRoom,
  getAblyChatToken,
};
