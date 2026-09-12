import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function StabilityIndexCard({ stability = 0.0, status = 'Standby' }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stability / 100) * circumference;

  return (
    <div className="flex-1 bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-[#94a3b8] tracking-wide">
          Grid Stability Index
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors cursor-pointer">
          <ArrowUpRight size={20} />
        </button>
      </div>

      <div className="relative flex items-center justify-center my-2">
        <svg className="w-28 h-28 transform -rotate-90">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="5"
            fill="transparent"
          />
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="#ffe600"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(255, 230, 0, 0.6))',
            }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {stability.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-mono pt-1">
        <span className="text-[#64748b]">Status</span>
        <span className="text-[#ffe600] font-bold">{status}</span>
      </div>
    </div>
  );
}
