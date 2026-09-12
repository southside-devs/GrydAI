import React from 'react';
import { Lightbulb, Zap } from 'lucide-react';

export default function AIDetectionBanner({
  confidence = 0.0,
  title = 'Power Outage',
  status = 'STANDBY',
  isAnomaly = false
}) {
  return (
    <div
      className="rounded-[24px] p-5 w-60 relative overflow-hidden bg-[#facc15] text-[#0f172a] shadow-lg"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
          <Lightbulb size={18} className="text-[#0f172a]" />
        </div>
        <span className="text-[11px] font-mono font-bold tracking-tight bg-black/10 px-2.5 py-1 rounded-full text-black">
          {typeof confidence === 'number' ? confidence.toFixed(1) : confidence}%
        </span>
      </div>

      <div className="mb-4">
        <div className="text-[10px] font-mono font-bold tracking-widest text-black/70 uppercase">
          AI DETECTION
        </div>
        <div className="text-xl font-bold font-sans tracking-tight text-black mt-0.5">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-black/10">
        <Zap size={16} className="fill-black text-black animate-pulse" />
        <div className="flex-1 flex items-center gap-1">
          <span className="h-[2px] w-3 bg-black rounded-full" />
          <span className="w-2 h-2 rounded-full bg-black" />
          <span className="h-[2px] flex-1 bg-black rounded-full" />
        </div>
        <span className="text-[11px] font-mono font-extrabold tracking-wider text-black">
          {status}
        </span>
      </div>
    </div>
  );
}
