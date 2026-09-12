import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function TotalEnergyCard({
  percentage = 0,
  currentKw = 0,
  limitKw = 0,
}) {
  const radius = 50;
  const cx = 70;
  const cy = 66;
  const arcLength = Math.PI * radius; // 180-degree semicircle
  const strokeOffset = arcLength - (Math.min(100, Math.max(0, percentage)) / 100) * arcLength;

  // Calculate needle angle based on percentage (from 180deg (left) to 0deg (right))
  // When percentage = 0: angle = 180 deg (points left)
  // When percentage = 100: angle = 0 deg (points right)
  const angleDeg = 180 - (Math.min(100, Math.max(0, percentage)) / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleLength = 40;
  const needleX = cx + needleLength * Math.cos(angleRad);
  const needleY = cy - needleLength * Math.sin(angleRad);

  return (
    <div className="flex-1 bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-mono font-bold tracking-wider text-[#94a3b8] uppercase">
          TOTAL ENERGY
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors cursor-pointer">
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* Percentage & Battery/Zap Icon */}
      <div className="flex items-center justify-between">
        <span className="text-3xl font-black font-mono text-white tracking-tight">
          {percentage}%
        </span>
        {/* Battery with bolt icon */}
        <div className="text-[#facc15] flex items-center justify-center">
          <svg
            className="w-5 h-5 text-[#facc15]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="7" width="16" height="12" rx="2" ry="2" />
            <line x1="22" y1="11" x2="22" y2="15" />
            <path d="M10 9l-2 4h3l-1 4" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Tachometer / Speedometer Gauge with Needle */}
      <div className="relative flex items-center justify-center -my-1">
        <svg viewBox="0 0 140 80" className="w-36 h-auto overflow-visible">
          <defs>
            <linearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          {/* Outer dashed tick track */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="4"
            strokeDasharray="2 3"
          />

          {/* Solid gradient arc */}
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="url(#energyGrad)"
            strokeWidth="5"
            strokeDasharray={arcLength}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Needle pivot circle */}
          <circle cx={cx} cy={cy} r="3" fill="#0b0e14" stroke="#facc15" strokeWidth="2" />

          {/* Needle pointer */}
          <line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#facc15"
            strokeWidth="2"
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />

          {/* Value text in center */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="bold"
          >
            {currentKw} kW
          </text>
        </svg>
      </div>

      {/* Footer Capacity */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-1">
        <span className="text-[#64748b] tracking-wider uppercase">PEAK DEMAND CAP</span>
        <span className="text-[#facc15] font-semibold">{limitKw} kW Limit</span>
      </div>
    </div>
  );
}
