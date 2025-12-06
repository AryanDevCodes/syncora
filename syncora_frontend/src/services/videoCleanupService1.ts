/**
 * Video Call Cleanup Service
 * Handles aggressive cleanup of all video/audio resources
 * Prevents audio/video transmission after call ends
 */

interface VideoResourceTracker {
  audioTracks: Set<any>;
  videoTracks: Set<any>;
  clients: Set<any>;
  streams: Set<MediaStream>;
  intervalIds: Set<NodeJS.Timeout>;
}

const videoResources: VideoResourceTracker = {
  audioTracks: new Set(),
  videoTracks: new Set(),
  clients: new Set(),
  streams: new Set(),
  intervalIds: new Set(),
};

/**
 * Register audio track for cleanup
 */
export function registerAudioTrack(track: any): void {
  if (track) {
    videoResources.audioTracks.add(track);
    console.log('[VideoCleanup] Audio track registered. Total:', videoResources.audioTracks.size);
  }
}

/**
 * Register video track for cleanup
 */
export function registerVideoTrack(track: any): void {
  if (track) {
    videoResources.videoTracks.add(track);
    console.log('[VideoCleanup] Video track registered. Total:', videoResources.videoTracks.size);
  }
}

/**
 * Register client for cleanup
 */
export function registerClient(client: any): void {
  if (client) {
    videoResources.clients.add(client);
    console.log('[VideoCleanup] Client registered. Total:', videoResources.clients.size);
  }
}

/**
 * Register media stream for cleanup
 */
export function registerStream(stream: MediaStream): void {
  if (stream) {
    videoResources.streams.add(stream);
    console.log('[VideoCleanup] Stream registered. Total:', videoResources.streams.size);
  }
}

/**
 * Register interval for cleanup
 */
export function registerInterval(intervalId: NodeJS.Timeout): void {
  videoResources.intervalIds.add(intervalId);
  console.log('[VideoCleanup] Interval registered. Total:', videoResources.intervalIds.size);
}

/**
 * AGGRESSIVE: Force stop ALL audio and video
 */
export async function forceStopAllMedia(): Promise<void> {
  console.log('[VideoCleanup] *** FORCE STOPPING ALL MEDIA - NUCLEAR MODE ***');

  // 1. DISABLE ALL TRACKS
  console.log('[VideoCleanup] Step 1: Disabling all tracks...');
  for (const track of videoResources.audioTracks) {
    try {
      if (track && typeof track.setEnabled === 'function') {
        track.setEnabled(false);
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error disabling audio track:', err);
    }
  }

  for (const track of videoResources.videoTracks) {
    try {
      if (track && typeof track.setEnabled === 'function') {
        track.setEnabled(false);
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error disabling video track:', err);
    }
  }

  // 2. STOP ALL AUDIO TRACKS
  console.log('[VideoCleanup] Step 2: Stopping all audio tracks...');
  for (const track of videoResources.audioTracks) {
    try {
      if (track && typeof track.stop === 'function') {
        track.stop();
      }
      if (track && typeof track.close === 'function') {
        track.close();
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error stopping audio track:', err);
    }
  }
  videoResources.audioTracks.clear();

  // 3. STOP ALL VIDEO TRACKS
  console.log('[VideoCleanup] Step 3: Stopping all video tracks...');
  for (const track of videoResources.videoTracks) {
    try {
      if (track && typeof track.stop === 'function') {
        track.stop();
      }
      if (track && typeof track.close === 'function') {
        track.close();
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error stopping video track:', err);
    }
  }
  videoResources.videoTracks.clear();

  // 4. STOP ALL MEDIA STREAMS
  console.log('[VideoCleanup] Step 4: Stopping all media streams...');
  for (const stream of videoResources.streams) {
    try {
      stream.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
    } catch (err) {
      console.warn('[VideoCleanup] Error stopping stream:', err);
    }
  }
  videoResources.streams.clear();

  // 5. LEAVE ALL CLIENTS
  console.log('[VideoCleanup] Step 5: Leaving all Agora clients...');
  for (const client of videoResources.clients) {
    try {
      if (typeof client.removeAllListeners === 'function') {
        client.removeAllListeners();
      }
      if (typeof client.leave === 'function') {
        await client.leave();
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error leaving client:', err);
    }
  }
  videoResources.clients.clear();

  // 6. CLEAR ALL INTERVALS
  console.log('[VideoCleanup] Step 6: Clearing all intervals...');
  for (const intervalId of videoResources.intervalIds) {
    try {
      clearInterval(intervalId);
    } catch (err) {
      console.warn('[VideoCleanup] Error clearing interval:', err);
    }
  }
  videoResources.intervalIds.clear();

  // 7. FORCE CLEANUP LINGERING AGORA TRACKS
  console.log('[VideoCleanup] Step 7: Force cleaning lingering Agora tracks...');
  try {
    const AgoraRTC = (window as any).AgoraRTC;
    if (AgoraRTC && typeof AgoraRTC.getLocalTracks === 'function') {
      const lingering = AgoraRTC.getLocalTracks();
      if (Array.isArray(lingering)) {
        for (const track of lingering) {
          try {
            if (typeof track.setEnabled === 'function') track.setEnabled(false);
            if (typeof track.stop === 'function') track.stop();
            if (typeof track.close === 'function') track.close();
          } catch (err) {
            console.warn('[VideoCleanup] Error cleaning lingering track:', err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[VideoCleanup] Error accessing Agora lingering tracks:', err);
  }

  // 8. SILENCE ALL AUDIO ELEMENTS
  console.log('[VideoCleanup] Step 8: Silencing all audio elements...');
  const audioElements = document.querySelectorAll('audio, video');
  audioElements.forEach(elem => {
    try {
      (elem as any).muted = true;
      (elem as any).pause();
      (elem as any).currentTime = 0;
    } catch (err) {
      console.warn('[VideoCleanup] Error silencing element:', err);
    }
  });

  console.log('[VideoCleanup] *** FORCE STOP COMPLETE ***');
}

/**
 * Get cleanup status
 */
export function getCleanupStatus(): VideoResourceTracker {
  return {
    audioTracks: new Set(videoResources.audioTracks),
    videoTracks: new Set(videoResources.videoTracks),
    clients: new Set(videoResources.clients),
    streams: new Set(videoResources.streams),
    intervalIds: new Set(videoResources.intervalIds),
  };
}

/**
 * Clear all resources
 */
export async function clearAllResources(): Promise<void> {
  console.log('[VideoCleanup] Clearing all resources...');
  await forceStopAllMedia();
  videoResources.audioTracks.clear();
  videoResources.videoTracks.clear();
  videoResources.clients.clear();
  videoResources.streams.clear();
  videoResources.intervalIds.clear();
  console.log('[VideoCleanup] All resources cleared');
}

