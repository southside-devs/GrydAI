import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function StabilityIndexCard({ stability = 0.0, status = 'Standby' }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  // Arc length with an intentional small top-gap opening (~320 deg arc)
  const gapAngle = 40; // degrees gap
  const activeArcLength = ((360 - gapAngle) / 360) * circumference;
  const strokeDashoffset = activeArcLength - (Math.min(100, Math.max(0, stability)) / 100) * activeArcLength;

  return (
    <div className="flex-1 bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white/90 tracking-tight">
          Grid Stability Index
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors cursor-pointer">
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* Ring Gauge */}
      <div className="relative flex items-center justify-center my-1.5">
        <svg className="w-28 h-28 transform -rotate-[70deg] overflow-visible">
          {/* Background circle track */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${activeArcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Foreground colored arc */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="#facc15"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={`${activeArcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Centered Percentage */}
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-extrabold font-mono text-white tracking-tight">
            {typeof stability === 'number' ? stability.toFixed(1) : stability}%
          </span>
        </div>
      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-xs font-mono pt-1">
        <span className="text-[#64748b]">Status</span>
        <span className="text-[#facc15] font-bold tracking-wide">{status}</span>
      </div>
    </div>
  );
}
