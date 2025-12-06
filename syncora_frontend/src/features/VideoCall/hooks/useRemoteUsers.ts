import { useCallback, useEffect, useState } from 'react';
import { IAgoraRTCClient, IRemoteAudioTrack, IRemoteVideoTrack, UID } from 'agora-rtc-sdk-ng';

export type RemoteUser = {
  uid: UID;
  audioTrack?: IRemoteAudioTrack | null;
  videoTrack?: IRemoteVideoTrack | null;
};

export function useRemoteUsers(client: IAgoraRTCClient | null) {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);

  useEffect(() => {
    if (!client) return;

    const onUserPublished = async (user: any, mediaType: any) => {
      // Narrow mediaType to the allowed Agora subscribe kinds
      const kind: 'audio' | 'video' = (mediaType === 'audio' || mediaType === 'video') ? mediaType : 'video';
      try {
        await client.subscribe(user, kind);
      } catch (e) { console.warn('subscribe failed', e); }
      setRemoteUsers(prev => {
        const exists = prev.some(p => p.uid === user.uid);
        if (exists) {
          return prev.map(p => p.uid === user.uid ? { uid: user.uid, audioTrack: user.audioTrack, videoTrack: user.videoTrack } : p);
        }
        return [...prev, { uid: user.uid, audioTrack: user.audioTrack, videoTrack: user.videoTrack }];
      });
    };

    const onUserUnpublished = (user: any) => {
      setRemoteUsers(prev => prev.map(p => p.uid === user.uid ? { ...p, videoTrack: null, audioTrack: null } : p));
    };

    const onUserLeft = (user: any) => {
      setRemoteUsers(prev => prev.filter(p => p.uid !== user.uid));
    };

  client.on('user-published', onUserPublished);
    client.on('user-unpublished', onUserUnpublished);
    client.on('user-left', onUserLeft);

    return () => {
      client.off('user-published', onUserPublished);
      client.off('user-unpublished', onUserUnpublished);
      client.off('user-left', onUserLeft);
      setRemoteUsers([]);
    };
  }, [client]);

  return { remoteUsers, setRemoteUsers };
}
