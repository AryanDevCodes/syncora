import * as Ably from 'ably';

let globalAblyClient: Ably.Realtime | null = null;

export class AblyClient {
  private client: Ably.Realtime | null = null;
  private isConnected = false;

  constructor() {
    console.log('AblyClient - initializing');
  }

  async connect(apiKey?: string): Promise<void> {
    try {
      const key = apiKey || import.meta.env.VITE_ABLY_API_KEY;

      if (!key) {
        throw new Error('Ably API key not found. Please set VITE_ABLY_API_KEY environment variable.');
      }

      this.client = new Ably.Realtime({
        key,
        clientId: `syncora-user-${Date.now()}`, 
        autoConnect: false, 
      });

      // Set up connection state listeners
      this.client.connection.on('connected', () => {
        console.log('✅ Connected to Ably');
        this.isConnected = true;
      });

      this.client.connection.on('failed', (stateChange) => {
        console.error('❌ Ably connection failed:', stateChange.reason);
        this.isConnected = false;
      });

      this.client.connection.on('disconnected', () => {
        console.log('🔌 Disconnected from Ably');
        this.isConnected = false;
      });

      // Connect to Ably
      await this.client.connection.connect();
      globalAblyClient = this.client;

    } catch (error) {
      console.error('Failed to initialize Ably client:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.connection.close();
      this.client = null;
      globalAblyClient = null;
      this.isConnected = false;
    }
  }

  getClient(): Ably.Realtime | null {
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected && this.client?.connection.state === 'connected';
  }

  // Get or create a channel
  getChannel(channelName: string): Ably.RealtimeChannel {
    if (!this.client) {
      throw new Error('Ably client not connected');
    }
    return this.client.channels.get(channelName);
  }
}

export const ablyClientInstance = new AblyClient();

// Export the global client instance
export const getAblyClient = (): Ably.Realtime | null => globalAblyClient;
