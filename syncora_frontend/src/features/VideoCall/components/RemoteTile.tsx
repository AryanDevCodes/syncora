// src/features/VideoCall/components/RemoteTile.tsx
import React, { useEffect, useRef } from "react";
import { IRemoteVideoTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";

type Props = {
  videoTrack?: IRemoteVideoTrack | null;
  audioTrack?: IRemoteAudioTrack | null;
  name?: string;
  muted?: boolean;
  cameraOff?: boolean;
  className?: string;
};

export default function RemoteTile({
  videoTrack,
  audioTrack,
  name = "Participant",
  muted,
  cameraOff,
  className = ""
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (videoTrack) {
      try {
        videoTrack.play(containerRef.current);
      } catch (e) {
        console.warn("remote video play failed", e);
      }
    } else {
      containerRef.current.innerHTML = "";
    }

    return () => {};
  }, [videoTrack]);

  useEffect(() => {
    if (audioTrack && !muted) {
      try {
        audioTrack.play();
      } catch (e) {
        console.warn("remote audio play failed", e);
      }
    }
  }, [audioTrack, muted]);

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-gray-800 relative ${className}`}
    >
      <div
        ref={containerRef}
        className="w-full h-full min-h-[180px] bg-black"
      />
      <div className="absolute left-3 bottom-3 px-3 py-1 rounded-full bg-black/60 text-sm flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${muted ? "bg-red-400" : "bg-green-400"}`} />
        <span className="text-xs">
          {name} {cameraOff ? "(Camera off)" : ""}
        </span>
      </div>
    </div>
  );
}
