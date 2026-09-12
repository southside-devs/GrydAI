import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';

export default function TransformerEventCard({
  transformerId = 'TX-02',
  nodeLabel = 'LV Winding Phase-B',
  time = '00:00',
  onReport = () => {},
}) {
  return (
    <div className="flex flex-col gap-2.5 w-60">
      {/* 1. Dark pill card with warm yellow border */}
      <div className="bg-[#0b0e14] border border-[#f59e0b]/80 rounded-[28px] py-4 px-5 text-center shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center">
        <div className="text-[11px] font-mono tracking-widest text-[#94a3b8] uppercase font-medium">
          TRANSFORMER {transformerId}
        </div>
        <div className="text-4xl font-extrabold font-mono text-white tracking-tight my-1">
          {time}
        </div>
        <div className="text-[11px] font-mono text-[#facc15] font-semibold tracking-wide">
          Node: {nodeLabel}
        </div>
      </div>

      {/* 2. Yellow CTA button: Report Event */}
      <button
        onClick={onReport}
        type="button"
        className="w-full bg-[#facc15] hover:bg-[#eab308] text-black font-bold text-xs py-3 px-4 rounded-full flex items-center justify-between transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} strokeWidth={2.5} className="text-black" />
          <span className="font-semibold tracking-tight text-[13px]">Report Event</span>
        </div>
        <ArrowUpRight size={16} strokeWidth={2.5} className="text-black" />
      </button>
    </div>
  );
}
