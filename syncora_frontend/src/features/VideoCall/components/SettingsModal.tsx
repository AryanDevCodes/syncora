import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectDevice: (kind: 'audioinput' | 'videoinput', deviceId: string) => void;
};

export default function SettingsModal({ open, onClose, onSelectDevice }: Props) {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setMics(devices.filter(d => d.kind === 'audioinput'));
        setCameras(devices.filter(d => d.kind === 'videoinput'));
      } catch (e) { console.warn('device enumerate fail', e); }
    })();
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg p-6 z-50 w-96 border border-white/10">
        <h3 className="text-lg font-medium mb-4">Device Settings</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Microphone</div>
            <select className="w-full bg-black/40 p-2 rounded" onChange={(e) => onSelectDevice('audioinput', e.target.value)}>
              <option value="">Default</option>
              {mics.map(m => <option key={m.deviceId} value={m.deviceId}>{m.label || 'Microphone'}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Camera</div>
            <select className="w-full bg-black/40 p-2 rounded" onChange={(e) => onSelectDevice('videoinput', e.target.value)}>
              <option value="">Default</option>
              {cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || 'Camera'}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-white/5">Close</button>
        </div>
      </div>
    </div>
  );
}
