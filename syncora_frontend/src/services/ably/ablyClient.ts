import * as Ably from 'ably';

class AblyClient {
  private client: Ably.Realtime | null = null;
  private channels: Map<string, Ably.RealtimeChannel> = new Map();

  async connect(): Promise<void> {
    try {
      const apiKey = import.meta.env.VITE_ABLY_API_KEY;
      if (!apiKey) {
        throw new Error('VITE_ABLY_API_KEY environment variable is not set');
      }

      this.client = new Ably.Realtime({
        key: apiKey,
        clientId: `syncora-client-${Date.now()}`,
        autoConnect: true,
      });

      return new Promise((resolve, reject) => {
        if (!this.client) return reject(new Error('Client not initialized'));

        this.client.connection.on('connected', () => {
          console.log('✅ Ably client connected successfully');
          resolve();
        });

        this.client.connection.on('failed', (stateChange) => {
          console.error('❌ Ably connection failed:', stateChange.reason);
          reject(new Error(`Connection failed: ${stateChange.reason}`));
        });

        this.client.connection.on('disconnected', () => {
          console.log('⚠️ Ably client disconnected');
        });
      });
    } catch (error) {
      console.error('❌ Failed to connect to Ably:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.close();
      this.client = null;
      this.channels.clear();
    }
  }

  getChannel(channelName: string): Ably.RealtimeChannel {
    if (!this.client) {
      throw new Error('Ably client not connected');
    }

    if (!this.channels.has(channelName)) {
      const channel = this.client.channels.get(channelName);
      this.channels.set(channelName, channel);
    }

    return this.channels.get(channelName)!;
  }

  isConnected(): boolean {
    return this.client?.connection.state === 'connected';
  }

  getConnectionState(): string {
    return this.client?.connection.state || 'disconnected';
  }
}

export const ablyClient = new AblyClient();