import { useState, useRef, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Search, MoreVertical, Phone, Video, Plus } from 'lucide-react';
import VoiceCallModal from '@/components/modals/VoiceCallModal';
import VideoCallRequestModal from '@/components/modals/VideoCallRequestModal';
import ZegoCloudVideoModal from '@/components/video/ZegoCloudVideoModal';
import InviteMembersDialog from '@/components/modals/InviteMembersDialog';
import { joinVoiceChannel, leaveVoiceChannel, toggleMute, getRemoteStreams } from '@/services/ablyVoiceCallService';
import { ablyChatService } from '@/services/ably/ablyChatService';
import axios from '@/lib/axios';
import { useChat } from '../contexts/ChatContext';
import { useAgoraChat } from '../contexts/AgoraChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useZegoCloudCall } from '@/hooks/useZegoCloudCall';
import { contactApi, ContactDto } from '../api/contactApi';
import { getUserByEmail } from '../api/getUserByEmail';
import { searchMessages } from '../api/chatApi';
import { FileUploadButton } from '@/components/chat/FileUploadButton';
import { FileAttachment } from '@/components/chat/FileAttachment';
import { ChatFileDto } from '@/api/chatFileApi';

// ============ TYPES ============
interface VoiceCallState {
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  isJoining: boolean;
  isLeaving: boolean;
}

interface CallSessionState {
  open: boolean;
  ringing: boolean;
  accepted: boolean;
  ended: boolean;
  minimized: boolean;
  muted: boolean;
  channel: string | null;
  caller: string | null;
  startTime: number | null;
  duration: number;
}

interface VideoCallRequestState {
  open: boolean;
  isIncoming: boolean;
  caller: string | null;
  callerName: string;
  callerAvatar: string;
  roomId: string | null;
  isAccepted: boolean;
  isDeclined: boolean;
}

// ============ CONSTANTS ============
const CALL_TIMEOUT_MS = 60000;
const CLEANUP_TIMEOUT_MS = 1000;
const CALL_AUTO_CLOSE_DELAY_MS = 2000;
const TYPING_INDICATOR_TIMEOUT_MS = 2000;

