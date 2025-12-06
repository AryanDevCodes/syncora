import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useAgoraChat } from "@/contexts/AgoraChatContext";
import {
  getAllRooms,
  getMessages,
  sendMessage as apiSendMessage,
  createDirectChat as apiCreateDirectChat,
  createGroupChat as apiCreateGroupChat,
  markAsRead as apiMarkAsRead,
  ChatRoomDto,
  ChatMessageDto,
  MessageSendRequest
} from "@/api/chatApi";
import { getAllContacts, ContactDto } from "@/api/contactApi";

interface ChatContextType {
  chats: ChatRoomDto[];
  activeChat: ChatRoomDto | null;
  messages: ChatMessageDto[];
  setActiveChat: (chat: ChatRoomDto | null) => void;
  sendMessage: (content: string, fileMetadata?: { fileId: string; fileName: string; fileSize: number; fileType: string }) => Promise<void>;
  createDirectChat: (peerEmail: string) => Promise<void>;
  createGroupChat: (name: string, members: string[]) => Promise<void>;
  markAsRead: (roomId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, markAsRead: wsMarkAsRead, markAllAsRead, messages: agoraMessages, subscribeToConversations } = useAgoraChat();
  
  const [chats, setChats] = useState<ChatRoomDto[]>([]);
  const [activeChat, setActiveChatState] = useState<ChatRoomDto | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track message IDs to prevent duplicates from multiple sources (API, WebSocket, Ably)
  const [messageIdSet, setMessageIdSet] = useState<Set<string>>(new Set());

  // Load all chat rooms
  const refreshChats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching rooms and contacts...');
      
      // Fetch both existing chats and contacts in parallel
      const [rooms, contacts] = await Promise.all([
        getAllRooms().catch(err => {
          console.error('❌ Failed to fetch rooms:', err);
          return [];
        }),
        getAllContacts().catch(err => {
          console.error('❌ Failed to fetch contacts:', err);
          return [];
        })
      ]);
      
      console.log('📊 Loaded rooms:', rooms.length, 'contacts:', contacts.length);
      console.log('👥 Contacts:', contacts);
      
      // Create a map of email to room for quick lookup
      const emailToRoomMap = new Map<string, ChatRoomDto>();
      rooms.forEach(room => {
        if (!room.isGroup) {
          const otherEmail = room.memberEmails.find(email => email !== user.email);
          if (otherEmail) {
            emailToRoomMap.set(otherEmail, room);
          }
        }
      });
      
      // Create a set of contact emails for quick lookup
      const contactEmails = new Set(contacts.map(c => c.email));
      
      console.log('📧 Email to room map:', Array.from(emailToRoomMap.keys()));
      console.log('👤 Contact emails:', Array.from(contactEmails));
      
      // Process contacts: use existing room or create virtual chat
      const contactChats: ChatRoomDto[] = contacts.map(contact => {
        const existingRoom = emailToRoomMap.get(contact.email);
        
        if (existingRoom) {
          // Use existing room but update the name to show contact name
          console.log(`Contact ${contact.name} (${contact.email}): Using existing room ${existingRoom.id}`);
          return {
            ...existingRoom,
            name: contact.name // Override with contact name for better UX
          };
        } else {
          // Create virtual chat for contact without room
          console.log(`Contact ${contact.name} (${contact.email}): Creating virtual chat`);
          return {
            id: `contact-${contact.id}`,
            name: contact.name,
            isGroup: false,
            memberEmails: [user.email, contact.email],
            ownerEmail: user.email,
            createdAt: contact.createdAt,
            lastMessagePreview: 'Click to start chatting',
            lastMessageTime: undefined,
            unreadCount: 0,
            canRename: false,
            canDelete: false,
            visible: true
          };
        }
      });
      
      // Add direct chats that are NOT in contacts (chats with non-contacts)
      const nonContactChats = rooms.filter(room => {
        if (room.isGroup) return false; // We'll add groups separately
        const otherEmail = room.memberEmails.find(email => email !== user.email);
        const isContact = otherEmail && contactEmails.has(otherEmail);
        if (!isContact && otherEmail) {
          console.log(`Non-contact chat: ${room.name} (${otherEmail})`);
        }
        return !isContact;
      });
      
