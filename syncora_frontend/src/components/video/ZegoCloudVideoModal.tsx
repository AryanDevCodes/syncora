/**
 * ZegoCloud Video Call Modal
 * 
 * Full-featured modal for ZegoCloud video calls with:
 * - Video call UI
 * - Call controls
 * - Participant management
 * - Minimize/maximize functionality
 */

import React, { useState, useEffect } from 'react';
import { X, Minimize2, Maximize2, PhoneOff, Loader2 } from 'lucide-react';
import ZegoCloudVideoCall from './ZegoCloudVideoCall';
import { zegoCloudService } from '@/services/zegoCloudService';
import { useAuth } from '@/contexts/AuthContext';

export interface ZegoCloudVideoModalProps {
  isOpen: boolean;
  roomId: string;
  participantName?: string;
  onClose: () => void;
  onCallEnd?: () => void;
  scenario?: 'OneONoneCall' | 'GroupCall' | 'VideoConference' | 'LiveStreaming';
  showScreenSharingButton?: boolean;
  showTextChat?: boolean;
  showUserList?: boolean;
  maxUsers?: number;
}

const ZegoCloudVideoModal: React.FC<ZegoCloudVideoModalProps> = ({
  isOpen,
  roomId,
  participantName = 'Video Call',
  onClose,
  onCallEnd,
  scenario = 'VideoConference',
  showScreenSharingButton = true,
  showTextChat = true,
  showUserList = true,
  maxUsers = 10,
}) => {
  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  
  useEffect(() => {
    // Close modal on Escape for accessibility
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  if (!isOpen) return null;

  const handleCallEnd = async () => {
    setIsEnding(true);
    try {
      // Ensure SDK cleanup is attempted (stops camera/mic)
      try {
        await zegoCloudService.leaveRoom(roomId);
      } catch (leaveErr) {
        console.warn('[ZegoCloudVideoModal] leaveRoom error (ignored):', leaveErr);
      }
      if (onCallEnd) {
        await onCallEnd();
      }
      onClose();
    } catch (error) {
      console.error('[ZegoCloudVideoModal] Error ending call:', error);
    } finally {
      setIsEnding(false);
    }
  };

  const handleClose = () => {
    if (!isEnding) {
      handleCallEnd();
    }
  };

  // Get user info for ZegoCloud
  const userId = user?.id?.toString() || user?.email?.replace(/[^a-zA-Z0-9]/g, '') || `user_${Date.now()}`;
  const userName = user?.email || user?.username || `Guest_${Date.now()}`;

  const getInitials = (name = '') => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-2xl flex items-center justify-center text-white hover:shadow-xl hover:scale-105 transition-transform duration-200 border-4 border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-300"
          aria-label="Maximize video call"
          title="Restore video"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-lg font-semibold">{getInitials(userName)}</div>
            <span className="text-xs mt-2">Video</span>
          </div>
        </button>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </div>
    );
  }

  // Full modal view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="zego-title" aria-describedby="zego-desc">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close video call"
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col border border-white/10 transform transition-all duration-200 ease-out scale-100">
        {/* Floating compact controls (header removed) */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/6 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/10"
            aria-label="Minimize"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>


          <button
            onClick={handleClose}
            disabled={isEnding}
            className="p-2 hover:bg-white/6 rounded-md text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/10"
            aria-label="Close"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Call Container */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <ZegoCloudVideoCall
            roomId={roomId}
            userId={userId}
            userName={userName}
            onCallEnd={handleCallEnd}
            onUserJoin={(userId) => {
              console.log('[ZegoCloudVideoModal] User joined:', userId);
            }}
            onUserLeave={(userId) => {
              console.log('[ZegoCloudVideoModal] User left:', userId);
            }}
            scenario={scenario}
            showScreenSharingButton={showScreenSharingButton}
            showTextChat={showTextChat}
            showUserList={showUserList}
            maxUsers={maxUsers}
            className="w-full h-full"
          />
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-black/30 backdrop-blur-xl border-t border-white/10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>
                Powered by ZegoCloud
              </span>
              <span className="text-xs">
                • Secure & Encrypted
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">
                User: {userName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZegoCloudVideoModal;
