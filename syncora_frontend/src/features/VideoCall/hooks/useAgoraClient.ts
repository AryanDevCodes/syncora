import { useEffect, useRef } from 'react';
import AgoraRTC, { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

// Creates and returns a single client instance (persisted)
export function useAgoraClient(mode: 'rtc' | 'live' = 'rtc', codec: 'vp8' | 'h264' = 'vp8') {
  const clientRef = useRef<IAgoraRTCClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode, codec });
  }

  useEffect(() => {
    return () => {
      // On unmount, optionally destroy client (leave handled elsewhere).
      // do not call clientRef.current?.leave() here; leave will be called explicitly.
    };
  }, []);

  return clientRef.current!;
}
