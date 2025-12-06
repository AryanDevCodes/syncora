import { ablyClientInstance, getAblyClient } from './ablyClient';
import * as Ably from 'ably';

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
}

class AblyChatService {
  private channels: Map<string, Ably.RealtimeChannel> = new Map();
  private messageListeners: Map<string, ((message: ChatMessage) => void)[]> = new Map();
  private typingListeners: Map<string, ((indicator: TypingIndicator) => void)[]> = new Map();
  private presenceListeners: Map<string, ((members: any[]) => void)[]> = new Map();
  private voiceCallListeners: Map<string, ((data: any) => void)[]> = new Map();
  private videoCallListeners: Map<string, ((data: any) => void)[]> = new Map();

  async initialize(): Promise<void> {
    try {
      await ablyClientInstance.connect();
      console.log('✅ Ably Chat Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Ably Chat Service:', error);
      throw error;
    }
  }

  disconnect(): void {
    // Leave all channels
    this.channels.forEach((channel, channelName) => {
      this.leaveChannel(channelName);
    });
    this.channels.clear();
    this.messageListeners.clear();
    this.typingListeners.clear();
    this.presenceListeners.clear();

    ablyClientInstance.disconnect();
  }

  // Channel management
  async joinChannel(channelName: string): Promise<void> {
    try {
      const client = getAblyClient();
      if (!client) {
        throw new Error('Ably client not connected');
      }

      const channel = client.channels.get(channelName);
      await channel.attach();

      // Set up message listener
      channel.subscribe('message', (message) => {
        this.handleIncomingMessage(channelName, message);
      });

      // Set up typing indicator listener
      channel.subscribe('typing', (message) => {
        this.handleTypingIndicator(channelName, message);
      });

      this.channels.set(channelName, channel);
      console.log(`✅ Joined Ably channel: ${channelName}`);

    } catch (error) {
      console.error(`❌ Failed to join channel ${channelName}:`, error);
      throw error;
    }
  }

