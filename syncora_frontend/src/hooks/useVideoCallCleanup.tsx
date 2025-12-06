import { useEffect, useRef, useCallback } from 'react';
import { forceStopAllMedia, clearAllResources } from '@/services/videoCleanupService';

/**
 * Hook to handle video call cleanup
 */
export function useVideoCallCleanup(enabled: boolean = true) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cleanup = useCallback(async () => {
    if (!isMountedRef.current || !enabled) return;

    console.log('[useVideoCallCleanup] Cleaning up video call...');
    try {
      await forceStopAllMedia();
      await clearAllResources();
      console.log('[useVideoCallCleanup] Cleanup successful');
    } catch (err) {
      console.error('[useVideoCallCleanup] Cleanup error:', err);
    }
  }, [enabled]);

  return { cleanup, isMountedRef };
}