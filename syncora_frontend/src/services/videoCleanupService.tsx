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
  // Utility: try to obtain underlying MediaStreamTrack if available
  const getUnderlyingMediaStreamTrack = (track: any): MediaStreamTrack | null => {
    try {
      if (!track) return null;
      if (typeof track.getMediaStreamTrack === 'function') {
        try {
          const t = track.getMediaStreamTrack();
          return t || null;
        } catch (e) {
          // Some SDK versions may throw when closed
          return null;
        }
      }
      // common fallbacks used by some SDK wrappers
      if ((track as any).mediaStreamTrack) return (track as any).mediaStreamTrack;
      if ((track as any)._mediaStreamTrack) return (track as any)._mediaStreamTrack;
      if ((track as any).mediaStream) {
        const list = (track as any).mediaStream.getTracks();
        return list && list.length ? list[0] : null;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  // 2. STOP ALL AUDIO TRACKS (stop/close first to avoid racing with setEnabled)
  console.log('[VideoCleanup] Step 2: Stopping all audio tracks...');
  for (const track of videoResources.audioTracks) {
    try {
      if (track && typeof track.stop === 'function') {
        try { track.stop(); } catch (e) { /* ignore */ }
      }
      if (track && typeof track.close === 'function') {
        try { track.close(); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error stopping audio track:', err);
    }
  }
  videoResources.audioTracks.clear();

  // 3. STOP ALL VIDEO TRACKS (stop/close first)
  console.log('[VideoCleanup] Step 3: Stopping all video tracks...');
  for (const track of videoResources.videoTracks) {
    try {
      if (track && typeof track.stop === 'function') {
        try { track.stop(); } catch (e) { /* ignore */ }
      }
      if (track && typeof track.close === 'function') {
        try { track.close(); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('[VideoCleanup] Error stopping video track:', err);
    }
  }
  videoResources.videoTracks.clear();

  // 4. As a safety: attempt to disable any still-live tracks (only when underlying
  // MediaStreamTrack exists). This avoids calling setEnabled on already-closed
  // SDK track wrappers which can trigger internal TypeErrors.
  console.log('[VideoCleanup] Step 4: Disabling any still-live tracks (safe check)...');
  try {
    // Check audio: set the underlying MediaStreamTrack.enabled = false instead
    // of calling the SDK wrapper's setEnabled which can trigger internal
    // async errors when the wrapper is partially closed.
    for (const track of videoResources.audioTracks) {
      try {
        const mst = getUnderlyingMediaStreamTrack(track);
        if (!mst) continue;
        try {
          mst.enabled = false;
        } catch (e) {
          console.warn('[VideoCleanup] Error disabling underlying audio MediaStreamTrack:', e);
        }
      } catch (e) {
        console.warn('[VideoCleanup] Error disabling audio track safely:', e);
      }
    }

    // Check video: same safe approach
    for (const track of videoResources.videoTracks) {
      try {
        const mst = getUnderlyingMediaStreamTrack(track);
        if (!mst) continue;
        try {
          mst.enabled = false;
        } catch (e) {
          console.warn('[VideoCleanup] Error disabling underlying video MediaStreamTrack:', e);
        }
      } catch (e) {
        console.warn('[VideoCleanup] Error disabling video track safely:', e);
      }
    }
  } catch (e) {
    console.warn('[VideoCleanup] Error in safe disable pass:', e);
  }

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
  console.log('[VideoCleanup] Step 5: Cleaning up video clients...');
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

  // 7. FORCE CLEANUP ANY LINGERING MEDIA TRACKS
  console.log('[VideoCleanup] Step 7: Force cleaning lingering media tracks...');
  try {
    // Check for any WebRTC tracks that weren't cleaned up
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const lingering = [];
      if (Array.isArray(lingering)) {
        for (const track of lingering) {
          try {
            // Prefer disabling the underlying MediaStreamTrack to avoid
            // invoking SDK wrapper internals which may be in a half-closed state.
            try {
              const mst = getUnderlyingMediaStreamTrack(track);
              if (mst) {
                try { mst.enabled = false; } catch (e) { console.warn('[VideoCleanup] Ignored lingering MST disable error:', e); }
              }
            } catch (e) {
              console.warn('[VideoCleanup] Ignored lingering setEnabled exception:', e);
            }
            if (typeof track.stop === 'function') {
              try {
                const _s = track.stop();
                if (_s && typeof _s.then === 'function') await Promise.resolve(_s).catch((e: any) => console.warn('[VideoCleanup] Ignored lingering stop error:', e));
              } catch (e) {
                console.warn('[VideoCleanup] Ignored lingering stop exception:', e);
              }
            }
            if (typeof track.close === 'function') {
              try {
                const _c = track.close();
                if (_c && typeof _c.then === 'function') await Promise.resolve(_c).catch((e: any) => console.warn('[VideoCleanup] Ignored lingering close error:', e));
              } catch (e) {
                console.warn('[VideoCleanup] Ignored lingering close exception:', e);
              }
            }
          } catch (err) {
            console.warn('[VideoCleanup] Error cleaning lingering track:', err);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[VideoCleanup] Error accessing lingering tracks:', err);
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

