/**
 * ZegoCloud Video Call Service
 * 
 * Handles all ZegoCloud video call operations including:
 * - Token generation
 * - Room creation and joining
 * - Call management
 * - User management
 */

import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

export interface ZegoConfig {
  appID: number;
  serverSecret: string;
  wsUrl?: string;
}

export interface ZegoUser {
  userId: string;
  userName: string;
  avatar?: string;
}

export interface ZegoRoomConfig {
  roomId: string;
  user: ZegoUser;
  container: HTMLElement;
  onCallEnd?: () => void;
  onUserJoin?: (userId: string) => void;
  onUserLeave?: (userId: string) => void;
  scenario?: 'OneONoneCall' | 'GroupCall' | 'VideoConference' | 'LiveStreaming';
  showScreenSharingButton?: boolean;
  showTextChat?: boolean;
  showUserList?: boolean;
  maxUsers?: number;
  layout?: 'Auto' | 'Sidebar' | 'Grid';
}

export class ZegoCloudService {
  private static instance: ZegoCloudService;
  private config: ZegoConfig;
  private activeRooms: Map<string, any> = new Map();

  private constructor() {
    // Get configuration from environment variables
    const appID = parseInt(import.meta.env.VITE_ZEGO_APP_ID || '0');
    // Try VITE_ZEGO_SERVER_SECRET first (32 chars), then fall back to VITE_ZEGO_APP_SIGN (64 chars)
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET || import.meta.env.VITE_ZEGO_APP_SIGN || '';
    const wsUrl = import.meta.env.VITE_ZEGO_WS_URL || '';

    // Validate App ID
    if (!appID || isNaN(appID)) {
      console.error('[ZegoCloudService] Invalid App ID:', import.meta.env.VITE_ZEGO_APP_ID);
      throw new Error(
        'Invalid ZegoCloud App ID. Please check VITE_ZEGO_APP_ID in .env file.\n' +
        'Get it from: https://console.zegocloud.com/'
      );
    }

    // Validate Server Secret (must be 32 hex characters according to ZegoCloud docs)
    if (!serverSecret || serverSecret.length !== 32) {
      console.error('[ZegoCloudService] Invalid Server Secret length:', serverSecret.length);
      throw new Error(
        `Invalid ZegoCloud Server Secret. Must be exactly 32 characters (hex string).\n` +
        `Current length: ${serverSecret.length}. Please check VITE_ZEGO_SERVER_SECRET in .env file.\n` +
        `Get it from: https://console.zegocloud.com/ > Projects > [Your Project] > Basic Information`
      );
    }

    // Validate Server Secret format (should be hex)
    if (!/^[0-9a-fA-F]{32}$/.test(serverSecret)) {
      console.error('[ZegoCloudService] Invalid Server Secret format');
      throw new Error(
        'Invalid ZegoCloud Server Secret format. Must be a 32-character hexadecimal string.\n' +
        'Get it from: https://console.zegocloud.com/'
      );
    }

    this.config = {
      appID,
      serverSecret,
      wsUrl
    };

    console.log('[ZegoCloudService] Initialized successfully');
    console.log('[ZegoCloudService] App ID:', appID);
    console.log('[ZegoCloudService] Server Secret length:', serverSecret.length);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ZegoCloudService {
    if (!ZegoCloudService.instance) {
      ZegoCloudService.instance = new ZegoCloudService();
    }
    return ZegoCloudService.instance;
  }

  /**
   * Validate and normalize user ID
   */
  private normalizeUserId(userId: string | number | undefined): string {
    if (!userId || userId === 'NaN' || userId === 'undefined') {
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (typeof userId === 'number') {
      return `user_${userId}`;
    }

    // Remove special characters and ensure valid format
    const normalized = userId.toString().replace(/[^a-zA-Z0-9_-]/g, '');
    return normalized || `user_${Date.now()}`;
  }

  /**
   * Create and join a video call room
   */
  public async joinRoom(config: ZegoRoomConfig): Promise<any> {
    try {
      const { roomId, user, container, onCallEnd, onUserJoin, onUserLeave } = config;

      console.log('[ZegoCloudService] Joining room:', { roomId, user });

      // Check if already in this room
      if (this.activeRooms.has(roomId)) {
        console.warn('[ZegoCloudService] Already in room:', roomId);
        return this.activeRooms.get(roomId);
      }

      // Generate UIKit token client-side (required by UIKit Prebuilt)
      console.log('[ZegoCloudService] Generating UIKit token');
      console.log('  - App ID:', this.config.appID);
      console.log('  - Room ID:', roomId);
      console.log('  - User ID:', user.userId);

      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        this.config.appID,
        this.config.serverSecret,
        roomId,
        user.userId,
        user.userName
      );

      console.log('[ZegoCloudService] UIKit token generated successfully');

      // Create ZegoUIKitPrebuilt instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // Store the instance
      this.activeRooms.set(roomId, zp);

      // Tag the container so we can find media elements later for cleanup
      try {
        if (container && container instanceof HTMLElement) {
          container.setAttribute('data-zego-room-id', roomId);
        }
      } catch (attrErr) {
        // ignore
      }

      // Determine scenario - use OneONoneCall by default for better compatibility
      const scenario = config.scenario || 'OneONoneCall';
      const scenarioConfig = this.getScenarioConfig(scenario);

      console.log('[ZegoCloudService] Room configuration:', {
        scenario,
        scenarioConfig,
        maxUsers: config.maxUsers || 2,
      });

      // Join the room
      await zp.joinRoom({
          container,
          scenario: scenarioConfig,
          // basic join settings
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          showPreJoinView: false,
          showLeavingView: false,

          // UI toggles (respect config if provided)
          showScreenSharingButton: config.showScreenSharingButton ?? true,
          showTextChat: config.showTextChat ?? true,
          showUserList: config.showUserList ?? true,

          // layout & limits
          maxUsers: config.maxUsers ?? 10,
          layout: config.layout ?? 'Auto',

          // helper links
          sharedLinks: [
            {
              name: 'Copy Link',
              url: `${window.location.origin}${window.location.pathname}?roomId=${roomId}`,
            },
          ],

          // callbacks
          onJoinRoom: () => {
            console.log('[ZegoCloudService] ✅ Successfully joined room:', roomId);
          },
          onLeaveRoom: () => {
            console.log('[ZegoCloudService] Left room:', roomId);
            this.activeRooms.delete(roomId);
            if (onCallEnd) {
              onCallEnd();
            }
          },
          onUserJoin: (users: any[]) => {
            console.log('[ZegoCloudService] Users joined:', users);
            if (onUserJoin) {
              users.forEach(u => onUserJoin(u.userID));
            }
          },
          onUserLeave: (users: any[]) => {
            console.log('[ZegoCloudService] Users left:', users);
            if (onUserLeave) {
              users.forEach(u => onUserLeave(u.userID));
            }
          },

          // UI extras
          showLayoutButton: true,
          showNonVideoUser: true,
          showOnlyAudioUser: true,
          useFrontFacingCamera: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showRoomDetailsButton: true,
          showRoomTimer: true,
        });

  console.log('[ZegoCloudService] Room setup complete:', roomId);
      return zp;
    } catch (error) {
      console.error('[ZegoCloudService] Error joining room:', error);
      throw error;
    }
  }

  /**
   * Get scenario configuration based on call type
   */
  private getScenarioConfig(scenario: string) {
    switch (scenario) {
      case 'OneONoneCall':
        return { mode: ZegoUIKitPrebuilt.OneONoneCall };
      case 'GroupCall':
        return { mode: ZegoUIKitPrebuilt.GroupCall };
      case 'VideoConference':
        return { mode: ZegoUIKitPrebuilt.VideoConference };
      case 'LiveStreaming':
        return { mode: ZegoUIKitPrebuilt.LiveStreaming };
      default:
        return { mode: ZegoUIKitPrebuilt.VideoConference };
    }
  }

  /**
   * Leave a room
   */
  public async leaveRoom(roomId: string): Promise<void> {
    try {
      console.log('[ZegoCloudService] Leaving room:', roomId);

      const zp = this.activeRooms.get(roomId);
      if (zp) {
        // Try to call common cleanup methods on the Zego instance so
        // camera/microphone tracks are released.
        try {
          // Preferred: destroy cleans up UI and internal resources
          if (typeof zp.destroy === 'function') {
            await zp.destroy();
            console.log('[ZegoCloudService] Called zp.destroy()');
          } else if (typeof zp.leaveRoom === 'function') {
            await zp.leaveRoom();
            console.log('[ZegoCloudService] Called zp.leaveRoom()');
          } else if (typeof zp.leave === 'function') {
            await zp.leave();
            console.log('[ZegoCloudService] Called zp.leave()');
          } else if (typeof zp.logout === 'function') {
            await zp.logout();
            console.log('[ZegoCloudService] Called zp.logout()');
          } else {
            console.warn('[ZegoCloudService] No known cleanup method on Zego instance; attempting best-effort DOM cleanup');
            try {
              const container = (zp as any).container as HTMLElement | undefined;
              if (container && container instanceof HTMLElement) {
                container.innerHTML = '';
                console.log('[ZegoCloudService] Cleared container DOM');
              }
            } catch (domErr) {
              console.warn('[ZegoCloudService] DOM cleanup failed', domErr);
            }
          }
        } catch (cleanupError) {
          console.warn('[ZegoCloudService] Error while cleaning up Zego instance:', cleanupError);
        } finally {
          // Ensure we remove the room from the active map to avoid leaks
          // Also attempt to stop any media tracks inside the original container
          try {
            const selector = `[data-zego-room-id="${roomId}"]`;
            const containerEl = document.querySelector(selector) as HTMLElement | null;
            if (containerEl) {
              const mediaEls = containerEl.querySelectorAll('video, audio');
              mediaEls.forEach((el) => {
                try {
                  // @ts-ignore
                  const src: MediaStream | null = (el as HTMLMediaElement).srcObject as MediaStream | null;
                  if (src && typeof src.getTracks === 'function') {
                    src.getTracks().forEach(t => {
                      try { t.stop(); } catch {};
                    });
                  }
                  try { (el as HTMLMediaElement).srcObject = null; } catch {}
                } catch (mediaErr) {
                  // ignore per-element errors
                }
              });
              // and clear inner HTML as a last resort
              try { containerEl.innerHTML = ''; } catch {}
            }
          } catch (domErr) {
            console.warn('[ZegoCloudService] Additional DOM/media cleanup failed', domErr);
          }

          this.activeRooms.delete(roomId);
        }
      }
    } catch (error) {
      console.error('[ZegoCloudService] Error leaving room:', error);
      throw error;
    }
  }

  /**
   * Check if currently in a room
   */
  public isInRoom(roomId: string): boolean {
    return this.activeRooms.has(roomId);
  }

  /**
   * Get all active rooms
   */
  public getActiveRooms(): string[] {
    return Array.from(this.activeRooms.keys());
  }

  /**
   * Leave all active rooms
   */
  public async leaveAllRooms(): Promise<void> {
    const rooms = this.getActiveRooms();
    for (const roomId of rooms) {
      await this.leaveRoom(roomId);
    }
  }

  /**
   * Get configuration
   */
  public getConfig(): ZegoConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const zegoCloudService = ZegoCloudService.getInstance();
export default zegoCloudService;
