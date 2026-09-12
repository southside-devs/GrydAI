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
      className="rounded-2xl p-5 w-56 shadow-2xl transition-all duration-500 backdrop-blur-md relative overflow-hidden bg-[#facc15] text-[#0f172a] shadow-[0_12px_40px_rgba(250,204,21,0.35)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
          <Lightbulb size={18} className="text-[#0f172a]" />
        </div>
        <span className="text-[11px] font-mono font-bold tracking-tight bg-black/10 px-2 py-0.5 rounded-md">
          {confidence.toFixed(1)}%
        </span>
      </div>

      <div className="mb-4">
        <div className="text-[10px] font-mono font-medium tracking-wider opacity-75 uppercase">
          AI Detection
        </div>
        <div className="text-lg font-bold font-display tracking-tight leading-tight">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-black/10">
        <Zap size={14} className="fill-current animate-pulse" />
        <div className="flex-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          <span className="h-[2px] flex-1 bg-current rounded-full opacity-60" />
        </div>
        <span className="text-[10px] font-mono font-bold tracking-wider">
          {status}
        </span>
      </div>
    </div>
  );
}
