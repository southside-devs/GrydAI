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
      className="rounded-2xl p-5 w-60 relative overflow-hidden bg-[#ffe600] text-[#0f172a] border border-[#ffe600]"
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center">
          <Lightbulb size={20} className="text-[#0f172a]" />
        </div>
        <span className="text-xs font-mono font-bold tracking-tight bg-black/10 px-2.5 py-1 rounded-md">
          {confidence.toFixed(1)}%
        </span>
      </div>

      <div className="mb-4">
        <div className="text-[11px] font-mono font-bold tracking-wider opacity-80 uppercase">
          AI Detection
        </div>
        <div className="text-xl font-bold font-display tracking-tight leading-tight mt-0.5">
          {title}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2.5 border-t border-black/10">
        <Zap size={16} className="fill-current animate-pulse" />
        <div className="flex-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-current" />
          <span className="h-[2.5px] flex-1 bg-current rounded-full opacity-60" />
        </div>
        <span className="text-xs font-mono font-black tracking-wider">
          {status}
        </span>
      </div>
    </div>
  );
}
