import React, { useRef, useEffect, useState, useCallback } from 'react';
import { zegoCloudService, ZegoRoomConfig } from '@/services/zegoCloudService';
import { Loader2, AlertCircle, RefreshCw, Users, Video, PhoneOff } from 'lucide-react';

interface ZegoCloudVideoCallProps {
  roomId: string;
  userId: string;
  userName: string;
  onCallEnd?: () => void;
  onUserJoin?: (userId: string) => void;
  onUserLeave?: (userId: string) => void;
  className?: string;
  scenario?: 'OneONoneCall' | 'GroupCall' | 'VideoConference' | 'LiveStreaming';
  showScreenSharingButton?: boolean;
  showTextChat?: boolean;
  showUserList?: boolean;
  maxUsers?: number;
  layout?: 'Auto' | 'Sidebar' | 'Grid';
  maxHeight?: string;
  minHeight?: string;
}

const ZegoCloudVideoCall: React.FC<ZegoCloudVideoCallProps> = ({
  roomId,
  userId,
  userName,
  onCallEnd,
  onUserJoin,
  onUserLeave,
  className = '',
  scenario = 'VideoConference',
  showScreenSharingButton = true,
  showTextChat = true,
  showUserList = true,
  layout = 'Auto',
  maxHeight = '600px',
  minHeight = '400px',
}) => {
  const meetingRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initAttemptedRef = useRef(false);

  const initializeMeeting = useCallback(async () => {
    const container = meetingRef.current;

    if (!container || initAttemptedRef.current) {
      return;
    }

    initAttemptedRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      console.log('[ZegoCloudVideoCall] Initializing with:', {
        roomId,
        userId,
        userName,
        scenario
      });

      const roomConfig: ZegoRoomConfig = {
        roomId,
        user: {
          userId,
          userName,
        },
        container,
        onCallEnd: () => {
          console.log('[ZegoCloudVideoCall] Call ended');
          setIsInitialized(false);
          onCallEnd?.();
        },
        onUserJoin: (userId: string) => {
          console.log('[ZegoCloudVideoCall] User joined:', userId);
          onUserJoin?.(userId);
        },
        onUserLeave: (userId: string) => {
          console.log('[ZegoCloudVideoCall] User left:', userId);
          onUserLeave?.(userId);
        },
        scenario,
        showScreenSharingButton,
        showTextChat,
        showUserList,
        layout,
      };

      await zegoCloudService.joinRoom(roomConfig);
      setIsInitialized(true);
      setIsLoading(false);
      console.log('[ZegoCloudVideoCall] Successfully initialized');
    } catch (error: any) {
      console.error('[ZegoCloudVideoCall] Initialization error:', error);
      setError(error.message || 'Failed to initialize video call');
      setIsLoading(false);
      initAttemptedRef.current = false;
    }
  }, [
    roomId, userId, userName, scenario, onCallEnd, onUserJoin, onUserLeave,
    showScreenSharingButton, showTextChat, showUserList, layout
  ]);

  useEffect(() => {
    initializeMeeting();
  }, [initializeMeeting]);

  useEffect(() => {
    return () => {
      if (isInitialized) {
        console.log('[ZegoCloudVideoCall] Cleaning up room:', roomId);
        initAttemptedRef.current = false;
        zegoCloudService.leaveRoom(roomId).catch(err => {
          console.error('[ZegoCloudVideoCall] Cleanup error:', err);
        });
      }
    };
  }, [roomId, isInitialized]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    initAttemptedRef.current = false;
    setIsInitialized(false);
    setTimeout(initializeMeeting, 100);
  };

  const handleLeaveCall = () => {
    if (isInitialized) {
      zegoCloudService.leaveRoom(roomId).catch(console.error);
    }
    onCallEnd?.();
  };

  return (
    <div 
      className={`relative bg-gray-900 rounded-xl overflow-hidden ${className}`}
      style={{
        minHeight: minHeight,
        maxHeight: maxHeight,
        height: '100%',
        width: '100%'
      }}
    >
      {/* ZegoCloud container - STRICTLY constrained */}
      <div 
        ref={meetingRef}
        className="w-full h-full"
        style={{ 
          display: isLoading || error ? 'none' : 'block',
          minHeight: '100%',
          maxHeight: '100%',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-900"
          style={{
            minHeight: '100%',
            maxHeight: '100%',
            height: '100%'
          }}
        >
          <div className="flex flex-col items-center gap-4 text-white p-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
                <Video className="w-8 h-8 text-white" />
              </div>
              <Loader2 className="w-5 h-5 animate-spin text-blue-300 absolute -top-1 -right-1" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Joining Video Call</h3>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                <span>Room: {roomId}</span>
              </div>
            </div>

            <div className="w-32 bg-gray-700 rounded-full h-2 mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-gray-900"
          style={{
            minHeight: '100%',
            maxHeight: '100%',
            height: '100%'
          }}
        >
          <div className="flex flex-col items-center gap-4 text-white p-6 max-w-xs text-center">
            <div className="relative">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Connection Failed</h3>
              <p className="text-sm text-gray-300">
                {error}
              </p>
            </div>

            <div className="flex gap-2 w-full">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              
              <button
                onClick={handleLeaveCall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm"
              >
                <PhoneOff className="w-4 h-4" />
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status bar when connected */}
      {!isLoading && !error && isInitialized && (
        <div className="absolute top-3 left-3 z-10">
          <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZegoCloudVideoCall;