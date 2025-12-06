import * as Ably from 'ably';
// Use the browser fetch API for Ably auth token requests so we avoid triggering
// the global axios interceptor (which may perform an app-wide logout on 401).
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderEmail: string;
  timestamp: number;
  type: 'text' | 'image' | 'file';
  status?: 'sent' | 'delivered' | 'read';
}

export interface TypingIndicator {
  userId: string;
  userEmail: string;
  isTyping: boolean;
  timestamp: number;
}

export interface PresenceData {
  userId: string;
  userEmail: string;
  name: string;
  online: boolean;
}

class AblyChatService {
  private client: Ably.Realtime | null = null;
  private channels: Map<string, Ably.RealtimeChannel> = new Map();
  private messageListeners: Map<string, (message: ChatMessage) => void> = new Map();
  private typingListeners: Map<string, (indicator: TypingIndicator) => void> = new Map();
  private presenceListeners: Map<string, (members: PresenceData[]) => void> = new Map();

  async initialize(): Promise<void> {
    try {
      this.client = new Ably.Realtime({
        authCallback: async (tokenParams, callback) => {
          try {
            console.log('🔐 Ably authCallback: Fetching token');

            // Check if token is expired and refresh if needed
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
              try {
                const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
                const currentTime = Date.now() / 1000;
                if (tokenPayload.exp < currentTime) {
                  console.log('🔄 JWT token expired, attempting refresh...');
                  // The axios interceptor will handle token refresh automatically
                }
              } catch (error) {
                console.warn('⚠️ Failed to check token expiration:', error);
              }
            }

            // Fetch token from backend using fetch to avoid the axios interceptor.
            // Include current access token if present so backend can validate it.
            // Reuse `accessToken` declared earlier in this scope.
            const headers: Record<string, string> = {
              'Accept': 'application/json',
            };
            if (accessToken) {
              headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const res = await fetch(`${API_BASE}/auth/ably-token`, {
              method: 'GET',
              headers,
              credentials: 'same-origin',
            });

            let data: any;
            try {
              data = await res.json();
            } catch (err) {
              throw new Error('Invalid JSON response from /auth/ably-token');
            }

            console.log('🔐 Ably token response:', res.status, data);

            if (!res.ok || !data?.success) {
              throw new Error(data?.message || `Failed to get Ably token (status ${res.status})`);
            }

            // Return the token string directly
            console.log('✅ Ably token obtained successfully');
            callback(null, data.data.token);
          } catch (error: any) {
            console.error('❌ Failed to fetch Ably token:', error);
            const ablyError: Ably.ErrorInfo = {
              code: 500,
              message: error.response?.data?.message || error.message || 'Failed to fetch Ably token',
              statusCode: error.response?.status || 500,
              name: 'AuthError'
            };
            callback(ablyError, null);
          }
        },
        autoConnect: true,
      });

      await new Promise((resolve, reject) => {
        if (!this.client) return reject(new Error('Client not initialized'));

        this.client.connection.on('connected', () => {
          console.log('✅ Connected to Ably');
          resolve(void 0);
        });

        this.client.connection.on('failed', (stateChange) => {
          console.error('❌ Ably connection failed:', stateChange.reason);
          reject(new Error(`Connection failed: ${stateChange.reason}`));
        });

        this.client.connection.on('disconnected', () => {
          console.log('⚠️ Disconnected from Ably');
        });
      });

    } catch (error) {
      console.error('❌ Failed to initialize Ably Chat Service:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.client?.connection.state === 'connected';
  }

  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.channels.clear();
      this.messageListeners.clear();
      this.typingListeners.clear();
      this.presenceListeners.clear();
    }
  }

  getChannel(channelId: string): Ably.RealtimeChannel {
    if (!this.client) {
      throw new Error('Ably client not initialized');
    }

    if (!this.channels.has(channelId)) {
      const channel = this.client.channels.get(channelId);
      this.channels.set(channelId, channel);
    }

    return this.channels.get(channelId)!;
  }

  async joinChannel(channelId: string): Promise<void> {
    try {
      const channel = this.getChannel(channelId);
      await channel.attach();
      console.log(`✅ Joined channel: ${channelId}`);
    } catch (error) {
      console.error(`❌ Failed to join channel ${channelId}:`, error);
      throw error;
    }
  }

  async leaveChannel(channelId: string): Promise<void> {
    try {
      const channel = this.channels.get(channelId);
      if (channel) {
        // Trace who requested the leave for debugging unexpected detaches
        console.log(`⏏️ leaveChannel requested for: ${channelId}`);
        console.trace();

        await channel.detach();
        this.channels.delete(channelId);
        this.messageListeners.delete(channelId);
        this.typingListeners.delete(channelId);
        this.presenceListeners.delete(channelId);
        console.log(`✅ Left channel: ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to leave channel ${channelId}:`, error);
      throw error;
    }
  }

  async sendMessage(channelId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    try {
      const channel = this.getChannel(channelId);
      const messageData: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      await channel.publish('message', messageData);
      console.log(`✅ Message sent to ${channelId}`);
    } catch (error) {
      console.error(`❌ Failed to send message to ${channelId}:`, error);
      throw error;
    }
  }

  addMessageListener(channelId: string, callback: (message: ChatMessage) => void): void {
    const channel = this.getChannel(channelId);

    const listener = (message: Ably.Message) => {
      if (message.name === 'message') {
        const chatMessage = message.data as ChatMessage;
        callback(chatMessage);
      }
    };

    channel.subscribe('message', listener);
    this.messageListeners.set(channelId, callback);
  }

  removeMessageListener(channelId: string, callback: (message: ChatMessage) => void): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unsubscribe('message');
      this.messageListeners.delete(channelId);
    }
  }

  sendTypingIndicator(channelId: string, userEmail: string, isTyping: boolean): void {
    try {
      const channel = this.getChannel(channelId);
      const indicator: TypingIndicator = {
        userId: userEmail,
        userEmail,
        isTyping,
        timestamp: Date.now(),
      };

      channel.publish('typing', indicator);
    } catch (error) {
      console.error(`❌ Failed to send typing indicator to ${channelId}:`, error);
    }
  }

  addTypingListener(channelId: string, callback: (indicator: TypingIndicator) => void): void {
    const channel = this.getChannel(channelId);

    const listener = (message: Ably.Message) => {
      if (message.name === 'typing') {
        const indicator = message.data as TypingIndicator;
        callback(indicator);
      }
    };

    channel.subscribe('typing', listener);
    this.typingListeners.set(channelId, callback);
  }

  removeTypingListener(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.unsubscribe('typing');
      this.typingListeners.delete(channelId);
    }
  }

  async enterPresence(channelId: string, userData: Omit<PresenceData, 'online'>): Promise<void> {
    try {
      const channel = this.getChannel(channelId);
      const presenceData: PresenceData = {
        ...userData,
        online: true,
      };

      await channel.presence.enter(presenceData);
      console.log(`✅ Entered presence in ${channelId}`);
    } catch (error) {
      console.error(`❌ Failed to enter presence in ${channelId}:`, error);
      throw error;
    }
  }

  async leavePresence(channelId: string): Promise<void> {
    try {
      const channel = this.channels.get(channelId);
      if (channel) {
        await channel.presence.leave();
        console.log(`✅ Left presence in ${channelId}`);
      }
    } catch (error) {
      console.error(`❌ Failed to leave presence in ${channelId}:`, error);
      throw error;
    }
  }

  addPresenceListener(channelId: string, callback: (members: PresenceData[]) => void): void {
    const channel = this.getChannel(channelId);

    const listener = async () => {
      try {
        const presenceMembers = await channel.presence.get();
        const members: PresenceData[] = presenceMembers.map(member => member.data as PresenceData);
        callback(members);
      } catch (error) {
        console.error(`❌ Failed to get presence for ${channelId}:`, error);
      }
    };

    channel.presence.subscribe(['enter', 'leave', 'update'], listener);
    this.presenceListeners.set(channelId, callback);

    // Get initial presence
    listener();
  }

  removePresenceListener(channelId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.presence.unsubscribe();
      this.presenceListeners.delete(channelId);
    }
  }

  async getPresenceMembers(channelId: string): Promise<PresenceData[]> {
    try {
      const channel = this.channels.get(channelId);
      if (!channel) {
        return [];
      }

      const presenceMembers = await channel.presence.get();
      return presenceMembers.map(member => member.data as PresenceData);
    } catch (error) {
      console.error(`❌ Failed to get presence members for ${channelId}:`, error);
      return [];
    }
  }

  // Voice Call Signaling
  sendVoiceCallSignal(channelId: string, payload: { caller: string; channelName: string; }) {
    try {
      const channel = this.getChannel(channelId);
      channel.publish('voice-call', payload);
      console.log(`✅ Voice call signal sent to ${channelId}`);
    } catch (error) {
      console.error(`❌ Failed to send voice call signal to ${channelId}:`, error);
    }
  }

  addVoiceCallListener(channelId: string, callback: (payload: { caller: string; channelName: string; }) => void) {
    const channel = this.getChannel(channelId);
    const listener = (message: Ably.Message) => {
      if (message.name === 'voice-call') {
        callback(message.data as { caller: string; channelName: string; });
      }
    };
    channel.subscribe('voice-call', listener);
  }

  // Video Call Signaling
  sendVideoCallSignal(channelId: string, payload: { caller: string; roomId: string; callerName: string; callerAvatar: string; }) {
    try {
      const channel = this.getChannel(channelId);
      channel.publish('video-call-request', payload);
      console.log(`✅ Video call signal sent to ${channelId}`, payload);
    } catch (error) {
      console.error(`❌ Failed to send video call signal to ${channelId}:`, error);
    }
  }

  addVideoCallListener(channelId: string, callback: (payload: { caller: string; roomId: string; callerName: string; callerAvatar: string; }) => void) {
    const channel = this.getChannel(channelId);
    const listener = (message: Ably.Message) => {
      if (message.name === 'video-call-request') {
        callback(message.data as { caller: string; roomId: string; callerName: string; callerAvatar: string; });
      }
    };
    channel.subscribe('video-call-request', listener);
  }
}

export const ablyChatService = new AblyChatService();