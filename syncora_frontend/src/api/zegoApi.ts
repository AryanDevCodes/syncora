import axios from '@/lib/axios';

export interface ZegoTokenResponse {
  token: string;
  appId: number;
  userId: string;
  userName: string;
  roomId: string;
  expiresIn: number;
  expiryTimestamp: number;
}

/**
 * Get ZegoCloud token from backend (secure)
 */
export const getZegoToken = async (roomId: string): Promise<ZegoTokenResponse> => {
  const response = await axios.get<{
    success: boolean;
    message: string;
    data: ZegoTokenResponse;
  }>(`/video/token`, {
    params: { roomId }
  });

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to get video token');
  }

  return response.data.data;
};

/**
 * Validate if user has access to a video room
 */
export const validateRoomAccess = async (roomId: string): Promise<boolean> => {
  try {
    const response = await axios.get<{
      success: boolean;
      data: { hasAccess: boolean };
    }>(`/video/validate-access`, {
      params: { roomId }
    });

    return response.data.success && response.data.data.hasAccess;
  } catch (error) {
    console.error('Error validating room access:', error);
    return false;
  }
};
