// src/features/VideoCall/components/LocalTile.tsx
import React, { useEffect, useRef } from 'react';
import { ICameraVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

type Props = {
  videoTrack?: ICameraVideoTrack | null;
  audioTrack?: IMicrophoneAudioTrack | null;
  name?: string;
  muted?: boolean;
  cameraOff?: boolean;
  className?: string;
};

export default function LocalTile({ videoTrack, audioTrack, name = 'You', muted, cameraOff, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // if videoTrack exists play into the container. track.play will create/replace <video>
    if (videoTrack) {
      try {
        // ensure video plays muted to avoid browser autoplay issues
        try {
          videoTrack.play(containerRef.current);
        } catch (e) {
          console.warn('local play failed', e);
        }
      } catch (e) {
        console.warn('local play exception', e);
      }
    } else {
      // render a placeholder gray background when camera is off
      containerRef.current.innerHTML = '';
    }
    return () => {
      // do not stop/close track here (hook manages lifecycle)
    };
  }, [videoTrack]);

  return (
    <div className={`rounded-2xl overflow-hidden bg-gray-800 relative ${className}`}>
      <div ref={containerRef} className="w-full h-full min-h-[180px] bg-black flex items-center justify-center" />
      <div className="absolute left-3 bottom-3 px-3 py-1 rounded-full bg-black/60 text-sm flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${muted ? 'bg-red-400' : 'bg-green-400'}`} />
        <span className="text-xs">{name} {cameraOff ? '(Camera off)' : ''}</span>
      </div>
    </div>
  );
}
