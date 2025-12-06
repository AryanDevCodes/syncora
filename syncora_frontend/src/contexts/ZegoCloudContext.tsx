/**
 * ZegoCloud Context Provider
 * 
 * Manages global ZegoCloud video call state and provides methods
 * to start, join, and end video calls across the application
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { zegoCloudService, ZegoUser, ZegoRoomConfig } from '@/services/zegoCloudService';
import { useAuth } from './AuthContext';

// ============ TYPES ============
export interface VideoCallState {
  isInCall: boolean;
  roomId: string | null;
  participants: string[];
  isInitiating: boolean;
  error: string | null;
  callStartTime: number | null;
}

export interface ZegoCloudContextType {
  // State
  videoCallState: VideoCallState;
  
  // Methods
  startVideoCall: (roomId: string, otherUserId?: string) => Promise<void>;
  joinVideoCall: (roomId: string) => Promise<void>;
  endVideoCall: () => Promise<void>;
  isInRoom: (roomId: string) => boolean;
  clearError: () => void;
}

// ============ CONTEXT ============
const ZegoCloudContext = createContext<ZegoCloudContextType | undefined>(undefined);

// ============ PROVIDER ============
export const ZegoCloudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoCallState, setVideoCallState] = useState<VideoCallState>({
    isInCall: false,
    roomId: null,
    participants: [],
    isInitiating: false,
    error: null,
    callStartTime: null,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      zegoCloudService.leaveAllRooms().catch(err => {
        console.error('[ZegoCloudContext] Cleanup error:', err);
      });
    };
  }, []);

  /**
   * Get user information for ZegoCloud
   */
  const getZegoUser = useCallback((): ZegoUser => {
    const userId = user?.id?.toString() || user?.email?.replace(/[^a-zA-Z0-9]/g, '') || `user_${Date.now()}`;
    const userName = user?.email || user?.username || `Guest_${Date.now()}`;
    
    return {
      userId,
      userName,
      avatar: user?.avatar,
    };
  }, [user]);

  /**
   * Start a new video call
   */
  const startVideoCall = useCallback(async (roomId: string, otherUserId?: string) => {
    try {
      console.log('[ZegoCloudContext] Starting video call:', { roomId, otherUserId });

      setVideoCallState(prev => ({
        ...prev,
        isInitiating: true,
        error: null,
      }));

      // Validate room ID
      if (!roomId || roomId.trim() === '') {
        throw new Error('Invalid room ID');
      }

      // Check if already in a call
      if (videoCallState.isInCall) {
        throw new Error('Already in a video call');
      }

      const zegoUser = getZegoUser();

      // Create a temporary container if not in a modal
      if (!containerRef.current) {
        console.warn('[ZegoCloudContext] No container ref available, call will be handled by modal');
      }

      // Update state
      setVideoCallState(prev => ({
        ...prev,
        isInCall: true,
        roomId,
        participants: otherUserId ? [otherUserId] : [],
        callStartTime: Date.now(),
        isInitiating: false,
      }));

      console.log('[ZegoCloudContext] Video call started successfully');
    } catch (error: any) {
      console.error('[ZegoCloudContext] Error starting video call:', error);
      setVideoCallState(prev => ({
        ...prev,
        error: error.message || 'Failed to start video call',
        isInitiating: false,
        isInCall: false,
        roomId: null,
      }));
      throw error;
    }
  }, [videoCallState.isInCall, getZegoUser]);

  /**
   * Join an existing video call
   */
  const joinVideoCall = useCallback(async (roomId: string) => {
    try {
      console.log('[ZegoCloudContext] Joining video call:', roomId);

      setVideoCallState(prev => ({
        ...prev,
        isInitiating: true,
        error: null,
      }));

      // Validate room ID
      if (!roomId || roomId.trim() === '') {
        throw new Error('Invalid room ID');
      }

      // Check if already in a call
      if (videoCallState.isInCall) {
        throw new Error('Already in a video call');
      }

      // Update state
      setVideoCallState(prev => ({
        ...prev,
        isInCall: true,
        roomId,
        callStartTime: Date.now(),
        isInitiating: false,
      }));

      console.log('[ZegoCloudContext] Joined video call successfully');
    } catch (error: any) {
      console.error('[ZegoCloudContext] Error joining video call:', error);
      setVideoCallState(prev => ({
        ...prev,
        error: error.message || 'Failed to join video call',
        isInitiating: false,
        isInCall: false,
        roomId: null,
      }));
      throw error;
    }
  }, [videoCallState.isInCall]);

  /**
   * End the current video call
   */
  const endVideoCall = useCallback(async () => {
    try {
      console.log('[ZegoCloudContext] Ending video call');

      const { roomId } = videoCallState;

      if (roomId) {
        await zegoCloudService.leaveRoom(roomId);
      }

      // Reset state
      setVideoCallState({
        isInCall: false,
        roomId: null,
        participants: [],
        isInitiating: false,
        error: null,
        callStartTime: null,
      });

      console.log('[ZegoCloudContext] Video call ended successfully');
    } catch (error: any) {
      console.error('[ZegoCloudContext] Error ending video call:', error);
      
      // Reset state even if there's an error
      setVideoCallState({
        isInCall: false,
        roomId: null,
        participants: [],
        isInitiating: false,
        error: error.message || 'Failed to end video call',
        callStartTime: null,
      });
    }
  }, [videoCallState]);

  /**
   * Check if currently in a room
   */
  const isInRoom = useCallback((roomId: string): boolean => {
    return zegoCloudService.isInRoom(roomId);
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setVideoCallState(prev => ({ ...prev, error: null }));
  }, []);

  // ============ CONTEXT VALUE ============
  const value: ZegoCloudContextType = {
    videoCallState,
    startVideoCall,
    joinVideoCall,
    endVideoCall,
    isInRoom,
    clearError,
  };

  return (
    <ZegoCloudContext.Provider value={value}>
      {children}
    </ZegoCloudContext.Provider>
  );
};

// ============ HOOK ============
export const useZegoCloud = (): ZegoCloudContextType => {
  const context = useContext(ZegoCloudContext);
  if (!context) {
    throw new Error('useZegoCloud must be used within a ZegoCloudProvider');
  }
  return context;
};

export default ZegoCloudContext;
