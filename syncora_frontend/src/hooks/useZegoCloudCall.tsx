/**
 * Custom Hook for ZegoCloud Video Calls
 * 
 * Provides an easy-to-use interface for managing video calls
 * with ZegoCloud in any component
 */

import { useState, useCallback, useEffect } from 'react';
import { useZegoCloud } from '@/contexts/ZegoCloudContext';
import { useAuth } from '@/contexts/AuthContext';

export interface UseZegoCloudCallOptions {
  autoCleanup?: boolean;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: string) => void;
}

export interface UseZegoCloudCallReturn {
  // State
  isInCall: boolean;
  roomId: string | null;
  isInitiating: boolean;
  error: string | null;
  callDuration: number;
  
  // Methods
  startCall: (roomId: string, otherUserId?: string) => Promise<void>;
  joinCall: (roomId: string) => Promise<void>;
  endCall: () => Promise<void>;
  clearError: () => void;
  
  // Computed
  isCallActive: boolean;
  canStartCall: boolean;
}

/**
 * Hook for managing ZegoCloud video calls
 */
export function useZegoCloudCall(options: UseZegoCloudCallOptions = {}): UseZegoCloudCallReturn {
  const {
    autoCleanup = true,
    onCallStart,
    onCallEnd,
    onError,
  } = options;

  const { user } = useAuth();
  const {
    videoCallState,
    startVideoCall,
    joinVideoCall,
    endVideoCall,
    clearError: clearContextError,
  } = useZegoCloud();

  const [callDuration, setCallDuration] = useState(0);
  const [durationInterval, setDurationInterval] = useState<NodeJS.Timeout | null>(null);

  // Update call duration
  useEffect(() => {
    if (videoCallState.isInCall && videoCallState.callStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - videoCallState.callStartTime!) / 1000);
        setCallDuration(elapsed);
      }, 1000);

      setDurationInterval(interval);

      return () => {
        clearInterval(interval);
      };
    } else {
      if (durationInterval) {
        clearInterval(durationInterval);
        setDurationInterval(null);
      }
      setCallDuration(0);
    }
  }, [videoCallState.isInCall, videoCallState.callStartTime]);

  // Handle error changes
  useEffect(() => {
    if (videoCallState.error && onError) {
      onError(videoCallState.error);
    }
  }, [videoCallState.error, onError]);

  // Auto cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCleanup && videoCallState.isInCall) {
        endVideoCall().catch(err => {
          console.error('[useZegoCloudCall] Auto cleanup error:', err);
        });
      }
    };
  }, [autoCleanup, videoCallState.isInCall]);

  /**
   * Start a new video call
   */
  const startCall = useCallback(async (roomId: string, otherUserId?: string) => {
    try {
      console.log('[useZegoCloudCall] Starting call:', { roomId, otherUserId });
      await startVideoCall(roomId, otherUserId);
      
      if (onCallStart) {
        onCallStart();
      }
    } catch (error: any) {
      console.error('[useZegoCloudCall] Error starting call:', error);
      throw error;
    }
  }, [startVideoCall, onCallStart]);

  /**
   * Join an existing video call
   */
  const joinCall = useCallback(async (roomId: string) => {
    try {
      console.log('[useZegoCloudCall] Joining call:', roomId);
      await joinVideoCall(roomId);
      
      if (onCallStart) {
        onCallStart();
      }
    } catch (error: any) {
      console.error('[useZegoCloudCall] Error joining call:', error);
      throw error;
    }
  }, [joinVideoCall, onCallStart]);

  /**
   * End the current video call
   */
  const endCall = useCallback(async () => {
    try {
      console.log('[useZegoCloudCall] Ending call');
      await endVideoCall();
      
      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error: any) {
      console.error('[useZegoCloudCall] Error ending call:', error);
      throw error;
    }
  }, [endVideoCall, onCallEnd]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    clearContextError();
  }, [clearContextError]);

  // Computed properties
  const isCallActive = videoCallState.isInCall && !videoCallState.error;
  const canStartCall = !videoCallState.isInCall && !videoCallState.isInitiating && !!user;

  return {
    // State
    isInCall: videoCallState.isInCall,
    roomId: videoCallState.roomId,
    isInitiating: videoCallState.isInitiating,
    error: videoCallState.error,
    callDuration,
    
    // Methods
    startCall,
    joinCall,
    endCall,
    clearError,
    
    // Computed
    isCallActive,
    canStartCall,
  };
}

export default useZegoCloudCall;
