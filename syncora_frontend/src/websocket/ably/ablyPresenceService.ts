// Placeholder for Ably presence service
// User online/offline status tracking

export const ablyPresenceService = {
  enterPresence: (userId: string, userData: any) => {
    // TODO: Enter presence on Ably channel
    console.log('ablyPresenceService.enterPresence - placeholder', userId);
  },

  leavePresence: (userId: string) => {
    // TODO: Leave presence on Ably channel
    console.log('ablyPresenceService.leavePresence - placeholder', userId);
  },

  subscribeToPresence: (callback: (members: any[]) => void) => {
    // TODO: Subscribe to presence updates
    console.log('ablyPresenceService.subscribeToPresence - placeholder');
  },
};
