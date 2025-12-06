import { useEffect, useState } from 'react';
import { IAgoraRTCClient } from 'agora-rtc-sdk-ng';

export function useSpeakingDetector(client: IAgoraRTCClient | null) {
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string | number>>(new Set());

  useEffect(() => {
    if (!client) return;
    try {
      client.enableAudioVolumeIndicator?.();
    } catch {}
    const handler = (volumes: any[]) => {
      const set = new Set<string | number>();
      volumes.forEach(v => {
        if (v.level > 0.05) set.add(v.uid);
      });
      setActiveSpeakers(set);
    };
    client.on('volume-indicator', handler);
    return () => {
      try { client.off('volume-indicator', handler); } catch {}
      setActiveSpeakers(new Set());
    };
  }, [client]);

  return { activeSpeakers };
}
