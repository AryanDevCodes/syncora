import axiosInstance from '@/lib/axios';

const BASE_URL = '/users';

export interface UserDto {
  theme: string;
  language: string;
  profileVisibility: string;
  onlineStatus: boolean;
  readReceipts: boolean;
  twoFactorAuth: boolean;
  userEmail: string;
  role: string;
  subscriptionPlan: string;
  storageUsedBytes: null;
  avatarUrl: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  chatNotifications?: boolean;
  taskNotifications?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  chatNotifications?: boolean;
  taskNotifications?: boolean;
  password?: string;
}

// Get current user profile
export const getCurrentUser = async (): Promise<UserDto> => {
  const response = await axiosInstance.get(`${BASE_URL}/me`);
  return response.data.data;
};

// Update current user profile
export const updateCurrentUser = async (updates: UpdateUserRequest): Promise<UserDto> => {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/me`, updates);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: number): Promise<UserDto> => {
  const response = await axiosInstance.get(`${BASE_URL}/${id}`);
  return response.data.data;
};

export const userApi = {
  getCurrentUser,
  updateCurrentUser,
  getUserById,
  exportCurrentUser: async (): Promise<Blob> => {
    const resp = await axiosInstance.get(`${BASE_URL}/me/export`, { responseType: 'blob' });
    return resp.data as Blob;
  },
  deleteCurrentUser: async (): Promise<void> => {
    await axiosInstance.delete(`${BASE_URL}/me`);
  }
};