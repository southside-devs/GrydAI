import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function CurrentTelemetryCard({ current = 0.0, frequency = 0.0, waveform = [] }) {
  // 11 bar heights default to 0
  const defaultBars = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const bars = waveform && waveform.length >= 11 ? waveform.slice(0, 11) : defaultBars;

  return (
    <div className="flex-1 bg-[#0b0e14] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-white/90 tracking-tight">
          Current Feeder Telemetry
        </span>
        <button className="text-[#64748b] hover:text-[#ffe600] transition-colors cursor-pointer">
          <ArrowUpRight size={18} />
        </button>
      </div>

      {/* Primary Numbers */}
      <div className="flex items-baseline justify-between mb-1">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {typeof current === 'number' ? current.toFixed(1) : current}
          </span>
          <span className="text-xs font-mono text-[#64748b] font-medium">A</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono text-white tracking-tight">
            {typeof frequency === 'number' ? frequency.toFixed(1) : frequency}
          </span>
          <span className="text-xs font-mono text-[#64748b] font-medium">Hz</span>
        </div>
      </div>

      {/* Legend Indicators */}
      <div className="flex items-center justify-between text-[11px] font-mono tracking-wider uppercase mb-5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f97316]" />
          <span className="text-[#94a3b8]">CURRENT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
          <span className="text-[#94a3b8]">FREQUENCY</span>
        </div>
      </div>

      {/* Bar visualizer */}
      <div className="h-10 flex items-end justify-between gap-[5px] pt-1">
        {bars.map((val, idx) => {
          // Highlight middle bars in bright orange, edges in dark navy
          const isOrange = idx >= 3 && idx <= 7;
          const heightPercent = Math.min(100, Math.max(12, val));
          return (
            <div
              key={idx}
              className="flex-1 rounded-[2px] transition-all duration-300"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: isOrange ? '#f97316' : '#1e293b',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
