// src/features/VideoCall/components/ControlsBar.tsx
import React from 'react';
import { Video, Mic, MicOff, Phone } from 'lucide-react';

type Props = {
  isJoined: boolean;
  isMuted: boolean;
  camOff: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onOpenSettings: () => void;
};

export default function ControlsBar({ isJoined, isMuted, camOff, onJoin, onLeave, onToggleMic, onToggleCam, onOpenSettings }: Props) {
  return (
    <div className="px-6 py-4 bg-black/30 backdrop-blur-sm flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {!isJoined ? (
          <button onClick={onJoin} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-medium">Join Call</button>
        ) : (
          <button onClick={onLeave} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white font-medium">Leave</button>
        )}

        <button onClick={onToggleMic} className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 flex items-center gap-2">
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <button onClick={onToggleCam} className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 flex items-center gap-2">
          <Video className="w-4 h-4" />
          <span className="text-sm">{camOff ? 'Start Video' : 'Stop Video'}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onOpenSettings} className="px-3 py-2 rounded bg-white/5 hover:bg-white/10">Devices</button>
        <div className="px-3 py-2 rounded bg-white/5 flex items-center gap-2 text-xs">
          <Phone className="w-4 h-4" />
          <span>Call status</span>
        </div>
      </div>
    </div>
  );
}