export default function ChatPage() {
  // -------- REFS --------
  const voiceCallBroadcast = useRef<BroadcastChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callAutoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupLockRef = useRef(false);
  const isMountedRef = useRef(true);

  // -------- CONTEXT --------
  const {
    chats,
    activeChat,
    messages,
    setActiveChat,
    sendMessage,
    refreshChats,
    createDirectChat,
    loading,
  } = useChat();

  const { isConnected: ablyConnected, sendTyping, joinRoom, leaveRoom, typingUsers } = useAgoraChat();
  const { user } = useAuth();
  const { setActiveModule, setActiveRoom } = useApp();

  // -------- VOICE CALL STATE --------
  const [voiceCallState, setVoiceCallState] = useState<VoiceCallState>({
    localStream: null,
    remoteStreams: new Map(),
    isJoining: false,
    isLeaving: false,
  });

  const [callSession, setCallSession] = useState<CallSessionState>({
    open: false,
    ringing: false,
    accepted: false,
    ended: false,
    minimized: false,
    muted: false,
    channel: null,
    caller: null,
    startTime: null,
    duration: 0,
  });

  // -------- VIDEO CALL REQUEST STATE --------
  const [videoCallRequest, setVideoCallRequest] = useState<VideoCallRequestState>({
    open: false,
    isIncoming: false,
    caller: null,
    callerName: '',
    callerAvatar: '',
    roomId: null,
    isAccepted: false,
    isDeclined: false,
  });

  // -------- ZEGO VIDEO CALL --------
  const {
    isInCall: isInZegoCall,
    roomId: zegoRoomId,
    startCall: startZegoCall,
    endCall: endZegoCall,
    clearError: clearZegoError,
  } = useZegoCloudCall({
    autoCleanup: true,
    onCallEnd: () => {
      console.log('[ChatPage] ZegoCloud call ended');
      
      // Notify remote user that video call has ended
      if (activeChat && videoCallRequest.roomId) {
        const channelId = `chat-${activeChat.id}`;
        try {
          ablyChatService.getChannel(channelId).publish('video-call-ended', {
            by: user?.email,
            roomId: videoCallRequest.roomId,
          });
          console.log('[VideoCall] Video call ended notification sent from ZegoCloud cleanup');
        } catch (err) {
          console.error('[VideoCall] Error publishing video-call-ended from ZegoCloud:', err);
        }
      }

      // Reset video call request state
      setVideoCallRequest({
        open: false,
        isIncoming: false,
        caller: null,
        callerName: '',
        callerAvatar: '',
        roomId: null,
        isAccepted: false,
        isDeclined: false,
      });
    },
    onError: (error) => {
      console.error('[ChatPage] ZegoCloud error:', error);
    },
  });

  // -------- UI STATE --------
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [messageSearch, setMessageSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const messageSearchInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [contacts, setContacts] = useState<ContactDto[]>([]);
  const [userAvatars, setUserAvatars] = useState<{ [email: string]: string }>({});
  const [userNames, setUserNames] = useState<{ [email: string]: string }>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newChatEmail, setNewChatEmail] = useState('');

  // ============ LIFECYCLE: CLEANUP ============
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
      if (callAutoCloseTimeoutRef.current) clearTimeout(callAutoCloseTimeoutRef.current);
      if (voiceCallBroadcast.current) {
        try {
          voiceCallBroadcast.current.close();
        } catch (err) {
          console.warn('[ChatPage] Error closing BroadcastChannel:', err);
        }
      }
    };
  }, []);

  // ============ BROADCAST CHANNEL SETUP ============
  useEffect(() => {
    if (!('BroadcastChannel' in window)) {
      console.warn('[ChatPage] BroadcastChannel not supported');
      return;
    }

    try {
      voiceCallBroadcast.current = new BroadcastChannel('voice-call-cleanup');
      voiceCallBroadcast.current.onmessage = (event) => {
        if (!isMountedRef.current) return;
        if (event.data === 'cleanup') {
          console.log('[ChatPage] Received cleanup signal from another tab');
          cleanupVoiceCallInternal();
        }
      };
      console.log('[ChatPage] BroadcastChannel established');
    } catch (err) {
      console.error('[ChatPage] Error setting up BroadcastChannel:', err);
    }

    return () => {
      if (voiceCallBroadcast.current) {
        try {
          voiceCallBroadcast.current.close();
        } catch {}
      }
    };
  }, []);

  // ============ VOICE CALL: CLEANUP LOGIC ============
  const cleanupVoiceCallInternal = useCallback(async () => {
    if (!isMountedRef.current) return;
    console.log('[VoiceCall] *** INTERNAL CLEANUP: Leaving Ably voice channel ***');
    try {
      await leaveVoiceChannel();
      // Stop all media streams
      if (voiceCallState.localStream) {
        voiceCallState.localStream.getTracks().forEach(track => track.stop());
      }
      voiceCallState.remoteStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
    } catch (err) {
      console.error('[VoiceCall] Error during voice cleanup:', err);
    }
    if (isMountedRef.current) {
      setVoiceCallState({
        localStream: null,
        remoteStreams: new Map(),
        isJoining: false,
        isLeaving: false,
      });
      
      // Remove event listeners
      window.removeEventListener('ably-remote-stream-added', () => {});
      window.removeEventListener('ably-remote-stream-removed', () => {});
    }
    console.log('[VoiceCall] *** INTERNAL CLEANUP COMPLETE ***');
  }, [voiceCallState]);

  const cleanupVoiceCall = useCallback(async () => {
    if (!isMountedRef.current) return;
    // Broadcast to other tabs
    if (voiceCallBroadcast.current) {
      try {
        voiceCallBroadcast.current.postMessage('cleanup');
      } catch (err) {
        console.warn('[ChatPage] Error broadcasting cleanup:', err);
      }
    }
    setCallSession(prev => ({
      ...prev,
      open: false,
      ringing: false,
      minimized: false,
      muted: false,
      ended: true,
      startTime: null,
    }));
    if (cleanupLockRef.current) {
      console.log('[VoiceCall] Cleanup already in progress, skipping');
      return;
    }
    cleanupLockRef.current = true;
    try {
      // Primary cleanup (leave Ably voice channel and stop streams)
      await cleanupVoiceCallInternal();

      // `cleanupVoiceCallInternal` performs Ably + media cleanup.
      // The previous `gracefulCleanup()` helper (video cleanup) was removed,
      // so just reset the cleanup lock after the timeout.
      if (cleanupTimeoutRef.current) clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = setTimeout(() => {
        cleanupLockRef.current = false;
      }, CLEANUP_TIMEOUT_MS);
    } catch (err) {
      console.error('[VoiceCall] Fatal error during cleanup:', err);
      cleanupLockRef.current = false;
    }
  }, [cleanupVoiceCallInternal]);

  // ============ VOICE CALL: AUTO-CLOSE ============
  useEffect(() => {
    if (!callSession.ended || !callSession.open) return;

    if (callAutoCloseTimeoutRef.current) clearTimeout(callAutoCloseTimeoutRef.current);

    callAutoCloseTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        console.log('[VoiceCall] Auto-closing modal after call ended');
        setCallSession(prev => ({ ...prev, open: false }));
      }
    }, CALL_AUTO_CLOSE_DELAY_MS);

    return () => {
      if (callAutoCloseTimeoutRef.current) clearTimeout(callAutoCloseTimeoutRef.current);
    };
  }, [callSession.ended, callSession.open]);

  // ============ VOICE CALL: DURATION TIMER ============
  useEffect(() => {
    if (callSession.accepted && !callSession.ended) {
      const startTime = callSession.startTime || Date.now();

      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);

      callDurationIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setCallSession(prev => ({
            ...prev,
            duration: Math.floor((Date.now() - startTime) / 1000),
          }));
        }
      }, 1000);

      return () => {
        if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
      };
    } else if (callSession.ended) {
      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
    }
  }, [callSession.accepted, callSession.ended, callSession.startTime]);

  // ============ VOICE CALL: CALL TIMEOUT ============
  useEffect(() => {
    if (callSession.accepted && !callSession.ended) {
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);

      callTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn('[VoiceCall] Call timeout - auto-ending call');
          handleEndVoiceCall();
        }
      }, CALL_TIMEOUT_MS);

      return () => {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      };
    }
  }, [callSession.accepted, callSession.ended]);

  // ============ CHAT: LOAD DATA ============
  useEffect(() => {
    refreshChats();
    contactApi
      .getAllContacts()
      .then(setContacts)
      .catch(err => console.error('[ChatPage] Error loading contacts:', err));
  }, [refreshChats]);

  // ============ CHAT: JOIN/LEAVE ROOM ============
  useEffect(() => {
    if (!activeChat) return;

    const roomId = activeChat.id;
    console.log('[ChatPage] Joining room:', roomId);
    joinRoom(roomId);

    return () => {
      console.log('[ChatPage] Leaving room:', roomId);
      leaveRoom(roomId);
    };
  }, [activeChat?.id, joinRoom, leaveRoom]);

  // ============ CHAT: SCROLL TO BOTTOM ============
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ============ CHAT: LOAD USER AVATARS ============
  useEffect(() => {
    if (!user || !Array.isArray(chats)) return;

    const toFetch = chats
      .filter(c => !c.isGroup)
      .map(c => c.memberEmails?.find((e: string) => e !== user.email))
      .filter(Boolean) as string[];

    Promise.all(
      toFetch.map(async email => {
        try {
          const data = await getUserByEmail(email);
          setUserAvatars(prev => ({ ...prev, [email]: data.avatarUrl || '' }));
          setUserNames(prev => ({
            ...prev,
            [email]: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
          }));
        } catch (err) {
          // Silently handle - contact may not have registered yet
          console.debug('[ChatPage] User not found (contact may not be registered):', email);
        }
      })
    );
  }, [chats, user]);

  // ============ LISTENERS: INCOMING VOICE CALL ============
  useEffect(() => {
    if (!activeChat) return;

    const channelId = `chat-${activeChat.id}`;

    const handleIncomingVoiceCall = (payload: { caller: string; channelName: string }) => {
      if (!isMountedRef.current) return;

      if (!callSession.open && user?.email !== payload.caller) {
        console.log('[VoiceCall] Incoming call from:', payload.caller);
        setCallSession(prev => ({
          ...prev,
          ringing: true,
          channel: payload.channelName,
          caller: payload.caller,
          open: true,
          accepted: false,
          ended: false,
          muted: false,
          minimized: false,
          duration: 0,
          startTime: null,
        }));
      }
    };

    ablyChatService.addVoiceCallListener(channelId, handleIncomingVoiceCall);

    return () => {
      // Cleanup handled by ablyChatService
    };
  }, [activeChat, user]);

  // ============ LISTENERS: CALL ACCEPTED ============
  useEffect(() => {
    if (!activeChat || !callSession.caller || callSession.accepted) return;

    const channelId = `chat-${activeChat.id}`;

    const handleCallAccepted = (message: any) => {
      if (!isMountedRef.current) return;

      const payload = message.data as { accepter: string; channelName: string };

      // Only update if we're the caller and call channel matches
      if (
        user?.email === callSession.caller &&
        payload.channelName === callSession.channel
      ) {
        console.log('[VoiceCall] Call accepted by:', payload.accepter);
        
        // Update UI to show call is accepted
        setCallSession(prev => ({
          ...prev,
          accepted: true,
          ringing: false,
          startTime: Date.now(),
          duration: 0,
        }));

        // Join channel as caller
        handleJoinVoiceCallAsCaller();
      }
    };

    let unsubscribed = false;
    let unsubscribeFn: (() => void) | null = null;
    ablyChatService.getChannel(channelId).subscribe('call-accepted', handleCallAccepted)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          unsubscribeFn = subscription.unsubscribe;
        }
      });

    return () => {
      unsubscribed = true;
      if (unsubscribeFn) {
        try { unsubscribeFn(); } catch (err) { console.warn('[VoiceCall] Error unsubscribing:', err); }
      }
    };
  }, [activeChat, callSession.caller, callSession.channel, callSession.accepted, user]);

  // ============ LISTENERS: CALL DECLINED/ENDED ============
  useEffect(() => {
    if (!activeChat || !callSession.channel) return;

    const channelId = `chat-${activeChat.id}`;

    const handleCallDeclined = async (message: any) => {
      if (!isMountedRef.current) return;

      const payload = message.data as { by: string; channelName: string };

      if (payload.channelName === callSession.channel) {
        console.log('[VoiceCall] Call declined/ended by:', payload.by);
        await cleanupVoiceCall();
      }
    };

    let unsubscribed = false;
    let declinedUnsub: (() => void) | null = null;
    let endedUnsub: (() => void) | null = null;
    ablyChatService.getChannel(channelId).subscribe('call-declined', handleCallDeclined)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          declinedUnsub = subscription.unsubscribe;
        }
      });
    ablyChatService.getChannel(channelId).subscribe('call-ended', handleCallDeclined)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          endedUnsub = subscription.unsubscribe;
        }
      });

    return () => {
      unsubscribed = true;
      if (declinedUnsub) {
        try { declinedUnsub(); } catch (err) { console.warn('[VoiceCall] Error unsubscribing:', err); }
      }
      if (endedUnsub) {
        try { endedUnsub(); } catch (err) { console.warn('[VoiceCall] Error unsubscribing:', err); }
      }
    };
  }, [activeChat, callSession.channel]);

  // ============ HANDLERS: VOICE CALL ============
  const handleStartVoiceCall = useCallback(async () => {
    if (!activeChat || voiceCallState.isJoining || voiceCallState.isLeaving) {
      console.warn('[VoiceCall] Cannot start call - already in progress');
      return;
    }
    console.log('[VoiceCall] Starting voice call...');
    const channelName = `voice-${activeChat.id}`;
    setCallSession({
      open: true,
      ringing: true,
      accepted: false,
      ended: false,
      minimized: false,
      muted: false,
      channel: channelName,
      caller: user?.email || null,
      startTime: null,
      duration: 0,
    });
    const channelId = `chat-${activeChat.id}`;
    try {
      ablyChatService.sendVoiceCallSignal(channelId, {
        caller: user?.email || 'Unknown',
        channelName,
      });
      console.log('[VoiceCall] Call signal sent');
    } catch (err) {
      console.error('[VoiceCall] Error sending call signal:', err);
      await cleanupVoiceCall();
    }
  }, [activeChat, user, voiceCallState.isJoining, voiceCallState.isLeaving, cleanupVoiceCall]);

  const handleAcceptVoiceCall = useCallback(async () => {
    if (!callSession.channel || !callSession.ringing) {
      console.warn('[VoiceCall] Cannot accept - no incoming call');
      return;
    }

    console.log('[VoiceCall] Accepting call...');

    // Update UI immediately
    setCallSession(prev => ({
      ...prev,
      ringing: false,
      accepted: true,
      startTime: Date.now(),
      duration: 0,
    }));

    if (activeChat) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('call-accepted', {
          accepter: user?.email,
          channelName: callSession.channel,
        });
        console.log('[VoiceCall] Call accepted notification sent');
      } catch (err) {
        console.error('[VoiceCall] Error publishing call-accepted:', err);
      }
    }

    // Join channel
    await joinVoiceCallChannel(callSession.channel, 'ROLE_SUBSCRIBER');
  }, [callSession.channel, callSession.ringing, activeChat, user]);

  const handleJoinVoiceCallAsCaller = useCallback(async () => {
    if (!callSession.channel) {
      console.warn('[VoiceCall] Cannot join - no channel');
      return;
    }

    console.log('[VoiceCall] Joining as caller...');
    await joinVoiceCallChannel(callSession.channel, 'ROLE_PUBLISHER');
  }, [callSession.channel]);

  const joinVoiceCallChannel = useCallback(
    async (channelName: string, role: 'ROLE_PUBLISHER' | 'ROLE_SUBSCRIBER') => {
      if (voiceCallState.isJoining || voiceCallState.isLeaving) {
        console.warn('[VoiceCall] Join already in progress');
        return;
      }

      setVoiceCallState(prev => ({ ...prev, isJoining: true }));

      try {
        if (!callSession.open || callSession.ended) {
          console.warn('[VoiceCall] Call was cancelled before join');
          return;
        }

        console.log('[VoiceCall] Joining Ably voice channel:', channelName);

        const clientId = user?.email || `user-${Date.now()}`;
        
        // Join Ably voice channel
        const localStream = await joinVoiceChannel(channelName, clientId);

        if (!callSession.open || callSession.ended) {
          console.warn('[VoiceCall] Call was cancelled before stream ready');
          await leaveVoiceChannel();
          return;
        }

        // Listen for remote stream events
        const handleRemoteStreamAdded = (event: any) => {
          if (!isMountedRef.current) return;
          console.log('[VoiceCall] Remote stream added:', event.detail.clientId);
          
          const remoteStreams = getRemoteStreams();
          setVoiceCallState(prev => ({
            ...prev,
            remoteStreams,
          }));

          // Play remote audio
          const audioElement = new Audio();
          audioElement.srcObject = event.detail.stream;
          audioElement.play().catch(err => {
            console.error('[VoiceCall] Error playing remote audio:', err);
          });
        };

        const handleRemoteStreamRemoved = (event: any) => {
          console.log('[VoiceCall] Remote stream removed:', event.detail.clientId);
          const remoteStreams = getRemoteStreams();
          setVoiceCallState(prev => ({
            ...prev,
            remoteStreams,
          }));
        };

        window.addEventListener('ably-remote-stream-added', handleRemoteStreamAdded);
        window.addEventListener('ably-remote-stream-removed', handleRemoteStreamRemoved);

        // Update state with stream
        setVoiceCallState({
          localStream,
          remoteStreams: new Map(),
          isJoining: false,
          isLeaving: false,
        });

        console.log('[VoiceCall] Successfully joined Ably voice channel');
      } catch (err) {
        console.error('[VoiceCall] Error joining channel:', err);

        if (isMountedRef.current) {
          setVoiceCallState(prev => ({ ...prev, isJoining: false }));
          alert('Failed to join voice call: ' + (err instanceof Error ? err.message : 'Unknown error'));
          await cleanupVoiceCall();
        }
      }
    },
    [voiceCallState.isJoining, voiceCallState.isLeaving, callSession.open, callSession.ended, user, cleanupVoiceCall]
  );

  const handleDeclineVoiceCall = useCallback(async () => {
    console.log('[VoiceCall] Declining call...');

    await cleanupVoiceCall();

    if (activeChat && callSession.channel) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('call-declined', {
          by: user?.email,
          channelName: callSession.channel,
        });
      } catch (err) {
        console.error('[VoiceCall] Error publishing call-declined:', err);
      }
    }
  }, [activeChat, callSession.channel, user, cleanupVoiceCall]);

  const handleEndVoiceCall = useCallback(async () => {
    console.log('[VoiceCall] Ending call...');

    await cleanupVoiceCall();

    if (activeChat && callSession.channel) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('call-ended', {
          by: user?.email,
          channelName: callSession.channel,
        });
      } catch (err) {
        console.error('[VoiceCall] Error publishing call-ended:', err);
      }
    }
  }, [activeChat, callSession.channel, user, cleanupVoiceCall]);

  const handleCloseVoiceCallModal = useCallback(async () => {
    console.log('[VoiceCall] Closing modal...');

    if (callSession.accepted && !callSession.ended) {
      await handleEndVoiceCall();
    } else {
      await cleanupVoiceCall();
    }

    setCallSession({
      open: false,
      ringing: false,
      accepted: false,
      ended: false,
      minimized: false,
      muted: false,
      channel: null,
      caller: null,
      startTime: null,
      duration: 0,
    });
  }, [callSession.accepted, callSession.ended, handleEndVoiceCall, cleanupVoiceCall]);

  const handleToggleMuteVoiceCall = useCallback(() => {
    setCallSession(prev => {
      const newMuted = !prev.muted;
      toggleMute(newMuted);
      return { ...prev, muted: newMuted };
    });
  }, []);

  // ============ LISTENERS: INCOMING VIDEO CALL ============
  useEffect(() => {
    if (!activeChat) return;

    const channelId = `chat-${activeChat.id}`;

    const handleIncomingVideoCall = (payload: { caller: string; roomId: string; callerName: string; callerAvatar: string }) => {
      if (!isMountedRef.current) return;

      if (!videoCallRequest.open && user?.email !== payload.caller) {
        console.log('[VideoCall] Incoming video call from:', payload.caller);
        setVideoCallRequest({
          open: true,
          isIncoming: true,
          caller: payload.caller,
          callerName: payload.callerName || payload.caller,
          callerAvatar: payload.callerAvatar || '',
          roomId: payload.roomId,
          isAccepted: false,
          isDeclined: false,
        });
      }
    };

    ablyChatService.addVideoCallListener(channelId, handleIncomingVideoCall);

    return () => {
    };
  }, [activeChat, user, videoCallRequest.open]);

  // ============ LISTENERS: VIDEO CALL ACCEPTED ============
  useEffect(() => {
    if (!activeChat || !videoCallRequest.caller || videoCallRequest.isAccepted) return;

    const channelId = `chat-${activeChat.id}`;

    const handleVideoCallAccepted = (message: any) => {
      if (!isMountedRef.current) return;

      const payload = message.data as { accepter: string; roomId: string };

      // Only update if we're the caller and room matches
      if (
        user?.email === videoCallRequest.caller &&
        payload.roomId === videoCallRequest.roomId
      ) {
        console.log('[VideoCall] Video call accepted by:', payload.accepter);
        
        // Update UI to show call is accepted
        setVideoCallRequest(prev => ({
          ...prev,
          isAccepted: true,
          isDeclined: false,
        }));

        // Start ZegoCloud video call
        if (payload.roomId) {
          startZegoCall(payload.roomId, activeChat.id);
        }
      }
    };

    let unsubscribed = false;
    let unsubscribeFn: (() => void) | null = null;
    ablyChatService.getChannel(channelId).subscribe('video-call-accepted', handleVideoCallAccepted)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          unsubscribeFn = subscription.unsubscribe;
        }
      });

    return () => {
      unsubscribed = true;
      if (unsubscribeFn) {
        try { unsubscribeFn(); } catch (err) { console.warn('[VideoCall] Error unsubscribing:', err); }
      }
    };
  }, [activeChat, videoCallRequest.caller, videoCallRequest.roomId, videoCallRequest.isAccepted, user, startZegoCall]);

  // ============ LISTENERS: VIDEO CALL DECLINED/ENDED ============
  useEffect(() => {
    if (!activeChat || !videoCallRequest.roomId) return;

    const channelId = `chat-${activeChat.id}`;

    const handleVideoCallDeclined = async (message: any) => {
      if (!isMountedRef.current) return;

      const payload = message.data as { by: string; roomId: string };

      if (payload.roomId === videoCallRequest.roomId) {
        console.log('[VideoCall] Video call declined/ended by:', payload.by);
        setVideoCallRequest(prev => ({
          ...prev,
          open: false,
          isDeclined: true,
        }));
      }
    };

    let unsubscribed = false;
    let declinedUnsub: (() => void) | null = null;
    let endedUnsub: (() => void) | null = null;
    ablyChatService.getChannel(channelId).subscribe('video-call-declined', handleVideoCallDeclined)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          declinedUnsub = subscription.unsubscribe;
        }
      });
    ablyChatService.getChannel(channelId).subscribe('video-call-ended', handleVideoCallDeclined)
      .then((subscription: any) => {
        if (unsubscribed && subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (subscription && typeof subscription.unsubscribe === 'function') {
          endedUnsub = subscription.unsubscribe;
        }
      });

    return () => {
      unsubscribed = true;
      if (declinedUnsub) {
        try { declinedUnsub(); } catch (err) { console.warn('[VideoCall] Error unsubscribing:', err); }
      }
      if (endedUnsub) {
        try { endedUnsub(); } catch (err) { console.warn('[VideoCall] Error unsubscribing:', err); }
      }
    };
  }, [activeChat, videoCallRequest.roomId]);

  // ============ HANDLERS: VIDEO CALL ============
  const handleStartVideoCall = useCallback(async () => {
    if (!activeChat) {
      console.warn('[VideoCall] Cannot start call - no active chat');
      return;
    }

    const roomId = `video-${activeChat.id}`;
    console.log('[VideoCall] Starting video call...');

    setVideoCallRequest({
      open: true,
      isIncoming: false,
      caller: user?.email || null,
      callerName: user?.email || 'Unknown',
      callerAvatar: '',
      roomId,
      isAccepted: false,
      isDeclined: false,
    });

    const channelId = `chat-${activeChat.id}`;
    try {
      ablyChatService.sendVideoCallSignal(channelId, {
        caller: user?.email || 'Unknown',
        roomId,
        callerName: user?.email || 'Unknown',
        callerAvatar: '',
      });
      console.log('[VideoCall] Video call signal sent');
    } catch (err) {
      console.error('[VideoCall] Error sending video call signal:', err);
      setVideoCallRequest({
        open: false,
        isIncoming: false,
        caller: null,
        callerName: '',
        callerAvatar: '',
        roomId: null,
        isAccepted: false,
        isDeclined: false,
      });
    }
  }, [activeChat, user]);

  const handleAcceptVideoCall = useCallback(async () => {
    if (!videoCallRequest.roomId) {
      console.warn('[VideoCall] Cannot accept - no room ID');
      return;
    }

    console.log('[VideoCall] Accepting video call...');

    // Update UI immediately
    setVideoCallRequest(prev => ({
      ...prev,
      isAccepted: true,
      isDeclined: false,
    }));

    if (activeChat) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('video-call-accepted', {
          accepter: user?.email,
          roomId: videoCallRequest.roomId,
        });
        console.log('[VideoCall] Video call accepted notification sent');
        
        // Start ZegoCloud video call
        await startZegoCall(videoCallRequest.roomId, activeChat.id);
      } catch (err) {
        console.error('[VideoCall] Error publishing video-call-accepted:', err);
      }
    }
  }, [videoCallRequest.roomId, activeChat, user, startZegoCall]);

  const handleDeclineVideoCall = useCallback(async () => {
    console.log('[VideoCall] Declining video call...');

    setVideoCallRequest(prev => ({
      ...prev,
      open: false,
      isDeclined: true,
    }));

    if (activeChat && videoCallRequest.roomId) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('video-call-declined', {
          by: user?.email,
          roomId: videoCallRequest.roomId,
        });
      } catch (err) {
        console.error('[VideoCall] Error publishing video-call-declined:', err);
      }
    }
  }, [activeChat, videoCallRequest.roomId, user]);

  const handleCloseVideoCallRequest = useCallback(async () => {
    console.log('[VideoCall] Closing video call request modal...');

    // Notify remote user that call is ended
    if (activeChat && videoCallRequest.roomId) {
      const channelId = `chat-${activeChat.id}`;
      try {
        ablyChatService.getChannel(channelId).publish('video-call-ended', {
          by: user?.email,
          roomId: videoCallRequest.roomId,
        });
        console.log('[VideoCall] Video call ended notification sent');
      } catch (err) {
        console.error('[VideoCall] Error publishing video-call-ended:', err);
      }
    }

    setVideoCallRequest({
      open: false,
      isIncoming: false,
      caller: null,
      callerName: '',
      callerAvatar: '',
      roomId: null,
      isAccepted: false,
      isDeclined: false,
    });
  }, [activeChat, videoCallRequest.roomId, user]);

  // ============ HANDLERS: CHAT MESSAGES ============
  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);

    if (!activeChat) return;

    if (!isTyping && value.trim()) {
      sendTyping(activeChat.id, true);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping && isMountedRef.current) {
        sendTyping(activeChat.id, false);
        setIsTyping(false);
      }
    }, TYPING_INDICATOR_TIMEOUT_MS);
  }, [activeChat, isTyping, sendTyping]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');

      if (isTyping && activeChat) {
        sendTyping(activeChat.id, false);
        setIsTyping(false);
      }
    } catch (err) {
      console.error('[ChatPage] Error sending message:', err);
    }
  }, [messageInput, sendMessage, isTyping, activeChat, sendTyping]);

  const handleMessageSearch = useCallback(async (query: string) => {
    setMessageSearch(query);

    if (!activeChat || !query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const results = await searchMessages(activeChat.id, query);
      setSearchResults(results);
    } catch (err) {
      console.error('[ChatPage] Error searching messages:', err);
    } finally {
      setSearching(false);
    }
  }, [activeChat]);

  const handleCreateDirectChat = useCallback(async (email: string) => {
    try {
      await createDirectChat(email);
      setShowCreateDialog(false);
      setNewChatEmail('');
    } catch (err) {
      console.error('[ChatPage] Error creating chat:', err);
    }
  }, [createDirectChat]);

  const handleInviteUser = useCallback(async (userEmail: string) => {
    try {
      await createDirectChat(userEmail);
    } catch (err) {
      console.error('[ChatPage] Error inviting user:', err);
    }
  }, [createDirectChat]);

  // ============ HELPERS ============
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const filteredChats = chats?.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // ============ RENDER ============
  return (
    <div className="flex h-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
          <button
            onClick={() => setShowCreateDialog(!showCreateDialog)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Plus className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full px-3 py-3 flex gap-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                activeChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage src={userAvatars[chat.name]} />
                <AvatarFallback>{chat.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {userNames[chat.name] || chat.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {chat.lastMessagePreview || 'No messages yet'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-950 h-full overflow-hidden">
          {/* Header */}
          <div className="h-14 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {activeChat.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">{activeChat.name}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Active now</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartVoiceCall}
                disabled={voiceCallState.isJoining || voiceCallState.isLeaving || callSession.open}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start voice call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={handleStartVideoCall}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                title="Start video call"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMessageSearch(v => !v)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                title="Search messages"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                title="More options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {(searchResults || messages)?.map((msg, idx) => {
              const isSelf = msg.senderEmail === user?.email;
              const key = msg.id || msg._id || `${msg.roomId || 'unknown'}-${idx}`;
              const hasFile = msg.fileId && msg.fileName;
              
              return (
                <div
                  key={key}
                  className={`flex mb-2 ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-md">
                    {hasFile ? (
                      <div className={`${isSelf ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        <FileAttachment
                          fileId={msg.fileId!}
                          fileName={msg.fileName!}
                          fileSize={msg.fileSize || 0}
                          fileType={msg.fileType || 'application/octet-stream'}
                          downloadUrl={`/chat/files/${msg.fileId}/download`}
                        />
                        <p className="text-xs opacity-75 px-1">{formatMessageTime(msg.sentAt)}</p>
                      </div>
                    ) : (
                      <div
                        className={`px-5 py-2 rounded-lg break-words ${
                          isSelf
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-75">{formatMessageTime(msg.sentAt)}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-900 border-t flex-shrink-0">
            <FileUploadButton 
              onFileUploaded={(fileData) => {
                // Send file as a message
                sendMessage(`📎 ${fileData.fileName}`, {
                  fileId: fileData.id,
                  fileName: fileData.fileName,
                  fileSize: fileData.fileSize,
                  fileType: fileData.fileType,
                });
              }}
              disabled={!activeChat}
            />
            <input
              value={messageInput}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              title="Send message"
            >
              <Send className="w-5 h-5 text-blue-600" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a conversation to start chatting.
        </div>
      )}

      {/* Voice Call Modal */}
      <VoiceCallModal
        isOpen={callSession.open}
        onClose={handleCloseVoiceCallModal}
        onMinimize={() => setCallSession(prev => ({ ...prev, minimized: true }))}
        onMaximize={() => setCallSession(prev => ({ ...prev, minimized: false }))}
        isMuted={callSession.muted}
        onToggleMute={handleToggleMuteVoiceCall}
        participantName={activeChat?.name || 'User'}
        minimized={callSession.minimized}
        onAccept={handleAcceptVoiceCall}
        onDecline={handleDeclineVoiceCall}
        onEnd={handleEndVoiceCall}
        isRinging={callSession.ringing}
        isCaller={user?.email === callSession.caller}
        callAccepted={callSession.accepted}
        callEnded={callSession.ended}
        callDuration={callSession.duration}
      />

      {/* Video Call Request Modal */}
      <VideoCallRequestModal
        isOpen={videoCallRequest.open && !videoCallRequest.isAccepted}
        callerName={videoCallRequest.isIncoming ? videoCallRequest.callerName : activeChat?.name || 'User'}
        callerEmail={videoCallRequest.caller || ''}
        callerAvatar={videoCallRequest.callerAvatar}
        isIncoming={videoCallRequest.isIncoming}
        isAccepted={videoCallRequest.isAccepted}
        isDeclined={videoCallRequest.isDeclined}
        onAccept={handleAcceptVideoCall}
        onDecline={handleDeclineVideoCall}
        onClose={handleCloseVideoCallRequest}
      />

      {/* ZegoCloud Video Call Modal */}
      {isInZegoCall && zegoRoomId && (
        <ZegoCloudVideoModal
          isOpen={isInZegoCall}
          roomId={zegoRoomId}
          participantName={activeChat?.name || 'Video Call'}
          onClose={() => {
            endZegoCall();
          }}
          onCallEnd={() => {
            endZegoCall();
          }}
          scenario="VideoConference"
          showScreenSharingButton={true}
          showTextChat={true}
          showUserList={true}
          maxUsers={10}
        />
      )}

      {/* Create Direct Chat Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateDialog(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Start New Chat</h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <InviteMembersDialog
              roomId="new-chat"
              currentParticipants={chats?.flatMap(c => c.memberEmails || []) || []}
              onInvite={handleInviteUser}
              onClose={() => setShowCreateDialog(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}