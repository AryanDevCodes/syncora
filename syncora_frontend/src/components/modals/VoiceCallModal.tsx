import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Maximize2, Minimize2, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  participantName: string;
  minimized: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onEnd: () => void;
  isRinging: boolean;
  isCaller: boolean;
  callAccepted: boolean;
  callEnded: boolean;
  callDuration: number;
}

/**
 * VoiceCallModal - UI Component for Agora Voice Calls
 * Handles both incoming and outgoing calls with proper state management
 * Updates caller UI correctly after call is accepted
 */
export default function VoiceCallModal({
  isOpen,
  onClose,
  onMinimize,
  onMaximize,
  isMuted,
  onToggleMute,
  participantName,
  minimized,
  onAccept,
  onDecline,
  onEnd,
  isRinging,
  isCaller,
  callAccepted,
  callEnded,
  callDuration,
}: VoiceCallModalProps) {
  // ============ REFS ============
  const isMountedRef = useRef(true);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============ STATE ============
  const [displayDuration, setDisplayDuration] = useState(0);
  const [isAcceptingCall, setIsAcceptingCall] = useState(false);
  const [isDecliningCall, setIsDecliningCall] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

  // ============ LIFECYCLE: MOUNT/UNMOUNT ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // ============ EFFECTS: CALL DURATION UPDATE ============
  /**
   * Updates display duration every second when call is active
   * This ensures the UI always shows the correct elapsed time
   */
  useEffect(() => {
    if (!callAccepted || callEnded) {
      setDisplayDuration(0);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
      return;
    }

    // Sync display duration with actual callDuration prop
    setDisplayDuration(callDuration);

    if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);

    updateIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        setDisplayDuration(prev => prev + 1);
      }
    }, 1000);

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [callAccepted, callEnded, callDuration]);

  // ============ EFFECTS: RESET STATES ON CALL END ============
  useEffect(() => {
    if (callEnded && isMountedRef.current) {
      setIsAcceptingCall(false);
      setIsDecliningCall(false);
      setIsEndingCall(false);
    }
  }, [callEnded]);

  // ============ HANDLERS ============
  const handleAccept = useCallback(async () => {
    if (isAcceptingCall) return;
    
    console.log('[VoiceCallModal] Accepting call...');
    setIsAcceptingCall(true);

    try {
      await onAccept();
    } catch (err) {
      console.error('[VoiceCallModal] Error accepting call:', err);
      if (isMountedRef.current) {
        setIsAcceptingCall(false);
      }
    }
  }, [onAccept, isAcceptingCall]);

  const handleDecline = useCallback(async () => {
    if (isDecliningCall) return;

    console.log('[VoiceCallModal] Declining call...');
    setIsDecliningCall(true);

    try {
      await onDecline();
    } catch (err) {
      console.error('[VoiceCallModal] Error declining call:', err);
      if (isMountedRef.current) {
        setIsDecliningCall(false);
      }
    }
  }, [onDecline, isDecliningCall]);

  const handleEnd = useCallback(async () => {
    if (isEndingCall) return;

    console.log('[VoiceCallModal] Ending call...');
    setIsEndingCall(true);

    try {
      await onEnd();
    } catch (err) {
      console.error('[VoiceCallModal] Error ending call:', err);
      if (isMountedRef.current) {
        setIsEndingCall(false);
      }
    }
  }, [onEnd, isEndingCall]);

  const handleClose = useCallback(() => {
    console.log('[VoiceCallModal] Closing modal...');
    onClose();
  }, [onClose]);

  // ============ HELPERS ============
  /**
   * Format call duration (HH:MM:SS)
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  /**
   * Get call status text based on current state
   */
  const getCallStatusText = (): string => {
    if (callEnded) return 'Call ended';
    if (callAccepted) return 'Call active';
    if (isRinging && isCaller) return 'Calling...';
    if (isRinging && !isCaller) return 'Incoming call';
    return 'Connecting...';
  };

  /**
   * Get status color based on call state
   */
  const getStatusColor = (): string => {
    if (callEnded) return 'bg-red-500';
    if (callAccepted) return 'bg-green-500';
    if (isRinging) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  // ============ RENDER: RETURN IF NOT OPEN ============
  if (!isOpen) {
    return null;
  }

  // ============ RENDER: MINIMIZED STATE ============
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onMaximize}
          className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
          aria-label="Maximize call"
        >
          <Phone className="w-6 h-6" />
        </button>
        <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
          {formatDuration(displayDuration)}
        </div>
      </div>
    );
  }

  // ============ RENDER: FULL MODAL ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-label="Close call modal"
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}
            />
            <span className="text-sm font-medium text-gray-300">
              {getCallStatusText()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!callEnded && (
              <button
                onClick={minimized ? onMaximize : onMinimize}
                className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300 hover:text-white"
                aria-label={minimized ? 'Maximize' : 'Minimize'}
              >
                {minimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition text-gray-300 hover:text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-6">
          {/* Participant Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {participantName.charAt(0).toUpperCase()}
            </div>
            {callAccepted && !callEnded && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>

          {/* Participant Name */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{participantName}</h2>
            <p className="text-sm text-gray-400 mt-1">{getCallStatusText()}</p>
          </div>

          {/* Duration or Status */}
          <div className="text-center">
            {callAccepted && !callEnded ? (
              <div className="flex flex-col items-center">
                <p className="text-4xl font-mono font-bold text-green-400">
                  {formatDuration(displayDuration)}
                </p>
                <p className="text-xs text-gray-400 mt-2">Call duration</p>
              </div>
            ) : callEnded ? (
              <div className="flex flex-col items-center">
                <p className="text-lg text-gray-400">Call ended</p>
                <p className="text-2xl font-mono font-bold text-gray-300 mt-2">
                  {formatDuration(displayDuration)}
                </p>
              </div>
            ) : isRinging ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-8 bg-blue-400 rounded-full animate-bounce"
                      style={{
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  {isCaller ? 'Waiting for response...' : 'Incoming call...'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Connecting...</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-4 justify-center">
          {/* INCOMING CALL - Show Accept/Decline */}
          {isRinging && !isCaller && !callAccepted && (
            <>
              <button
                onClick={handleDecline}
                disabled={isDecliningCall}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                Decline
              </button>
              <button
                onClick={handleAccept}
                disabled={isAcceptingCall}
                className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Accept
              </button>
            </>
          )}

          {/* ACTIVE CALL - Show Mute/End */}
          {callAccepted && !callEnded && (
            <>
              <button
                onClick={onToggleMute}
                className={`flex-1 px-6 py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                  isMuted
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={handleEnd}
                disabled={isEndingCall}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <PhoneOff className="w-5 h-5" />
                End Call
              </button>
            </>
          )}

          {/* CALL ENDED - Show Close */}
          {callEnded && (
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              Close
            </button>
          )}

          {/* OUTGOING CALL (RINGING) - Show Cancel */}
          {isRinging && isCaller && !callAccepted && (
            <button
              onClick={handleDecline}
              disabled={isDecliningCall}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              Cancel Call
            </button>
          )}
        </div>
      </div>
    </div>
  );
}