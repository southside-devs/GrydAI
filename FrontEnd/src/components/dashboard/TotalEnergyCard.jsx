import React from 'react';
import { ArrowUpRight, Zap } from 'lucide-react';

export default function TotalEnergyCard({ percentage = 0, currentKw = 0, limitKw = 0 }) {
  const radius = 45;
  const cx = 65;
  const cy = 60;
  const arcLength = Math.PI * radius;
  const strokeOffset = arcLength - (percentage / 100) * arcLength;

  return (
    <div className="flex-1 bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-bold tracking-wider text-[#94a3b8] uppercase">
          TOTAL ENERGY
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors cursor-pointer">
          <ArrowUpRight size={20} />
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
          {percentage}%
        </span>
        <div className="text-[#f59e0b] drop-shadow-[0_0_8px_#f59e0b]">
          <Zap size={24} fill="#f59e0b" />
        </div>
      </div>

      <div className="relative flex items-center justify-center my-1">
        <svg viewBox="0 0 130 75" className="w-32 h-auto overflow-visible">
          <defs>
            <linearGradient id="speedometerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="4"
            strokeDasharray="2 3"
          />

          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#speedometerGrad)"
            strokeWidth="5"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.6))',
            }}
          />

          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="12"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
          >
            {currentKw} kW
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#64748b] pt-1">
        <span className="uppercase">PEAK DEMAND CAP</span>
        <span className="text-[#94a3b8] font-medium">{limitKw} kW Limit</span>
      </div>
    </div>
  );
}
