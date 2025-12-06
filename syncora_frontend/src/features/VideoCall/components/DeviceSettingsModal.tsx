// src/features/VideoCall/components/DeviceSettingsModal.tsx
import React, { useEffect, useState } from 'react';

type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectDevice: (kind: DeviceKind, deviceId: string) => void;
};

export default function DeviceSettingsModal({ open, onClose, onSelectDevice }: Props) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = useState<{ [k in DeviceKind]?: string }>({});

  useEffect(() => {
    if (!open) return;
    const fetch = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list);
        const defaultAudioIn = list.find(d => d.kind === 'audioinput')?.deviceId;
        const defaultVideo = list.find(d => d.kind === 'videoinput')?.deviceId;
        setSelected(s => ({ audioinput: s.audioinput ?? defaultAudioIn, videoinput: s.videoinput ?? defaultVideo }));
      } catch (e) {
        console.warn('enumerateDevices failed', e);
      }
    };
    fetch();
  }, [open]);

  if (!open) return null;

  const audios = devices.filter(d => d.kind === 'audioinput');
  const videos = devices.filter(d => d.kind === 'videoinput');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Device Settings</h3>
          <button className="text-sm text-gray-500" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Microphone</label>
            <select
              className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-900 border"
              value={selected.audioinput ?? ''}
              onChange={(e) => setSelected(s => ({ ...s, audioinput: e.target.value }))}
            >
              <option value="">Default</option>
              {audios.map(a => <option key={a.deviceId} value={a.deviceId}>{a.label || a.deviceId}</option>)}
            </select>
            <div className="mt-2 text-xs text-gray-500">Pick a microphone to use for calls.</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Camera</label>
            <select
              className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-900 border"
              value={selected.videoinput ?? ''}
              onChange={(e) => setSelected(s => ({ ...s, videoinput: e.target.value }))}
            >
              <option value="">Default</option>
              {videos.map(v => <option key={v.deviceId} value={v.deviceId}>{v.label || v.deviceId}</option>)}
            </select>
            <div className="mt-2 text-xs text-gray-500">Pick a camera to use for calls.</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selected.audioinput) onSelectDevice('audioinput', selected.audioinput);
                if (selected.videoinput) onSelectDevice('videoinput', selected.videoinput);
                onClose();
              }}
              className="flex-1 px-3 py-2 rounded bg-blue-600 text-white"
            >
              Apply
            </button>
            <button onClick={onClose} className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
