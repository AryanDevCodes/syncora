import axios from 'axios';

interface WhiteboardRoom {
  uuid: string;
  name: string;
  teamUUID: string;
  isRecord: boolean;
  limit: number;
  createdAt: string;
  updatedAt: string;
}

interface WhiteboardToken {
  token: string;
  lifespan: number;
  role: 'admin' | 'writer' | 'reader';
}

interface WhiteboardConfig {
  appIdentifier: string;
  sdkToken: string;
  region: 'us-sv' | 'sg' | 'in-mum' | 'eu' | 'cn-hz';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

interface DrawingEvent {
  type: 'pencil' | 'rectangle' | 'circle' | 'text' | 'eraser';
  payload: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    strokeWidth: number;
    text?: string;
    timestamp: number;
  };
  userId: string;
  roomId: string;
}

interface UserCursor {
  userId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

class WhiteboardAPI {
  private static instance: WhiteboardAPI;
  private baseURL: string;
  private config: WhiteboardConfig | null = null;
  private whiteSDK: any = null;
  private room: any = null;
  private isInitialized = false;

  private constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  }

  public static getInstance(): WhiteboardAPI {
    if (!WhiteboardAPI.instance) {
      WhiteboardAPI.instance = new WhiteboardAPI();
    }
    return WhiteboardAPI.instance;
  }

  /**
   * Initialize the Agora Interactive Whiteboard SDK
   */
  async initialize(config: WhiteboardConfig): Promise<void> {
    try {
      this.config = config;
      
      // Dynamic import of Agora Whiteboard SDK`
      const { WhiteWebSdk } = await import('white-web-sdk');
      
      this.whiteSDK = new WhiteWebSdk({
        appIdentifier: config.appIdentifier,
        region: config.region,
        // logLevel: config.logLevel || 'warn', // Removed because not supported by WhiteWebSdkConfiguration
        // Additional SDK configurations
        fonts: {
          'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
        }
      });

      this.isInitialized = true;
      console.log('Agora Whiteboard SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Agora Whiteboard SDK:', error);
      throw new Error('Whiteboard initialization failed');
    }
  }

