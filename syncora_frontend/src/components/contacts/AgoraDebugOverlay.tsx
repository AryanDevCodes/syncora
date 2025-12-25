import React, { useEffect, useState } from 'react';

export default function AgoraDebugOverlay({ client }: { client: any }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!client) return;

    const append = (msg: string) =>
      setLogs(prev => [...prev.slice(-70), msg]);

    const handler = (state: any) => {
      append(`State → ${state}`);
    };

    try {
      client.on('connection-state-change', handler);
    } catch (e) {
      // ignore
    }

    append('Agora Debug Overlay started');

    return () => {
      try {
        client.off('connection-state-change', handler);
      } catch {}
    };
  }, [client]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-3 py-1 bg-black/60 text-white text-xs rounded shadow"
      >
        {open ? 'Hide Logs' : 'Show Logs'}
      </button>

      {open && (
        <div className="mt-2 bg-black/80 text-green-300 text-xs p-3 rounded max-h-64 w-96 overflow-auto custom-scrollbar border border-green-500/20 shadow-xl">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
