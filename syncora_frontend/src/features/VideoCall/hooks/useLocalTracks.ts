import { useCallback, useEffect, useRef, useState } from 'react';
import AgoraRTC, { ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import { HIGH_QUALITY, LOW_QUALITY, VERY_LOW } from '../utils/constants';

export type TrackQuality = 'high' | 'low' | 'very-low';

export function useLocalTracks() {
  const audioRef = useRef<ILocalAudioTrack | null>(null);
  const videoRef = useRef<ILocalVideoTrack | null>(null);
  const [audio, setAudio] = useState<ILocalAudioTrack | null>(null);
  const [video, setVideo] = useState<ILocalVideoTrack | null>(null);
  const [isCameraOn, setCameraOn] = useState(true);
  const [isMicOn, setMicOn] = useState(true);

  const createAudio = useCallback(async () => {
    if (audioRef.current) return audioRef.current;
    const track = await AgoraRTC.createMicrophoneAudioTrack();
    audioRef.current = track;
    setAudio(track);
    return track;
  }, []);

  const createVideo = useCallback(async (quality: TrackQuality = 'high') => {
    // stop old
    if (videoRef.current) {
      try { videoRef.current.stop(); videoRef.current.close(); } catch {}
      videoRef.current = null;
    }

    const config = quality === 'high' ? HIGH_QUALITY : quality === 'low' ? LOW_QUALITY : VERY_LOW;
    const track = await AgoraRTC.createCameraVideoTrack({ encoderConfig: config });
    videoRef.current = track;
    setVideo(track);
    setCameraOn(true);
    return track;
  }, []);

  const toggleMic = useCallback(async (val?: boolean) => {
    if (!audioRef.current) return;
    const next = typeof val === 'boolean' ? val : !isMicOn;
    try { await audioRef.current.setEnabled(next); } catch {}
    setMicOn(next);
  }, [isMicOn]);

  const toggleCamera = useCallback(async (val?: boolean) => {
    if (!videoRef.current) return;
    const next = typeof val === 'boolean' ? val : !isCameraOn;
    try { await videoRef.current.setEnabled(next); } catch {}
    setCameraOn(next);
  }, [isCameraOn]);

  useEffect(() => {
    return () => {
      try { audioRef.current?.stop(); audioRef.current?.close(); } catch {}
      try { videoRef.current?.stop(); videoRef.current?.close(); } catch {}
    };
  }, []);

  return {
    audio,
    video,
    isCameraOn,
    isMicOn,
    createAudio,
    createVideo,
    toggleMic,
    toggleCamera,
    setAudio,
    setVideo,
  };
}
