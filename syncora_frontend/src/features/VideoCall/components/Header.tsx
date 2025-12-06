import React from 'react';
import clsx from 'clsx';
import { formatTime } from '../utils/formatting';

type Props = {
  elapsed: number;
  participants: number;
  joined: boolean;
  onOpenSettings: () => void;
  connectionState?: string;
  notice?: string | null;
};
export default function Header({ elapsed, participants, joined, onOpenSettings, connectionState, notice }: Props) {
  return (
    <header className="relative z-20 px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={clsx("px-4 py-2 rounded-full bg-white/5 border border-white/10 flex items-center gap-3")}>
          <div className={clsx("w-3 h-3 rounded-full", joined ? 'bg-green-400 animate-pulse' : 'bg-yellow-500')}/>
          <div className="text-sm text-gray-200 font-medium">{formatTime(elapsed)}</div>
        </div>
        <div className="text-sm text-gray-300 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <span className="font-semibold text-white">{participants}</span> {participants === 1 ? 'participant' : 'participants'}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {notice && <div className="text-xs px-3 py-1 rounded-full bg-yellow-600/90 text-white">{notice}</div>}
        <div className="text-xs px-3 py-1 rounded-full bg-black/50 border border-white/10 text-gray-200">Conn: {connectionState}</div>

        <button onClick={onOpenSettings} className="p-3 bg-white/5 rounded-full hover:bg-white/10 border border-white/10">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/>
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-1.52 3.4 2 2 0 01-1.9-.95l-.06-.1a1.65 1.65 0 00-1.41-.83"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