  /**
   * Create a new whiteboard room
   */
  async createRoom(name: string, limit: number = 10): Promise<WhiteboardRoom> {
    try {
      const response = await axios.post(`${this.baseURL}/whiteboard/rooms`, {
        name,
        limit,
        isRecord: true
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to create whiteboard room:', error);
      throw new Error('Room creation failed');
    }
  }

  /**
   * Join a whiteboard room
   */
  async joinRoom(roomUuid: string, userId: string, userName: string): Promise<any> {
    if (!this.isInitialized || !this.whiteSDK) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }

    try {
      // Get room token from backend
      const tokenResponse = await axios.get(`${this.baseURL}/whiteboard/rooms/${roomUuid}/token`, {
        params: { userId, role: 'writer' },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const { token } = tokenResponse.data;

      // Join the room using Agora SDK
      this.room = await this.whiteSDK.joinRoom({
        uuid: roomUuid,
        roomToken: token,
        userPayload: {
          userId,
          userName,
          avatar: localStorage.getItem('userAvatar') || '',
          joinTime: Date.now()
        },
        // Enable real-time collaboration
        isWritable: true,
        disableDeviceInputs: false,
        disableCameraTransform: false
      });

      // Set up event listeners
      this.setupRoomEventListeners();

      console.log('Successfully joined whiteboard room:', roomUuid);
      return this.room;
    } catch (error) {
      console.error('Failed to join whiteboard room:', error);
      throw new Error('Room join failed');
    }
  }

  /**
   * Set up room event listeners for real-time collaboration
   */
  private setupRoomEventListeners(): void {
    if (!this.room) return;

    // Listen for room state changes
    this.room.addMagixEventListener('roomStateChanged', (event: any) => {
      console.log('Room state changed:', event);
    });

    // Listen for user cursor movements
    this.room.addMagixEventListener('cursor', (event: any) => {
      this.handleCursorUpdate(event);
    });

    // Listen for drawing events
    this.room.addMagixEventListener('drawing', (event: any) => {
      this.handleDrawingEvent(event);
    });

    // Listen for user join/leave events
    this.room.addMagixEventListener('userJoined', (event: any) => {
      console.log('User joined:', event);
    });

    this.room.addMagixEventListener('userLeft', (event: any) => {
      console.log('User left:', event);
    });

    // Listen for phase changes (connecting, connected, disconnected)
    this.room.callbacks.on('onPhaseChanged', (phase: any) => {
      console.log('Room phase changed:', phase);
    });

    // Listen for errors
    this.room.callbacks.on('onKickedWithReason', (reason: string) => {
      console.error('Kicked from room:', reason);
    });
  }

  /**
   * Handle cursor update events
   */
  private handleCursorUpdate(event: any): void {
    // Emit cursor position to other collaborative features
    const cursor: UserCursor = {
      userId: event.userId,
      x: event.x,
      y: event.y,
      color: event.color || '#000000',
      name: event.userName || 'Anonymous'
    };

    // Dispatch custom event for UI components to listen
    window.dispatchEvent(new CustomEvent('whiteboard:cursorUpdate', { detail: cursor }));
  }

  /**
   * Handle drawing events
   */
  private handleDrawingEvent(event: DrawingEvent): void {
    // Process drawing events for real-time collaboration
    window.dispatchEvent(new CustomEvent('whiteboard:drawingEvent', { detail: event }));
  }

  /**
   * Send cursor position to other users
   */
  async sendCursorPosition(x: number, y: number): Promise<void> {
    if (!this.room) return;

    try {
      await this.room.dispatchMagixEvent('cursor', {
        x,
        y,
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to send cursor position:', error);
    }
  }

  /**
   * Send drawing event to other users
   */
  async sendDrawingEvent(event: Omit<DrawingEvent, 'userId' | 'roomId'>): Promise<void> {
    if (!this.room) return;

    try {
      await this.room.dispatchMagixEvent('drawing', {
        ...event,
        userId: localStorage.getItem('userId'),
        roomId: this.room.uuid
      });
    } catch (error) {
      console.warn('Failed to send drawing event:', error);
    }
  }

  /**
   * Upload and convert file to whiteboard
   */
  async uploadFile(file: File, convertType: 'static' | 'dynamic' = 'static'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('convertType', convertType);

      const response = await axios.post(`${this.baseURL}/whiteboard/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { taskUuid } = response.data;

      // Poll for conversion status
      return await this.pollConversionStatus(taskUuid);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw new Error('File upload failed');
    }
  }

  /**
   * Poll file conversion status
   */
  private async pollConversionStatus(taskUuid: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${this.baseURL}/whiteboard/convert/${taskUuid}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          const { status, result } = response.data;

          if (status === 'Finished') {
            clearInterval(interval);
            resolve(result.prefix);
          } else if (status === 'Fail') {
            clearInterval(interval);
            reject(new Error('File conversion failed'));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('File conversion timeout'));
      }, 300000);
    });
  }

  /**
   * Insert converted file into whiteboard
   */
  async insertFile(fileUrl: string, x: number = 0, y: number = 0): Promise<void> {
    if (!this.room) throw new Error('Not connected to a room');

    try {
      await this.room.insertImage({
        uuid: `file_${Date.now()}`,
        url: fileUrl,
        x,
        y,
        width: 400,
        height: 300,
        locked: false
      });
    } catch (error) {
      console.error('Failed to insert file:', error);
      throw new Error('File insertion failed');
    }
  }

  /**
   * Set drawing tool and properties
   */
  setTool(toolType: string, properties: any = {}): void {
    if (!this.room) return;

    const toolConfig = {
      currentApplianceName: toolType,
      ...properties
    };

    this.room.setMemberState(toolConfig);
  }

  /**
   * Clear the whiteboard
   */
  async clearBoard(): Promise<void> {
    if (!this.room) return;

    try {
      await this.room.cleanCurrentScene();
    } catch (error) {
      console.error('Failed to clear board:', error);
    }
  }

  /**
   * Save whiteboard as image
   */
  async saveAsImage(): Promise<string> {
    if (!this.room) throw new Error('Not connected to a room');

    try {
      const canvas = await this.room.screenshotToCanvas();
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Failed to save as image:', error);
      throw new Error('Screenshot failed');
    }
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    if (this.room) {
      try {
        await this.room.disconnect();
        this.room = null;
        console.log('Successfully left whiteboard room');
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
  }

  /**
   * Get current room info
   */
  getRoomInfo(): any {
    if (!this.room) return null;

    return {
      uuid: this.room.uuid,
      phase: this.room.phase,
      state: this.room.state,
      memberState: this.room.memberState,
      broadcastState: this.room.broadcastState
    };
  }

  /**
   * Check if SDK is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.whiteSDK !== null;
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.room !== null && this.room.phase === 'connected';
  }
}

export default WhiteboardAPI;
export type { WhiteboardRoom, WhiteboardToken, WhiteboardConfig, DrawingEvent, UserCursor };