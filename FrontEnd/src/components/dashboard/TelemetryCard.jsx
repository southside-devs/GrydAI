import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function TelemetryCard({ telemetry = {} }) {
  const {
    voltage = 0.0,
    current = 0.0,
    frequency = 0.0,
    waveform = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  } = telemetry;

  return (
    <div className="flex-1 bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-medium text-[#94a3b8] tracking-wide">
          Incoming Feeder Telemetry
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors">
          <ArrowUpRight size={17} />
        </button>
      </div>

      <div className="flex items-baseline gap-4 mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {voltage.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono text-[#64748b]">V</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {current.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono text-[#64748b]">A</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {frequency.toFixed(1)}
          </span>
          <span className="text-[11px] font-mono text-[#64748b]">Hz</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[9px] font-mono tracking-wider text-[#94a3b8] uppercase mb-4">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
          <span>VOLTAGE</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shadow-[0_0_6px_#f97316]" />
          <span>CURRENT</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_6px_#3b82f6]" />
          <span>FREQUEN...</span>
        </div>
      </div>

      <div className="h-9 flex items-end gap-[4px] pt-1">
        {waveform.map((val, idx) => {
          const heightPercent = val === 0 ? 8 : Math.min(100, Math.max(15, val));
          const isHighlight = val > 0 && idx >= 4 && idx <= 8;
          return (
            <div
              key={idx}
              className="flex-1 rounded-sm transition-all duration-300"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: val === 0 ? '#1e293b' : isHighlight ? '#ffe600' : idx > 8 ? '#f59e0b' : '#334155',
                opacity: val === 0 ? 0.4 : 0.85,
                boxShadow: isHighlight ? '0 0 8px rgba(255, 230, 0, 0.4)' : 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
