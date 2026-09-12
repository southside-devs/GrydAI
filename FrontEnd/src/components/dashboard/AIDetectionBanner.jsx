import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Zap } from 'lucide-react';

export default function AIDetectionBanner({
  gridStatus = 0,
  confidence = 0.0,
  message = '',
  title = '',
  status = '',
  isAnomaly = false,
}) {
  // Derive effective status (0: Normal, 1: Warning, 2: Critical)
  const effectiveStatus = gridStatus !== undefined ? gridStatus : (isAnomaly ? 1 : 0);

  // Status 2: CRITICAL (Solid Red)
  if (effectiveStatus === 2) {
    const displayTitle = title || (message.includes('Line Break') ? 'Line Break Trip' : (message.includes('Overload') ? 'Feeder Overload' : 'Critical Fault'));
    const displaySubtitle = message || 'CRITICAL: Severe Feeder Risk';
    const displayConf = confidence > 0 ? confidence : 98.4;

    return (
      <div className="rounded-2xl p-5 w-60 relative overflow-hidden bg-[#ef4444] text-white border border-[#ef4444] transition-colors duration-300">
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <AlertOctagon size={20} className="text-white" />
          </div>
          <span className="text-xs font-mono font-bold tracking-tight bg-white/20 px-2.5 py-1 rounded-md">
            {typeof displayConf === 'number' ? displayConf.toFixed(1) : displayConf}%
          </span>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-mono font-bold tracking-wider opacity-90 uppercase">
            AI DETECTION // ALERT
          </div>
          <div className="text-xl font-bold font-display tracking-tight leading-tight mt-0.5">
            {displayTitle}
          </div>
          <div className="text-[11px] font-mono opacity-90 mt-1 line-clamp-1">
            {displaySubtitle}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2.5 border-t border-white/20">
          <Zap size={16} className="fill-current animate-pulse text-white" />
          <div className="flex-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="h-[2.5px] flex-1 bg-white rounded-full opacity-60" />
          </div>
          <span className="text-xs font-mono font-black tracking-wider uppercase">
            CRITICAL LOCKDOWN
          </span>
        </div>
      </div>
    );
  }

  // Status 1: WARNING (Solid Yellow)
  if (effectiveStatus === 1) {
    const displayTitle = title || (message.includes('EV Surge') || message.includes('Feeder Demand') ? 'EV Surge Detected' : (message.includes('Sag') ? 'Voltage Sag' : 'Grid Warning'));
    const displaySubtitle = message || 'Warning: Abnormal Feeder Micro-Fluctuation';
    const displayConf = confidence > 0 ? confidence : 87.2;

    return (
      <div className="rounded-2xl p-5 w-60 relative overflow-hidden bg-[#ffe600] text-[#0f172a] border border-[#ffe600] transition-colors duration-300">
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-[#0f172a]" />
          </div>
          <span className="text-xs font-mono font-bold tracking-tight bg-black/10 px-2.5 py-1 rounded-md">
            {typeof displayConf === 'number' ? displayConf.toFixed(1) : displayConf}%
          </span>
        </div>

        <div className="mb-4">
          <div className="text-[11px] font-mono font-bold tracking-wider opacity-80 uppercase">
            AI DETECTION // PREDICTIVE
          </div>
          <div className="text-xl font-bold font-display tracking-tight leading-tight mt-0.5">
            {displayTitle}
          </div>
          <div className="text-[11px] font-mono opacity-80 mt-1 line-clamp-1">
            {displaySubtitle}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2.5 border-t border-black/10">
          <Zap size={16} className="fill-current animate-pulse text-[#0f172a]" />
          <div className="flex-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-current" />
            <span className="h-[2.5px] flex-1 bg-current rounded-full opacity-60" />
          </div>
          <span className="text-xs font-mono font-black tracking-wider uppercase">
            PREDICTIVE WARNING
          </span>
        </div>
      </div>
    );
  }

  // Status 0: NORMAL (Clean Solid Dark / Emerald)
  return (
    <div className="rounded-2xl p-5 w-60 relative overflow-hidden bg-[#0b0e14] text-white border border-white/[0.08] transition-colors duration-300">
      <div className="flex items-center justify-between mb-3.5">
        <div className="w-9 h-9 rounded-full bg-[#10b981]/15 border border-[#10b981]/25 flex items-center justify-center text-[#10b981]">
          <ShieldCheck size={20} />
        </div>
        <span className="text-xs font-mono font-bold tracking-tight bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-2.5 py-1 rounded-md">
          NOMINAL
        </span>
      </div>

      <div className="mb-4">
        <div className="text-[11px] font-mono font-bold tracking-wider text-[#64748b] uppercase">
          AI MONITOR // REAL-TIME
        </div>
        <div className="text-xl font-bold font-display tracking-tight leading-tight mt-0.5 text-white">
          Grid Stable
        </div>
        <div className="text-[11px] font-mono text-[#64748b] mt-1 line-clamp-1">
          Feeder telemetry nominal
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2.5 border-t border-white/[0.08] text-[#10b981]">
        <Zap size={16} className="fill-current" />
        <div className="flex-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-current" />
          <span className="h-[2.5px] flex-1 bg-current rounded-full opacity-40" />
        </div>
        <span className="text-xs font-mono font-bold tracking-wider text-[#94a3b8] uppercase">
          STANDBY
        </span>
      </div>
    </div>
  );
}