  async leaveChannel(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      try {
        await channel.detach();
        this.channels.delete(channelName);
        console.log(`✅ Left Ably channel: ${channelName}`);
      } catch (error) {
        console.error(`❌ Failed to leave channel ${channelName}:`, error);
      }
    }
  }

  // Message handling
  async sendMessage(channelName: string, messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not joined`);
    }

    const message: ChatMessage = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'sent'
    };

    try {
      await channel.publish('message', message);
      console.log(`📤 Message sent to ${channelName}:`, message);
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  private handleIncomingMessage(channelName: string, message: Ably.Message) {
    console.log('📨 Raw Ably message received:', channelName, message);
    
    // Parse message data - backend sends JSON string
    let chatMessage: ChatMessage;
    try {
      // If data is a string, parse it as JSON
      if (typeof message.data === 'string') {
        chatMessage = JSON.parse(message.data);
      } else {
        chatMessage = message.data as ChatMessage;
      }
      
      console.log('📨 Parsed chat message:', chatMessage);
    } catch (error) {
      console.error('❌ Failed to parse Ably message:', error, message.data);
      return;
    }
    
    const listeners = this.messageListeners.get(channelName) || [];

    listeners.forEach(listener => {
      try {
        listener(chatMessage);
      } catch (error) {
        console.error('Error in message listener:', error);
      }
    });
  }

  // Typing indicators
  async sendTypingIndicator(channelName: string, userEmail: string, isTyping: boolean): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not joined`);
    }

    const indicator: TypingIndicator = {
      userId: userEmail, // Using email as userId for simplicity
      userEmail,
      isTyping
    };

    try {
      await channel.publish('typing', indicator);
    } catch (error) {
      console.error('❌ Failed to send typing indicator:', error);
    }
  }

  private handleTypingIndicator(channelName: string, message: Ably.Message) {
    const indicator = message.data as TypingIndicator;
    const listeners = this.typingListeners.get(channelName) || [];

    listeners.forEach(listener => {
      try {
        listener(indicator);
      } catch (error) {
        console.error('Error in typing listener:', error);
      }
    });
  }

  // Event listeners
  addMessageListener(channelName: string, listener: (message: ChatMessage) => void): void {
    if (!this.messageListeners.has(channelName)) {
      this.messageListeners.set(channelName, []);
    }
    this.messageListeners.get(channelName)!.push(listener);
  }

  removeMessageListener(channelName: string, listener: (message: ChatMessage) => void): void {
    const listeners = this.messageListeners.get(channelName) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  addTypingListener(channelName: string, listener: (indicator: TypingIndicator) => void): void {
    if (!this.typingListeners.has(channelName)) {
      this.typingListeners.set(channelName, []);
    }
    this.typingListeners.get(channelName)!.push(listener);
  }

  removeTypingListener(channelName: string, listener: (indicator: TypingIndicator) => void): void {
    const listeners = this.typingListeners.get(channelName) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  // Presence management
  async enterPresence(channelName: string, userData: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not joined`);
    }

    try {
      await channel.presence.enter(userData);
      console.log(`✅ Entered presence on ${channelName}`);
    } catch (error) {
      console.error('❌ Failed to enter presence:', error);
      throw error;
    }
  }

  async leavePresence(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      return;
    }

    try {
      await channel.presence.leave();
      console.log(`✅ Left presence on ${channelName}`);
    } catch (error) {
      console.error('❌ Failed to leave presence:', error);
    }
  }

  addPresenceListener(channelName: string, listener: (members: any[]) => void): void {
    if (!this.presenceListeners.has(channelName)) {
      this.presenceListeners.set(channelName, []);
    }
    this.presenceListeners.get(channelName)!.push(listener);

    // Subscribe to presence events
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.presence.subscribe((presenceMessage) => {
        this.handlePresenceUpdate(channelName);
      });
    }
  }

  private async handlePresenceUpdate(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    try {
      const presenceMembers = await channel.presence.get();
      const listeners = this.presenceListeners.get(channelName) || [];

      listeners.forEach(listener => {
        try {
          listener(presenceMembers);
        } catch (error) {
          console.error('Error in presence listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to get presence members:', error);
    }
  }

  // Voice call management
  addVoiceCallListener(channelName: string, listener: (data: any) => void): void {
    if (!this.voiceCallListeners.has(channelName)) {
      this.voiceCallListeners.set(channelName, []);
    }
    this.voiceCallListeners.get(channelName)!.push(listener);

    // Subscribe to voice-call events on the channel
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribe('voice-call', (message) => {
        const listeners = this.voiceCallListeners.get(channelName) || [];
        listeners.forEach(l => {
          try {
            l(message.data);
          } catch (error) {
            console.error('Error in voice call listener:', error);
          }
        });
      });
    }
  }

  async sendVoiceCallSignal(channelName: string, data: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not joined`);
    }

    try {
      await channel.publish('voice-call', data);
      console.log(`📞 Voice call signal sent to ${channelName}:`, data);
    } catch (error) {
      console.error('❌ Failed to send voice call signal:', error);
      throw error;
    }
  }

  // Video call management
  addVideoCallListener(channelName: string, listener: (data: any) => void): void {
    if (!this.videoCallListeners.has(channelName)) {
      this.videoCallListeners.set(channelName, []);
    }
    this.videoCallListeners.get(channelName)!.push(listener);

    // Subscribe to video-call-request events on the channel
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribe('video-call-request', (message) => {
        const listeners = this.videoCallListeners.get(channelName) || [];
        listeners.forEach(l => {
          try {
            l(message.data);
          } catch (error) {
            console.error('Error in video call listener:', error);
          }
        });
      });
    }
  }

  async sendVideoCallSignal(channelName: string, data: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not joined`);
    }

    try {
      await channel.publish('video-call-request', data);
      console.log(`🎥 Video call signal sent to ${channelName}:`, data);
    } catch (error) {
      console.error('❌ Failed to send video call signal:', error);
      throw error;
    }
  }

  getChannel(channelName: string): Ably.RealtimeChannel {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel ${channelName} not found. Make sure to join the channel first.`);
    }
    return channel;
  }

  // Utility methods
  isConnected(): boolean {
    return ablyClientInstance.isClientConnected();
  }

  getJoinedChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

export const ablyChatService = new AblyChatService();
