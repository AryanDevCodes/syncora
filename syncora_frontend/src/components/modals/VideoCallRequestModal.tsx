import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, Video, VideoOff, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface VideoCallRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  callerName: string;
  callerEmail: string;
  callerAvatar?: string;
  isIncoming: boolean;
  isAccepted: boolean;
  isDeclined: boolean;
}

/**
 * VideoCallRequestModal - UI Component for incoming/outgoing video call requests
 * Shows caller info, profile image, ringtone, and Accept/Decline buttons
 * Similar to VoiceCallModal but for video call signaling before ZegoCloud modal
 */
export default function VideoCallRequestModal({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  callerName,
  callerEmail,
  callerAvatar,
  isIncoming,
  isAccepted,
  isDeclined,
}: VideoCallRequestModalProps) {
  const isMountedRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  // ============ LIFECYCLE: MOUNT/UNMOUNT ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ============ EFFECTS: PLAY RINGTONE ============
  useEffect(() => {
    if (!isOpen || isAccepted || isDeclined) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (isIncoming) {
      // Play ringtone for incoming call
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('/ringtone.mp3'); // Add a ringtone file to public folder
          audioRef.current.loop = true;
          audioRef.current.volume = 0.5;
        }
        audioRef.current.play().catch(err => {
          console.warn('[VideoCallRequestModal] Failed to play ringtone:', err);
        });
      } catch (err) {
        console.warn('[VideoCallRequestModal] Ringtone error:', err);
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isOpen, isIncoming, isAccepted, isDeclined]);

  // ============ HANDLERS ============
  const handleAccept = useCallback(async () => {
    if (isAccepting) return;

    console.log('[VideoCallRequestModal] Accepting video call...');
    setIsAccepting(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      await onAccept();
    } catch (err) {
      console.error('[VideoCallRequestModal] Error accepting call:', err);
      if (isMountedRef.current) {
        setIsAccepting(false);
      }
    }
  }, [onAccept, isAccepting]);

  const handleDecline = useCallback(async () => {
    if (isDeclining) return;

    console.log('[VideoCallRequestModal] Declining video call...');
    setIsDeclining(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      await onDecline();
    } catch (err) {
      console.error('[VideoCallRequestModal] Error declining call:', err);
      if (isMountedRef.current) {
        setIsDeclining(false);
      }
    }
  }, [onDecline, isDeclining]);

  const handleClose = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onClose();
  }, [onClose]);

  // ============ HELPERS ============
  const getInitials = (name: string): string => {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return callerEmail.charAt(0).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getStatusText = (): string => {
    if (isAccepted) return 'Connecting...';
    if (isDeclined) return 'Call declined';
    if (isIncoming) return 'Incoming Video Call';
    return 'Calling...';
  };

  const getStatusColor = (): string => {
    if (isAccepted) return 'bg-green-500';
    if (isDeclined) return 'bg-red-500';
    if (isIncoming) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  // ============ RENDER: RETURN IF NOT OPEN ============
  if (!isOpen) {
    return null;
  }

  // ============ RENDER: FULL MODAL ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close video call request"
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}
            />
            <span className="text-sm font-medium text-gray-200">
              {getStatusText()}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition text-gray-300 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col items-center justify-center gap-6">
          {/* Caller Avatar with Ring Animation */}
          <div className="relative">
            {!isAccepted && !isDeclined && (
              <div className="absolute inset-0 -m-4">
                <div className="w-full h-full border-4 border-blue-400/30 rounded-full animate-ping" />
              </div>
            )}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white/10 shadow-xl">
                <AvatarImage src={callerAvatar} alt={callerName} />
                <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                  {getInitials(callerName)}
                </AvatarFallback>
              </Avatar>
              {!isAccepted && !isDeclined && (
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Video className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Caller Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">{callerName}</h2>
            <p className="text-sm text-gray-400">{callerEmail}</p>
          </div>

          {/* Status Message */}
          <div className="text-center">
            {isAccepted ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-green-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">Starting video call...</p>
              </div>
            ) : isDeclined ? (
              <div className="flex flex-col items-center">
                <VideoOff className="w-12 h-12 text-red-400 mb-2" />
                <p className="text-sm text-gray-400">Call declined</p>
              </div>
            ) : isIncoming ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-6 bg-blue-400 rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-300 font-medium">
                  wants to video call with you
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-yellow-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">Waiting for response...</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-4 justify-center">
          {/* INCOMING CALL - Show Accept/Decline */}
          {isIncoming && !isAccepted && !isDeclined && (
            <>
              <button
                onClick={handleDecline}
                disabled={isDeclining}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30"
              >
                <VideoOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30"
              >
                <Video className="w-5 h-5" />
                Accept
              </button>
            </>
          )}

          {/* OUTGOING CALL (WAITING) - Show Cancel */}
          {!isIncoming && !isAccepted && !isDeclined && (
            <button
              onClick={handleDecline}
              disabled={isDeclining}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30"
            >
              <VideoOff className="w-5 h-5" />
              Cancel Call
            </button>
          )}

          {/* CALL ACCEPTED OR DECLINED - Show Close */}
          {(isAccepted || isDeclined) && (
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
