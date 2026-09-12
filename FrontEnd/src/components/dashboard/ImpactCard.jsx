import React from 'react';
import { ArrowUpRight, Wallet, Leaf } from 'lucide-react';

export default function ImpactCard({ earning = 0.00, co2SavedKm = '0', co2OffsetMt = '0.0' }) {
  return (
    <div className="flex-1 bg-[#0b0e14]/90 border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md relative overflow-hidden group hover:border-[#ffe600]/30 transition-all duration-300">
      <div className="border-b border-white/[0.06] pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-[#94a3b8] tracking-wide">
            Earning
          </span>
          <button className="text-[#64748b] hover:text-[#ffe600] transition-colors">
            <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-[#ffe600]/10 border border-[#ffe600]/25 flex items-center justify-center text-[#ffe600]">
            <Wallet size={16} />
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1.5">
              <span className="text-lg font-bold font-mono text-white tracking-tight">
                {typeof earning === 'number' ? earning.toFixed(2) : earning}
              </span>
              <span className="text-[10px] font-mono text-[#64748b]">INR</span>
            </div>
            <div className="text-[10px] font-mono text-[#64748b]">
              September 2024
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-medium text-[#94a3b8] tracking-wide">
            CO₂ Savings Total
          </span>
          <button className="text-[#64748b] hover:text-[#10b981] transition-colors">
            <ArrowUpRight size={17} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 flex items-center justify-center text-[#10b981]">
            <Leaf size={16} />
          </div>
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-lg font-bold font-mono text-[#10b981] tracking-tight">
                {co2SavedKm}
              </span>
              <span className="text-[10px] font-mono text-[#64748b]">km</span>
            </div>
            <div className="text-[10px] font-mono text-[#64748b]">
              {co2OffsetMt} MT Offset
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
