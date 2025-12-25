import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type ChatMessage = { id: string; from: string; text: string; ts: number; };

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages]);

  if (!open) return null;
  return (
    <motion.aside initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }} className="fixed right-0 top-0 bottom-0 w-96 bg-gray-900/95 border-l border-white/8 z-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Chat</h3>
        <button onClick={onClose} className="text-sm text-gray-300">Close</button>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-auto custom-scrollbar mb-4" style={{maxHeight: '60vh'}}>
        {messages.length === 0 && <div className="text-gray-400 text-sm">No messages yet — say hello 👋</div>}
        {messages.map(m => (
          <div key={m.id} className="mb-3">
            <div className="text-xs text-gray-400">{m.from} • {new Date(m.ts).toLocaleTimeString()}</div>
            <div className="bg-white/5 p-3 rounded mt-1 text-sm">{m.text}</div>
          </div>
        ))}
      </div>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        const msg: ChatMessage = { id: String(Date.now()), from: 'You', text: text.trim(), ts: Date.now() };
        setMessages(prev => [...prev, msg]);
        setText('');
      }}>
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 bg-black/40 p-2 rounded" placeholder="Write a message..." />
          <button type="submit" className="px-4 py-2 bg-blue-600 rounded">Send</button>
        </div>
      </form>
    </motion.aside>
  );
}
