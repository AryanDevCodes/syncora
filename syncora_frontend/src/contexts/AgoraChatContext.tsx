import React, { createContext, useContext, useCallback, useState, useEffect, useRef } from 'react';
import { ablyChatService } from '@/services/ably/ablyChatService';
import { useAuth } from './AuthContext';

interface AgoraChatContextType {
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendTyping: (roomId: string, isTyping: boolean) => void;
  typingUsers: string[];
  messages: any[];
  fetchContacts: () => Promise<void>;
  subscribeToConversations: (roomIds: string[]) => void;
  markAsRead: (roomId: string) => void;
  markAllAsRead: (roomId: string) => void;
}

const AgoraChatContext = createContext<AgoraChatContextType | null>(null);

export const useAgoraChat = () => {
  const context = useContext(AgoraChatContext);
  if (!context) {
    throw new Error('useAgoraChat must be used within AgoraChatProvider');
  }
  return context;
};

export const AgoraChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [joinedRooms, setJoinedRooms] = useState<Set<string>>(new Set());
  
  const typingTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const messageIdSetRef = useRef<Set<string>>(new Set());

  // Initialize Ably service on mount
  useEffect(() => {
    const initializeAbly = async () => {
      try {
        await ablyChatService.initialize();
        setIsConnected(true);
        console.log('✅ Ably Chat Service connected');
      } catch (error) {
        console.error('Failed to initialize Ably:', error);
        setIsConnected(false);
      }
    };

    if (user) {
      initializeAbly();
    }

    return () => {
      ablyChatService.disconnect();
    };
  }, [user]);

  // Join a chat room with Ably channel
  const joinRoom = useCallback((roomId: string) => {
    const channelName = `chat-${roomId}`;
    
    setJoinedRooms(prev => {
      if (prev.has(roomId)) {
        console.log(`Already joined room: ${roomId}`);
        return prev;
      }
      
      try {
        ablyChatService.joinChannel(channelName);

        // Subscribe to messages
        const handleMessage = (message: any) => {
          console.log('📨 Ably message received in room', roomId, message);
          // Prevent duplicates
          if (messageIdSetRef.current.has(message.id)) {
            console.log('Duplicate Ably message prevented:', message.id);
            return;
          }
          messageIdSetRef.current.add(message.id);

          setMessages(prevMessages => {
            // Double-check for duplicates in state
            if (prevMessages.some(m => m.msgId === message.id)) {
              console.log('Duplicate in state prevented:', message.id);
              return prevMessages;
            }
            // Defensive timestamp handling: accept number or parseable string, else fallback to now
            const rawTs = message.timestamp ?? message.ts ?? message.time ?? message.sentAt;
            let tsNum: number;
            if (typeof rawTs === 'number' && !isNaN(rawTs)) {
              tsNum = rawTs;
            } else if (typeof rawTs === 'string') {
              const parsed = Date.parse(rawTs);
              tsNum = !isNaN(parsed) ? parsed : Date.now();
            } else {
              tsNum = Date.now();
            }

            const newMessage = {
              msgId: message.id,
              conversationId: roomId,
              content: message.content,
              from: message.senderEmail,
              timestamp: tsNum,
              status: message.status || 'sent'
            };
            console.log('Adding Ably message to state:', newMessage);
            return [...prevMessages, newMessage];
          });
        };

        ablyChatService.addMessageListener(channelName, handleMessage);

        // Subscribe to typing indicators
        const handleTyping = (indicator: any) => {
          if (indicator.isTyping) {
            setTypingUsers(prevTyping => {
              if (prevTyping.includes(indicator.userEmail)) return prevTyping;
              return [...prevTyping, indicator.userEmail];
            });

            // Clear existing timeout for this user
            if (typingTimeoutRef.current.has(indicator.userEmail)) {
              clearTimeout(typingTimeoutRef.current.get(indicator.userEmail)!);
            }

            // Set timeout to remove typing indicator
            const timeout = setTimeout(() => {
              setTypingUsers(prevTyping => prevTyping.filter(u => u !== indicator.userEmail));
              typingTimeoutRef.current.delete(indicator.userEmail);
            }, 3000);

            typingTimeoutRef.current.set(indicator.userEmail, timeout);
          } else {
            setTypingUsers(prevTyping => prevTyping.filter(u => u !== indicator.userEmail));
            if (typingTimeoutRef.current.has(indicator.userEmail)) {
              clearTimeout(typingTimeoutRef.current.get(indicator.userEmail)!);
              typingTimeoutRef.current.delete(indicator.userEmail);
            }
          }
        };

        ablyChatService.addTypingListener(channelName, handleTyping);

        console.log(`✅ Joined Ably room: ${roomId}`);
      } catch (error) {
        console.error(`Failed to join room ${roomId}:`, error);
        return prev; // Don't add to joined rooms if failed
      }
      
      return new Set([...prev, roomId]);
    });
  }, []);

  // Leave a chat room
  const leaveRoom = useCallback((roomId: string) => {
    const channelName = `chat-${roomId}`;

    try {
      ablyChatService.leaveChannel(channelName);
      setJoinedRooms(prev => {
        const updated = new Set(prev);
        updated.delete(roomId);
        return updated;
      });

      // Clear typing users for this room
      setTypingUsers([]);

      // Clear timeouts
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
      typingTimeoutRef.current.clear();

      console.log(`✅ Left room: ${roomId}`);
    } catch (error) {
      console.error(`Failed to leave room ${roomId}:`, error);
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    const channelName = `chat-${roomId}`;

    if (!user) return;

    try {
      ablyChatService.sendTypingIndicator(channelName, user.email, isTyping);
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback((roomId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.conversationId === roomId
        ? { ...msg, status: 'read' }
        : msg
    ));
  }, []);

  // Mark all messages as read
  const markAllAsRead = useCallback((roomId: string) => {
    setMessages(prev => prev.map(msg =>
      msg.conversationId === roomId
        ? { ...msg, status: 'read' }
        : msg
    ));
  }, []);

  // Subscribe to multiple conversations
  const subscribeToConversations = useCallback((roomIds: string[]) => {
    roomIds.forEach(roomId => {
      joinRoom(roomId);
    });
  }, [joinRoom]);

  // Fetch contacts (stub - implement as needed)
  const fetchContacts = useCallback(async () => {
    // This would call your contacts API
    try {
      // const contacts = await contactApi.getAllContacts();
      // Update state as needed
      console.log('Fetching contacts...');
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      joinedRooms.forEach(roomId => {
        leaveRoom(roomId);
      });
      typingTimeoutRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const value: AgoraChatContextType = {
    isConnected,
    joinRoom,
    leaveRoom,
    sendTyping,
    typingUsers,
    messages,
    fetchContacts,
    subscribeToConversations,
    markAsRead,
    markAllAsRead,
  };

  return (
    <AgoraChatContext.Provider value={value}>
      {children}
    </AgoraChatContext.Provider>
  );
};