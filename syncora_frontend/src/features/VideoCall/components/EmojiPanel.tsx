import React from 'react';
import { motion } from 'framer-motion';

const EMOJIS = ['👍','👏','😂','🎉','❤️','🔥','😮'];

export default function EmojiPanel({ onReact }: { onReact: (emoji: string) => void }) {
  return (
    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black/60 p-3 rounded-full flex gap-2">
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onReact(e)} className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-2xl">
          {e}
        </button>
      ))}
    </motion.div>
  );
}