      console.log('✨ Contact-based chats:', contactChats.length);
      console.log('💬 Non-contact chats:', nonContactChats.length);
      
      // Add group chats
      const groupChats = rooms.filter(r => r.isGroup);
      console.log('👥 Group chats:', groupChats.length);
      
      // Combine: contacts + non-contact chats + groups
      const allChats = [...contactChats, ...nonContactChats, ...groupChats].sort((a, b) => {
        // Sort by last message time, with nulls at the end
        if (!a.lastMessageTime && !b.lastMessageTime) return 0;
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      
      console.log('📋 Total chats:', allChats.length, '= contacts:', contactChats.length, '+ non-contacts:', nonContactChats.length, '+ groups:', groupChats.length);
      
      setChats(allChats);

      try {
        // Only subscribe to real rooms (not virtual contact chats)
        const roomIds = rooms.map(r => r.id);
        console.log('ChatContext: subscribing to room IDs', roomIds);
        subscribeToConversations(roomIds);
      } catch (err) {
        console.warn('Failed to subscribe to room IDs', err);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [user, subscribeToConversations]);

  // Load messages for active chat
  const loadMessages = useCallback(async (roomId: string) => {
    try {
      setLoading(true);
      setError(null);
      const msgs = await getMessages(roomId);
      setMessages(msgs);
      
      // Initialize message ID set with loaded messages
      const newSet = new Set(msgs.map(m => m.id));
      setMessageIdSet(newSet);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent background refresh - doesn't trigger loading state or UI flicker
  const silentRefreshMessages = useCallback(async (roomId: string) => {
    try {
      const msgs = await getMessages(roomId);
      
      // Only update if there are new messages
      setMessages(prev => {
        // Check if we have new messages
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = msgs.filter(m => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          console.log('🔄 Silent refresh: Found', newMessages.length, 'new messages');
          // Update message ID set
          const newSet = new Set(msgs.map(m => m.id));
          setMessageIdSet(newSet);
          return msgs; // Use the full list from server
        }
        
        return prev; // No changes
      });
    } catch (err) {
      // Silently fail - don't update error state to avoid UI disruption
      console.error("Silent refresh failed:", err);
    }
  }, []);

  // Safe add message with deduplication
  const addMessageSafely = useCallback((msg: ChatMessageDto) => {
    setMessages(prev => {
      // Check if message already exists by ID
      if (prev.some(m => m.id === msg.id)) {
        console.log('Duplicate message prevented:', msg.id);
        return prev;
      }
      console.log('Adding new message:', msg.id, msg.content);
      return [...prev, msg];
    });
    
    // Update message ID set
    setMessageIdSet(prevSet => {
      if (prevSet.has(msg.id)) return prevSet;
      return new Set([...prevSet, msg.id]);
    });
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, fileMetadata?: { fileId: string; fileName: string; fileSize: number; fileType: string }) => {
    if (!activeChat || !user) return;

    try {
      const messageRequest: MessageSendRequest = {
        content,
        type: fileMetadata ? "FILE" : "TEXT",
        ...(fileMetadata && {
          fileId: fileMetadata.fileId,
          fileName: fileMetadata.fileName,
          fileSize: fileMetadata.fileSize,
          fileType: fileMetadata.fileType
        })
      };

      const sentMessage = await apiSendMessage(activeChat.id, messageRequest);

      // Add the message to local state with deduplication
      addMessageSafely(sentMessage);
      console.log('ChatContext: sent message via API', { roomId: activeChat.id, sentMessage });

      // Update the chat's last message
      setChats(prev => prev.map(chat =>
        chat.id === activeChat.id
          ? { 
              ...chat, 
              lastMessagePreview: sentMessage.content, 
              lastMessageTime: sentMessage.sentAt,
              unreadCount: 0 // Mark as read for own message
            }
          : chat
      ));
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
      throw err;
    }
  }, [activeChat, user, addMessageSafely]);

  // Create direct chat
  const createDirectChat = useCallback(async (peerEmail: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newChat = await apiCreateDirectChat(peerEmail);
      setChats(prev => {
        // Prevent duplicate if chat already exists
        if (prev.some(c => c.id === newChat.id)) return prev;
        return [...prev, newChat];
      });
      setActiveChatState(newChat);
    } catch (err) {
      console.error("Failed to create direct chat:", err);
      setError("Failed to create direct chat");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create group chat
  const createGroupChat = useCallback(async (name: string, members: string[]) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const newChat = await apiCreateGroupChat(name, members);
      setChats(prev => {
        if (prev.some(c => c.id === newChat.id)) return prev;
        return [...prev, newChat];
      });
      setActiveChatState(newChat);
    } catch (err) {
      console.error("Failed to create group chat:", err);
      setError("Failed to create group chat");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark messages as read
  const markAsRead = useCallback(async (roomId: string) => {
    try {
      await apiMarkAsRead(roomId);
      markAllAsRead(roomId);

      setMessages(prev => prev.map(msg => ({ 
        ...msg, 
        read: true, 
        readAt: new Date().toISOString() 
      })));
      
      setChats(prev => prev.map(chat =>
        chat.id === roomId ? { ...chat, unreadCount: 0 } : chat
      ));
    } catch (err) {
      console.error("Failed to mark as read:", err);
      setError("Failed to mark messages as read");
    }
  }, [markAllAsRead]);



  const handleStatusUpdate = useCallback((statusEvent: any) => {
    if (activeChat && statusEvent.roomId === activeChat.id) {
      if (statusEvent.type === 'MESSAGE_DELIVERED' || statusEvent.type === 'MESSAGE_READ') {
        setMessages(prev => prev.map(msg =>
          msg.id === statusEvent.messageId
            ? {
                ...msg,
                delivered: statusEvent.type === 'MESSAGE_DELIVERED' || msg.delivered,
                read: statusEvent.type === 'MESSAGE_READ' || msg.read,
                readAt: statusEvent.type === 'MESSAGE_READ' ? new Date().toISOString() : msg.readAt
              }
            : msg
        ));
      } else if (statusEvent.type === 'ALL_READ') {
        setMessages(prev => prev.map(msg => ({ 
          ...msg, 
          read: true,
          readAt: new Date().toISOString()
        })));
        setChats(prev => prev.map(chat =>
          chat.id === statusEvent.roomId ? { ...chat, unreadCount: 0 } : chat
        ));
      }
    }
  }, [activeChat]);

  // Handle active chat change
  const handleSetActiveChat = useCallback(async (chat: ChatRoomDto | null) => {
    // Leave previous room
    if (activeChat) {
      leaveRoom(activeChat.id);
    }

    // If this is a virtual contact chat, create a real room first
    if (chat && chat.id.startsWith('contact-')) {
      console.log('🆕 Creating real chat room for virtual contact:', chat.name);
      const contactEmail = chat.memberEmails.find(email => email !== user?.email);
      if (contactEmail) {
        try {
          const realChat = await apiCreateDirectChat(contactEmail);
          console.log('✅ Real chat created:', realChat.id);
          
          // Replace virtual chat with real chat in the list
          setChats(prev => prev.map(c => 
            c.id === chat.id ? realChat : c
          ));
          
          // Use the real chat
          chat = realChat;
        } catch (err) {
          console.error('Failed to create chat room:', err);
          setError('Failed to create chat room');
          return;
        }
      }
    }

    setActiveChatState(chat);
    setError(null);
    setMessageIdSet(new Set());

    if (chat) {
      joinRoom(chat.id);
      loadMessages(chat.id);

      // Mark as read when opening chat
      if (chat.unreadCount > 0) {
        markAsRead(chat.id);
      }
    } else {
      setMessages([]);
    }
  }, [activeChat, joinRoom, leaveRoom, loadMessages, markAsRead, user]);

  // Auto-refresh messages for active chat every 0.5 seconds
  useEffect(() => {
    if (!activeChat) return;

    console.log('🔄 Starting silent auto-refresh for chat:', activeChat.id);
    
    const intervalId = setInterval(() => {
      // Use silent refresh instead of loadMessages to avoid UI flicker
      silentRefreshMessages(activeChat.id);
    }, 500); // 0.5 seconds

    return () => {
      console.log('🛑 Stopping auto-refresh for chat:', activeChat.id);
      clearInterval(intervalId);
    };
  }, [activeChat, silentRefreshMessages]);

  // Load chats on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshChats();
    } else {
      setChats([]);
      setActiveChatState(null);
      setMessages([]);
      setMessageIdSet(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Sync Ably messages to ChatContext when received
  useEffect(() => {
    if (!activeChat) return;

    console.log('🔄 Checking Ably messages. Total:', agoraMessages.length, 'Active chat:', activeChat.id);
    
    // Map Ably messages to ChatMessageDto format and add to state
    const abilyMessagesForRoom = agoraMessages.filter(m => m.conversationId === activeChat.id);
    
    console.log('📨 Ably messages for this room:', abilyMessagesForRoom.length);
    
    abilyMessagesForRoom.forEach(rawMsg => {
      console.log('📨 Processing Ably message for active room (raw):', rawMsg);

      // Normalize various possible shapes from Ably / backend
      const id = rawMsg.msgId || rawMsg.id || rawMsg.messageId || rawMsg.msg_id || `ably-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const conversationId = rawMsg.conversationId || rawMsg.roomId || rawMsg.channel || rawMsg.channelId || activeChat.id;
      const from = rawMsg.from || rawMsg.senderEmail || rawMsg.sender || rawMsg.clientId || 'unknown';
      const content = rawMsg.content || rawMsg.message || rawMsg.body || (typeof rawMsg.data === 'string' ? rawMsg.data : rawMsg.data?.content) || '';

      // Robust timestamp parsing: prefer numeric epoch, then parseable date string, else now
      let timestampNum: number | null = null;
      const rawTs = rawMsg.timestamp ?? rawMsg.ts ?? rawMsg.time ?? rawMsg.sentAt ?? rawMsg.createdAt;
      if (typeof rawTs === 'number' && !isNaN(rawTs)) {
        timestampNum = rawTs;
      } else if (typeof rawTs === 'string') {
        const parsed = Date.parse(rawTs);
        if (!isNaN(parsed)) timestampNum = parsed;
      }
      if (timestampNum === null) timestampNum = Date.now();

      const sentAt = new Date(timestampNum).toISOString();
      const deliveredAt = new Date(timestampNum).toISOString();

      // Deduplicate and safely add to messages state
      setMessageIdSet(prev => {
        if (prev.has(id)) {
          console.log('Message already exists in state (id):', id);
          return prev;
        }

        const chatMsg: ChatMessageDto = {
          id,
          roomId: conversationId,
          senderEmail: from,
          content,
          type: 'TEXT',
          sentAt,
          delivered: true,
          deliveredAt,
          read: false,
          readAt: null,
          attachmentUrl: null,
        };

        console.log('✅ Adding normalized Ably message to ChatContext state:', chatMsg);

        setMessages(prevMsgs => {
          if (prevMsgs.some(m => m.id === chatMsg.id)) {
            console.log('⚠️ Message already in messages array, skipping (post-check)', chatMsg.id);
            return prevMsgs;
          }
          const updated = [...prevMsgs, chatMsg].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          console.log('✅ Messages updated. Total count:', updated.length);
          return updated;
        });

        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    });
  }, [agoraMessages, activeChat]);

  // NOTE: We now use BOTH WebSocket/STOMP AND Ably for real-time messages
  // Backend publishes to both WebSocket /topic/room/{roomId} AND Ably channel chat-{roomId}
  // This provides redundancy and leverages Ably's token-based authentication

  const value: ChatContextType = {
    chats,
    activeChat,
    messages,
    setActiveChat: handleSetActiveChat,
    sendMessage,
    createDirectChat,
    createGroupChat,
    markAsRead,
    refreshChats,
    loading,
    error,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};