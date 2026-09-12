import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';

export default function LaunchScreen({ onLaunch }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60000,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Central Launch Box (Pure Solid Flat Yellow Box) */}
      <button
        onClick={onLaunch}
        type="button"
        className="group relative px-10 py-5 rounded-2xl bg-[#ffe600] text-black font-extrabold text-xl tracking-tight active:scale-95 cursor-pointer flex items-center gap-3 select-none border-0"
      >
        <Zap size={22} className="fill-black text-black" />
        <span>Launch Gryd AI</span>
        <ArrowUpRight size={22} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
}
