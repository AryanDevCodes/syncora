/**
 * ZegoCloud Video API Integration
 * 
 * Integrates ZegoCloud with the backend for:
 * - Room management
 * - Call history
 * - Participant tracking
 */

import axiosInstance from '@/lib/axios';

const BASE_URL = '/video/zego';

export interface ZegoRoomRequest {
  chatRoomId: string;
  roomName: string;
  scenario?: 'OneONoneCall' | 'GroupCall' | 'VideoConference' | 'LiveStreaming';
  maxUsers?: number;
}

export interface ZegoRoomResponse {
  id: string;
  roomId: string;
  chatRoomId: string;
  roomName: string;
  scenario: string;
  maxUsers: number;
  participants: string[];
  startTime: string;
  endTime?: string;
  status: 'ACTIVE' | 'ENDED';
}

export interface ZegoParticipant {
  userId: string;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  duration?: number;
}

/**
 * Create a new ZegoCloud video room
 */
export const createZegoRoom = async (request: ZegoRoomRequest): Promise<ZegoRoomResponse> => {
  try {
    console.log('[zegoVideoApi] Creating ZegoCloud room:', request);
    const response = await axiosInstance.post(`${BASE_URL}/create`, request);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('[zegoVideoApi] Error creating room:', error);
    throw error;
  }
};

/**
 * Start a ZegoCloud video call
 */
export const startZegoCall = async (
  chatRoomId: string,
  roomName?: string,
  scenario?: string
): Promise<ZegoRoomResponse> => {
  try {
    console.log('[zegoVideoApi] Starting ZegoCloud call:', { chatRoomId, roomName, scenario });
    const response = await axiosInstance.post(`${BASE_URL}/start/${chatRoomId}`, null, {
      params: { roomName, scenario },
    });
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('[zegoVideoApi] Error starting call:', error);
    throw error;
  }
};

/**
 * Join a ZegoCloud video room
 */
export const joinZegoRoom = async (roomId: string, email: string): Promise<ZegoRoomResponse> => {
  try {
    console.log('[zegoVideoApi] Joining ZegoCloud room:', { roomId, email });
    const response = await axiosInstance.post(`${BASE_URL}/${roomId}/join`, null, {
      params: { email },
    });
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('[zegoVideoApi] Error joining room:', error);
    throw error;
  }
};

/**
 * Leave a ZegoCloud video room
 */
export const leaveZegoRoom = async (roomId: string, email: string): Promise<void> => {
  try {
    console.log('[zegoVideoApi] Leaving ZegoCloud room:', { roomId, email });
    await axiosInstance.post(`${BASE_URL}/${roomId}/leave`, null, {
      params: { email },
    });
  } catch (error: any) {
    console.error('[zegoVideoApi] Error leaving room:', error);
    throw error;
  }
};

/**
 * End a ZegoCloud video call
 */
export const endZegoCall = async (roomId: string): Promise<void> => {
  try {
    console.log('[zegoVideoApi] Ending ZegoCloud call:', roomId);
    await axiosInstance.patch(`${BASE_URL}/${roomId}/end`);
  } catch (error: any) {
    console.error('[zegoVideoApi] Error ending call:', error);
    throw error;
  }
};

/**
 * Get active ZegoCloud rooms for a chat
 */
export const getActiveZegoRooms = async (chatRoomId: string): Promise<ZegoRoomResponse[]> => {
  try {
    console.log('[zegoVideoApi] Getting active ZegoCloud rooms:', chatRoomId);
    const response = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: any) {
    console.error('[zegoVideoApi] Error getting active rooms:', error);
    return [];
  }
};

/**
 * Get ZegoCloud call history for a chat
 */
export const getZegoCallHistory = async (chatRoomId: string): Promise<ZegoRoomResponse[]> => {
  try {
    console.log('[zegoVideoApi] Getting ZegoCloud call history:', chatRoomId);
    const response = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}/history`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: any) {
    console.error('[zegoVideoApi] Error getting call history:', error);
    return [];
  }
};

/**
 * Get ended ZegoCloud sessions
 */
export const getEndedZegoSessions = async (chatRoomId: string): Promise<ZegoRoomResponse[]> => {
  try {
    console.log('[zegoVideoApi] Getting ended ZegoCloud sessions:', chatRoomId);
    const response = await axiosInstance.get(`${BASE_URL}/chat/${chatRoomId}/ended`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: any) {
    console.error('[zegoVideoApi] Error getting ended sessions:', error);
    return [];
  }
};

/**
 * Get room participants
 */
export const getZegoRoomParticipants = async (roomId: string): Promise<ZegoParticipant[]> => {
  try {
    console.log('[zegoVideoApi] Getting ZegoCloud room participants:', roomId);
    const response = await axiosInstance.get(`${BASE_URL}/${roomId}/participants`);
    return response.data?.data ?? response.data ?? [];
  } catch (error: any) {
    console.error('[zegoVideoApi] Error getting participants:', error);
    return [];
  }
};

/**
 * Get room details
 */
export const getZegoRoomDetails = async (roomId: string): Promise<ZegoRoomResponse | null> => {
  try {
    console.log('[zegoVideoApi] Getting ZegoCloud room details:', roomId);
    const response = await axiosInstance.get(`${BASE_URL}/${roomId}`);
    return response.data?.data ?? response.data;
  } catch (error: any) {
    console.error('[zegoVideoApi] Error getting room details:', error);
    return null;
  }
};

// Export all functions as a single object
export const zegoVideoApi = {
  createZegoRoom,
  startZegoCall,
  joinZegoRoom,
  leaveZegoRoom,
  endZegoCall,
  getActiveZegoRooms,
  getZegoCallHistory,
  getEndedZegoSessions,
  getZegoRoomParticipants,
  getZegoRoomDetails,
};

export default zegoVideoApi;
